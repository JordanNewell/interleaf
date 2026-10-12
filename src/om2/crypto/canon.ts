import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "./b64";

/**
 * Canonical strings are the exact bytes that get signed. The templates below are
 * the wire contract — changing one invalidates every signature ever made, so
 * treat these as frozen (spec OM-2 §2.4).
 */

export function sha256Hex(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return bytesToHex(sha256(bytes));
}

export function sha256Bytes(input: string | Uint8Array): Uint8Array {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return sha256(bytes);
}

/** Signed by the sender's identity key for every message. */
export function canonicalMessage(parts: {
  id: string;
  from2: string;
  to2: string;
  ts: string;
  replyTo: string | null;
  body: string;
}): string {
  return [
    "om2.v1",
    parts.id,
    parts.from2,
    parts.to2,
    parts.ts,
    parts.replyTo ?? "",
    sha256Hex(parts.body),
  ].join("|");
}

/** Signed by the requester's identity key for relay operations. */
export function canonicalAuth(parts: {
  method: string;
  resource: string;
  ts: number;
  nonce: string;
}): string {
  return `om2.auth|v1|${parts.method}|${parts.resource}|${parts.ts}|${parts.nonce}`;
}
