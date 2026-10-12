/**
 * Runtime-neutral storage contracts for the OM-2 edge. The bridge and its state
 * live at an edge (spec OM-2 §3.3) but must run anywhere: Node CLIs, the
 * Obsidian desktop renderer, mobile webviews. Anything platform-specific
 * implements these interfaces instead of the core reaching for node:fs or the
 * Obsidian API.
 */

import type { MailEnvelope } from "../mailbox/envelope";

/** Minimal persistent string blobs, namespaced by arbitrary keys. */
export interface Om2KeyValueStore {
  read(path: string): Promise<string | null>;
  write(path: string, data: string): Promise<void>;
}

export interface Om2RegistryEntry {
  address: string;
  name: string;
  updated: string;
}

/** What the bridge needs from a mailbox (the OM-1 bus is a foreign writer). */
export interface Om2MailStore {
  ensureInbox(address: string): Promise<void>;
  appendMessage(address: string, message: MailEnvelope): Promise<void>;
  readInbox(address: string): Promise<MailEnvelope[]>;
  upsertRegistry(entry: Om2RegistryEntry): Promise<void>;
}

/** The local conversation address a pinned remote identity maps to. */
export type { MailEnvelope };
