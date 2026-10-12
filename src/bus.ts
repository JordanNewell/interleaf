import {
  ADDRESS_RE,
  CLOSING_MARKER,
  MailEnvelope,
  isExpired,
  newMessageId,
} from "./mailbox/envelope";
import { MailboxStore } from "./mailbox/store";

export interface Cursor {
  id: string;
  ts: string;
}

export type MessageHandler = (msg: MailEnvelope) => void | Promise<void>;

/** Machine-readable failure codes for the bus's typed error. */
export type MessengerErrorCode =
  | "invalid_address"
  | "reserved_address"
  | "invalid_body"
  | "invalid_reply_to"
  | "receipt_timeout";

/**
 * Every thrown bus error carries a stable `code`, so API consumers (agents,
 * other plugins) can branch on the failure mode instead of parsing messages.
 * Still an Error — existing try/catch code is unaffected.
 */
export class MessengerError extends Error {
  readonly code: MessengerErrorCode;
  constructor(message: string, code: MessengerErrorCode) {
    super(message);
    this.name = "MessengerError";
    this.code = code;
  }
}

export interface SendOptions {
  replyTo?: string | null;
  /** Burn-after-send (SPEC §16): message dies this many ms from now. */
  burnAfterMs?: number;
  /** Burn-after-read (SPEC §16): message dies this many s after display. */
  burnOnReadSec?: number;
}

/** What GC should apply to one address's files (retention + size cap). */
export interface GcPolicy {
  maxAgeMs: number;
  maxMessages: number;
}

export interface MailBusHooks {
  onError?: (err: unknown, address: string) => void;
  onDispatch?: (msg: MailEnvelope) => void;
  /** Called after a message lands in its recipient's inbox (SPEC §3). */
  onSend?: (msg: MailEnvelope) => void;
}

/**
 * The time-gated loop: scans every inbox under the mailbox root and delivers
 * messages past each inbox's cursor to subscribed handlers. Delivery is
 * at-least-once (SPEC.md §4) — handlers should be idempotent.
 */
export class MailBus {
  private handlers: Array<{ addresses: Set<string> | null; fn: MessageHandler }> = [];
  private cursors: Record<string, Cursor> = {};
  private ticking = false;
  /**
   * When on, every send also appends a copy to the sender's outbox
   * (SPEC §13) so sent history survives the recipient's folder. Off by
   * default — the vault is shared, and the recipient's inbox already holds
   * the conversation.
   */
  keepOutbox = false;
  /**
   * Where loadConversation reads per-peer display timestamps from (SPEC §16
   * burn-after-read). The plugin points this at settings.readAt.
   */
  readAtSource: (() => Record<string, string>) | null = null;
  /**
   * Per-address GC overrides (per-address retention): when set, resolved for
   * every address at GC time; a null return falls back to the gc() arguments.
   * The plugin points this at settings' per-peer retention records.
   */
  gcPolicySource: ((address: string) => GcPolicy | null) | null = null;

  constructor(
    private store: MailboxStore,
    private hooks: MailBusHooks = {}
  ) {}

  setCursors(cursors: Record<string, Cursor>): void {
    this.cursors = { ...cursors };
  }

  getCursors(): Record<string, Cursor> {
    return { ...this.cursors };
  }

  subscribe(handler: MessageHandler, address?: string): () => void {
    const entry = { addresses: address ? new Set([address]) : null, fn: handler };
    this.handlers.push(entry);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== entry);
    };
  }

  async send(
    from: string,
    to: string,
    body: string,
    options: SendOptions = {}
  ): Promise<MailEnvelope> {
    if (!ADDRESS_RE.test(from)) {
      throw new MessengerError(`Invalid sender address: ${from}`, "invalid_address");
    }
    if (!ADDRESS_RE.test(to)) {
      throw new MessengerError(`Invalid recipient address: ${to}`, "invalid_address");
    }
    if (!body.trim()) throw new MessengerError("Message body is empty", "invalid_body");
    // SPEC §3 rule 2 — a body carrying the closing marker would truncate
    // every parser that reads this block, mangling the inbox after it
    if (body.includes(CLOSING_MARKER)) {
      throw new MessengerError(
        `Message body contains the block delimiter "${CLOSING_MARKER}"`,
        "invalid_body"
      );
    }
    const replyTo = options.replyTo ?? null;
    if (
      replyTo !== null &&
      (replyTo.length === 0 || replyTo.length > 64 || replyTo.includes("-->"))
    ) {
      throw new MessengerError(`Invalid replyTo id: ${replyTo}`, "invalid_reply_to");
    }
    const message: MailEnvelope = {
      id: newMessageId(),
      from,
      to,
      ts: new Date().toISOString(),
      replyTo,
      body,
    };
    if (options.burnAfterMs && options.burnAfterMs > 0) {
      message.exp = new Date(Date.now() + options.burnAfterMs).toISOString();
    }
    if (options.burnOnReadSec && options.burnOnReadSec >= 1) {
      message.bar = Math.round(options.burnOnReadSec);
    }
    const sealed = await this.store.append(to, message);
    if (this.keepOutbox) {
      try {
        await this.store.appendOutbox(from, message);
      } catch (err) {
        // the recipient already has the mail; the outbox is a local
        // convenience copy (§13) and must not fail a delivered send
        this.hooks.onError?.(err, from);
      }
    }
    if (sealed) {
      // hand the sealed form to hooks and the caller: the retransmission
      // memory (SPEC §14) must never hold plaintext at rest (SPEC §15)
      message.enc = { v: 1, iv: sealed.iv };
      message.body = sealed.ct;
    }
    try {
      this.hooks.onSend?.(message);
    } catch (err) {
      // a hook failure must never fail a message that is already delivered
      this.hooks.onError?.(err, to);
    }
    return message;
  }

  /** One poll pass over every inbox. Returns the number of messages delivered. */
  async tick(): Promise<number> {
    if (this.ticking) return 0;
    this.ticking = true;
    try {
      let processed = 0;
      for (const address of await this.store.listAddresses()) {
        const messages = await this.store.readInbox(address);
        const pending = pendingAfter(messages, this.cursors[address] ?? null);
        for (const message of pending) {
          for (const handler of this.handlers) {
            if (handler.addresses && !handler.addresses.has(address)) continue;
            try {
              await handler.fn(message);
            } catch (err) {
              this.hooks.onError?.(err, address);
            }
          }
          this.cursors[address] = { id: message.id, ts: message.ts };
          processed++;
          this.hooks.onDispatch?.(message);
        }
      }
      return processed;
    } finally {
      this.ticking = false;
    }
  }

  /**
   * Both halves of a conversation {me, peer}: mail the peer sent me (my
   * inbox), mail I sent them (their inbox — the sender keeps no copy), plus
   * my outbox copies when keepOutbox is on. Deduped by id, oldest first.
   * Burn-expired mail is gone from the view (SPEC §16): `exp` was already
   * filtered at read time; `bar` messages drop once this vault has displayed
   * the conversation past their window.
   */
  async loadConversation(me: string, peer: string): Promise<MailEnvelope[]> {
    const [mine, theirs] = await Promise.all([
      this.store.readInbox(me),
      this.store.readInbox(peer),
    ]);
    const byId = new Map<string, MailEnvelope>();
    const add = (m: MailEnvelope): void => {
      if (!byId.has(m.id)) byId.set(m.id, m);
    };
    if (peer === me) {
      mine.filter((m) => m.from === me).forEach(add);
      if (this.keepOutbox) {
        (await this.store.readOutbox(me))
          .filter((m) => m.to === me)
          .forEach(add);
      }
    } else {
      mine.filter((m) => m.from === peer).forEach(add);
      theirs.filter((m) => m.from === me).forEach(add);
      if (this.keepOutbox) {
        (await this.store.readOutbox(me))
          .filter((m) => m.to === peer)
          .forEach(add);
      }
    }
    const readAt = this.readAtSource?.()[peer];
    const shown = [...byId.values()].sort(
      (a, b) => a.ts.localeCompare(b.ts) || a.id.localeCompare(b.id)
    );
    if (!readAt) return shown;
    const readMs = Date.parse(readAt);
    const now = Date.now();
    return shown.filter((m) => !(m.bar && now >= readMs + m.bar * 1000));
  }

  /**
   * The burn sweep (SPEC §16): delete burned blocks from every inbox and
   * outbox on disk. `exp` is absolute; `bar` burns relative to when this
   * vault displayed the message's conversation (readAt, keyed by peer).
   * Returns the number of blocks dropped.
   */
  async burnSweep(
    me: string,
    readAtByPeer: Record<string, string>
  ): Promise<number> {
    const now = Date.now();
    const burned = (m: MailEnvelope): boolean => {
      if (isExpired(m, now)) return true;
      if (m.bar) {
        // a message belongs to the conversation with the other party
        const peer = m.from === me ? m.to : m.from;
        const read = readAtByPeer[peer];
        if (read && now >= Date.parse(read) + m.bar * 1000) return true;
      }
      return false;
    };
    let dropped = 0;
    for (const address of await this.store.listAddresses()) {
      dropped += await this.store.sweepBurned(address, burned);
    }
    return dropped;
  }

  /**
   * Drop messages older than maxAgeMs from every inbox, and everything past
   * maxMessages per inbox when set (oldest first). Per-address overrides from
   * gcPolicySource win over the arguments (per-address retention). The
   * receiver's own cursor protects still-reachable mail from the age drop
   * (SPEC §7 invariant); the size cap applies regardless of age. Returns
   * count dropped.
   */
  async gc(maxAgeMs: number, maxMessages = 0): Promise<number> {
    let dropped = 0;
    for (const address of await this.store.listAddresses()) {
      let ageMs = maxAgeMs;
      let cap = maxMessages;
      const policy = this.gcPolicySource?.(address);
      if (policy) {
        if (typeof policy.maxAgeMs === "number") ageMs = policy.maxAgeMs;
        if (typeof policy.maxMessages === "number") cap = policy.maxMessages;
      }
      dropped += await this.store.gc(address, ageMs, cap, this.cursors[address] ?? null);
      await this.store.gcReceipts(address, ageMs);
      dropped += await this.store.gcOutbox(address, ageMs, cap);
    }
    return dropped;
  }
}

export function pendingAfter(messages: MailEnvelope[], cursor: Cursor | null): MailEnvelope[] {
  if (!cursor) return messages;
  const idx = messages.findIndex((m) => m.id === cursor.id);
  if (idx >= 0) return messages.slice(idx + 1);
  const ts = Date.parse(cursor.ts);
  return messages.filter((m) => Date.parse(m.ts) > ts);
}
