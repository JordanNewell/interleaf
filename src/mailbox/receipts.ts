/**
 * Delivery & read receipts — an optional companion channel to the OM-1 bus.
 *
 * Convention (SPEC.md §11): acknowledgments of mail delivered to X's inbox
 * live in `<root>/<X>/receipts.md`, written only by X's own plugin instance.
 * Delivery receipts are appended when the poll loop dispatches a message;
 * read receipts when the chat view has actually shown it. Senders read the
 * recipient's file to decorate their outgoing bubbles (✓ delivered, ✓✓ read).
 *
 * The file is append-only and invisible in reading mode: one receipt is one
 * HTML comment line, human-readable like everything else on this bus.
 */

export type ReceiptState = "delivered" | "read";

export interface ReceiptEntry {
  state: ReceiptState;
  ts: string;
}

const RECEIPT_LINE_RE = /<!--\s*receipts:\s*(\{[^\r\n]*\})\s*-->/g;

/** State ordering: read outranks delivered, and delivered implies sent. */
export const RECEIPT_RANK: Record<ReceiptState, number> = {
  delivered: 1,
  read: 2,
};

export const receiptsHeader = (address: string): string =>
  `# Receipts — ${address}\n\nAppend-only acknowledgments of this inbox's mail. ` +
  `Written by the owner's plugin, read by senders. See SPEC.md §11.\n\n`;

export function encodeReceiptBlock(
  by: string,
  state: ReceiptState,
  ts: string,
  ids: string[]
): string {
  const payload = JSON.stringify({ by, state, ts, ids });
  return `<!-- receipts: ${payload} -->\n`;
}

/** Merge every receipt line into id → best state (read > delivered, newest ts). */
export function parseReceipts(content: string): Map<string, ReceiptEntry> {
  const out = new Map<string, ReceiptEntry>();
  const re = new RegExp(RECEIPT_LINE_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    try {
      const header = JSON.parse(match[1]) as {
        state?: string;
        ts?: string;
        ids?: unknown;
      };
      if (header.state !== "delivered" && header.state !== "read") continue;
      if (typeof header.ts !== "string") continue;
      if (!Array.isArray(header.ids)) continue;
      for (const id of header.ids) {
        if (typeof id !== "string") continue;
        const existing = out.get(id);
        if (!existing || RECEIPT_RANK[header.state] >= RECEIPT_RANK[existing.state]) {
          out.set(id, { state: header.state, ts: header.ts });
        }
      }
    } catch {
      // malformed line — skip it, never break the whole file
    }
  }
  return out;
}

/** Drop receipt lines older than the cutoff; returns '' when nothing remains. */
export function pruneReceiptLines(content: string, cutoffMs: number): string {
  const kept: string[] = [];
  const re = new RegExp(RECEIPT_LINE_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    try {
      const header = JSON.parse(match[1]) as { ts?: string };
      if (typeof header.ts === "string" && Date.parse(header.ts) > cutoffMs) {
        kept.push(match[0]);
      }
    } catch {
      // undated junk ages out immediately by not being kept
    }
  }
  return kept.length ? kept.join("\n") + "\n" : "";
}
