import nacl from "tweetnacl";
import { sha256 } from "@noble/hashes/sha256";
import { base58Encode } from "./base58";
import { bytesToHex, fromB64u, toB64u } from "./b64";

export interface Identity {
  /** Ed25519 public key, 32 bytes */
  publicKey: Uint8Array;
  /** Ed25519 secret key, 64 bytes (seed + public) */
  secretKey: Uint8Array;
}

export function generateIdentity(): Identity {
  const kp = nacl.sign.keyPair();
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}

export function identityFromSeed(seed: Uint8Array): Identity {
  const kp = nacl.sign.keyPair.fromSeed(seed);
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}

/**
 * The absolute address form: `fp_` + base58(SHA-256(pubkey) truncated to 20 bytes).
 * ~27 chars; local conversations use a sanitized alias slug instead (see
 * om2/alias.ts) — the fingerprint stays the cross-vault identity.
 */
export function fingerprint(publicKey: Uint8Array): string {
  const digest = sha256(publicKey).slice(0, 20);
  return `fp_${base58Encode(digest)}`;
}

export function signDetached(identity: Identity, canonical: string): Uint8Array {
  return nacl.sign.detached(new TextEncoder().encode(canonical), identity.secretKey);
}

export function verifyDetached(
  publicKey: Uint8Array,
  sig: Uint8Array,
  canonical: string
): boolean {
  try {
    return nacl.sign.detached.verify(new TextEncoder().encode(canonical), sig, publicKey);
  } catch {
    return false;
  }
}

export { fromB64u, toB64u, fromB64, toB64 } from "./b64";

const KEYFILE_VERSION = 1;

/** Export/backup form (Social-compatible). Never written to disk unwrapped. */
export interface KeyFile {
  version: number;
  publicKey: string; // b64u
  secretKey: string; // b64u — treat as a secret
}

export function keyFile(identity: Identity): KeyFile {
  return {
    version: KEYFILE_VERSION,
    publicKey: toB64u(identity.publicKey),
    secretKey: toB64u(identity.secretKey),
  };
}

export function identityFromKeyFile(file: KeyFile): Identity {
  return { publicKey: fromB64u(file.publicKey), secretKey: fromB64u(file.secretKey) };
}

/** Sanity: the secret's public half must match the stored public key. */
export function identityValid(identity: Identity): boolean {
  const kp = nacl.sign.keyPair.fromSecretKey(identity.secretKey);
  return bytesToHex(kp.publicKey) === bytesToHex(identity.publicKey);
}
