/**
 * Level-1 passcode security for the Messenger UI.
 *
 * A passcode is stored only as a salted, iterated SHA-256 hash — never in
 * plaintext — and only while it gates the UI alone (no encryption, SPEC §8).
 * When at-rest sealing is on there is deliberately NO stored hash of the
 * secret: a fast verifier next to the wrapped key would hand an offline
 * attacker a cheap oracle, so verification there is the GCM unwrap itself.
 * Deliberately dependency-free and free of "obsidian" imports so the unit
 * suite can exercise it under plain node.
 */

/** Shortest passcode we accept — a PIN, not a password policy. */
export const PASSCODE_MIN = 4;
/** Longest passcode we accept — keeps data.json and every hash round cheap. */
export const PASSCODE_MAX = 64;
/** Stretch rounds: fast enough to feel instant, slow enough to blunt brute force. */
const ROUNDS = 1500;

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotr = (x: number, n: number): number => (x >>> n) | (x << (32 - n));

const HEX = "0123456789abcdef";
const toHex = (bytes: Uint8Array): string => {
  let out = "";
  for (const b of bytes) out += HEX[b >>> 4] + HEX[b & 15];
  return out;
};

/** FIPS 180-4 SHA-256 over a UTF-8 string, as lowercase hex. */
export function sha256Hex(message: string): string {
  const msg = new TextEncoder().encode(message);
  const l = msg.length;
  // minimal 64-byte multiple fitting message + 0x80 + 8 length bytes —
  // one block too many changes the digest, so ceil, never floor+1
  const padded = new Uint8Array(((l + 9 + 63) >>> 6) << 6);
  padded.set(msg);
  padded[l] = 0x80;
  const view = new DataView(padded.buffer);
  const bits = l * 8; // exact in a double for any input that fits memory
  view.setUint32(padded.length - 8, Math.floor(bits / 0x100000000));
  view.setUint32(padded.length - 4, bits % 0x100000000);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3];
    let e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0; h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }
  // words are big-endian in the digest — never walk h's buffer directly,
  // Uint32Array exposes it little-endian on every mainstream platform
  let out = "";
  for (const word of h) {
    for (let shift = 28; shift >= 0; shift -= 4) out += HEX[(word >>> shift) & 15];
  }
  return out;
}

/** 128-bit random salt as hex — crypto RNG when present, best-effort otherwise. */
export function makeSalt(): string {
  const bytes = new Uint8Array(16);
  const c = window.crypto;
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return toHex(bytes);
}

/** Length gate shared by every entry point that sets a passcode. */
export function isValidPasscode(passcode: string): boolean {
  const pc = passcode.trim();
  return pc.length >= PASSCODE_MIN && pc.length <= PASSCODE_MAX;
}

/**
 * Floor for passcodes that protect the encryption key: a stolen data.json can
 * be attacked offline at Argon2id speed, so digits-only codes are capped out and
 * a longer minimum applies. UI-gate-only passcodes (no encryption) keep the
 * friendlier PASSCODE_MIN — nothing secret is at stake there.
 */
export const ENCRYPTION_PASSCODE_MIN = 8;

export function isStrongPasscode(passcode: string): boolean {
  const pc = passcode.trim();
  if (pc.length < ENCRYPTION_PASSCODE_MIN || pc.length > PASSCODE_MAX) return false;
  return /\D/.test(pc);
}

/**
 * Salted, stretched hash of a passcode. Two users picking the same code, or
 * the same code on two vaults, get unrelated hashes; the round count makes
 * each guess cost the same ~1500 compressions a legit unlock pays once.
 */
export function hashPasscode(passcode: string, salt: string): string {
  // the domain string keeps the pre-rename plugin id: it separates this hash
  // from every other sha256 use, and changing it would invalidate the stored
  // hash of every vault that set a passcode before the rename
  let hash = sha256Hex(`${salt}:obsidian-messenger:${passcode.trim()}`);
  for (let i = 0; i < ROUNDS; i++) {
    hash = sha256Hex(`${salt}:${i}:${hash}`);
  }
  return hash;
}

/** Constant-time hex compare — no early exit for a matching prefix. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verify a candidate against a stored salt+hash pair. */
export function verifyPasscode(
  candidate: string,
  salt: string,
  expectedHash: string
): boolean {
  if (!salt || !expectedHash) return false;
  return constantTimeEqual(hashPasscode(candidate, salt), expectedHash);
}
