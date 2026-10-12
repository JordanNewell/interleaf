import { DataAdapter, normalizePath } from "obsidian";
import { ADDRESS_RE } from "./mailbox/envelope";
import { isReservedAddress } from "./reserved";

/**
 * The social gate (SPEC.md §17): a name-based contact list beside the
 * advisory registry. States:
 *
 * - `request`  — a stranger wrote to me; their mail waits under Contact
 *   requests until I accept (or they get blocked).
 * - `pending`  — I added them / wrote first; their first reply upgrades.
 * - `mutual`   — two-way: a contact whose mail I accepted or who replied.
 * - `blocked`  — declined; hidden from the list, conversation stays quiet.
 *
 * This is a UI-and-delivery gate over self-declared names, not
 * authentication — §8 applies in full. Authentication exists for cross-vault
 * contacts (OM-2): entries pinned through the bridge (src/om2/) carry the
 * extra fields below, and their mail is verified before it ever lands here.
 */
export type ContactState = "request" | "pending" | "mutual" | "blocked";

export interface ContactEntry {
  address: string;
  name: string;
  state: ContactState;
  /** ISO timestamp of the last change — advisory, like registry.updated. */
  updated: string;
  /**
   * OM-2 pin (cross-vault contacts only): fingerprint, pinned base64url
   * Ed25519 public key, and the relays they receive mail on. Absent for
   * plain shared-bus contacts, who stay name-gated.
   */
  fp?: string;
  publicKey?: string;
  relays?: string[];
}

const CONTACT_STATES: ReadonlySet<string> = new Set([
  "request",
  "pending",
  "mutual",
  "blocked",
]);

/** Who may put mail in front of me / appear nearby (settings.whoCanReachMe). */
export type ReachMode = "everyone" | "contacts";

/** What one inbound envelope's sender is, relative to the contact list. */
export type InboundClass =
  | "self" // my own mail echoed back
  | "system" // the bus's own address (welcome mail) — never gated
  | "contact" // a mutual contact writing me
  | "upgrade" // a pending contact writing me, or verified §12 mail — becomes mutual
  | "request" // a stranger (or unaccepted requester) writing me
  | "blocked"; // someone I declined

/**
 * Contacts live in `<root>/contacts.md` — a rewritten markdown table beside
 * registry.md, same stat-validated caching, same tolerance for hand edits
 * (a bumped mtime invalidates the cache; junk rows drop on parse).
 */
export class ContactsStore {
  private cache: { mtimeMs: number; size: number; entries: ContactEntry[] } | null =
    null;

  constructor(private adapter: DataAdapter, private root: string) {}

  get contactsPath(): string {
    return normalizePath(`${this.root}/contacts.md`);
  }

  setRoot(root: string): void {
    this.root = root;
    this.cache = null;
  }

  /**
   * One-time migration: with no contacts.md yet, every existing conversation
   * address starts as `mutual` so nothing an upgrade user already sees moves
   * into Contact requests. Returns whether the file was written.
   */
  async seed(addresses: string[]): Promise<boolean> {
    if (await this.pathExists()) return false;
    const now = new Date().toISOString();
    const entries = [...new Set(addresses)]
      .filter((a) => ADDRESS_RE.test(a))
      .sort()
      .map((address) => ({ address, name: address, state: "mutual" as const, updated: now }));
    await this.write(entries);
    return true;
  }

  async list(): Promise<ContactEntry[]> {
    return [...(await this.read())].sort((a, b) => a.address.localeCompare(b.address));
  }

  /** Entries keyed by address — the shape classifyInbound wants. */
  async map(): Promise<Map<string, ContactEntry>> {
    return new Map((await this.read()).map((e) => [e.address, e]));
  }

  async get(address: string): Promise<ContactEntry | null> {
    return (await this.read()).find((e) => e.address === address) ?? null;
  }

  async upsert(entry: ContactEntry): Promise<void> {
    if (!ADDRESS_RE.test(entry.address) || !CONTACT_STATES.has(entry.state)) return;
    const kept =
      entry.name === "" || entry.updated === ""
        ? { ...entry, name: entry.name || entry.address, updated: entry.updated || new Date().toISOString() }
        : entry;
    await this.write([kept, ...(await this.read()).filter((e) => e.address !== kept.address)]);
  }

  async setState(address: string, state: ContactState): Promise<void> {
    const entries = await this.read();
    const hit = entries.find((e) => e.address === address);
    if (!hit || hit.state === state || !CONTACT_STATES.has(state)) return;
    hit.state = state;
    hit.updated = new Date().toISOString();
    await this.write(entries);
  }

  async remove(address: string): Promise<void> {
    const entries = await this.read();
    if (!entries.some((e) => e.address === address)) return;
    await this.write(entries.filter((e) => e.address !== address));
  }

  private async pathExists(): Promise<boolean> {
    try {
      return await this.adapter.exists(this.contactsPath);
    } catch {
      return false;
    }
  }

  private async read(): Promise<ContactEntry[]> {
    // obsidian's Stat exposes mtime (ms), not mtimeMs — map it like the store does
    let st: { mtimeMs: number; size: number } | null = null;
    try {
      const raw = await this.adapter.stat(this.contactsPath);
      st = raw && raw.type === "file" ? { mtimeMs: raw.mtime, size: raw.size } : null;
    } catch {
      st = null;
    }
    if (!st) {
      this.cache = null;
      return [];
    }
    if (this.cache && this.cache.mtimeMs === st.mtimeMs && this.cache.size === st.size) {
      return this.cache.entries;
    }
    const entries = parseContacts(await this.adapter.read(this.contactsPath));
    this.cache = { mtimeMs: st.mtimeMs, size: st.size, entries };
    return entries;
  }

  /** Rewritten, never appended — same rule as the registry. */
  private async write(entries: ContactEntry[]): Promise<void> {
    const sorted = [...entries].sort((a, b) => a.address.localeCompare(b.address));
    const escape = (s: string): string => s.replace(/\|/g, "\\|");
    // OM-2 columns are optional per row — old tables (4 columns) parse fine,
    // and an old plugin reading a new table just ignores the extra cells.
    const table =
      "| address | name | state | updated | fp | key | relays |\n| --- | --- | --- | --- | --- | --- | --- |\n" +
      sorted
        .map(
          (e) =>
            `| ${escape(e.address)} | ${escape(e.name)} | ${escape(e.state)} | ${escape(e.updated)} | ${escape(e.fp ?? "")} | ${escape(e.publicKey ?? "")} | ${escape((e.relays ?? []).join(" "))} |`
        )
        .join("\n") +
      "\n";
    const content =
      `# Messenger contacts\n\n` +
      `The social gate: request | pending | mutual | blocked (see SPEC.md §17). ` +
      `A name-based gate over self-declared addresses — not authentication (§8). ` +
      `Cross-vault contacts carry their OM-2 pin in the fp/key/relays columns. ` +
      `Rewritten by plugins, not appended.\n\n${table}`;
    this.cache = null;
    try {
      await this.adapter.mkdir(this.root);
    } catch {
      // already there (or the mailbox root creation races us) — the write says the rest
    }
    await this.adapter.write(this.contactsPath, content);
  }
}

/** Parses contacts.md's table (see ContactsStore.read). */
export function parseContacts(content: string): ContactEntry[] {
  const entries: ContactEntry[] = [];
  const unescape = (s: string): string => s.replace(/\\\|/g, "|");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    // split on unescaped pipes — an escaped \| is part of its cell
    const cells = trimmed.split(/(?<!\\)\|/).map((c) => c.trim());
    // rows look like: | address | name | state | updated [| fp | key | relays |]
    // 4-column rows are length 6; OM-2 rows are length 9
    if (cells.length < 6) continue;
    const address = cells[1];
    const name = cells[2];
    const state = cells[3];
    const updated = cells[4];
    if (!address || address === "---" || !ADDRESS_RE.test(address)) continue;
    if (address === "address" && name === "name" && state === "state") continue;
    if (!CONTACT_STATES.has(state)) continue;
    const entry: ContactEntry = {
      address,
      name: (name || address).replace(/\\\|/g, "|"),
      state: state as ContactState,
      updated: updated.replace(/\\\|/g, "|"),
    };
    if (cells.length >= 9) {
      const fp = unescape(cells[5] ?? "");
      const publicKey = unescape(cells[6] ?? "");
      const relays = (unescape(cells[7] ?? "")).split(" ").filter(Boolean);
      if (fp) entry.fp = fp;
      if (publicKey) entry.publicKey = publicKey;
      if (relays.length > 0) entry.relays = relays;
    }
    entries.push(entry);
  }
  return entries;
}

/**
 * Where one sender stands. Unknown senders are requests (they land under
 * Contact requests, quiet); `pending` senders writing back are upgrades —
 * that reply is exactly what makes the contact mutual. `verified` marks
 * mail that already crossed an authenticated edge (OM-2 §12): signed and
 * accepted at the bridge, so a stranger or unaccepted requester arrives
 * pre-accepted — unless they're blocked, which wins no matter what.
 */
export function classifyInbound(
  from: string,
  contacts: Map<string, ContactEntry>,
  myAddress: string,
  systemAddress: string,
  verified = false
): InboundClass {
  if (from === myAddress) return "self";
  if (from === systemAddress) return "system";
  const state = contacts.get(from)?.state;
  switch (state) {
    case "blocked":
      return "blocked"; // block wins — verified upstream or not
    case "mutual":
      return "contact";
    case "pending":
      return "upgrade";
    default:
      // request state and total stranger behave alike; verified §12 mail
      // already passed the OM-2 edge, so it arrives as an upgrade instead
      return verified ? "upgrade" : "request";
  }
}

/** An address-shaped slug, or "" when the input yields nothing usable. */
function slugify(raw: string): string {
  const s = raw
    // strip diacritics first so "Gödel" keeps its o ("godel", not "g-del")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+/, "")
    .replace(/[._-]+$/, "")
    .slice(0, 64)
    .replace(/[._-]+$/, "");
  return ADDRESS_RE.test(s) ? s : "";
}

/**
 * Suggest an address for an imported contact: the email's local part, then
 * phone digits, then the name — de-duplicated against addresses already
 * taken (contacts or conversations) with a -2, -3… suffix.
 */
export function suggestAddress(
  picked: { name?: string; email?: string; tel?: string },
  taken: Iterable<string>
): string {
  const owned = new Set(taken);
  const sources = [
    (picked.email ?? "").split("@")[0],
    (picked.tel ?? "").replace(/[^0-9]/g, ""),
    picked.name ?? "",
  ];
  for (const source of sources) {
    const base = slugify(source);
    if (!base) continue;
    // a device contact whose email local part is "support@" or "pay@"
    // suggests a reserved name — skip straight to the next source rather
    // than offering a handle no one can keep
    if (!owned.has(base) && !isReservedAddress(base)) return base;
    for (let n = 2; n < 100; n++) {
      const candidate = `${base}-${n}`.slice(0, 64);
      if (!owned.has(candidate) && !isReservedAddress(candidate)) return candidate;
    }
  }
  return "";
}
