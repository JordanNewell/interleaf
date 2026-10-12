import nacl from "tweetnacl";
import { identityFromSeed, identityValid, type Identity } from "./crypto/keys";
import { toB64u } from "./crypto/b64";
import { PBKDF2_ITERATIONS, rewrapRawVaultKey, unwrapRawVaultKey, zeroKeyMaterial } from "../crypto";
import type { Om2KeyValueStore } from "./types";

/**
 * The OM-2 identity at rest. Unlike a plaintext key file, the Ed25519 seed is
 * sealed (AES-GCM) under a KEK derived from the Messenger passcode — the same
 * posture as mail bodies at rest: stealing the vault files never yields the
 * signing key. The seed unwraps into session memory when the user enters the
 * passcode and is zeroed on lock/unload.
 *
 * Record shape deliberately parallel to the vault-key bundle (keySalt +
 * wrappedKey), so a passcode change re-wraps both with the same machinery.
 */

export const IDENTITY_KEY = "identity.json";

export interface IdentityRecord {
  version: 1;
  keySalt: string;
  /** base64 of iv ‖ ciphertext over the 32-byte Ed25519 seed */
  wrappedKey: string;
  /** base64url public key — readable without unlock (invites, display) */
  publicKey: string;
}

/** A fresh identity: new keypair, seed wrapped under this passcode. */
export async function createIdentityRecord(
  passcode: string,
  iterations = PBKDF2_ITERATIONS
): Promise<{ record: IdentityRecord; identity: Identity }> {
  const seed = nacl.randomBytes(32);
  const identity = identityFromSeed(seed);
  zeroKeyMaterial(seed); // nacl copied the seed; the buffer has no further business
  const bundle = await rewrapRawVaultKey(identity.secretKey.slice(0, 32), passcode, iterations);
  return {
    record: { version: 1, keySalt: bundle.keySalt, wrappedKey: bundle.wrappedKey, publicKey: toB64u(identity.publicKey) },
    identity,
  };
}

/**
 * Unwrap the seed with the passcode. Throws on a wrong passcode (the GCM tag
 * fails) — callers treat any throw as "wrong passcode", exactly like the
 * vault-key unlock.
 */
export async function openIdentityRecord(
  record: IdentityRecord,
  passcode: string,
  iterations = PBKDF2_ITERATIONS
): Promise<Identity> {
  const seed = await unwrapRawVaultKey(passcode, record.keySalt, record.wrappedKey, iterations);
  const identity = identityFromSeed(seed);
  zeroKeyMaterial(seed);
  if (!identityValid(identity)) {
    identity.secretKey.fill(0);
    throw new Error("identity record is corrupt (public key does not match the seed)");
  }
  return identity;
}

/** A fresh keypair under the same passcode; the caller replaces the record on disk. */
export async function regenerateIdentityRecord(
  passcode: string,
  iterations = PBKDF2_ITERATIONS
): Promise<{ record: IdentityRecord; identity: Identity }> {
  return createIdentityRecord(passcode, iterations);
}

/** Best-effort scrub of an in-memory identity (lock / unload / regenerate). */
export function wipeIdentity(identity: Identity | null): void {
  if (!identity) return;
  identity.secretKey.fill(0);
  identity.publicKey.fill(0);
}

export async function saveIdentityRecord(kv: Om2KeyValueStore, record: IdentityRecord): Promise<void> {
  await kv.write(IDENTITY_KEY, JSON.stringify(record));
}

export async function loadIdentityRecord(kv: Om2KeyValueStore): Promise<IdentityRecord | null> {
  const raw = await kv.read(IDENTITY_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as IdentityRecord;
    if (parsed?.version !== 1 || typeof parsed.keySalt !== "string" || typeof parsed.wrappedKey !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearIdentityRecord(kv: Om2KeyValueStore): Promise<void> {
  await kv.write(IDENTITY_KEY, "null");
}
