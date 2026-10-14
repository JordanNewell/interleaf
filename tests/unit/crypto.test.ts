import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARGON2ID_MEMORY_KIB,
  ARGON2ID_TIME,
  createWrappedVaultKey,
  DEFAULT_KDF,
  fromB64,
  generateVaultKeyString,
  LEGACY_KDF,
  LEGACY_PBKDF2_ITERATIONS,
  normalizeVaultKey,
  openWrappedVaultKey,
  PBKDF2_ITERATIONS,
  rewrapRawVaultKey,
  toB64,
  unwrapRawVaultKey,
  webcryptoAvailable,
} from "../../src/crypto";

// PBKDF2 at full strength costs a few hundred ms per derivation — one shared
// bundle keeps this file fast without weakening the tested code path.
// Cheap iterations on the explicit legacy KDF exercise the same code paths
// the real counts use; Argon2id has its own test below at real parameters.
const CHEAP = 1000;
const bundle = await (async () => {
  if (!webcryptoAvailable()) return null;
  return createWrappedVaultKey("correct horse battery staple", CHEAP, LEGACY_KDF);
})();

test("base64 round-trips arbitrary bytes", () => {
  const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 255]);
  assert.deepEqual(fromB64(toB64(bytes)), bytes);
});

test("wrapped vault key: seal, open, and reject the wrong passcode", async () => {
  if (!bundle) return; // WebCrypto missing — nothing to test here
  const { cipher } = bundle;

  const sealed = await cipher.seal("top secret body");
  assert.notEqual(sealed.ct, "top secret body");
  assert.equal(await cipher.open(sealed.iv, sealed.ct), "top secret body");

  // every seal gets a fresh IV — same body, different ciphertext
  const again = await cipher.seal("top secret body");
  assert.notEqual(again.iv, sealed.iv);
  assert.notEqual(again.ct, sealed.ct);

  await assert.rejects(() => cipher.open(sealed.iv, `${sealed.ct.slice(0, -4)}AAAA`));
});

test("the bundle reopens with the right passcode and refuses the wrong one", async () => {
  if (!bundle) return;
  const cipher = await openWrappedVaultKey(
    "correct horse battery staple",
    bundle.keySalt,
    bundle.wrappedKey,
    CHEAP,
    LEGACY_KDF
  );
  const sealed = await cipher.seal("round trip");
  assert.equal(await cipher.open(sealed.iv, sealed.ct), "round trip");

  await assert.rejects(() =>
    openWrappedVaultKey("wrong passcode", bundle.keySalt, bundle.wrappedKey, CHEAP, LEGACY_KDF)
  );
  // tampered wrapped material must fail, not fall back
  const tampered = bundle.wrappedKey.slice(0, -4) + "AAAA";
  await assert.rejects(() =>
    openWrappedVaultKey("correct horse battery staple", bundle.keySalt, tampered, CHEAP, LEGACY_KDF)
  );
});

test("raw unwrap matches the cipher from create — the same vault key", async () => {
  if (!bundle) return;
  const raw = await unwrapRawVaultKey(
    "correct horse battery staple",
    bundle.keySalt,
    bundle.wrappedKey,
    CHEAP,
    LEGACY_KDF
  );
  assert.equal(raw.length, 32);
  // a seal made by the session cipher must open with a cipher rebuilt from raw
  const { cipherFromRawKey } = await import("../../src/crypto");
  const rebuilt = await cipherFromRawKey(raw);
  const sealed = await bundle.cipher.seal("via raw key");
  assert.equal(await rebuilt.open(sealed.iv, sealed.ct), "via raw key");
});

test("unicode bodies survive sealing", async () => {
  if (!bundle) return;
  const body = "héllo — 密码 🔐 \"quoted\" 'single' <not html>";
  const sealed = await bundle.cipher.seal(body);
  assert.equal(await bundle.cipher.open(sealed.iv, sealed.ct), body);
});

test("PBKDF2 is the legacy KDF; new wraps default to Argon2id at OWASP-band cost", () => {
  assert.equal(PBKDF2_ITERATIONS, 600_000);
  assert.equal(LEGACY_PBKDF2_ITERATIONS, 200_000);
  assert.ok(PBKDF2_ITERATIONS > LEGACY_PBKDF2_ITERATIONS);
  assert.equal(DEFAULT_KDF, "argon2id");
  // memory-hardness is the point — hold the band if parameters are ever tuned
  assert.ok(ARGON2ID_MEMORY_KIB >= 19_456, "argon2id memory below OWASP band");
  assert.ok(ARGON2ID_TIME >= 2, "argon2id time cost below OWASP band");
});

test("new wraps are Argon2id: reopen with the default KDF, refuse the legacy one", async () => {
  if (!webcryptoAvailable()) return;
  const wrapped = await createWrappedVaultKey("argon secret");
  const cipher = await openWrappedVaultKey(
    "argon secret",
    wrapped.keySalt,
    wrapped.wrappedKey
  );
  const sealed = await cipher.seal("argon body");
  assert.equal(await cipher.open(sealed.iv, sealed.ct), "argon body");
  // a PBKDF2-era open must not silently succeed on an argon2id bundle
  await assert.rejects(() =>
    openWrappedVaultKey("argon secret", wrapped.keySalt, wrapped.wrappedKey, PBKDF2_ITERATIONS, LEGACY_KDF)
  );
  await assert.rejects(() =>
    openWrappedVaultKey("wrong secret", wrapped.keySalt, wrapped.wrappedKey)
  );
});

test("a bundle opens only with the iteration count it was wrapped with", async () => {
  if (!webcryptoAvailable()) return;
  const wrapped = await createWrappedVaultKey("counted secret", 200_000, LEGACY_KDF);
  await openWrappedVaultKey("counted secret", wrapped.keySalt, wrapped.wrappedKey, 200_000, LEGACY_KDF);
  // the vault answers only to the count it was wrapped with — settings carry it
  await assert.rejects(() =>
    openWrappedVaultKey("counted secret", wrapped.keySalt, wrapped.wrappedKey, PBKDF2_ITERATIONS, LEGACY_KDF)
  );
});

test("generated vault keys: five Crockford groups, unique per mint", () => {
  const KEY_RE = /^[0-9A-Z]{5}(-[0-9A-Z]{5}){4}$/;
  const seen = new Set<string>();
  for (let i = 0; i < 50; i++) {
    const key = generateVaultKeyString();
    assert.match(key, KEY_RE);
    // Crockford alphabet only — no I, L, O, or U anywhere
    assert.ok(!/[ILOU]/.test(key.replace(/-/g, "")), `ambiguous char in ${key}`);
    seen.add(key);
  }
  assert.equal(seen.size, 50);
});

test("normalizeVaultKey folds pasted variants to the canonical key", () => {
  const key = generateVaultKeyString();
  assert.equal(normalizeVaultKey(key), key);
  assert.equal(normalizeVaultKey(key.toLowerCase()), key, "lowercase paste");
  assert.equal(normalizeVaultKey(key.replace(/-/g, "")), key, "no separators");
  assert.equal(normalizeVaultKey(`  ${key}  `), key, "surrounding space");
  // the excluded lookalikes fold back: I/L→1 and O→0 (fixed key so the
  // fixture is guaranteed to contain digits to mangle)
  const withDigits = "10XK4-Q2M9Z-A3WB7-C4DE5-F6GH8";
  const mistyped = withDigits.replace(/1/g, "I").replace(/0/g, "O");
  assert.equal(normalizeVaultKey(mistyped), withDigits);
  assert.equal(normalizeVaultKey(withDigits.replace(/1/g, "L")), withDigits);
});

test("normalizeVaultKey rejects anything that cannot be a key", () => {
  assert.equal(normalizeVaultKey(""), null);
  assert.equal(normalizeVaultKey("7XK4Q"), null, "too short");
  const bare = generateVaultKeyString().replace(/-/g, "");
  assert.equal(normalizeVaultKey(`${bare}X`), null, "too long");
  // U is excluded from the alphabet — a pasted U is a typo, not folded away
  assert.equal(normalizeVaultKey("UUUUU-UUUUU-UUUUU-UUUUU-UUUUU"), null);
});

test("key mode round-trip: wrap with a generated key, unlock with a mangled paste", async () => {
  if (!webcryptoAvailable()) return;
  const key = generateVaultKeyString();
  const wrapped = await createWrappedVaultKey(key, CHEAP, LEGACY_KDF);
  const pasted = key.toLowerCase().replace(/-/g, " "); // phone-typed variant
  const cipher = await openWrappedVaultKey(
    normalizeVaultKey(pasted)!,
    wrapped.keySalt,
    wrapped.wrappedKey,
    CHEAP,
    LEGACY_KDF
  );
  const sealed = await cipher.seal("key mode body");
  assert.equal(await cipher.open(sealed.iv, sealed.ct), "key mode body");
  // one flipped character must not open it
  const flipped = key.slice(0, -1) + (key.endsWith("0") ? "1" : "0");
  await assert.rejects(() =>
    openWrappedVaultKey(flipped, wrapped.keySalt, wrapped.wrappedKey, CHEAP, LEGACY_KDF)
  );
});

test("rewrapRawVaultKey honors the requested iteration count", async () => {
  if (!webcryptoAvailable()) return;
  const raw = await unwrapRawVaultKey(
    "correct horse battery staple",
    bundle.keySalt,
    bundle.wrappedKey,
    CHEAP,
    LEGACY_KDF
  );
  const rewrapped = await rewrapRawVaultKey(raw, "new secret", 200_000, LEGACY_KDF);
  await unwrapRawVaultKey("new secret", rewrapped.keySalt, rewrapped.wrappedKey, 200_000, LEGACY_KDF);
  await assert.rejects(() =>
    unwrapRawVaultKey("new secret", rewrapped.keySalt, rewrapped.wrappedKey, CHEAP, LEGACY_KDF)
  );
});

// -- failure modes -----------------------------------------------------------------

test("a seal made under one vault key refuses another", async () => {
  if (!webcryptoAvailable()) return;
  const other = await createWrappedVaultKey("a different secret entirely", CHEAP, LEGACY_KDF);
  const sealed = await bundle!.cipher.seal("classified");
  await assert.rejects(() => other.cipher.open(sealed.iv, sealed.ct));
  // and the original still opens its own output
  assert.equal(await bundle!.cipher.open(sealed.iv, sealed.ct), "classified");
});

test("malformed base64 iv/ciphertext reject instead of corrupting", async () => {
  if (!webcryptoAvailable()) return;
  const { cipher } = bundle!;
  const sealed = await cipher.seal("payload");
  await assert.rejects(() => cipher.open("!!!not base64!!!", sealed.ct));
  await assert.rejects(() => cipher.open(sealed.iv, "not base64!!"));
  await assert.rejects(() => cipher.open("", sealed.ct));
  await assert.rejects(() => cipher.open(sealed.iv, ""));
  // a truncated ciphertext (lost tail bytes) fails the GCM tag
  await assert.rejects(() => cipher.open(sealed.iv, sealed.ct.slice(0, -8)));
});

test("key hygiene: raw bytes zero after cipher creation, the cipher lives on", async () => {
  if (!webcryptoAvailable()) return;
  const raw = await unwrapRawVaultKey(
    "correct horse battery staple",
    bundle!.keySalt,
    bundle!.wrappedKey,
    CHEAP,
    LEGACY_KDF
  );
  const { cipherFromRawKey, zeroKeyMaterial } = await import("../../src/crypto");
  const cipher = await cipherFromRawKey(raw);
  assert.ok(raw.every((b) => b === 0), "cipherFromRawKey wipes the caller's buffer");
  // WebCrypto copied the material at import — the cipher is unaffected
  const sealed = await bundle!.cipher.seal("still works");
  assert.equal(await cipher.open(sealed.iv, sealed.ct), "still works");
  // the helper is a no-op on nothing, a wipe on something
  zeroKeyMaterial(null);
  zeroKeyMaterial(undefined);
  const bytes = new Uint8Array([1, 2, 3]);
  zeroKeyMaterial(bytes);
  assert.deepEqual([...bytes], [0, 0, 0]);
});
