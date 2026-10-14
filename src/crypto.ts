/**
 * At-rest body sealing (SPEC §15): AES-256-GCM over message bodies, with a
 * random per-vault key that is itself wrapped by a key derived from the
 * unlock secret. The KDF is Argon2id (memory-hard) for all new wraps; vaults
 * wrapped in the PBKDF2 era open with PBKDF2 until their next re-wrap. The
 * wrapped form is what data.json stores; the raw vault key exists only in
 * memory between unlock and lock/unload.
 *
 * Envelope metadata (id/from/to/ts) stays plaintext on purpose — cursors,
 * dedup, GC, and non-plugin participants still work on sealed inboxes.
 * Deliberately free of "obsidian" imports so the unit suite can run it.
 */

import { argon2id } from "@noble/hashes/argon2";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * The KDF a wrap was sealed with. Absent in persisted settings/records means
 * "pbkdf2" — everything wrapped before the field existed. New wraps use the
 * DEFAULT_KDF.
 */
export type KdfId = "pbkdf2" | "argon2id";
export const DEFAULT_KDF: KdfId = "argon2id";
/** KDF for pre-field data — matches the absent-field reading, never wrap new. */
export const LEGACY_KDF: KdfId = "pbkdf2";

/** OWASP-band stretch for PBKDF2-SHA256 (the legacy KDF); unlock-only cost. */
export const PBKDF2_ITERATIONS = 600_000;
/**
 * Rounds used by vaults wrapped before the count was persisted — data.json
 * without a kdfIterations field means this. Only read with, never wrap new.
 */
export const LEGACY_PBKDF2_ITERATIONS = 200_000;

/**
 * Argon2id parameters (new wraps): 19 MiB / t=2 / p=1 — the OWASP Password
 * Storage Cheat Sheet's first recommendation band. Memory-hardness is the
 * point: GPU/ASIC offline guessing pays per-guess for RAM, which PBKDF2
 * never charged. Unlock pays it once per session.
 */
export const ARGON2ID_MEMORY_KIB = 19_456; // 19 MiB
export const ARGON2ID_TIME = 2;
export const ARGON2ID_PARALLELISM = 1;

/** AES-GCM IV length in bytes (NIST SP 800-38D minimum for 96-bit). */
const IV_BYTES = 12;
/** Vault key length in bytes (AES-256). */
const KEY_BYTES = 32;
/** KDF salt length in bytes (16 = both PBKDF2 and Argon2id happy). */
const SALT_BYTES = 16;

function subtle(): SubtleCrypto {
  const c = window.crypto?.subtle;
  if (!c) throw new Error("WebCrypto unavailable in this runtime");
  return c;
}

/** Whether sealing can be offered on this platform at all. */
export function webcryptoAvailable(): boolean {
  return typeof window.crypto?.subtle === "object";
}

// -- base64 (chunked, safe for multi-KB bodies) -------------------------------

export function toB64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function fromB64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const HEX = "0123456789abcdef";
const randomHex = (nBytes: number): string => {
  const bytes = new Uint8Array(nBytes);
  window.crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += HEX[b >>> 4] + HEX[b & 15];
  return out;
};

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// -- keys ----------------------------------------------------------------------

/**
 * Best-effort wipe of raw key material. JavaScript strings are immortal, but
 * these bytes live in an ArrayBuffer we own — zero it once the key has been
 * handed to (copied by) WebCrypto or re-wrapped, so a later heap snapshot or
 * a stray structured clone of the buffer sees only zeros.
 */
export function zeroKeyMaterial(bytes: Uint8Array | null | undefined): void {
  if (bytes) bytes.fill(0);
}

/** Fresh random salt for the passcode-derived key, as 32 hex chars. */
export function makeKeySalt(): string {
  return randomHex(SALT_BYTES);
}

/**
 * The KEK input: 32 bytes derived from the unlock secret. Argon2id for new
 * wraps (memory-hard), PBKDF2-SHA256 only to open legacy-era material.
 */
async function deriveKekBytes(
  passcode: string,
  saltHex: string,
  kdf: KdfId,
  iterations: number
): Promise<Uint8Array> {
  const secret = encoder.encode(passcode.trim());
  if (kdf === "argon2id") {
    return argon2id(secret, hexToBytes(saltHex), {
      t: ARGON2ID_TIME,
      m: ARGON2ID_MEMORY_KIB,
      p: ARGON2ID_PARALLELISM,
    });
  }
  const material = await subtle().importKey("raw", secret, "PBKDF2", false, [
    "deriveBits",
  ]);
  return new Uint8Array(
    await subtle().deriveBits(
      { name: "PBKDF2", salt: hexToBytes(saltHex), iterations, hash: "SHA-256" },
      material,
      256
    )
  );
}

/** The KEK: AES-GCM key built from the derived bytes. */
async function deriveKek(
  passcode: string,
  saltHex: string,
  kdf: KdfId,
  iterations: number
): Promise<CryptoKey> {
  const bytes = await deriveKekBytes(passcode, saltHex, kdf, iterations);
  return subtle().importKey(
    "raw",
    bytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Seals and opens message bodies — the store holds one while unlocked. */
export interface VaultCipher {
  seal(body: string): Promise<{ iv: string; ct: string }>;
  open(iv: string, ct: string): Promise<string>;
}

/**
 * Import raw vault-key bytes as a live cipher. The caller's buffer is zeroed
 * once WebCrypto has copied the material (import is extractable=false, the
 * key exists inside the API from here on) — the raw bytes have no further
 * business being readable.
 */
async function cipherFromRawKey(raw: Uint8Array): Promise<VaultCipher> {
  const key = await subtle().importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  zeroKeyMaterial(raw);
  return {
    async seal(body) {
      const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTES));
      const ct = await subtle().encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(body)
      );
      return { iv: toB64(iv), ct: toB64(new Uint8Array(ct)) };
    },
    async open(iv, ct) {
      const plain = await subtle().decrypt(
        { name: "AES-GCM", iv: fromB64(iv) },
        key,
        fromB64(ct)
      );
      return decoder.decode(plain);
    },
  };
}

/**
 * Everything data.json needs to restore the key later: a fresh vault key,
 * wrapped by a KEK from this passcode + a fresh salt. Returns the live cipher
 * for the session plus the persisted bundle. New wraps default to Argon2id;
 * pass kdf="pbkdf2" only to exercise the legacy path (tests).
 */
export async function createWrappedVaultKey(
  passcode: string,
  iterations = PBKDF2_ITERATIONS,
  kdf: KdfId = DEFAULT_KDF
): Promise<{ keySalt: string; wrappedKey: string; cipher: VaultCipher }> {
  const keySalt = makeKeySalt();
  const kek = await deriveKek(passcode, keySalt, kdf, iterations);
  const vk = window.crypto.getRandomValues(new Uint8Array(KEY_BYTES));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const wrapped = new Uint8Array(
    await subtle().encrypt({ name: "AES-GCM", iv }, kek, vk)
  );
  const bundle = new Uint8Array(iv.length + wrapped.length);
  bundle.set(iv, 0);
  bundle.set(wrapped, iv.length);
  return {
    keySalt,
    wrappedKey: toB64(bundle),
    cipher: await cipherFromRawKey(vk),
  };
}

/**
 * Recover the vault cipher from a passcode. Throws on a wrong passcode (the
 * GCM tag fails), on tampered material, or when WebCrypto is missing — the
 * unlock flow treats any throw as "wrong passcode". The KDF must match the
 * one the bundle was wrapped with (persisted alongside it).
 */
export async function openWrappedVaultKey(
  passcode: string,
  keySalt: string,
  wrappedKey: string,
  iterations = PBKDF2_ITERATIONS,
  kdf: KdfId = DEFAULT_KDF
): Promise<VaultCipher> {
  const kek = await deriveKek(passcode, keySalt, kdf, iterations);
  const bundle = fromB64(wrappedKey);
  const iv = bundle.subarray(0, IV_BYTES);
  const wrapped = bundle.subarray(IV_BYTES);
  const vk = new Uint8Array(
    await subtle().decrypt({ name: "AES-GCM", iv }, kek, wrapped)
  );
  if (vk.length !== KEY_BYTES) throw new Error("vault key has wrong length");
  return cipherFromRawKey(vk);
}

/**
 * Re-wrap raw vault-key bytes under a new passcode. Returns the replacement
 * bundle to persist. New wraps default to Argon2id.
 */
export async function rewrapRawVaultKey(
  rawKey: Uint8Array,
  newPasscode: string,
  iterations = PBKDF2_ITERATIONS,
  kdf: KdfId = DEFAULT_KDF
): Promise<{ keySalt: string; wrappedKey: string }> {
  const keySalt = makeKeySalt();
  const kek = await deriveKek(newPasscode, keySalt, kdf, iterations);
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const wrapped = new Uint8Array(
    await subtle().encrypt({ name: "AES-GCM", iv }, kek, rawKey)
  );
  const bundle = new Uint8Array(iv.length + wrapped.length);
  bundle.set(iv, 0);
  bundle.set(wrapped, iv.length);
  return { keySalt, wrappedKey: toB64(bundle) };
}

/**
 * Unwrap to raw bytes — used when re-wrapping (passcode change) and when
 * un-sealing everything (encryption off). Not exported lightly: the raw key
 * is the most sensitive value in the plugin; it lives on the stack only.
 */
export async function unwrapRawVaultKey(
  passcode: string,
  keySalt: string,
  wrappedKey: string,
  iterations = PBKDF2_ITERATIONS,
  kdf: KdfId = DEFAULT_KDF
): Promise<Uint8Array> {
  const kek = await deriveKek(passcode, keySalt, kdf, iterations);
  const bundle = fromB64(wrappedKey);
  const vk = new Uint8Array(
    await subtle().decrypt(
      { name: "AES-GCM", iv: bundle.subarray(0, IV_BYTES) },
      kek,
      bundle.subarray(IV_BYTES)
    )
  );
  if (vk.length !== KEY_BYTES) throw new Error("vault key has wrong length");
  return vk;
}

// -- generated vault keys (password-manager mode) ------------------------------

/**
 * Crockford base32: 32 unambiguous symbols (no I, L, O, U) — every character
 * survives being read off a screen, retyped, or pasted through a font swap.
 */
const KEY_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
/** 25 base32 symbols = 125 bits of entropy — beyond brute force at any scale. */
const KEY_CHARS = 25;
const KEY_GROUP = 5;

/**
 * A fresh vault key as five dash-separated groups ("7XK4Q-M2P9Z-…"). This is
 * the *secret* the KEK is derived from in key mode — generate once at setup,
 * store in a password manager, never write to disk.
 */
export function generateVaultKeyString(): string {
  const bytes = window.crypto.getRandomValues(new Uint8Array(KEY_CHARS));
  // 256 % 32 === 0, so taking the low 5 bits of a random byte is unbiased
  const chars = Array.from(bytes, (b) => KEY_ALPHABET[b & 31]);
  const groups: string[] = [];
  for (let i = 0; i < KEY_CHARS; i += KEY_GROUP) {
    groups.push(chars.slice(i, i + KEY_GROUP).join(""));
  }
  return groups.join("-");
}

/**
 * Canonicalize pasted key input: uppercase, drop separators and whitespace,
 * fold the ambiguous lookalikes Crockford excludes (I/L→1, O→0). Returns the
 * canonical dashed form, or null when the input can't be a vault key — wrong
 * length or symbols outside the alphabet (including U).
 */
export function normalizeVaultKey(input: string): string | null {
  const folded = input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/I/g, "1")
    .replace(/L/g, "1")
    .replace(/O/g, "0");
  if (folded.length !== KEY_CHARS) return null;
  for (const ch of folded) {
    if (!KEY_ALPHABET.includes(ch)) return null;
  }
  const groups: string[] = [];
  for (let i = 0; i < KEY_CHARS; i += KEY_GROUP) {
    groups.push(folded.slice(i, i + KEY_GROUP));
  }
  return groups.join("-");
}

export { cipherFromRawKey };
