import type { DataAdapter } from "obsidian";
import { normalizePath } from "obsidian";
import type { ContactEntry, ContactsStore } from "../contacts";
import { isReservedAddress } from "../reserved";
import { ADDRESS_RE, type MailEnvelope } from "../mailbox/envelope";
import type { MailboxStore } from "../mailbox/store";
import { fingerprint, toB64u } from "./crypto/keys";
import { aliasCandidate, collisionSuffix } from "./alias";
import type { Om2Contact, Om2Contacts } from "./bridge";
import type { Om2KeyValueStore, Om2MailStore, Om2RegistryEntry } from "./types";

/**
 * Host adapters: the platform-shaped skins over Obsidian's DataAdapter,
 * MailboxStore, and ContactsStore that the OM-2 core (bridge, state) talks
 * to. Nothing here knows about crypto or the wire; nothing in the core knows
 * about Obsidian. Bridge state lives under the plugin's own dir — never the
 * mailbox root, where GC, migration, and the burn sweep would treat it as
 * conversation data.
 */

export function adapterKv(adapter: DataAdapter, baseDir: string): Om2KeyValueStore {
  const base = normalizePath(baseDir);
  return {
    async read(path: string): Promise<string | null> {
      try {
        return await adapter.read(normalizePath(`${base}/${path}`));
      } catch {
        return null; // missing file is the same as empty state
      }
    },
    async write(path: string, data: string): Promise<void> {
      const full = normalizePath(`${base}/${path}`);
      try {
        await adapter.mkdir(base);
      } catch {
        // already there — the write says the rest
      }
      await adapter.write(full, data);
    },
  };
}

export function mailboxMailStore(store: MailboxStore): Om2MailStore {
  return {
    async ensureInbox(address: string): Promise<void> {
      await store.ensureAddress(address);
    },
    async appendMessage(address: string, message: MailEnvelope) {
      await store.append(address, message);
    },
    async readInbox(address: string) {
      return store.readInbox(address);
    },
    async upsertRegistry(entry: Om2RegistryEntry): Promise<void> {
      await store.upsertRegistry(entry);
    },
  };
}

/** ContactEntry → bridge read model; only pinned (OM-2) entries map. */
function toOm2Contact(e: ContactEntry): Om2Contact | null {
  if (!e.fp || !e.publicKey) return null;
  return {
    fp: e.fp,
    publicKey: e.publicKey,
    alias: e.address,
    displayName: e.name,
    relays: e.relays ? [...e.relays] : [],
  };
}

const shortFp = (fp: string): string => `${fp.slice(0, 11)}…`;

/**
 * The bridge's pin/lookup surface over the one real contact book
 * (contacts.md). Pinning is what turns a quarantined stranger (state
 * `request`) into a deliverable contact (state `mutual`) — the chat list,
 * the contact-requests UI, and the §17 gate all keep working off the same
 * rows they already read.
 */
export function contactsBook(contacts: ContactsStore, store: MailboxStore): Om2Contacts {
  const persist = async (entry: ContactEntry): Promise<Om2Contact> => {
    await contacts.upsert(entry);
    const fresh = await contacts.get(entry.address);
    const mapped = fresh ? toOm2Contact(fresh) : null;
    if (!mapped) throw new Error(`pin failed: could not persist contact ${entry.address}`);
    return mapped;
  };

  return {
    async all(): Promise<Om2Contact[]> {
      const list = await contacts.list();
      return list
        .map(toOm2Contact)
        .filter((c): c is Om2Contact => c !== null);
    },

    async byFpGet(fp: string): Promise<Om2Contact | undefined> {
      const list = await contacts.list();
      const hit = list.find((e) => e.fp === fp);
      return hit ? toOm2Contact(hit) ?? undefined : undefined;
    },

    async pin(input: {
      publicKey: Uint8Array;
      handle?: string;
      displayName?: string;
      relays: string[];
    }): Promise<Om2Contact> {
      const fp = fingerprint(input.publicKey);
      const publicKey = toB64u(input.publicKey);

      const existing = (await contacts.list()).find((e) => e.fp === fp);
      if (existing) {
        // Merge, never fork: relays accumulate, a bare name fills in, and a
        // request/pending row graduates to mutual (blocked stays blocked —
        // the gate still wins over the bridge).
        const relays = new Set(existing.relays ?? []);
        for (const r of input.relays) relays.add(r);
        const name =
          existing.name && existing.name !== existing.address
            ? existing.name
            : input.displayName ?? input.handle ?? existing.name;
        await persist({
          ...existing,
          name,
          publicKey,
          relays: [...relays],
          updated: new Date().toISOString(),
        });
        if (existing.state === "request" || existing.state === "pending") {
          await contacts.setState(existing.address, "mutual");
        }
        const fresh = await contacts.get(existing.address);
        const mapped = fresh ? toOm2Contact(fresh) : null;
        if (mapped) return mapped;
        throw new Error(`pin failed: could not persist contact ${existing.address}`);
      }

      // New pin: a free alias for the folder, deterministic from fp/handle
      // with a pubkey-hash suffix when taken — and never a reserved name.
      const taken = new Set<string>([
        ...(await store.listAddresses()),
        ...(await contacts.list()).map((e) => e.address),
      ]);
      let alias = aliasCandidate({ fp, handle: input.handle }, input.publicKey);
      if (taken.has(alias) || isReservedAddress(alias)) {
        alias = `${alias}-${collisionSuffix(input.publicKey)}`.slice(0, 64);
      }
      if (!ADDRESS_RE.test(alias) || isReservedAddress(alias) || taken.has(alias)) {
        alias = `fp-${collisionSuffix(input.publicKey)}`;
      }
      const entry: ContactEntry = {
        address: alias,
        name: input.displayName ?? input.handle ?? shortFp(fp),
        state: "mutual",
        updated: new Date().toISOString(),
        fp,
        publicKey,
        relays: [...new Set(input.relays)],
      };
      return persist(entry);
    },
  };
}
