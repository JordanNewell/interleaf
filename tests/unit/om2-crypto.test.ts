import { test, describe } from "node:test";
import assert from "node:assert/strict";
import nacl from "tweetnacl";
import { base58Decode, base58Encode } from "../../src/om2/crypto/base58";
import { canonicalAuth, canonicalMessage, sha256Hex } from "../../src/om2/crypto/canon";
import {
  fingerprint,
  generateIdentity,
  identityFromSeed,
  identityValid,
  signDetached,
  verifyDetached,
} from "../../src/om2/crypto/keys";
import { convertPublicKey, convertSecretKey } from "../../src/om2/crypto/ed2curve";
import { openJson, sealJson } from "../../src/om2/crypto/seal";

describe("om2 base58", () => {
  test("round-trips arbitrary bytes", () => {
    for (let i = 0; i < 50; i++) {
      const bytes = nacl.randomBytes(1 + Math.floor(Math.random() * 64));
      assert.deepEqual(base58Decode(base58Encode(bytes)), bytes);
    }
  });

  test("preserves leading zeros as leading 1s", () => {
    const encoded = base58Encode(new Uint8Array([0, 0, 1, 0]));
    assert.ok(encoded.startsWith("11"));
    assert.deepEqual(base58Decode(encoded), new Uint8Array([0, 0, 1, 0]));
  });

  test("known vector: hello", () => {
    assert.equal(base58Encode(new TextEncoder().encode("hello")), "Cn8eVZg");
  });
});

describe("om2 fingerprints and canonical strings", () => {
  test("fingerprint is deterministic, unique per key, right shape", () => {
    const a = generateIdentity();
    const b = generateIdentity();
    const fa = fingerprint(a.publicKey);
    assert.equal(fa, fingerprint(a.publicKey));
    assert.notEqual(fa, fingerprint(b.publicKey));
    assert.match(fa, /^fp_[1-9A-HJ-NP-Za-km-z]{25,30}$/);
  });

  test("identity from seed reproduces the same key; validity check holds", () => {
    const seed = nacl.randomBytes(32);
    const id = identityFromSeed(seed);
    assert.ok(identityValid(id));
    assert.deepEqual(id.publicKey, nacl.sign.keyPair.fromSeed(seed).publicKey);
  });

  test("sha256Hex matches known vector", () => {
    assert.equal(sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  test("canonical message template is exact, replyTo null → empty slot", () => {
    const body = "hi there";
    const canonical = canonicalMessage({
      id: "msg_x",
      from2: "fp_aaa",
      to2: "fp_bbb",
      ts: "2026-10-10T12:00:00.000Z",
      replyTo: null,
      body,
    });
    assert.equal(
      canonical,
      `om2.v1|msg_x|fp_aaa|fp_bbb|2026-10-10T12:00:00.000Z||${sha256Hex(body)}`
    );
  });

  test("sign/verify round-trip; any tampering breaks it", () => {
    const id = generateIdentity();
    const canonical = canonicalAuth({ method: "GET", resource: "inbox/fp_x", ts: 1, nonce: "n" });
    const sig = signDetached(id, canonical);
    assert.ok(verifyDetached(id.publicKey, sig, canonical));
    assert.ok(!verifyDetached(id.publicKey, sig, canonical + " "));
    const other = generateIdentity();
    assert.ok(!verifyDetached(other.publicKey, sig, canonical));
  });
});

describe("om2 ed25519 → curve25519 conversion", () => {
  test("scalarMult.base(convertSecret(seed)) === convertPublicKey(ed pub) for random keys", () => {
    // The self-checking invariant: if either conversion is wrong, this fails.
    for (let i = 0; i < 20; i++) {
      const seed = nacl.randomBytes(32);
      const ed = nacl.sign.keyPair.fromSeed(seed);
      const curveFromSecret = nacl.scalarMult.base(convertSecretKey(seed));
      const curveFromPublic = convertPublicKey(ed.publicKey);
      assert.deepEqual(
        Buffer.from(curveFromSecret),
        Buffer.from(curveFromPublic),
        `conversion mismatch on iteration ${i}`
      );
    }
  });

  test("accepts both 32-byte seed and 64-byte nacl secret key", () => {
    const ed = nacl.sign.keyPair();
    assert.deepEqual(
      Buffer.from(convertSecretKey(ed.secretKey)),
      Buffer.from(convertSecretKey(ed.secretKey.subarray(0, 32)))
    );
  });
});

describe("om2 sealed boxes", () => {
  test("seal → open round-trips JSON", () => {
    const bob = generateIdentity();
    const payload = { hello: "world", n: 42, nested: { ok: true } };
    const sealed = sealJson(bob.publicKey, payload);
    assert.deepEqual(openJson(bob.secretKey, sealed), payload);
  });

  test("wrong key cannot open", () => {
    const bob = generateIdentity();
    const eve = generateIdentity();
    const sealed = sealJson(bob.publicKey, { secret: "x" });
    assert.equal(openJson(eve.secretKey, sealed), null);
  });

  test("tampered ciphertext cannot open", () => {
    const bob = generateIdentity();
    const sealed = sealJson(bob.publicKey, { secret: "x" });
    const raw = Buffer.from(sealed.box, "base64");
    raw[raw.length - 1] = (raw[raw.length - 1] as number) ^ 1;
    assert.equal(openJson(bob.secretKey, { box: raw.toString("base64") }), null);
  });

  test("truncated box cannot open", () => {
    const bob = generateIdentity();
    const sealed = sealJson(bob.publicKey, { secret: "x" });
    const short = Buffer.from(sealed.box, "base64").subarray(0, 30).toString("base64");
    assert.equal(openJson(bob.secretKey, { box: short }), null);
  });
});

describe("om2 ed2curve", () => {
  // Independent cross-check: our hand-rolled RFC 7748 §4.1 conversion must
  // agree with @noble/curves (a separate audited implementation) in both
  // directions, on random keys and on the RFC 8032 known-answer key.
  test("convertPublicKey/convertSecretKey agree with @noble/curves", async () => {
    const { ed25519 } = await import("@noble/curves/ed25519.js");
    const seeds = [
      nacl.randomBytes(32),
      nacl.randomBytes(32),
      // RFC 8032 §7.1 TEST 1 — Ed25519 side is a published known-answer;
      // the Montgomery halves below are whatever the two implementations
      // independently agree they convert to.
      Buffer.from(
        "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
        "hex"
      ),
    ];
    for (const seed of seeds) {
      const pub = ed25519.getPublicKey(seed);
      assert.deepEqual(
        Buffer.from(pub).toString("hex"),
        Buffer.from(nacl.sign.keyPair.fromSeed(seed).publicKey).toString("hex")
      );
      assert.deepEqual(
        Buffer.from(convertPublicKey(pub)).toString("hex"),
        Buffer.from(ed25519.utils.toMontgomery(pub)).toString("hex")
      );
      assert.deepEqual(
        Buffer.from(convertSecretKey(seed)).toString("hex"),
        Buffer.from(ed25519.utils.toMontgomerySecret(seed)).toString("hex")
      );
    }
  });

  test("converted keys perform working X25519 against noble's", async () => {
    const { ed25519, x25519 } = await import("@noble/curves/ed25519.js");
    const alice = nacl.sign.keyPair();
    const bob = nacl.sign.keyPair();
    const seed = (kp: Uint8Array) => kp.subarray(0, 32);
    // ours: converted keys through tweetnacl's scalar mult
    const ours = nacl.scalarMult(
      convertSecretKey(seed(alice.secretKey)),
      convertPublicKey(bob.publicKey)
    );
    // noble: the same DH entirely inside the independent implementation
    const noble = x25519.getSharedSecret(
      ed25519.utils.toMontgomerySecret(seed(alice.secretKey)),
      x25519.getPublicKey(ed25519.utils.toMontgomerySecret(seed(bob.secretKey)))
    );
    assert.deepEqual(Buffer.from(ours).toString("hex"), Buffer.from(noble).toString("hex"));
  });

  test("convertPublicKey rejects the small-order point (u = 0)", async () => {
    const { ed25519 } = await import("@noble/curves/ed25519.js");
    // y = 1 (little-endian 0x01) and y = -1 mod p are non-canonical Ed25519
    // encodings of the small-order point whose Montgomery image is u = 0.
    const yOne = new Uint8Array(32);
    yOne[0] = 1;
    const yMinusOne = Buffer.from(
      "ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
      "hex"
    );
    assert.throws(() => convertPublicKey(yOne), /small-order/);
    assert.throws(() => convertPublicKey(yMinusOne), /small-order/);
    // noble independently agrees these degenerate: y=-1 maps to all-zero u,
    // y=1 refuses to decompress outright
    assert.ok(
      ed25519.utils.toMontgomery(yMinusOne).every((b: number) => b === 0)
    );
    assert.throws(() => ed25519.utils.toMontgomery(yOne));
  });
});
