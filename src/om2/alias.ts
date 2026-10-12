import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "./crypto/b64";
import { ADDRESS_RE } from "../mailbox/envelope";

/**
 * Remote identities get a deterministic local OM-1 alias so everything
 * downstream (plugin, scripts, Dataview) sees an ordinary address (OM-2 §2.2).
 *
 * - absolute `fp_<base58>` → `fp-<base58>` (OM-1 §2 has no underscore)
 * - handle `@alice@dir.example.com` → `alice.dir-example-com`
 * - anything else → sanitized; on collision (two contacts mapping to one
 *   alias) a 6-hex-char suffix of the pubkey hash disambiguates.
 */

export function sanitizeHandleForm(remote: string): string {
  // @name@host → name.dir-example-com
  const m = /^@([^@\s]+)@([^@\s]+)$/.exec(remote);
  if (!m) return sanitizeFreeform(remote);
  const name = m[1] as string;
  const host = (m[2] as string).replace(/\./g, "-");
  return sanitizeFreeform(`${name}.${host}`);
}

export function sanitizeFpForm(fp: string): string {
  // fp_ab3… → fp-ab3…  (base58 payload is already OM-1-safe)
  return sanitizeFreeform(fp.replace(/^fp_/, "fp-"));
}

function sanitizeFreeform(s: string): string {
  let out = s.replace(/[^a-zA-Z0-9._-]/g, "-");
  out = out.replace(/^[-._]+/, ""); // must start alnum
  out = out.slice(0, 56); // leave room for the collision suffix (64 cap)
  return out;
}

export function collisionSuffix(publicKey: Uint8Array): string {
  return bytesToHex(sha256(publicKey)).slice(0, 6);
}

/**
 * Pure alias candidate before collision handling; the contact book applies
 * the suffix when two contacts would share one.
 */
export function aliasCandidate(
  remote: { fp: string; handle?: string },
  publicKey: Uint8Array
): string {
  let alias = remote.handle ? sanitizeHandleForm(remote.handle) : sanitizeFpForm(remote.fp);
  if (!ADDRESS_RE.test(alias)) {
    alias = `fp-${collisionSuffix(publicKey)}`;
  }
  return alias;
}
