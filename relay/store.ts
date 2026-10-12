import { promises as fs } from "node:fs";

/**
 * The relay's only state: per-fingerprint mailboxes of sealed boxes. It cannot
 * read any of it. At-least-once in the OM-1 spirit: entries live until fetched
 * + deleted or until retention expires, whichever first.
 */

export interface RelayEntry {
  id: string; // relay-generated opaque entry id
  ts: number; // arrival epoch ms
  box: string; // base64 sealed box (nonce ‖ ephPub ‖ ciphertext)
}

interface DbFile {
  version: number;
  entries: Record<string, RelayEntry[]>; // fp → entries, oldest first
}

export function newEntryId(): string {
  return `ent_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export class RelayStore {
  private entries = new Map<string, RelayEntry[]>();
  private dirty = false;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(
    private dbPath: string | null,
    private maxEntryBytes = 96 * 1024,
    private saveDebounceMs = 1000
  ) {}

  async load(): Promise<void> {
    if (!this.dbPath) return;
    try {
      const raw = JSON.parse(await fs.readFile(this.dbPath, "utf8")) as DbFile;
      for (const [fp, list] of Object.entries(raw.entries ?? {})) {
        this.entries.set(fp, list);
      }
    } catch {
      // fresh start
    }
  }

  size(fp: string): number {
    return (this.entries.get(fp) ?? []).length;
  }

  add(fp: string, box: string): RelayEntry | null {
    if (Buffer.byteLength(box, "utf8") > this.maxEntryBytes) return null;
    const entry: RelayEntry = { id: newEntryId(), ts: Date.now(), box };
    const list = this.entries.get(fp) ?? [];
    list.push(entry);
    this.entries.set(fp, list);
    this.scheduleSave();
    return entry;
  }

  list(fp: string): Array<{ id: string; ts: number; bytes: number }> {
    return (this.entries.get(fp) ?? []).map((e) => ({
      id: e.id,
      ts: e.ts,
      bytes: Buffer.byteLength(e.box, "utf8"),
    }));
  }

  get(fp: string, id: string): RelayEntry | null {
    return (this.entries.get(fp) ?? []).find((e) => e.id === id) ?? null;
  }

  del(fp: string, id: string): boolean {
    const list = this.entries.get(fp);
    if (!list) return false;
    const next = list.filter((e) => e.id !== id);
    if (next.length === list.length) return false;
    if (next.length === 0) this.entries.delete(fp);
    else this.entries.set(fp, next);
    this.scheduleSave();
    return true;
  }

  /** Drop entries older than retentionMs. Returns count dropped. */
  sweep(retentionMs: number): number {
    const cutoff = Date.now() - retentionMs;
    let dropped = 0;
    for (const [fp, list] of this.entries) {
      const kept = list.filter((e) => e.ts > cutoff);
      dropped += list.length - kept.length;
      if (kept.length === 0) this.entries.delete(fp);
      else if (kept.length !== list.length) this.entries.set(fp, kept);
    }
    if (dropped > 0) this.scheduleSave();
    return dropped;
  }

  private scheduleSave(): void {
    this.dirty = true;
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flush();
    }, this.saveDebounceMs);
  }

  async flush(): Promise<void> {
    if (!this.dbPath || !this.dirty) return;
    this.dirty = false;
    const file: DbFile = { version: 1, entries: Object.fromEntries(this.entries) };
    const tmp = `${this.dbPath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(file), "utf8");
    await fs.rename(tmp, this.dbPath);
  }
}
