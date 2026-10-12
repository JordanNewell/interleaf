import type { MailEnvelope } from "./mailbox/envelope";
import { ADDRESS_RE } from "./mailbox/envelope";
import type { MailBus, MessageHandler, SendOptions } from "./bus";
import { MessengerError } from "./bus";
import type { MailboxStore, RegistryEntry } from "./mailbox/store";
import type { ContactEntry } from "./contacts";
import { RECEIPT_RANK, parseReceipts } from "./mailbox/receipts";
import type { ReceiptEntry, ReceiptState } from "./mailbox/receipts";
import { isReservedAddress } from "./reserved";

export interface MessengerClient {
  readonly address: string;
  send(to: string, body: string, options?: SendOptions): Promise<MailEnvelope>;
  /**
   * Send, then resolve once the peer's receipt (SPEC §11) confirms the
   * message — the awaitable delivery state for agent-style consumers. The
   * resolved message carries the id; rejection carries a typed
   * MessengerError (code "receipt_timeout") if the peer stays silent.
   * Receipts are advisory: a peer that never publishes a receipts file will
   * always time out — treat that as "sent, unconfirmed", not "failed".
   */
  sendAndWait(
    to: string,
    body: string,
    options?: SendWaitOptions
  ): Promise<{ message: MailEnvelope; receipt: ReceiptEntry }>;
  onMessage(handler: MessageHandler): () => void;
}

/** Send options plus the receipt-wait knobs (see sendAndWait). */
export interface SendWaitOptions extends SendOptions {
  /** Receipt state that settles the wait (default "delivered"; "read" waits for ✓✓). */
  until?: ReceiptState;
  /** How long to wait for the receipt before rejecting (default 60s). */
  timeoutMs?: number;
}

/** What one conversation looks like to a consumer (agent, plugin, script). */
export interface ConversationSummary {
  address: string;
  name: string;
  unread: number;
  lastTs: string | null;
  muted: boolean;
}

/** Pagination for conversations(): newest-first after sorting, then slice. */
export interface ConversationsOptions {
  limit?: number;
  offset?: number;
}

/** Pagination for messages(): walk a conversation backwards from the newest. */
export interface MessagePageOptions {
  /** Page size (default 50, newest `limit` messages of the slice). */
  limit?: number;
  /** ISO ts — only messages strictly older than this are returned. */
  before?: string;
}

/** Settings/store access the API needs; the plugin instance satisfies this. */
export interface ApiContext {
  address(): string;
  readAt(): Record<string, string>;
  mutedPeers(): Record<string, boolean>;
  markPeerRead(peer: string): Promise<void>;
  contacts(): Promise<ContactEntry[]>;
  addContact(address: string, name: string): Promise<void>;
}

export interface MessengerApiV1 {
  readonly version: 1;
  /**
   * Register (or refresh) an address and get a client bound to it.
   * The bus polls the new inbox automatically — no per-client loop needed.
   */
  client(address: string, options?: { name?: string }): Promise<MessengerClient>;
  /** Listen to all traffic, or to one address's mail. Returns a stable unsubscribe. */
  onMessage(handler: MessageHandler, address?: string): () => void;
  /** Run one poll pass now. Returns the number of messages delivered. */
  checkInboxes(): Promise<number>;
  registry(): Promise<RegistryEntry[]>;
  /**
   * The social gate's contact list (SPEC §17): address, name, and state —
   * request | pending | mutual | blocked. Read-only.
   */
  contacts(): Promise<ContactEntry[]>;
  /**
   * Add (or re-register) a contact — state pending until they reply or a
   * request is accepted. Existing entries keep their state.
   */
  addContact(address: string, name?: string): Promise<void>;
  /** Every conversation with unread counts — the agent-friendly list view. */
  conversations(options?: ConversationsOptions): Promise<ConversationSummary[]>;
  /**
   * One conversation's messages, oldest first, burn-filtered like every
   * read. `before` + `limit` walk the thread backwards page by page.
   */
  messages(peer: string, options?: MessagePageOptions): Promise<MailEnvelope[]>;
  /** Mark a conversation read (and emit read receipts when enabled). */
  markRead(peer: string): Promise<void>;
  /**
   * Await a peer's receipt for one message id (SPEC §11) — resolves with the
   * receipt entry once the peer acknowledges, rejects with a typed
   * MessengerError (code "receipt_timeout") past timeoutMs. Rides the
   * receipts files exactly like the retransmission logic does; a peer
   * without a receipts file simply never acknowledges.
   */
  waitForDelivery(
    peer: string,
    messageId: string,
    options?: WaitForDeliveryOptions
  ): Promise<ReceiptEntry>;
}

export interface WaitForDeliveryOptions {
  /** Receipt state that settles the wait (default "delivered"). */
  until?: ReceiptState;
  /** How long to wait before rejecting (default 60s). */
  timeoutMs?: number;
  /** Receipt-file poll interval (default 1s, floor 250ms). */
  pollMs?: number;
}

declare global {
  interface Window {
    obsidianMessenger?: MessengerApiV1;
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

export function createApi(
  bus: MailBus,
  store: MailboxStore,
  ctx: ApiContext
): MessengerApiV1 {
  const waitForDelivery = async (
    peer: string,
    messageId: string,
    options: WaitForDeliveryOptions = {}
  ): Promise<ReceiptEntry> => {
    if (!ADDRESS_RE.test(peer)) {
      throw new MessengerError(`Invalid recipient address: ${peer}`, "invalid_address");
    }
    const until = options.until ?? "delivered";
    const timeoutMs = Math.max(1, options.timeoutMs ?? 60_000);
    const pollMs = Math.min(60_000, Math.max(250, options.pollMs ?? 1000));
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      if (await store.hasReceipts(peer)) {
        const hit = parseReceipts(await store.readReceiptsRaw(peer)).get(messageId);
        if (hit && RECEIPT_RANK[hit.state] >= RECEIPT_RANK[until]) return hit;
      }
      if (Date.now() >= deadline) {
        throw new MessengerError(
          `No ${until} receipt from ${peer} for ${messageId} within ${timeoutMs}ms`,
          "receipt_timeout"
        );
      }
      await sleep(Math.min(pollMs, Math.max(1, deadline - Date.now())));
    }
  };

  const api: MessengerApiV1 = {
    version: 1,
    onMessage: (handler, address) => bus.subscribe(handler, address),
    checkInboxes: () => bus.tick(),
    registry: () => store.readRegistry(),
    contacts: () => ctx.contacts(),
    async addContact(address, name) {
      if (!ADDRESS_RE.test(address)) {
        throw new MessengerError(`Invalid messenger address: ${address}`, "invalid_address");
      }
      if (isReservedAddress(address)) {
        throw new MessengerError(
          `Reserved messenger address: ${address} — no one can hold a name with that weight (SPEC §2)`,
          "reserved_address"
        );
      }
      await ctx.addContact(address, name ?? address);
    },
    async conversations(options) {
      const me = ctx.address();
      const readAt = ctx.readAt();
      const muted = ctx.mutedPeers();
      const [addresses, registry, mine] = await Promise.all([
        store.listAddresses(),
        store.readRegistry(),
        store.readInbox(me),
      ]);
      const names = new Map(registry.map((r) => [r.address, r.name]));
      const unreadBySender = new Map<string, number>();
      const since = (from: string): string => readAt[from] ?? "";
      for (const m of mine) {
        if (m.from === me || m.ts <= since(m.from)) continue;
        unreadBySender.set(m.from, (unreadBySender.get(m.from) ?? 0) + 1);
      }
      const out: ConversationSummary[] = [];
      for (const address of addresses) {
        const messages = await bus.loadConversation(me, address);
        const last = messages[messages.length - 1] ?? null;
        out.push({
          address,
          name: names.get(address) ?? address,
          unread: address === me ? 0 : (unreadBySender.get(address) ?? 0),
          lastTs: last?.ts ?? null,
          muted: muted[address] === true,
        });
      }
      out.sort(
        (a, b) =>
          (b.lastTs ?? "").localeCompare(a.lastTs ?? "") ||
          a.address.localeCompare(b.address)
      );
      const offset = Math.max(0, options?.offset ?? 0);
      const limit = options?.limit;
      return limit === undefined ? out.slice(offset) : out.slice(offset, offset + Math.max(0, limit));
    },
    async messages(peer, options = {}) {
      if (!ADDRESS_RE.test(peer)) {
        throw new MessengerError(`Invalid messenger address: ${peer}`, "invalid_address");
      }
      const all = await bus.loadConversation(ctx.address(), peer);
      const bounded = options.before ? all.filter((m) => m.ts < options.before!) : all;
      const limit = Math.max(0, options.limit ?? 50);
      return bounded.slice(Math.max(0, bounded.length - limit));
    },
    markRead: (peer) => ctx.markPeerRead(peer),
    waitForDelivery,
    async client(address, options) {
      if (!ADDRESS_RE.test(address)) {
        throw new MessengerError(`Invalid messenger address: ${address}`, "invalid_address");
      }
      if (isReservedAddress(address)) {
        throw new MessengerError(
          `Reserved messenger address: ${address} — no one can hold a name with that weight (SPEC §2)`,
          "reserved_address"
        );
      }
      await store.ensureAddress(address);
      await store.upsertRegistry({
        address,
        name: options?.name ?? address,
        updated: new Date().toISOString(),
      });
      // a registered client is an introduction from this vault (SPEC §17):
      // pending now, mutual on its first mail — not a stranger's request
      if (address !== ctx.address()) {
        await ctx.addContact(address, options?.name ?? address);
      }
      return {
        address,
        send: (to, body, sendOptions) => bus.send(address, to, body, sendOptions),
        async sendAndWait(to, body, sendOptions = {}) {
          const message = await bus.send(address, to, body, sendOptions);
          const receipt = await waitForDelivery(to, message.id, {
            until: sendOptions.until,
            timeoutMs: sendOptions.timeoutMs,
          });
          return { message, receipt };
        },
        onMessage: (handler) => bus.subscribe(handler, address),
      };
    },
  };
  return api;
}
