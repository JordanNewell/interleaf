import { QrCode } from "./qrcodegen.js";
import { inviteLink, type ContactInvite } from "./invite.js";

/**
 * The scannable form of a contact invite: the full obsidian:// deep link as a
 * QR matrix. Error correction level M so a phone camera reads it off another
 * screen or a compressed post screenshot — level L does not survive either.
 * Pure data (no DOM) so the unit suite can run it; canvas/PNG lives in
 * qr-card.ts. Scanning opens Add contact in their Obsidian via the
 * social-invite protocol handler — no server, no directory involved.
 */
/** An encoded QR symbol (the vendored class is re-exported as a value, so its
 * instance type has to be spelled InstanceType). */
export type InviteQr = InstanceType<typeof QrCode>;

export function inviteQr(invite: ContactInvite): InviteQr {
  return QrCode.encodeText(inviteLink(invite), QrCode.Ecc.MEDIUM);
}
