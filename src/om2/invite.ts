import { fingerprint, fromB64u, toB64u } from "./crypto/keys";

/**
 * Contact invites (app layer over OM-2 §4 pinning): a contact reduced to one
 * pasteable string. The code carries exactly what a pin needs — the inviter's
 * public key, the relay they receive mail on, and an optional handle — so
 * "add me" becomes paste instead of dictation. It is convenience packaging,
 * not a membership grant: the bus has no rooms to join, and trust still
 * anchors in comparing safety numbers out-of-band after pinning.
 *
 * The code format (`osinv1-`) is shared with the Obsidian Social plugin, so a
 * code minted there pastes here and vice versa. This repo's own deep links
 * use the `interleaf-invite` action; pasted `social-invite` links — and
 * pre-rename `message-bus-invite` links already in the wild — still decode,
 * because the code itself is found in any text.
 */

export const INVITE_PREFIX = "osinv1-";
/** Deep link that opens Obsidian and pre-fills Add contact (registered in main.ts). */
export const INVITE_LINK_BASE = "obsidian://interleaf-invite?code=";

export interface ContactInvite {
  /** base64url Ed25519 public key of the inviter */
  publicKey: string;
  /** relay where the inviter receives mail */
  relay: string;
  handle?: string;
}

interface InviteJson {
  v: 1;
  k: string;
  r: string;
  h?: string;
}

export function encodeInvite(invite: ContactInvite): string {
  const json: InviteJson = { v: 1, k: invite.publicKey, r: invite.relay };
  if (invite.handle) json.h = invite.handle;
  const bytes = new TextEncoder().encode(JSON.stringify(json));
  return INVITE_PREFIX + toB64u(bytes);
}

export function inviteLink(invite: ContactInvite): string {
  return INVITE_LINK_BASE + encodeURIComponent(encodeInvite(invite));
}

/**
 * Accepts a bare code (`osinv1-…`), a full invite link (either deep-link
 * flavor), or either wrapped in other text (chat quotes) — null when nothing
 * invite-shaped is found or the payload fails validation.
 */
export function decodeInvite(raw: string): ContactInvite | null {
  const code = extractCode(raw);
  if (!code) return null;
  try {
    const bytes = fromB64u(code.slice(INVITE_PREFIX.length));
    const json = JSON.parse(new TextDecoder().decode(bytes)) as Partial<InviteJson>;
    if (json.v !== 1) return null;
    if (typeof json.k !== "string" || fromB64u(json.k).length !== 32) return null;
    if (typeof json.r !== "string" || !/^https?:\/\//.test(json.r)) return null;
    const invite: ContactInvite = {
      publicKey: json.k,
      relay: json.r.trim().replace(/\/+$/, ""),
    };
    if (typeof json.h === "string" && /^@[^@\s]+@[^@\s]+$/.test(json.h.trim())) {
      invite.handle = json.h.trim();
    }
    return invite;
  } catch {
    return null;
  }
}

/** The inviter's fingerprint — what the recipient eyeball-checks. */
export function inviteFingerprint(invite: ContactInvite): string {
  return fingerprint(fromB64u(invite.publicKey));
}

function extractCode(raw: string): string | null {
  const s = raw.trim();
  if (s.startsWith(INVITE_PREFIX)) return s.split(/\s/)[0] ?? null;
  const m = /osinv1-[A-Za-z0-9_-]+/.exec(s);
  return m ? (m[0] ?? null) : null;
}
