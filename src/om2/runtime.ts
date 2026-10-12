import { canonicalMessage, sha256Bytes } from "./crypto/canon";
import { fingerprint, fromB64, fromB64u, verifyDetached } from "./crypto/keys";
import type { MailEnvelope } from "../mailbox/envelope";
import type { Om2Contacts } from "./bridge";

/**
 * Verification for the shield badge and the Signal-style safety number.
 * Host-agnostic: takes the contacts surface, not the plugin, so the unit
 * suite runs it anywhere. A signature proves key possession, never
 * personhood — "verified" means "the pinned key signed this".
 */

export interface Om2Badge {
  state: "verified" | "signed-unknown" | "invalid";
  name?: string;
  fp?: string;
  reason?: string;
}

export async function verifyEnvelope(
  msg: MailEnvelope,
  contacts: Om2Contacts | null
): Promise<Om2Badge | null> {
  if (!msg.om2) return null;
  const { om2 } = msg;
  let publicKey: Uint8Array;
  try {
    publicKey = fromB64u(om2.sender);
  } catch {
    return { state: "invalid", reason: "sender key is not valid base64url" };
  }
  const canonical = canonicalMessage({
    id: msg.id,
    from2: om2.from2,
    to2: om2.to2,
    ts: msg.ts,
    replyTo: msg.replyTo,
    body: msg.body,
  });
  let sig: Uint8Array;
  try {
    sig = fromB64(om2.sig);
  } catch {
    return { state: "invalid", reason: "signature is not valid base64" };
  }
  if (!verifyDetached(publicKey, sig, canonical)) {
    return { state: "invalid", reason: "signature does not verify" };
  }
  if (contacts) {
    const all = await contacts.all();
    const contact = all.find((c) => c.publicKey === om2.sender || c.fp === om2.from2);
    if (contact) return { state: "verified", name: contact.displayName ?? contact.alias };
  }
  return { state: "signed-unknown", fp: fingerprint(publicKey) };
}

/** Signal-style safety number: 30 digits from sha256 over both public keys. */
export function safetyNumber(myPub: Uint8Array, theirPub: Uint8Array): string {
  const a = myPub.slice().sort();
  const b = theirPub.slice().sort();
  const first = compare(a, b) <= 0 ? a : b;
  const second = compare(a, b) <= 0 ? b : a;
  const digest = sha256Bytes(new Uint8Array([...first, ...second]));
  let digits = "";
  for (let i = 0; i < 15 && digits.length < 30; i++) {
    digits += String(((digest[i * 2] as number) << 8) | (digest[i * 2 + 1] as number)).padStart(5, "0");
  }
  return digits.slice(0, 30).replace(/(\d{3})(?=\d)/g, "$1 ");
}

function compare(x: Uint8Array, y: Uint8Array): number {
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    if (x[i] !== y[i]) return (x[i] as number) - (y[i] as number);
  }
  return x.length - y.length;
}
