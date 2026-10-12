/**
 * Retransmission (SPEC.md §14): on a shared bus, a sync merge can clobber a
 * sender's append after it was written. The sender remembers each send until
 * its delivery receipt (§11) arrives; past a grace period with no ✓, it
 * re-appends the message unchanged — same id, so receivers dedupe (§4) and
 * GC collapses the duplicate (§7).
 *
 * Retransmission only ever targets peers that publish a receipts file: no
 * receipts file means no ACK channel (remote OM-2 peers, scripts, agents),
 * and re-sending to them would duplicate everything they receive.
 */

import type { MailEnvelope } from "./mailbox/envelope";

/** A sent message still awaiting its delivery receipt. */
export interface UnackedSend {
  message: MailEnvelope;
  /** ISO ts of the send (or of the last retransmit attempt). */
  sentAt: string;
  attempts: number;
}

/** How long a sent message waits for its ✓ before the bus re-appends it. */
export const RETRANSMIT_AFTER_MS = 5 * 60 * 1000;
/** Give up retransmitting after this many attempts… */
export const RETRANSMIT_MAX_ATTEMPTS = 4;
/** …or once the message is this old regardless. */
export const RETRANSMIT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type RetransmitDecision = "wait" | "clear" | "retransmit" | "drop";

/**
 * Pure decision for one remembered send. `receipts` is the recipient's
 * parsed receipts file, or null when it could not be read; `hasReceiptsFile`
 * distinguishes "no file at all" (no ACK channel) from "empty file".
 *
 * The one-day give-up ages the MESSAGE (§14 "stop entirely once the message
 * is more than a day old"), not the last attempt — sentAt moves forward on
 * every retransmit, and aging by it would let an old message ride reset
 * after reset. The grace period still measures from the last attempt.
 */
export function planRetransmit(
  entry: UnackedSend,
  hasReceiptsFile: boolean,
  receipts: Map<string, unknown> | null,
  now: number
): RetransmitDecision {
  const sentAt = Date.parse(entry.sentAt);
  if (!Number.isFinite(sentAt)) return "drop"; // undatable — never loop on it
  const messageTs = Date.parse(entry.message.ts);
  const ageBase = Number.isFinite(messageTs) ? messageTs : sentAt;
  if (now - ageBase > RETRANSMIT_MAX_AGE_MS) return "drop"; // too old to matter
  if (!hasReceiptsFile) return "wait"; // no ACK channel — never duplicate
  if (receipts?.has(entry.message.id)) return "clear"; // ✓ arrived
  if (now - sentAt < RETRANSMIT_AFTER_MS) return "wait";
  if (entry.attempts >= RETRANSMIT_MAX_ATTEMPTS) return "drop";
  return "retransmit";
}
