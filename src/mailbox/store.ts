import { DataAdapter, normalizePath } from "obsidian";
import {
  ADDRESS_RE,
  MailEnvelope,
  encodeMessage,
  isExpired,
  parseInbox,
} from "./envelope";
import type { EncSeal } from "./envelope";
import type { VaultCipher } from "../crypto";
import { pruneReceiptLines, receiptsHeader } from "./receipts";

/** What a sealed append actually wrote: the header seal + the body ciphertext. */
export interface SealedBody {
  iv: string;
  ct: string;
}

export interface RegistryEntry {
  address: string;
  name: string;
  updated: string;
}

const inboxHeader = (address: string): string =>
  `# Inbox — ${address}\n\nAppend-only, oldest at top. Do not reorder or edit delivered blocks. See SPEC.md.\n\n`;

const outboxHeader = (address: string): string =>
  `# Outbox — ${address}\n\nCopies of mail this address sent (settings: keep a copy of sent mail). See SPEC.md §13.\n\n`;

/**
 * Siblings of inbox.md that folder-sync conflict machinery leaves behind —
 * "inbox (conflicted copy …).md" (Dropbox), "inbox.sync-conflict-…md"
 * (Syncthing), "inbox 2.md" / "inbox(1).md" (iCloud, Drive). The strict
 * shape (a space, dot, or open-paren right after "inbox") leaves real notes
 * like "inbox-notes.md" alone; the canonical inbox.md never matches.
 */
const CONFLICT_SIBLING = /^inbox[ .(].*\.md$/i;

/**
 * Storage goes through the raw file adapter, not the Vault index: the default
 * root is a dot-folder inside .obsidian, which Obsidian deliberately keeps out
 * of the vault (explorer, search, quick switcher, graph). Same markdown files,
 * same protocol — just invisible unless you go looking.
 */
export class MailboxStore {
  /** Parsed files keyed by path, revalidated against stat on every read. */
  private inboxCache = new Map<string, { mtimeMs: number; size: number; messages: MailEnvelope[] }>();
  private rawCache = new Map<string, { mtimeMs: number; size: number; content: string }>();
  /**
   * Stat fingerprints from the last GC parse, keyed by file: an unchanged
   * file whose oldest kept message hasn't aged past the cutoff skips the
   * read+parse entirely (messages can't newly expire while bytes stand still).
   */
  private gcStats = new Map<string, { mtimeMs: number; size: number; minTs: number }>();
  /** Same idea for the burn sweep — a file with no burn fields never burns. */
  private sweepStats = new Map<string, { mtimeMs: number; size: number; hasBurnFields: boolean }>();
  /**
   * Parsed registry, revalidated against stat: every chat refresh reads it
   * (list names, thread metas), but it only changes through this class or a
   * hand edit (which bumps mtime).
   */
  private registryCache: { mtimeMs: number; size: number; entries: RegistryEntry[] } | null = null;
  /**
   * The vault key, while a session has it (SPEC §15). Sealed bodies are
   * opened on read and sealed on fresh append; with no key, sealed blocks
   * pass through reads and rewrites untouched — ciphertext is never lost.
   */
  private cipher: VaultCipher | null = null;

  constructor(private adapter: DataAdapter, private root: string) {}

  setRoot(root: string): void {
    this.root = root;
    this.inboxCache.clear();
    this.rawCache.clear();
    this.gcStats.clear();
    this.registryCache = null;
  }

  /** Install or drop the vault key; cached reads depend on it. */
  setCipher(cipher: VaultCipher | null): void {
    this.cipher = cipher;
    this.inboxCache.clear();
  }

  hasCipher(): boolean {
    return this.cipher !== null;
  }

  /**
   * Encode one message for disk: pre-sealed bodies pass through as-is (the
   * body already is ciphertext that matches the iv), fresh plaintext gets a
   * new seal when a key is in session, otherwise it stays plaintext.
   * Returns the block and the sealed body actually written, if any.
   */
  private async encodeBlock(
    message: MailEnvelope
  ): Promise<{ block: string; sealed: SealedBody | null }> {
    if (message.enc) {
      return {
        block: encodeMessage(message),
        sealed: { iv: message.enc.iv, ct: message.body },
      };
    }
    if (this.cipher) {
      const { iv, ct } = await this.cipher.seal(message.body);
      const seal: EncSeal = { v: 1, iv };
      return { block: encodeMessage({ ...message, body: ct, enc: seal }), sealed: { iv, ct } };
    }
    return { block: encodeMessage(message), sealed: null };
  }

  /**
   * Open sealed bodies (clearing their markers), drop burn-expired mail, and
   * leave undecryptable bodies locked-and-preserved for the caller to flag.
   */
  private async resolveBodies(messages: MailEnvelope[]): Promise<MailEnvelope[]> {
    const live = messages.filter((m) => !isExpired(m));
    const cipher = this.cipher;
    if (!cipher || !live.some((m) => m.enc)) return live;
    return Promise.all(
      live.map(async (m) => {
        if (!m.enc) return m;
        try {
          const body = await cipher.open(m.enc.iv, m.body);
          const opened: MailEnvelope = { ...m, body };
          delete opened.enc;
          delete opened.encLocked;
          return opened;
        } catch {
          return m; // wrong/corrupt key material — keep ciphertext, stay locked
        }
      })
    );
  }

  get rootPath(): string {
    return normalizePath(this.root);
  }

  /** Dot-prefixed roots live outside Obsidian's vault index. */
  get hidden(): boolean {
    return this.rootPath.startsWith(".");
  }

  get registryPath(): string {
    return normalizePath(`${this.root}/registry.md`);
  }

  inboxPath(address: string): string {
    return normalizePath(`${this.root}/${address}/inbox.md`);
  }

  receiptsPath(address: string): string {
    return normalizePath(`${this.root}/${address}/receipts.md`);
  }

  outboxPath(address: string): string {
    return normalizePath(`${this.root}/${address}/outbox.md`);
  }

  /** Folder holding everything this participant owns (inbox, receipts, outbox). */
  addressPath(address: string): string {
    return normalizePath(`${this.root}/${address}`);
  }

  async ensureRoot(): Promise<void> {
    await ensureFolder(this.adapter, this.root);
  }

  async ensureAddress(address: string): Promise<void> {
    if (!ADDRESS_RE.test(address)) {
      throw new Error(`Invalid messenger address: ${address}`);
    }
    await ensureFolder(this.adapter, `${this.root}/${address}`);
  }

  /** All address folders under the root, sorted. */
  async listAddresses(): Promise<string[]> {
    let folders: string[];
    try {
      folders = (await this.adapter.list(this.rootPath)).folders;
    } catch {
      return []; // root not created yet
    }
    return folders
      .map((folder) => folder.split("/").pop() ?? "")
      .filter(Boolean)
      .sort();
  }

  /**
   * Append one message to an address's inbox, sealing the body when a key is
   * in session. Returns the sealed body written (or null for plaintext) so
   * callers can keep ciphertext-only copies (retransmission memory, SPEC §14).
   */
  async append(address: string, message: MailEnvelope): Promise<SealedBody | null> {
    await ensureFolder(this.adapter, `${this.root}/${address}`);
    const path = this.inboxPath(address);
    const { block, sealed } = await this.encodeBlock(message);
    // Pure appends never rewrite the file, so concurrent writers can't clobber
    // each other (SPEC §9); a create race at worst duplicates the header,
    // which parsers ignore.
    if (await this.adapter.exists(path)) {
      await this.adapter.append(path, block);
    } else {
      await this.adapter.append(path, inboxHeader(address) + block);
    }
    return sealed;
  }

  private statOf(path: string): Promise<FileStat | null> {
    return statFile(this.adapter, path);
  }

  private async removeQuietly(path: string): Promise<void> {
    try {
      await this.adapter.remove(path);
    } catch {
      // raced with another writer — leave it for the next pass
    }
  }

  /** Trash a merged conflict sibling; plain removal where trash is unsupported. */
  private async trashQuietly(path: string): Promise<void> {
    try {
      await this.adapter.trashLocal(path);
      return;
    } catch {
      // fall through to the destructive-but-honest remove
    }
    await this.removeQuietly(path);
  }

  async readInbox(address: string): Promise<MailEnvelope[]> {
    const path = this.inboxPath(address);
    const st = await this.statOf(path);
    if (!st) {
      this.inboxCache.delete(path);
      return [];
    }
    const hit = this.inboxCache.get(path);
    if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) {
      return hit.messages;
    }
    const messages = await this.resolveBodies(parseInbox(await this.adapter.read(path)));
    this.inboxCache.set(path, { mtimeMs: st.mtimeMs, size: st.size, messages });
    return messages;
  }

  /**
   * Sender-side copy of outgoing mail (optional, settings.keepOutbox). Same
   * block format as an inbox; the chat view merges it with the recipient's
   * copy, deduped by id, so enabling it mid-history is safe.
   */
  async appendOutbox(address: string, message: MailEnvelope): Promise<SealedBody | null> {
    await ensureFolder(this.adapter, `${this.root}/${address}`);
    const path = this.outboxPath(address);
    const { block, sealed } = await this.encodeBlock(message);
    this.inboxCache.delete(path);
    if (await this.adapter.exists(path)) {
      await this.adapter.append(path, block);
    } else {
      await this.adapter.append(path, outboxHeader(address) + block);
    }
    return sealed;
  }

  async readOutbox(address: string): Promise<MailEnvelope[]> {
    const path = this.outboxPath(address);
    const st = await this.statOf(path);
    if (!st) {
      this.inboxCache.delete(path);
      return [];
    }
    const hit = this.inboxCache.get(path);
    if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) {
      return hit.messages;
    }
    const messages = await this.resolveBodies(parseInbox(await this.adapter.read(path)));
    this.inboxCache.set(path, { mtimeMs: st.mtimeMs, size: st.size, messages });
    return messages;
  }

  /**
   * Drop outbox blocks older than maxAgeMs — and beyond maxMessages when
   * set — keeping the newest. Returns count dropped.
   */
  async gcOutbox(address: string, maxAgeMs: number, maxMessages = 0): Promise<number> {
    if (maxAgeMs <= 0 && maxMessages <= 0) return 0;
    const path = this.outboxPath(address);
    if (!(await this.adapter.exists(path))) return 0;
    const cutoff = maxAgeMs > 0 ? Date.now() - maxAgeMs : Number.NEGATIVE_INFINITY;
    const st = await this.statOf(path);
    const fingerprint = st ? this.gcStats.get(path) : undefined;
    if (
      st &&
      fingerprint &&
      fingerprint.mtimeMs === st.mtimeMs &&
      fingerprint.size === st.size &&
      fingerprint.minTs > cutoff
    ) {
      return 0; // nothing changed and nothing aged out — skip the read
    }
    const content = await this.adapter.read(path);
    const all = parseInbox(content);
    const kept = all.filter((m) => Date.parse(m.ts) > cutoff && !isExpired(m));
    let dropped = all.length - kept.length;
    if (maxMessages > 0 && kept.length > maxMessages) {
      dropped += kept.length - maxMessages;
      kept.splice(0, kept.length - maxMessages);
    }
    if (dropped === 0) {
      if (st) {
        this.gcStats.set(path, {
          mtimeMs: st.mtimeMs,
          size: st.size,
          minTs: kept.reduce((min, m) => Math.min(min, Date.parse(m.ts)), Infinity),
        });
      }
      return 0;
    }
    this.inboxCache.delete(path);
    this.gcStats.delete(path); // reparse on the next pass after a rewrite
    if (kept.length === 0) {
      await this.removeQuietly(path);
      return dropped;
    }
    await this.adapter.write(
      path,
      outboxHeader(address) + kept.map(encodeMessage).join("")
    );
    return dropped;
  }

  /**
   * Trash the folder holding an address's inbox/receipts/outbox — used by
   * "delete conversation". The system trash is preferred; a plain remove is
   * the fallback where the adapter can't trash (some mobile adapters).
   */
  async deleteAddress(address: string): Promise<void> {
    const folder = this.addressPath(address);
    this.inboxCache.clear();
    this.rawCache.clear();
    this.gcStats.clear();
    try {
      await this.adapter.trashLocal(folder);
      return;
    } catch {
      // fall through to the destructive-but-honest rmdir
    }
    await this.adapter.rmdir(folder, true).catch(() => {
      /* already gone */
    });
  }

  /** Append one receipt block to an address's receipts file (creating it). */
  async appendReceiptBlock(address: string, block: string): Promise<void> {
    await ensureFolder(this.adapter, `${this.root}/${address}`);
    const path = this.receiptsPath(address);
    if (await this.adapter.exists(path)) {
      await this.adapter.append(path, block);
    } else {
      await this.adapter.append(path, receiptsHeader(address) + block);
    }
  }

  async readReceiptsRaw(address: string): Promise<string> {
    const path = this.receiptsPath(address);
    const st = await this.statOf(path);
    if (!st) {
      this.rawCache.delete(path);
      return "";
    }
    const hit = this.rawCache.get(path);
    if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) {
      return hit.content;
    }
    const content = await this.adapter.read(path);
    this.rawCache.set(path, { mtimeMs: st.mtimeMs, size: st.size, content });
    return content;
  }

  /**
   * Whether the address publishes a receipts file at all (SPEC §11) — the
   * signal senders use to decide whether receipts-based ACKs (and therefore
   * retransmission, §14) apply to this peer at all.
   */
  async hasReceipts(address: string): Promise<boolean> {
    return (await this.statOf(this.receiptsPath(address))) !== null;
  }

  /** Drop receipt lines older than maxAgeMs from one address. */
  async gcReceipts(address: string, maxAgeMs: number): Promise<void> {
    if (maxAgeMs <= 0) return;
    const path = this.receiptsPath(address);
    if (!(await this.adapter.exists(path))) return;
    const content = await this.adapter.read(path);
    const kept = pruneReceiptLines(content, Date.now() - maxAgeMs);
    this.rawCache.delete(path);
    if (!kept) {
      await this.removeQuietly(path);
      return;
    }
    const next = receiptsHeader(address) + kept;
    if (next !== content) {
      await this.adapter.write(path, next);
    }
  }

  /**
   * Drop blocks older than maxAgeMs — and beyond maxMessages when set — from
   * one inbox, keeping the newest. Duplicate-id blocks (retransmitted mail,
   * SPEC §14) collapse to their first occurrence. Returns count dropped.
   *
   * With a cursor (SPEC §7 invariant), no message newer than the cursor's ts
   * is ever age-dropped: a receiver whose cursor id was pruned falls back to
   * ts comparison (§4), and dropping such mail would lose it forever. The
   * maxMessages cap still applies regardless of age — the spec grants the
   * size cap that power explicitly so a busy inbox stays bounded.
   */
  async gc(
    address: string,
    maxAgeMs: number,
    maxMessages = 0,
    cursor: { id: string; ts: string } | null = null
  ): Promise<number> {
    if (maxAgeMs <= 0 && maxMessages <= 0) return 0;
    const path = this.inboxPath(address);
    if (!(await this.adapter.exists(path))) return 0;
    const cutoff = maxAgeMs > 0 ? Date.now() - maxAgeMs : Number.NEGATIVE_INFINITY;
    const st = await this.statOf(path);
    const fingerprint = st ? this.gcStats.get(path) : undefined;
    if (
      st &&
      fingerprint &&
      fingerprint.mtimeMs === st.mtimeMs &&
      fingerprint.size === st.size &&
      fingerprint.minTs > cutoff
    ) {
      return 0; // nothing changed and nothing aged out — skip the read
    }
    const content = await this.adapter.read(path);
    const all = parseInbox(content);
    const seen = new Set<string>();
    const unique = all.filter((m) => !seen.has(m.id) && (seen.add(m.id), true));
    // ts-fallback protection (§7): mail a live receiver could still reach
    const cursorTs = cursor ? Date.parse(cursor.ts) : NaN;
    const reach = (m: MailEnvelope): boolean =>
      Number.isFinite(cursorTs) && !isExpired(m) && Date.parse(m.ts) > cursorTs;
    const kept = unique.filter((m) => (Date.parse(m.ts) > cutoff && !isExpired(m)) || reach(m));
    let dropped = all.length - kept.length;
    if (maxMessages > 0 && kept.length > maxMessages) {
      dropped += kept.length - maxMessages;
      kept.splice(0, kept.length - maxMessages);
    }
    if (dropped === 0) {
      if (st) {
        this.gcStats.set(path, {
          mtimeMs: st.mtimeMs,
          size: st.size,
          minTs: kept.reduce((min, m) => Math.min(min, Date.parse(m.ts)), Infinity),
        });
      }
      return 0;
    }
    // GC is the one read-modify-write on the hot path; the adapter has no
    // atomic RMW, but only the owner ever rewrites its own inbox (SPEC §9).
    this.inboxCache.delete(path);
    this.gcStats.delete(path);
    await this.adapter.write(
      path,
      inboxHeader(address) + kept.map(encodeMessage).join("")
    );
    return dropped;
  }

  /**
   * The burn sweep (SPEC §16): drop blocks the caller judges burned from one
   * address's inbox and outbox. Works without the vault key — the predicate
   * reads envelope fields only, and sealed bodies are re-encoded byte-for-byte.
   * Returns the number of blocks dropped.
   */
  async sweepBurned(
    address: string,
    isBurned: (m: MailEnvelope) => boolean
  ): Promise<number> {
    let dropped = 0;
    dropped += await this.sweepFile(
      this.inboxPath(address),
      () => inboxHeader(address),
      isBurned
    );
    dropped += await this.sweepFile(
      this.outboxPath(address),
      () => outboxHeader(address),
      isBurned
    );
    return dropped;
  }

  private async sweepFile(
    path: string,
    makeHeader: () => string,
    isBurned: (m: MailEnvelope) => boolean
  ): Promise<number> {
    if (!(await this.adapter.exists(path))) return 0;
    const st = await this.statOf(path);
    const prev = st ? this.sweepStats.get(path) : undefined;
    if (
      st &&
      prev &&
      prev.mtimeMs === st.mtimeMs &&
      prev.size === st.size &&
      !prev.hasBurnFields
    ) {
      return 0; // unchanged and nothing time-sensitive aboard
    }
    const all = parseInbox(await this.adapter.read(path));
    const hasBurnFields = all.some((m) => m.exp || m.bar);
    if (!hasBurnFields) {
      if (st) this.sweepStats.set(path, { mtimeMs: st.mtimeMs, size: st.size, hasBurnFields: false });
      return 0;
    }
    const kept = all.filter((m) => !isBurned(m));
    const dropped = all.length - kept.length;
    if (dropped === 0) {
      if (st) this.sweepStats.set(path, { mtimeMs: st.mtimeMs, size: st.size, hasBurnFields: true });
      return 0;
    }
    this.inboxCache.delete(path);
    this.gcStats.delete(path);
    this.sweepStats.delete(path);
    if (kept.length === 0) {
      await this.removeQuietly(path);
      return dropped;
    }
    await this.adapter.write(path, makeHeader() + kept.map(encodeMessage).join(""));
    return dropped;
  }

  /**
   * Rewrite every inbox and outbox, sealing plaintext bodies (needs the
   * vault key) or unsealing everything (key active, writes plaintext).
   * The one-shot migration behind the encryption toggle — not part of the
   * poll loop.
   */
  async rewriteAll(seal: boolean): Promise<{ files: number; messages: number }> {
    if (seal && !this.cipher) {
      throw new Error("sealing rewrite requires the vault key");
    }
    let files = 0;
    let messages = 0;
    for (const address of await this.listAddresses()) {
      const targets: Array<[() => Promise<MailEnvelope[]>, string]> = [
        [() => this.readInbox(address), this.inboxPath(address)],
        [() => this.readOutbox(address), this.outboxPath(address)],
      ];
      for (const [read, path] of targets) {
        const all = await read(); // opened plaintext when a key is active
        if (all.length === 0) continue;
        const blocks: string[] = [];
        for (const message of all) {
          if (message.enc) {
            // still sealed after the read (key couldn't open it) — pass the
            // block through untouched rather than mangling ciphertext
            blocks.push(encodeMessage(message));
          } else if (seal) {
            blocks.push((await this.encodeBlock(message)).block);
          } else {
            blocks.push(encodeMessage(message));
          }
        }
        const header = path === this.outboxPath(address)
          ? outboxHeader(address)
          : inboxHeader(address);
        this.inboxCache.delete(path);
        this.gcStats.delete(path);
        this.sweepStats.delete(path);
        await this.adapter.write(path, header + blocks.join(""));
        files++;
        messages += all.length;
      }
    }
    return { files, messages };
  }

  /**
   * Sync engines that can't merge two devices appending at once leave
   * conflict copies beside the inbox (see CONFLICT_SIBLING). The poll loop
   * reads only inbox.md, so mail trapped in a sibling sits unseen forever.
   * Adoption appends any block whose id the canonical inbox lacks — SPEC §4
   * dedupes by id, and because adoption appends at the end of the file,
   * file-order delivery dispatches adopted mail even when its ts is old —
   * then trashes the sibling. A sibling that parses to no message blocks is
   * left alone: it may be user content that merely looks like a conflict.
   * Returns the number of blocks adopted.
   */
  async adoptConflicts(address: string): Promise<number> {
    let listing: { files: string[] };
    try {
      listing = await this.adapter.list(this.addressPath(address));
    } catch {
      return 0; // address folder doesn't exist yet
    }
    const siblings = listing.files.filter((file) => {
      const name = file.split("/").pop() ?? "";
      return name !== "inbox.md" && CONFLICT_SIBLING.test(name);
    });
    let adopted = 0;
    for (const sibling of siblings) {
      let blocks: MailEnvelope[];
      try {
        blocks = parseInbox(await this.adapter.read(sibling));
      } catch {
        continue; // unreadable — leave it for a later pass
      }
      if (blocks.length === 0) continue;
      const known = new Set((await this.readInbox(address)).map((m) => m.id));
      for (const message of blocks) {
        if (known.has(message.id)) continue;
        await this.append(address, message);
        known.add(message.id);
        adopted++;
      }
      await this.trashQuietly(sibling);
    }
    return adopted;
  }

  async upsertRegistry(entry: RegistryEntry): Promise<void> {
    const entries = await this.readRegistry();
    await this.writeRegistry([
      entry,
      ...entries.filter((e) => e.address !== entry.address),
    ]);
  }

  /** Drop an address from the registry — used when a participant renames. */
  async removeRegistry(address: string): Promise<void> {
    const entries = await this.readRegistry();
    const kept = entries.filter((e) => e.address !== address);
    if (kept.length === entries.length) return;
    await this.writeRegistry(kept);
  }

  /** Registry rows sorted by address; the file is rewritten, never appended. */
  private async writeRegistry(entries: RegistryEntry[]): Promise<void> {
    entries.sort((a, b) => a.address.localeCompare(b.address));
    const escape = (s: string): string => s.replace(/\|/g, "\\|");
    const table =
      "| address | name | updated |\n| --- | --- | --- |\n" +
      entries
        .map((e) => `| ${escape(e.address)} | ${escape(e.name)} | ${escape(e.updated)} |`)
        .join("\n") +
      "\n";
    const content =
      `# Messenger registry\n\nWho lives on this bus. Advisory only — ` +
      `any folder with an inbox.md is addressable. Rewritten by plugins, not appended.\n\n${table}`;
    this.registryCache = null;
    await ensureFolder(this.adapter, this.root);
    await this.adapter.write(this.registryPath, content);
  }

  async readRegistry(): Promise<RegistryEntry[]> {
    const st = await this.statOf(this.registryPath);
    if (!st) {
      this.registryCache = null;
      return [];
    }
    const hit = this.registryCache;
    if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) {
      return hit.entries;
    }
    const entries = parseRegistry(await this.adapter.read(this.registryPath));
    this.registryCache = { mtimeMs: st.mtimeMs, size: st.size, entries };
    return entries;
  }
}

/** Parses the registry's markdown table into rows (see readRegistry). */
function parseRegistry(content: string): RegistryEntry[] {
  const entries: RegistryEntry[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.split("|").map((c) => c.trim());
    // rows look like: | address | name | updated | → ["", address, name, updated, ""]
    if (cells.length < 5) continue;
    const address = cells[1];
    const name = cells[2];
    const updated = cells[3];
    if (!address || address === "---") continue;
    // the written table's own header row matches the address regex — skip it
    if (address === "address" && name === "name" && updated === "updated") continue;
    if (!ADDRESS_RE.test(address)) continue;
    entries.push({
      address,
      name: (name || address).replace(/\\\|/g, "|"),
      updated: updated.replace(/\\\|/g, "|"),
    });
  }
  return entries;
}

/** Creates a folder (and parents) if missing; tolerates races. */
async function ensureFolder(adapter: DataAdapter, relPath: string): Promise<void> {  const path = normalizePath(relPath);
  const parts = path.split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (await adapter.exists(current)) continue;
    try {
      await adapter.mkdir(current);
    } catch {
      // already exists (race) — the next segment's existence check handles it
    }
  }
}

interface FileStat {
  mtimeMs: number;
  size: number;
}

async function statFile(adapter: DataAdapter, path: string): Promise<FileStat | null> {
  try {
    const st = await adapter.stat(path);
    return st && st.type === "file" ? { mtimeMs: st.mtime, size: st.size } : null;
  } catch {
    return null;
  }
}

async function listFilesRecursive(
  adapter: DataAdapter,
  dir: string,
  out: string[]
): Promise<void> {
  let listing;
  try {
    listing = await adapter.list(normalizePath(dir));
  } catch {
    return; // folder doesn't exist
  }
  for (const file of listing.files) out.push(file);
  for (const folder of listing.folders) await listFilesRecursive(adapter, folder, out);
}

export interface MigrationResult {
  copied: number;
  skipped: number;
  trashed: boolean;
}

/** Only files the messenger itself creates — anything else pins the old folder down. */
const MANAGED_NAMES = new Set(["inbox.md", "receipts.md", "registry.md"]);

/**
 * Move a mailbox root (visible folder ↔ hidden app folder). Copies managed
 * files without ever overwriting a destination file, and sends the source to
 * the system trash only when it held nothing else. The source folder survives
 * whenever anything unmanaged (or already-copied) is found.
 */
export async function migrateRoot(
  adapter: DataAdapter,
  from: string,
  to: string
): Promise<MigrationResult> {
  const source = normalizePath(from);
  const target = normalizePath(to);
  if (
    source === target ||
    target.startsWith(`${source}/`) ||
    source.startsWith(`${target}/`)
  ) {
    return { copied: 0, skipped: 0, trashed: false };
  }
  const files: string[] = [];
  await listFilesRecursive(adapter, source, files);
  let copied = 0;
  let skipped = 0;
  for (const file of files) {
    const name = file.split("/").pop() ?? "";
    if (!MANAGED_NAMES.has(name)) {
      skipped++;
      continue;
    }
    const dest = `${target}${file.slice(source.length)}`;
    if (await adapter.exists(dest)) {
      skipped++;
      continue;
    }
    await ensureFolder(adapter, dest.split("/").slice(0, -1).join("/"));
    await adapter.write(dest, await adapter.read(file));
    copied++;
  }
  let trashed = false;
  if (files.length > 0 && skipped === 0) {
    try {
      await adapter.trashLocal(source);
      trashed = true;
    } catch {
      // leave it — the copy already succeeded, cleanup can happen by hand
    }
  }
  return { copied, skipped, trashed };
}
