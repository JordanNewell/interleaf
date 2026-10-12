import nacl from "tweetnacl";
import { convertPublicKey, convertSecretKey } from "./ed2curve";
import { fromB64, toB64 } from "./b64";

/**
 * Anonymous sealed box (nacl.box with an ephemeral sender key). The relay sees
 * only destination fingerprint, nonce and ciphertext — the ephemeral public key
 * rides inside the box blob: nonce(24) ‖ ephemeralPub(32) ‖ ciphertext.
 */

export interface SealedBox {
  /** base64 of nonce ‖ ephemeralPub ‖ ciphertext */
  box: string;
}

export function sealTo(publicKeyEd: Uint8Array, plaintext: string): SealedBox {
  const ephemeral = nacl.box.keyPair();
  // nacl.box.before(peerPublicKey, mySecretKey)
  const shared = nacl.box.before(convertPublicKey(publicKeyEd), ephemeral.secretKey);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ciphertext = nacl.box.after(new TextEncoder().encode(plaintext), nonce, shared);
  const blob = new Uint8Array(nonce.length + ephemeral.publicKey.length + ciphertext.length);
  blob.set(nonce, 0);
  blob.set(ephemeral.publicKey, nonce.length);
  blob.set(ciphertext, nonce.length + ephemeral.publicKey.length);
  return { box: toB64(blob) };
}

export function openSealed(secretKeyEd: Uint8Array, sealed: SealedBox): string | null {
  try {
    const blob = fromB64(sealed.box);
    const head = nacl.box.nonceLength + nacl.box.publicKeyLength;
    if (blob.length < head + nacl.box.overheadLength) return null;
    const nonce = blob.subarray(0, nacl.box.nonceLength);
    const ephemeralPub = blob.subarray(nacl.box.nonceLength, head);
    const ciphertext = blob.subarray(head);
    // nacl.box.before(peerPublicKey, mySecretKey)
    const shared = nacl.box.before(ephemeralPub, convertSecretKey(secretKeyEd));
    const plaintext = nacl.box.open.after(ciphertext, nonce, shared);
    if (!plaintext) return null;
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

/** Convenience for tests/tools: seal a JSON object, open back into one. */
export function sealJson(publicKeyEd: Uint8Array, value: unknown): SealedBox {
  return sealTo(publicKeyEd, JSON.stringify(value));
}

export function openJson<T = unknown>(secretKeyEd: Uint8Array, sealed: SealedBox): T | null {
  const s = openSealed(secretKeyEd, sealed);
  if (s === null) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export { toB64, toB64u, fromB64, fromB64u } from "./b64";
