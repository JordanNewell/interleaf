import type { Om2KeyValueStore } from "./types";

/**
 * Bridge-local delivery state: outbound message ids already sent, inbound
 * inner ids already appended (dedupe against relay redelivery), and send
 * attempts for bounce logic. At-least-once everywhere (OM-1 §4); this state
 * exists to avoid REDUNDANT work, not to provide exactly-once.
 *
 * First-contact state (docs/first-contact.md §2, §4 — the §2 state machine):
 * - `outgoing[fp]` — REQUESTED: we sent them a sealed intro and pin only on
 *   their first valid reply. The only auto-pin in the system keys off this.
 * - `quarantine[fp]` — QUARANTINE: a verified self-signed stranger knocked.
 *   Never auto-delivered; later boxes from the fp are HELD on the relay
 *   (recorded in `heldIds`) until the user accepts or declines.
 * - `blocked[fp]` — declined forever: silent, §3.3 behavior restored.
 */

const MAX_IDS = 4000;

/** Quarantine slots (docs/first-contact.md §4: capped, oldest swept; the relay's 7-day retention is the outer bound). */
export const QUARANTINE_CAP = 20;

/**
 * Upper bound on remembered relay entry ids per quarantined fp. Relay POST
 * rate limits (30/10min) make this unreachable in practice; the cap just
 * keeps a hostile flood from growing our state file.
 */
const MAX_HELD_IDS = 200;

export interface QuarantineRecord {
  /** base64url Ed25519 public key carried in the verified request — the key acceptance would pin */
  publicKey: string;
  handle?: string;
  /** inner message id of the first verified message from this fp (UI reference) */
  firstId: string;
  /** first-contact epoch ms — the sweep key for the cap */
  ts: number;
  /** relay entry ids held on the relay while quarantine is pending; decline() DELETEs them (§4) */
  heldIds: string[];
  /**
   * The sender's return address (first-contact.md §9, v1.1): the relay the
   * intro asked us to reply to. Carried inside the sealed box, so only the
   * sender or recipient could have set it. Accept pins with it so cross-relay
   * first contact doesn't strand the auto-reply.
   */
  relay?: string;
}

export interface OutgoingRecord {
  ts: number;
}

interface AttemptRecord {
  n: number;
  lastErr: string;
  ts: number;
}

/**
 * version 2 adds outgoing/quarantine/blocked. Loading is tolerant: any older
 * file parses, missing fields come up empty, so a pre-first-contact state
 * file keeps working untouched.
 */
const STATE_VERSION = 2;

interface StateFile {
  version: number;
  sent: Record<string, number>; // outbound inner id → sent epoch ms
  seen: Record<string, number>; // inbound inner id → first-seen epoch ms
  attempts: Record<string, AttemptRecord>;
  outgoing?: Record<string, OutgoingRecord>; // fp → pending request
  quarantine?: Record<string, QuarantineRecord>; // fp → pending request from them
  blocked?: Record<string, number>; // fp → blocked epoch ms
}

export class BridgeState {
  private sent = new Map<string, number>();
  private seen = new Map<string, number>();
  private attempts = new Map<string, AttemptRecord>();
  private outgoing = new Map<string, OutgoingRecord>();
  private quarantine = new Map<string, QuarantineRecord>();
  private blocked = new Map<string, number>();
  private dirty = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private unloading = false;

  constructor(
    private kv: Om2KeyValueStore | null,
    private key: string,
    private debounceMs = 500
  ) {}

  static async load(kv: Om2KeyValueStore | null, key: string): Promise<BridgeState> {
    const state = new BridgeState(kv, key);
    if (!kv) return state;
    try {
      const raw = await kv.read(key);
      const parsed = raw ? (JSON.parse(raw) as StateFile) : null;
      if (parsed) {
        // Version tolerance: v1 files (pre-first-contact) simply lack the new
        // records; `?? {}` brings them up as empty. Never reject an old file.
        for (const [k, v] of Object.entries(parsed.sent ?? {})) state.sent.set(k, v);
        for (const [k, v] of Object.entries(parsed.seen ?? {})) state.seen.set(k, v);
        for (const [k, v] of Object.entries(parsed.attempts ?? {})) state.attempts.set(k, v);
        for (const [k, v] of Object.entries(parsed.outgoing ?? {})) state.outgoing.set(k, v);
        for (const [k, v] of Object.entries(parsed.quarantine ?? {})) state.quarantine.set(k, v);
        for (const [k, v] of Object.entries(parsed.blocked ?? {})) state.blocked.set(k, v);
      }
    } catch {
      // fresh start
    }
    return state;
  }

  /** Stop the debounced writer (plugin unload); a final flush may still be forced. */
  setUnloading(): void {
    this.unloading = true;
  }

  isSent(id: string): boolean {
    return this.sent.has(id);
  }

  markSent(id: string): void {
    this.trim(this.sent, id, Date.now());
  }

  isSeen(id: string): boolean {
    return this.seen.has(id);
  }

  markSeen(id: string): void {
    this.trim(this.seen, id, Date.now());
  }

  attemptFailed(id: string, err: string): number {
    const prev = this.attempts.get(id);
    const n = (prev?.n ?? 0) + 1;
    this.attempts.set(id, { n, lastErr: err.slice(0, 300), ts: Date.now() });
    this.scheduleSave();
    return n;
  }

  attemptsOf(id: string): number {
    return this.attempts.get(id)?.n ?? 0;
  }

  clearAttempt(id: string): void {
    this.attempts.delete(id);
  }

  // ── first contact (docs/first-contact.md §2, §4) ────────────────────────

  outgoingHas(fp: string): boolean {
    return this.outgoing.has(fp);
  }

  outgoingOf(fp: string): OutgoingRecord | undefined {
    return this.outgoing.get(fp);
  }

  markOutgoing(fp: string): void {
    if (!this.outgoing.has(fp)) this.outgoing.set(fp, { ts: Date.now() });
    this.scheduleSave();
  }

  clearOutgoing(fp: string): void {
    if (this.outgoing.delete(fp)) this.scheduleSave();
  }

  outgoingAll(): Array<[string, OutgoingRecord]> {
    return [...this.outgoing.entries()];
  }

  quarantineGet(fp: string): QuarantineRecord | undefined {
    return this.quarantine.get(fp);
  }

  quarantineAll(): Array<[string, QuarantineRecord]> {
    return [...this.quarantine.entries()];
  }

  /**
   * Record a verified knock. Over the cap the OLDEST-ts record is swept —
   * the sender whose request waited longest loses their slot (the relay's
   * 7-day retention is the outer bound; they can knock again).
   */
  quarantinePut(fp: string, rec: QuarantineRecord): void {
    if (!this.quarantine.has(fp) && this.quarantine.size >= QUARANTINE_CAP) {
      const oldest = [...this.quarantine.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
      if (oldest) this.quarantine.delete(oldest[0]);
    }
    this.quarantine.set(fp, rec);
    this.scheduleSave();
  }

  quarantineDelete(fp: string): void {
    if (this.quarantine.delete(fp)) this.scheduleSave();
  }

  /**
   * Remember another relay entry to keep alive for this fp (the §4 hold
   * rule). Idempotent per entry — held boxes are re-polled every tick — and
   * bounded so a flood cannot grow the state file without limit.
   */
  quarantineAddHeld(fp: string, entryId: string): boolean {
    const rec = this.quarantine.get(fp);
    if (!rec || rec.heldIds.includes(entryId)) return false;
    rec.heldIds.push(entryId);
    if (rec.heldIds.length > MAX_HELD_IDS) rec.heldIds.splice(0, rec.heldIds.length - MAX_HELD_IDS);
    this.scheduleSave();
    return true;
  }

  isBlocked(fp: string): boolean {
    return this.blocked.has(fp);
  }

  markBlocked(fp: string): void {
    this.trim(this.blocked, fp, Date.now());
  }

  private trim(map: Map<string, number>, key: string, value: number): void {
    if (map.size >= MAX_IDS) {
      const oldest = [...map.entries()].sort((a, b) => a[1] - b[1]).slice(0, MAX_IDS / 4);
      for (const [k] of oldest) map.delete(k);
    }
    map.set(key, value);
    this.scheduleSave();
  }

  private scheduleSave(): void {
    this.dirty = true;
    if (this.timer || this.unloading) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.debounceMs);
  }

  async flush(): Promise<void> {
    if (!this.kv || !this.dirty) return;
    this.dirty = false;
    const file: StateFile = {
      version: STATE_VERSION,
      sent: Object.fromEntries(this.sent),
      seen: Object.fromEntries(this.seen),
      attempts: Object.fromEntries(this.attempts),
      outgoing: Object.fromEntries(this.outgoing),
      quarantine: Object.fromEntries(this.quarantine),
      blocked: Object.fromEntries(this.blocked),
    };
    await this.kv.write(this.key, JSON.stringify(file));
  }
}
