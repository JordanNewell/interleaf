/** Address = slug identifying a participant. See SPEC.md §2. */
export const ADDRESS_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;

/** The block delimiter a body must never contain (SPEC §3, hard rule 2). */
export const CLOSING_MARKER = "<!-- /messenger -->";

/**
 * Optional OM-2 extension fields (cross-vault, signed mail — see the OM-2
 * spec, Obsidian Social repo). Absent on ordinary local mail; the reference
 * parser ignores unknown header keys, so OM-1-only readers still parse these
 * blocks fine.
 */
export interface Om2Fields {
  v: number; // 2
  /** origin address, absolute (fp_...) or handle (@name@host) */
  from2: string;
  /** recipient fingerprint */
  to2: string;
  /** base64url Ed25519 public key of the signer */
  sender: string;
  /** base64 Ed25519 signature over the OM-2 canonical string */
  sig: string;
}

/**
 * On-disk body seal (SPEC §15): present when the body slot holds AES-GCM
 * ciphertext (base64) instead of plaintext. In memory the body is plaintext
 * once opened, and `enc` is cleared — a live envelope with `enc` set carries
 * ciphertext in `body` (locked, or a retransmission copy).
 */
export interface EncSeal {
  v: number; // 1
  /** base64 AES-GCM IV for this body */
  iv: string;
}

export interface MailEnvelope {
  id: string;
  from: string;
  to: string;
  /** ISO 8601 UTC */
  ts: string;
  /** Id of the message this replies to, or null */
  replyTo: string | null;
  body: string;
  /** Present when the body slot is sealed (see EncSeal above). */
  enc?: EncSeal;
  /**
   * True on read-back when the body is sealed but no vault key is in
   * session — `body` then holds ciphertext and must not be shown or searched.
   */
  encLocked?: boolean;
  /** Burn-after-send deadline (SPEC §16): ISO 8601 UTC, or absent. */
  exp?: string | null;
  /** Burn-after-read (SPEC §16): seconds after this vault displayed it. */
  bar?: number | null;
  /** Present only on delivered cross-vault mail (OM-2 §2.4). */
  om2?: Om2Fields;
}

interface EnvelopeHeader {
  id: string;
  from: string;
  to: string;
  ts: string;
  replyTo: string | null;
  v?: number;
  from2?: string;
  to2?: string;
  sender?: string;
  sig?: string;
  enc?: { v?: unknown; iv?: unknown };
  exp?: unknown;
  bar?: unknown;
}

/** Longest accepted burn-after-read window: a year, in seconds. */
export const MAX_BAR_SECONDS = 31_536_000;

/** Whether an envelope's burn-after-send deadline has passed. */
export function isExpired(message: MailEnvelope, now = Date.now()): boolean {
  if (!message.exp) return false;
  const at = Date.parse(message.exp);
  return Number.isFinite(at) && at <= now;
}

const BLOCK_RE_SOURCE =
  /<!--\s*messenger:\s*(\{[^\r\n]*\})\s*-->\r?\n([\s\S]*?)<!--\s*\/messenger\s*-->/.source;

export function newMessageId(): string {
  return `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function encodeMessage(message: MailEnvelope): string {
  const header: EnvelopeHeader = {
    id: message.id,
    from: message.from,
    to: message.to,
    ts: message.ts,
    replyTo: message.replyTo ?? null,
  };
  if (message.om2) {
    header.v = 2;
    header.from2 = message.om2.from2;
    header.to2 = message.om2.to2;
    header.sender = message.om2.sender;
    header.sig = message.om2.sig;
  }
  // a sealed body is written exactly as given — the caller guarantees `body`
  // is the ciphertext that goes with this iv (sealed append, retransmission
  // copy, or a GC rewrite of a locked inbox)
  if (message.enc) header.enc = { v: message.enc.v, iv: message.enc.iv };
  if (typeof message.exp === "string" && message.exp) header.exp = message.exp;
  if (typeof message.bar === "number" && Number.isFinite(message.bar)) {
    header.bar = Math.round(message.bar);
  }
  const body = message.body.replace(/\s+$/, "");
  return `<!-- messenger: ${JSON.stringify(header)} -->\n${body}\n<!-- /messenger -->\n\n`;
}

export function parseInbox(content: string): MailEnvelope[] {
  const out: MailEnvelope[] = [];
  const re = new RegExp(BLOCK_RE_SOURCE, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    try {
      const header = JSON.parse(match[1]) as Partial<EnvelopeHeader>;
      if (
        typeof header.id === "string" &&
        typeof header.from === "string" &&
        typeof header.to === "string" &&
        typeof header.ts === "string"
      ) {
        const env: MailEnvelope = {
          id: header.id,
          from: header.from,
          to: header.to,
          ts: header.ts,
          replyTo: typeof header.replyTo === "string" ? header.replyTo : null,
          body: match[2].replace(/\s+$/, ""),
        };
        // sealed body: keep marker + ciphertext; opening is the store's call
        if (
          header.enc &&
          typeof header.enc === "object" &&
          (header.enc as { v?: unknown }).v === 1 &&
          typeof (header.enc as { iv?: unknown }).iv === "string" &&
          (header.enc as { iv: string }).iv.length > 0 &&
          (header.enc as { iv: string }).iv.length <= 64
        ) {
          env.enc = { v: 1, iv: (header.enc as { iv: string }).iv };
          env.encLocked = true; // stays true until a key opens it
        }
        // burn fields: parseable deadline, bounded window — junk is dropped,
        // never inherited (a bad value must not burn or preserve mail wrongly)
        if (typeof header.exp === "string" && Number.isFinite(Date.parse(header.exp))) {
          env.exp = header.exp;
        }
        if (
          typeof header.bar === "number" &&
          Number.isFinite(header.bar) &&
          header.bar >= 1 &&
          header.bar <= MAX_BAR_SECONDS
        ) {
          env.bar = Math.round(header.bar);
        }
        if (
          header.v === 2 &&
          typeof header.from2 === "string" &&
          typeof header.to2 === "string" &&
          typeof header.sender === "string" &&
          typeof header.sig === "string"
        ) {
          env.om2 = {
            v: 2,
            from2: header.from2,
            to2: header.to2,
            sender: header.sender,
            sig: header.sig,
          };
        }
        out.push(env);
      }
    } catch {
      // malformed block — skip it, never break the whole inbox
    }
  }
  return out;
}
