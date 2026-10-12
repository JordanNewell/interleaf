import nacl from "tweetnacl";
import { canonicalAuth } from "./crypto/canon";
import { fromB64, fromB64u, toB64, toB64u } from "./crypto/b64";
import { fingerprint, verifyDetached, type Identity } from "./crypto/keys";

/**
 * Relay operation auth (spec §3.2): the header carries the signer's public
 * key; the fingerprint is derived, never transported. The signature covers
 * method + resource + ts + nonce, so a captured header can't be replayed
 * against another route. Runtime-neutral: Node ≥18 and every webview have
 * btoa/atob, so the same builder works in the plugin, the bundled relay, and
 * tests.
 */

export interface AuthParts {
  fp: string;
  publicKey: Uint8Array;
  ts: number;
  nonce: string;
  sig: Uint8Array;
}

export function parseAuthHeader(value: string): AuthParts | null {
  const m =
    /^v1 pk=([A-Za-z0-9_-]+) ts=(\d+) nonce=([A-Za-z0-9_-]+) sig=([A-Za-z0-9+/=]+)$/.exec(
      value.trim()
    );
  if (!m) return null;
  try {
    const publicKey = fromB64u(m[1] as string);
    // The fingerprint is derived, never transported — fp(pk) by construction.
    return {
      fp: fingerprint(publicKey),
      publicKey,
      ts: Number(m[2]),
      nonce: m[3] as string,
      sig: fromB64(m[4] as string),
    };
  } catch {
    return null;
  }
}

export function buildAuthHeader(
  identity: Identity,
  method: string,
  resource: string,
  ts = Date.now(),
  nonce = toB64u(nacl.randomBytes(12))
): string {
  const canonical = canonicalAuth({ method, resource, ts, nonce });
  const sig = nacl.sign.detached(new TextEncoder().encode(canonical), identity.secretKey);
  return `v1 pk=${toB64u(identity.publicKey)} ts=${ts} nonce=${nonce} sig=${toB64(sig)}`;
}

export { verifyDetached };
