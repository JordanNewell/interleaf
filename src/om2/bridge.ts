import { canonicalMessage } from "./crypto/canon";
import {
  fingerprint,
  fromB64u,
  signDetached,
  toB64,
  toB64u,
  verifyDetached,
  type Identity,
} from "./crypto/keys";
import { fromB64 } from "./crypto/b64";
import { sealJson, openJson } from "./crypto/seal";
import { buildAuthHeader } from "./auth";
import { newMessageId, type MailEnvelope } from "../mailbox/envelope";
import { BridgeState, type QuarantineRecord } from "./state";
import type { Om2KeyValueStore, Om2MailStore } from "./types";

/**
 * The OM-2 bridge (spec §3.3): one component at the vault edge, two directions.
 *
 * Outbound — local participants write ordinary OM-1 blocks into a contact's
 * alias inbox; the bridge notices blocks it hasn't sent, signs + seals + POSTs
 * them to one of the contact's relays, and records the id. The block stays in
 * the file as the local record of "mail sent". `sendRequest` is the one
 * outbound path that needs no pinned contact: it seals a self-signed intro to
 * a bare public key (docs/first-contact.md §4).
 *
 * Inbound — the bridge polls its relay mailbox, opens each sealed box and
 * walks the verification ladder (docs/first-contact.md §3):
 *   1. box won't open with our key → poison, delete;
 *   2. sender pinned → verify against the PINNED key; a carried `from.pk`
 *      that differs from the pin is a §5.3 key change — quarantine, never
 *      silently re-pin;
 *   3. sender unpinned but self-consistent (`fp(pk) === from.fp`, signature
 *      verifies) → quarantine as a contact REQUEST — unless we have a pending
 *      `outgoing[fp]`, in which case this is the awaited reply and the ONLY
 *      auto-pin in the system fires, symmetric to the accepter's explicit
 *      Accept;
 *   4. anything else → impostor, reject + delete.
 * Boxes from a quarantined or blocked fp are HELD on the relay (skipped, not
 * deleted) so the conversation is complete when the user decides — blocked
 * senders just never get delivered and age out with the relay's 7-day
 * retention (§3.2 mailbox, not ledger).
 *
 * Delivery failures bounce back into the sender's inbox as mail from `bridge`.
 * Storage is injected (Om2MailStore/Om2KeyValueStore/Om2Contacts): the same
 * core runs in Node tests and embedded in the plugin.
 */

/** A pinned remote identity, as the bridge sees it (read model over the contact book). */
export interface Om2Contact {
  fp: string;
  /** base64url Ed25519 public key — the pinned key */
  publicKey: string;
  /** local OM-1 alias, the folder under the mailbox root */
  alias: string;
  handle?: string;
  displayName?: string;
  /** relays where this contact receives mail */
  relays: string[];
}

/** The pin/lookup surface the bridge needs; the host implements it over its own contact store. */
export interface Om2Contacts {
  all(): Promise<Om2Contact[]>;
  byFpGet(fp: string): Promise<Om2Contact | undefined>;
  pin(input: {
    publicKey: Uint8Array;
    handle?: string;
    displayName?: string;
    relays: string[];
  }): Promise<Om2Contact>;
}

export interface BridgeOptions {
  mail: Om2MailStore;
  kv: Om2KeyValueStore | null;
  /** kv key for delivery state (default `bridge-state.json`) */
  stateKey?: string;
  /** the local human's OM-1 address (default `owner`) */
  localAddress?: string;
  /** this vault's handle, e.g. `@alice@dir.example.com` — travels as from2 (optional) */
  handle?: string;
  identity: Identity;
  contacts: Om2Contacts;
  /** this vault's relay (where inbound mail waits) */
  relayUrl: string;
  /** poll interval for the relay inbox, ms (default 60s, jittered ±10%) */
  inboundPollMs?: number;
  /** scan interval for local outbound inboxes, ms (default 5s) */
  outboundPollMs?: number;
  /** append a bounce after this many failed send attempts (default 3) */
  maxSendAttempts?: number;
  /** contact-request send attempts before giving up (default 3) */
  requestAttempts?: number;
  /** delay between contact-request retries, ms (default 500) */
  requestRetryDelayMs?: number;
  log?: (msg: string) => void;
  /**
   * UI hook (replaces log-string coupling): fires once per state transition
   * a host wants to surface — a knock, an auto-pin, a key change, a bounce.
   * Never fires for per-tick repeats (held/blocked re-polls stay silent).
   */
  onEvent?: (ev: BridgeEvent) => void;
  /** test hook: replace global fetch */
  fetchImpl?: typeof fetch;
}

export interface WireMessage {
  id: string;
  ts: string;
  replyTo: string | null;
  /**
   * `pk` (docs/first-contact.md §3): the sender's base64url Ed25519 public
   * key, 44 bytes. Always included by senders — it is what lets an unpinned
   * but self-consistent sender knock (ladder step 3) without letting them
   * DELIVER (§3.3: an impostor can knock, never enter).
   *
   * `relay` (first-contact.md §9, v1.1): the sender's own return address —
   * where replies should be posted. It is not a secret (a relay URL routes
   * ciphertext, it opens nothing) and it rides inside the sealed box, so its
   * integrity comes from the seal, not the signature: the canonical template
   * stays frozen (§2.4). Accept pins with it so cross-relay first contact
   * doesn't strand the auto-reply.
   */
  from: { fp: string; handle?: string; pk?: string; relay?: string };
  to: string; // recipient fingerprint
  body: string;
  sig: string;
}

/** One state transition worth surfacing to the host UI. */
export type BridgeEvent =
  | {
      type: "quarantined";
      fp: string;
      handle?: string;
      /** the verified key the request would pin — the host files it under Contact requests */
      publicKey: string;
      innerId: string;
    }
  | { type: "autopinned"; fp: string; alias: string }
  | { type: "keychange"; fp: string; /** the newly announced key */ publicKey: string }
  | { type: "bounce"; id: string; alias: string; reason: string };

/** Result of the inbound verification ladder for one sealed box. */
type DeliverStatus =
  | "appended" // delivered to the local owner's inbox
  | "duplicate" // already-delivered inner id (relay redelivery)
  | "rejected" // impostor/unsigned — deleted
  | "poison" // unopenable garbage — deleted
  | "quarantined" // first verified knock from a stranger — HELD on relay
  | "held" // follow-up box from a quarantined fp — HELD on relay
  | "blocked" // box from a blocked fp — HELD on relay, silent (§3.3)
  | "keychange"; // pinned sender announced a new key — quarantined, deleted

interface DeliverOutcome {
  status: DeliverStatus;
  innerId: string;
  alias?: string;
  fp?: string;
  /** the verified carried key — quarantined (request) or newly announced (keychange) */
  pk?: string;
  reason?: string;
}

const BOUNCE_FROM = "bridge";
const DEFAULT_REQUEST_NOTE = "Hi — I'd like to add you as a contact on Interleaf.";
const ACCEPT_REPLY_NOTE = "Contact request accepted — this conversation is now mutual.";
/**
 * A sent request authorizes auto-pin only while it is fresh (§2): the
 * person may have moved on, a device may have changed hands — a forgotten
 * invitation must not wave a stranger straight in years later. After this,
 * their reply is treated as an ordinary verified knock.
 */
const OUTGOING_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export class Bridge {
  readonly localAddress: string;
  readonly myFp: string;
  private stateKey: string;
  private inboundPollMs: number;
  private outboundPollMs: number;
  private maxSendAttempts: number;
  private requestAttempts: number;
  private requestRetryDelayMs: number;
  private state: BridgeState | null = null;
  private log: (msg: string) => void;
  private onEvent: (ev: BridgeEvent) => void;
  private fetchImpl: typeof fetch;
  private inboundTimer: ReturnType<typeof setTimeout> | null = null;
  private outboundTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private inFlightInbound = false;
  private inFlightOutbound = false;

  constructor(private opts: BridgeOptions) {
    this.localAddress = opts.localAddress ?? "owner";
    this.stateKey = opts.stateKey ?? "bridge-state.json";
    this.inboundPollMs = opts.inboundPollMs ?? 60_000;
    this.outboundPollMs = opts.outboundPollMs ?? 5_000;
    this.maxSendAttempts = opts.maxSendAttempts ?? 3;
    this.requestAttempts = Math.max(1, opts.requestAttempts ?? 3);
    this.requestRetryDelayMs = Math.max(0, opts.requestRetryDelayMs ?? 500);
    this.log = opts.log ?? (() => {});
    this.onEvent = opts.onEvent ?? (() => {});
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.myFp = fingerprint(opts.identity.publicKey);
  }

  async start(): Promise<void> {
    this.stopped = false;
    this.state = await BridgeState.load(this.opts.kv, this.stateKey);
    await this.opts.mail.ensureInbox(this.localAddress);
    await this.ensureContactFolders();
    this.scheduleInbound(jitter(this.inboundPollMs));
    this.outboundTimer = setTimeout(() => void this.outboundTick(), 200);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.inboundTimer) clearTimeout(this.inboundTimer);
    if (this.outboundTimer) clearTimeout(this.outboundTimer);
    this.inboundTimer = this.outboundTimer = null;
    this.state?.setUnloading();
    await this.state?.flush();
  }

  /** Create the drop-box inbox for each pinned contact so users can find it. */
  async ensureContactFolders(): Promise<void> {
    for (const contact of await this.opts.contacts.all()) {
      await this.opts.mail.ensureInbox(contact.alias);
      await this.opts.mail.upsertRegistry({
        address: contact.alias,
        name:
          contact.displayName ??
          contact.handle ??
          `${contact.fp.slice(0, 11)}… (remote)`,
        updated: new Date().toISOString(),
      });
    }
  }

  // ── first contact: request / accept / decline (docs/first-contact.md §4) ─

  /**
   * Send a sealed, self-signed introduction to a bare public key — the
   * REQUESTED state (§2). Needs no pinned contact and creates no alias
   * folder: pinning happens only when THEY reply and the reply passes the
   * ladder (the only auto-pin in the system). The post is retried a few
   * times inline (a briefly-down relay must not eat the knock); on total
   * failure it throws — there is no local bounce, because the request
   * exists nowhere but here.
   *
   * Returns the derived fingerprint (the key you'll wait for) and the intro
   * message id. The intro carries our own relay as the return address (§9).
   */
  async sendRequest(
    publicKey: Uint8Array,
    relay: string,
    note?: string
  ): Promise<{ fp: string; id: string }> {
    if (!this.state) throw new Error("bridge not started");
    const fp = fingerprint(publicKey);
    if (fp === this.myFp) throw new Error("cannot send a contact request to yourself");
    const wire: WireMessage = {
      id: newMessageId(),
      ts: new Date().toISOString(),
      replyTo: null,
      from: {
        fp: this.myFp,
        handle: this.opts.handle,
        pk: toB64u(this.opts.identity.publicKey),
        relay: this.opts.relayUrl,
      },
      to: fp,
      body: note ?? DEFAULT_REQUEST_NOTE,
      sig: "",
    };
    wire.sig = toB64(
      signDetached(
        this.opts.identity,
        canonicalMessage({
          id: wire.id,
          from2: wire.from.handle ?? wire.from.fp,
          to2: wire.to,
          ts: wire.ts,
          replyTo: wire.replyTo,
          body: wire.body,
        })
      )
    );
    const box = sealJson(publicKey, wire).box;
    let ok = false;
    let lastErr = "unknown error";
    for (let n = 1; n <= this.requestAttempts; n++) {
      try {
        if (await this.postOutbox(relay, fp, box)) {
          ok = true;
          break;
        }
        lastErr = `relay ${relay} rejected the contact request`;
      } catch (err) {
        lastErr = String(err instanceof Error ? err.message : err);
      }
      if (n < this.requestAttempts && this.requestRetryDelayMs > 0) {
        await new Promise((r) => setTimeout(r, this.requestRetryDelayMs));
      }
    }
    if (!ok) {
      throw new Error(`contact request failed after ${this.requestAttempts} attempts: ${lastErr}`);
    }
    this.state.markOutgoing(fp);
    this.log(`contact request sent to ${fp} via ${relay}`);
    return { fp, id: wire.id };
  }

  /**
   * Accept a quarantined request: pin the key that arrived verified inside
   * the sealed intro (OM-2 §4 "first successful exchange pins the key"),
   * drop the quarantine, and let the held relay entries flow — the hold rule
   * keys off quarantine membership, so the next inbound tick flushes them
   * through the normal deliver() path with no extra machinery.
   *
   * The requester is pinned with the return address their intro carried
   * (§9): a sealed box from a pinned sender is still opaque, so the relay
   * they posted through is the only hint where their inbox lives — but it is
   * the hint THEY chose, and only they could have sealed it in.
   */
  async accept(fp: string): Promise<void> {
    if (!this.state) throw new Error("bridge not started");
    const rec = this.state.quarantineGet(fp);
    if (!rec) throw new Error(`no pending contact request from ${fp}`);
    const contact = await this.opts.contacts.pin({
      publicKey: fromB64u(rec.publicKey),
      handle: rec.handle,
      relays: rec.relay ? [rec.relay] : [],
    });
    // Accepting them supersedes any request of ours in the other direction.
    this.state.clearOutgoing(fp);
    this.state.quarantineDelete(fp);
    await this.ensureContactFolders(); // the alias inbox must exist before held mail lands
    await this.sendAcceptReply(contact, rec);
  }

  /**
   * The accepter's half of the handshake (§2): one signed sealed system line
   * through the normal sendBlock path, so the requester's bridge sees a
   * verified reply against a pending `outgoing[fp]` and auto-pins.
   */
  private async sendAcceptReply(contact: Om2Contact, rec: QuarantineRecord): Promise<void> {
    const env: MailEnvelope = {
      id: newMessageId(),
      from: this.localAddress,
      to: contact.alias,
      ts: new Date().toISOString(),
      replyTo: rec.firstId,
      body: ACCEPT_REPLY_NOTE,
    };
    // Local record first (§3.3: the block in the alias folder IS the sent
    // record); sendBlock then marks it sent so the outbound scan won't
    // double-send the id.
    await this.opts.mail.appendMessage(contact.alias, env);
    await this.sendBlock(contact, env);
    this.log(`accepted contact request — auto-reply sent to ${contact.alias}`);
  }

  /**
   * Decline a quarantined request: DELETE every held relay entry for the fp
   * (heldIds is the only way to identify them — entries are opaque sealed
   * boxes), then block the fp so later boxes are ignored silently forever
   * (§3.3 behavior restored).
   */
  async decline(fp: string): Promise<void> {
    if (!this.state) throw new Error("bridge not started");
    const rec = this.state.quarantineGet(fp);
    if (!rec) throw new Error(`no pending contact request from ${fp}`);
    for (const id of rec.heldIds) {
      await this.deleteEntry(id).catch(() => {}); // already gone is fine
    }
    // Blocking them kills any pending request of ours in the other
    // direction — we will never auto-pin their reply.
    this.state.clearOutgoing(fp);
    this.state.quarantineDelete(fp);
    this.state.markBlocked(fp);
    this.log(`declined contact request from ${fp}`);
  }

  /** Quarantined requests, for the contact-requests UI and tests. */
  quarantineList(): Array<{ fp: string } & QuarantineRecord> {
    return (this.state?.quarantineAll() ?? []).map(([fp, rec]) => ({ fp, ...rec }));
  }

  /** Fps we've sent a request to and still await a reply from. */
  outgoingList(): string[] {
    return (this.state?.outgoingAll() ?? []).map(([fp]) => fp);
  }

  isBlocked(fp: string): boolean {
    return this.state?.isBlocked(fp) ?? false;
  }

  // ── outbound ────────────────────────────────────────────────────────────

  private async outboundTick(): Promise<void> {
    if (this.stopped) return;
    if (!this.inFlightOutbound) {
      this.inFlightOutbound = true;
      try {
        await this.scanOutbound();
      } catch (err) {
        this.log(`outbound scan error: ${String(err)}`);
      } finally {
        this.inFlightOutbound = false;
      }
    }
    this.outboundTimer = setTimeout(() => void this.outboundTick(), jitter(this.outboundPollMs));
  }

  private async scanOutbound(): Promise<void> {
    if (!this.state) return;
    for (const contact of await this.opts.contacts.all()) {
      const blocks = await this.opts.mail.readInbox(contact.alias);
      for (const block of blocks) {
        if (this.state.isSent(block.id)) continue;
        if (block.from === BOUNCE_FROM) continue; // never bounce our own bounces
        // A body still sealed at rest (locked vault) can't be signed — skip
        // it and let a later tick pick it up once the session unlocks.
        if (block.enc) continue;
        await this.sendBlock(contact, block);
      }
    }
  }

  private async sendBlock(contact: Om2Contact, block: MailEnvelope): Promise<void> {
    if (!this.state) return;
    const wire: WireMessage = {
      id: block.id,
      ts: block.ts,
      replyTo: block.replyTo,
      from: {
        fp: this.myFp,
        handle: this.opts.handle,
        // Always carried (docs/first-contact.md §3): lets an unpinned
        // recipient quarantine us as a request, and lets a recipient with a
        // pending outgoing request auto-pin us on this reply. Our relay rides
        // along (§9) so a first-contact reply knows where to come back to.
        pk: toB64u(this.opts.identity.publicKey),
        relay: this.opts.relayUrl,
      },
      to: contact.fp,
      body: block.body,
      sig: "",
    };
    wire.sig = toB64(
      signDetached(
        this.opts.identity,
        canonicalMessage({
          id: wire.id,
          from2: wire.from.handle ?? wire.from.fp,
          to2: wire.to,
          ts: wire.ts,
          replyTo: wire.replyTo,
          body: wire.body,
        })
      )
    );

    const payload = sealJson(fromB64u(contact.publicKey), wire);
    let lastErr = "unknown error";
    let delivered = false;
    // A contact with no relay on file (an older client, or an invite that
    // omitted it) falls back to OUR relay — which they never poll, so a
    // failure there deserves its own bounce text, not a mystery.
    const noRelayOnFile = contact.relays.length === 0;

    for (const relay of noRelayOnFile ? [this.opts.relayUrl] : contact.relays) {
      try {
        const ok = await this.postOutbox(relay, contact.fp, payload.box);
        if (ok) {
          delivered = true;
          break;
        }
        lastErr = "relay rejected the message";
      } catch (err) {
        lastErr = String(err instanceof Error ? err.message : err);
      }
    }

    if (delivered) {
      this.state.markSent(block.id);
      this.state.clearAttempt(block.id);
      this.log(`sent ${block.id} → ${contact.alias}`);
      return;
    }

    const attempts = this.state.attemptFailed(block.id, lastErr);
    this.log(`send failed for ${block.id} (attempt ${attempts}): ${lastErr}`);
    if (attempts >= this.maxSendAttempts) {
      const reason = noRelayOnFile
        ? "no relay on file for this contact (an older client may have omitted it) — your own relay was tried as a fallback, but they never poll it. Ask them to re-share their invite code."
        : lastErr;
      await this.bounce(block, contact, reason);
      this.state.markSent(block.id); // stop retrying; the bounce is the record
      this.state.clearAttempt(block.id);
      this.onEvent({ type: "bounce", id: block.id, alias: contact.alias, reason });
    }
  }

  private async postOutbox(relayUrl: string, toFp: string, box: string): Promise<boolean> {
    const url = `${relayUrl.replace(/\/$/, "")}/outbox`;
    const auth = buildAuthHeader(this.opts.identity, "POST", "outbox");
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-om2-auth": auth },
      body: JSON.stringify({ to: toFp, box }),
    });
    return res.status === 201;
  }

  private async bounce(block: MailEnvelope, contact: Om2Contact, reason: string): Promise<void> {
    await this.opts.mail.appendMessage(block.from, {
      id: newMessageId(),
      from: BOUNCE_FROM,
      to: block.from,
      ts: new Date().toISOString(),
      replyTo: block.id,
      body:
        `Delivery failed: your message \`${block.id}\` to \`${contact.alias}\` ` +
        `could not be delivered after ${this.maxSendAttempts} attempts.\n\n` +
        `Reason: ${reason}\n\nThe message block is still in \`${contact.alias}/inbox.md\`.`,
    });
  }

  // ── inbound ─────────────────────────────────────────────────────────────

  private scheduleInbound(delay: number): void {
    if (this.stopped) return;
    this.inboundTimer = setTimeout(() => {
      void this.inboundTick().finally(() => this.scheduleInbound(jitter(this.inboundPollMs)));
    }, delay);
  }

  private async inboundTick(): Promise<void> {
    if (this.stopped || !this.state || this.inFlightInbound) return;
    this.inFlightInbound = true;
    try {
      const list = await this.relayList();
      for (const entry of list) {
        await this.processEntry(entry.id);
      }
    } catch (err) {
      this.log(`inbound poll error: ${String(err)}`);
    } finally {
      this.inFlightInbound = false;
    }
  }

  private async relayList(): Promise<Array<{ id: string; ts: number }>> {
    const url = `${this.opts.relayUrl.replace(/\/$/, "")}/inbox/${this.myFp}`;
    const auth = buildAuthHeader(this.opts.identity, "GET", `inbox/${this.myFp}`);
    const res = await this.fetchImpl(url, { headers: { "x-om2-auth": auth } });
    if (res.status !== 200) throw new Error(`relay list failed: ${res.status}`);
    const body = (await res.json()) as { entries?: Array<{ id: string; ts: number }> };
    return body.entries ?? [];
  }

  private async processEntry(entryId: string): Promise<void> {
    if (!this.state) return;
    const resource = `inbox/${this.myFp}/${entryId}`;
    const base = `${this.opts.relayUrl.replace(/\/$/, "")}/inbox/${this.myFp}/${entryId}`;

    const getAuth = buildAuthHeader(this.opts.identity, "GET", resource);
    const getRes = await this.fetchImpl(base, { headers: { "x-om2-auth": getAuth } });
    if (getRes.status === 404) {
      return; // already gone
    }
    if (getRes.status !== 200) throw new Error(`relay fetch failed: ${getRes.status}`);
    const sealed = (await getRes.json()) as { id: string; ts: number; box: string };

    const outcome = await this.deliver(sealed.box, entryId);
    // Only DELIVERED mail occupies the seen-dedupe: held boxes must still
    // flow after a later accept, so they must not be remembered as seen.
    if (outcome.status === "appended" && outcome.innerId) this.state.markSeen(outcome.innerId);

    switch (outcome.status) {
      case "appended":
        await this.deleteEntry(entryId);
        this.log(`received ${outcome.innerId} from ${outcome.alias}`);
        break;
      case "duplicate":
        await this.deleteEntry(entryId);
        this.log(`duplicate inbound ${outcome.innerId} — skipped`);
        break;
      case "rejected":
        await this.deleteEntry(entryId);
        this.log(`rejected inbound ${entryId}: ${outcome.reason}`);
        break;
      case "poison":
        // Unopenable garbage — deleted, nothing else to do.
        await this.deleteEntry(entryId);
        break;
      case "keychange":
        // §5.3 loud: the announcement is consumed into quarantine state (the
        // user decides there); the entry itself can never re-verify under the
        // new key, so it is deleted rather than held.
        await this.deleteEntry(entryId);
        this.log(
          `KEY CHANGE: pinned contact ${outcome.fp} announced a new key — ` +
            `quarantined for review, nothing re-pinned silently`
        );
        this.onEvent({ type: "keychange", fp: outcome.fp ?? "", publicKey: outcome.pk ?? "" });
        break;
      case "quarantined":
        // First verified knock: the intro itself stays on the relay so the
        // user still gets it if they accept. One event at the transition only.
        this.log(`contact request from ${outcome.fp} quarantined — awaiting your decision`);
        this.onEvent({
          type: "quarantined",
          fp: outcome.fp ?? "",
          publicKey: outcome.pk ?? "",
          innerId: outcome.innerId,
        });
        break;
      case "held":
      case "blocked":
        // §4 hold rule / §3.3 silent-forever: leave the entry on the relay
        // (7-day retention is the outer bound). No events — these re-polled
        // entries would otherwise generate noise every tick.
        break;
    }
  }

  private async deleteEntry(entryId: string): Promise<void> {
    const resource = `inbox/${this.myFp}/${entryId}`;
    await this.fetchImpl(`${this.opts.relayUrl.replace(/\/$/, "")}/inbox/${this.myFp}/${entryId}`, {
      method: "DELETE",
      headers: { "x-om2-auth": buildAuthHeader(this.opts.identity, "DELETE", resource) },
    });
  }

  private async deliver(box: string, entryId: string): Promise<DeliverOutcome> {
    if (!this.state) return { status: "poison", innerId: "" };
    const wire = openJson<WireMessage>(this.opts.identity.secretKey, { box });
    if (!wire || !this.wireWellFormed(wire)) {
      return { status: "poison", innerId: "" };
    }

    // The canonical string the sender signed — identical template on both
    // sides, from2 = handle ?? fp (OM-2 §2.4, frozen). `from.relay` is
    // deliberately NOT in the canonical: it rides inside the sealed box, and
    // the seal is its integrity (see WireMessage.relay).
    const canonical = canonicalMessage({
      id: wire.id,
      from2: wire.from.handle ?? wire.from.fp,
      to2: wire.to,
      ts: wire.ts,
      replyTo: wire.replyTo,
      body: wire.body,
    });
    const sig = safeSigBytes(wire.sig);

    // Ladder step 2 (docs/first-contact.md §3): PINNED sender — verify
    // against the pinned key, never against a carried key.
    const contact = await this.opts.contacts.byFpGet(wire.from.fp);
    if (contact) {
      if (!sig || !verifyDetached(fromB64u(contact.publicKey), sig, canonical)) {
        // An impostor claiming someone else's fp cannot produce this.
        return {
          status: "rejected",
          innerId: wire.id,
          reason: "signature verification failed",
        };
      }
      if (wire.from.pk && wire.from.pk !== contact.publicKey) {
        // The pinned key itself signed an announcement of a different key —
        // §5.3 key change. Quarantine the claim: never deliver under it,
        // never silently re-pin. (The user accepts or dismisses; accepting
        // pins the new fp as its own contact.)
        this.state.quarantinePut(wire.from.fp, {
          publicKey: wire.from.pk,
          handle: wire.from.handle,
          firstId: wire.id,
          ts: Date.now(),
          heldIds: [],
          relay: wire.from.relay,
        });
        return { status: "keychange", innerId: wire.id, fp: wire.from.fp, pk: wire.from.pk };
      }
      if (this.state.isSeen(wire.id)) return { status: "duplicate", innerId: wire.id };
      await this.appendInbound(contact, wire);
      return { status: "appended", innerId: wire.id, alias: contact.alias };
    }

    // Unpinned sender. Blocked first: silent forever means not even a
    // quarantine revival (§3.3).
    if (this.state.isBlocked(wire.from.fp)) {
      return { status: "blocked", innerId: wire.id, fp: wire.from.fp };
    }

    // Hold rule (§4): boxes from a pending quarantine stay on the relay so
    // the conversation is complete when the user decides. Idempotent — the
    // held box is re-polled every tick until accept/decline consumes it.
    if (this.state.quarantineGet(wire.from.fp)) {
      this.state.quarantineAddHeld(wire.from.fp, entryId);
      return { status: "held", innerId: wire.id };
    }

    // Ladder step 3: a self-consistent stranger — the carried key hashes to
    // the claimed fp AND the message verifies under that key. This proves
    // key possession, never personhood (§6) — so it QUARANTINES as a
    // request, unless it is the reply our pending outgoing request waits
    // for: then auto-pin (the only auto-pin in the system).
    const pkStr = typeof wire.from.pk === "string" ? wire.from.pk : null;
    const pkBytes = pkStr ? safePkBytes(pkStr) : null;
    const verified =
      pkStr !== null &&
      pkBytes !== null &&
      fingerprint(pkBytes) === wire.from.fp &&
      sig !== null &&
      verifyDetached(pkBytes, sig, canonical);

    if (pkStr && pkBytes && verified) {
      const pending = this.state.outgoingOf(wire.from.fp);
      if (pending && Date.now() - pending.ts > OUTGOING_TTL_MS) {
        this.state.clearOutgoing(wire.from.fp); // expired: they knock like anyone else
      }
      if (this.state.outgoingHas(wire.from.fp)) {
        // The reply is sealed to us and self-signed — only the holder of the
        // key we requested could have produced it (§2 REQUESTED → PINNED).
        // Pin with the return address the reply carried (§9).
        const pinned = await this.opts.contacts.pin({
          publicKey: pkBytes,
          handle: wire.from.handle,
          relays: wire.from.relay ? [wire.from.relay] : [],
        });
        this.state.clearOutgoing(wire.from.fp);
        await this.ensureContactFolders();
        this.log(`auto-pinned ${wire.from.fp} — first valid reply to our request`);
        this.onEvent({ type: "autopinned", fp: wire.from.fp, alias: pinned.alias });
        if (this.state.isSeen(wire.id)) return { status: "duplicate", innerId: wire.id };
        await this.appendInbound(pinned, wire);
        return { status: "appended", innerId: wire.id, alias: pinned.alias };
      }
      // Verified knock → Contact requests. Never auto-delivered (§3.3: an
      // impostor must not be able to deliver, only to knock).
      this.state.quarantinePut(wire.from.fp, {
        publicKey: pkStr,
        handle: wire.from.handle,
        firstId: wire.id,
        ts: Date.now(),
        heldIds: [entryId],
        relay: wire.from.relay,
      });
      return { status: "quarantined", innerId: wire.id, fp: wire.from.fp, pk: pkStr };
    }

    // Ladder step 4: impostor, unsigned, or fp(pk) mismatch — reject + delete.
    const reason = !wire.from.pk
      ? "unsigned (no from.pk carried)"
      : !pkBytes
        ? "carried from.pk is not a valid Ed25519 key"
        : "fingerprint does not match the carried key, or signature verification failed";
    return { status: "rejected", innerId: wire.id, reason };
  }

  /** Append a verified wire as an ordinary OM-1 block for the local owner (§3.3 inbound). */
  private async appendInbound(contact: Om2Contact, wire: WireMessage): Promise<void> {
    const env: MailEnvelope = {
      id: wire.id,
      from: contact.alias,
      to: this.localAddress,
      ts: wire.ts,
      replyTo: wire.replyTo,
      body: wire.body,
      om2: {
        v: 2,
        from2: wire.from.handle ?? wire.from.fp,
        to2: wire.to,
        sender: contact.publicKey,
        sig: wire.sig,
      },
    };
    await this.opts.mail.appendMessage(this.localAddress, env);
  }

  private wireWellFormed(wire: WireMessage): boolean {
    return (
      typeof wire.id === "string" &&
      wire.id.length > 0 &&
      typeof wire.ts === "string" &&
      !Number.isNaN(Date.parse(wire.ts)) &&
      typeof wire.to === "string" &&
      wire.to === this.myFp &&
      typeof wire.from?.fp === "string" &&
      (wire.from.handle === undefined || typeof wire.from.handle === "string") &&
      (wire.from.pk === undefined || typeof wire.from.pk === "string") &&
      (wire.from.relay === undefined || typeof wire.from.relay === "string") &&
      typeof wire.body === "string" &&
      typeof wire.sig === "string" &&
      !`${wire.id}${wire.from.fp}${wire.to}${wire.ts}`.includes("|") &&
      !(wire.body.includes("<!-- /messenger -->"))
    );
  }
}

/** base64url → 32-byte key, or null for malformed input (hostile wires must not throw). */
function safePkBytes(pk: string): Uint8Array | null {
  try {
    const bytes = fromB64u(pk);
    return bytes.length === 32 ? bytes : null;
  } catch {
    return null;
  }
}

/** base64 signature bytes, or null for malformed input. */
function safeSigBytes(sig: string): Uint8Array | null {
  try {
    return fromB64(sig);
  } catch {
    return null;
  }
}

function jitter(ms: number): number {
  return Math.max(50, Math.round(ms * (0.9 + Math.random() * 0.2)));
}
