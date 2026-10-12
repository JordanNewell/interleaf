/**
 * Attachments — media and files carried into conversations as vault files.
 *
 * The composer stores every pasted/dropped image as a real vault file
 * (settings.attachmentsFolder) and splices an embed into the message body, so
 * "the attachments of a conversation" is a query over the embeds in that
 * thread's markdown resolved against the vault's file list. This module is
 * the pure half — parsing, resolution, orphan detection — kept free of the
 * Obsidian API so the unit suite can exercise it; the screens live in
 * dialogs.ts and the wiring in chat-view.ts / main.ts.
 */

import type { MailEnvelope } from "./mailbox/envelope";

export const ATTACHMENT_IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "avif",
  "bmp",
];

export function isImageFile(name: string): boolean {
  const ext = name.includes(".")
    ? (name.split(".").pop() ?? "").toLowerCase()
    : "";
  return ATTACHMENT_IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Every embed target a markdown body references: wiki embeds
 * (`![[notes/shot.png|300]]`, `![[shot.png#section]]`) and markdown embeds
 * (`![alt](folder/my%20file.png "title")`). Plain links and non-embed
 * references are not attachments and stay out; external URLs parse but never
 * resolve against the vault.
 */
export function parseEmbedTargets(body: string): string[] {
  const out = new Set<string>();
  for (const m of body.matchAll(/!\[\[([^\]\n]+)\]\]/g)) {
    const target = m[1].split("|")[0].split("#")[0].trim();
    if (target) out.add(target);
  }
  for (const m of body.matchAll(/!\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    let target = m[1];
    const space = target.indexOf(" ");
    if (space !== -1) target = target.slice(0, space); // drop the "title" part
    try {
      target = decodeURIComponent(target);
    } catch {
      // not percent-encoded (or malformed) — use it raw
    }
    target = target.split("#")[0].trim();
    if (target) out.add(target);
  }
  return [...out];
}

export interface VaultFileRef {
  /** Vault-relative path, e.g. `Messenger/Attachments/messenger-1-abc.png`. */
  path: string;
  /** Bare filename, e.g. `messenger-1-abc.png`. */
  name: string;
}

/**
 * Resolve one embed target to a vault path: an exact path match first, then a
 * unique basename match (the conservative half of Obsidian's shortest-path
 * rule — an ambiguous or missing name resolves to nothing rather than a
 * guess, because a wrong match would show mail in the wrong thread).
 */
export function resolveEmbedTarget(
  target: string,
  files: VaultFileRef[]
): string | null {
  if (/^(https?:|data:|mailto:|file:)/i.test(target)) return null;
  const norm = target.replace(/\\/g, "/").replace(/^\//, "");
  const exact = files.find((f) => f.path === norm);
  if (exact) return exact.path;
  const base = norm.split("/").pop() ?? norm;
  const byName = files.filter((f) => f.name === base);
  return byName.length === 1 ? byName[0].path : null;
}

/** One attachment occurrence in a conversation: a file, carried by a message. */
export interface ConversationAttachment {
  path: string;
  /** Sender address from the envelope — labels come from the caller. */
  from: string;
  ts: string;
  msgId: string;
}

export interface ConversationAttachmentResult {
  /** Newest first — the sheet is a media timeline. */
  items: ConversationAttachment[];
  /** Messages skipped because their bodies are sealed and locked (§15). */
  skippedSealed: number;
}

/**
 * Attachments of one thread, both directions (the caller passes the merged
 * conversation from bus.loadConversation). The same file sent twice is two
 * entries — like iMessage, each send is its own tile; the same file embedded
 * twice in one message is one.
 */
export function conversationAttachments(
  messages: MailEnvelope[],
  files: VaultFileRef[]
): ConversationAttachmentResult {
  const items: ConversationAttachment[] = [];
  const seen = new Set<string>();
  let skippedSealed = 0;
  for (const m of messages) {
    if (m.encLocked) {
      skippedSealed++;
      continue;
    }
    for (const target of parseEmbedTargets(m.body)) {
      const path = resolveEmbedTarget(target, files);
      if (!path) continue;
      const key = `${m.id}\u0000${path}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ path, from: m.from, ts: m.ts, msgId: m.id });
    }
  }
  items.sort((a, b) => b.ts.localeCompare(a.ts) || b.msgId.localeCompare(a.msgId));
  return { items, skippedSealed };
}

/**
 * Files in the attachments folder that nothing survives to reference — not
 * any conversation's messages, not any draft, not any note in the vault.
 * Cleanup is deliberately conservative: callers should over-fill `holders`
 * (resolved AND unresolved link texts both count) so a stray `![[x.png]]` in
 * an old note can never get its file trashed.
 */
export function findOrphans<T extends VaultFileRef>(
  folderFiles: T[],
  holders: Set<string>
): T[] {
  return folderFiles.filter((f) => !holders.has(f.path));
}
