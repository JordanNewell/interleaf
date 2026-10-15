import nacl from "tweetnacl";

/**
 * Ed25519 → Curve25519 conversion (the ed2curve algorithm, RFC 7748 §4.1).
 *
 * The identity key is Ed25519 (signing). nacl.box needs Curve25519 scalars.
 * We derive them from the same key so an identity is one key, not two:
 *
 * - secret: SHA-512(seed)[0..32], clamped — this is exactly the Ed25519 scalar,
 *   and it is a valid Curve25519 scalar.
 * - public: the Montgomery u-coordinate u = (1+y)/(1-y) mod p of the Ed25519 point.
 *
 * Both directions are self-checking: if either conversion were wrong, the
 * scalarMult.base(convertSecret) === convertPublic invariant and every box
 * round-trip would fail. tests/unit/om2-crypto.test.ts pins both.
 */

const P = 2n ** 255n - 19n;

function bytesToBigIntLE(bytes: Uint8Array): bigint {
  let x = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) x = (x << 8n) | BigInt(bytes[i] as number);
  return x;
}

function bigIntToBytesLE(x: bigint, len: number): Uint8Array {
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = Number(x & 255n);
    x >>= 8n;
  }
  return out;
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

/** 32-byte Ed25519 secret key (the seed half) → 32-byte Curve25519 scalar. */
export function convertSecretKey(edSecretKey: Uint8Array): Uint8Array {
  // Accept either the 32-byte seed or the 64-byte nacl secret key.
  const seed = edSecretKey.length === 64 ? edSecretKey.subarray(0, 32) : edSecretKey;
  const h = nacl.hash(seed); // SHA-512
  const scalar = h.slice(0, 32);
  scalar[0]! &= 248;
  scalar[31]! &= 127;
  scalar[31]! |= 64;
  return scalar;
}

/** 32-byte Ed25519 public key → 32-byte Curve25519 public key (u-coordinate). */
export function convertPublicKey(edPublicKey: Uint8Array): Uint8Array {
  const y = bytesToBigIntLE(edPublicKey) & ((1n << 255n) - 1n); // drop sign bit
  const num = (1n + y) % P;
  const den = (1n - y + P) % P;
  const denInv = modPow(den, P - 2n, P);
  const out = bigIntToBytesLE((num * denInv) % P, 32);
  // u = 0 is the Montgomery image of y = ±1 — non-canonical Ed25519 encodings
  // on the small-order point. X25519 against it collapses every shared secret
  // to all zeros, so a box built with it can never work: reject at the door
  // instead of letting the failure surface as an undecryptable message.
  if (out.every((b) => b === 0)) throw new Error("ed2curve: small-order point (u = 0)");
  return out;
}
