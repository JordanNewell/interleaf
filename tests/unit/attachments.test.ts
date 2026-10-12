/**
 * Attachments — the pure half (src/attachments.ts): embed parsing, vault
 * resolution, conversation gathering, orphan detection. The sheets themselves
 * need a real workspace; these helpers decide everything the sheets show.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  conversationAttachments,
  findOrphans,
  isImageFile,
  parseEmbedTargets,
  resolveEmbedTarget,
  type VaultFileRef,
} from "../../src/attachments";
import type { MailEnvelope } from "../../src/mailbox/envelope";

const FILES: VaultFileRef[] = [
  { path: "Messenger/Attachments/messenger-1-aaa.png", name: "messenger-1-aaa.png" },
  { path: "Messenger/Attachments/messenger-2-bbb.jpg", name: "messenger-2-bbb.jpg" },
  { path: "Messenger/Attachments/messenger-3-ccc.pdf", name: "messenger-3-ccc.pdf" },
  { path: "Notes/dup.png", name: "dup.png" },
  { path: "Photos/dup.png", name: "dup.png" },
];

// -- embed parsing ----------------------------------------------------------------

test("embed parsing: wiki embeds with size and heading decorations", () => {
  assert.deepEqual(
    parseEmbedTargets("![[Messenger/Attachments/messenger-1-aaa.png]]"),
    ["Messenger/Attachments/messenger-1-aaa.png"]
  );
  assert.deepEqual(parseEmbedTargets("![[messenger-2-bbb.jpg|300]]"), [
    "messenger-2-bbb.jpg",
  ]);
  assert.deepEqual(parseEmbedTargets("![[note.md#Heading]]"), ["note.md"]);
});

test("embed parsing: markdown embeds decode percent-escapes and drop titles", () => {
  assert.deepEqual(parseEmbedTargets("![alt](folder/my%20file.png)"), [
    "folder/my file.png",
  ]);
  assert.deepEqual(parseEmbedTargets('![](Messenger/Attachments/x.png "Pic")'), [
    "Messenger/Attachments/x.png",
  ]);
});

test("embed parsing: plain links are not attachments and duplicates collapse", () => {
  const body = [
    "[[messenger-1-aaa.png]]", // a link, not an embed
    "https://example.com/x.png", // prose
    "![[messenger-1-aaa.png]]",
    "![[messenger-1-aaa.png]]", // same embed twice
  ].join("\n");
  assert.deepEqual(parseEmbedTargets(body), ["messenger-1-aaa.png"]);
});

// -- resolution -------------------------------------------------------------------

test("resolution: exact path first, then a unique basename, never a guess", () => {
  assert.equal(
    resolveEmbedTarget("Messenger/Attachments/messenger-1-aaa.png", FILES),
    "Messenger/Attachments/messenger-1-aaa.png"
  );
  assert.equal(resolveEmbedTarget("messenger-2-bbb.jpg", FILES), "Messenger/Attachments/messenger-2-bbb.jpg");
  // two files share the name — showing either would be a guess
  assert.equal(resolveEmbedTarget("dup.png", FILES), null);
  assert.equal(resolveEmbedTarget("nope.png", FILES), null);
});

test("resolution: external and data URLs never resolve to vault files", () => {
  assert.equal(resolveEmbedTarget("https://example.com/x.png", FILES), null);
  assert.equal(resolveEmbedTarget("data:image/png;base64,xxx", FILES), null);
});

// -- conversation gathering ---------------------------------------------------------

const msg = (over: Partial<MailEnvelope>): MailEnvelope => ({
  id: "msg_x",
  from: "curtis",
  to: "owner",
  ts: "2026-10-10T12:00:00.000Z",
  replyTo: null,
  body: "",
  ...over,
});

test("conversation attachments: newest first, both directions, per-send tiles", () => {
  const { items, skippedSealed } = conversationAttachments(
    [
      msg({
        id: "m1",
        from: "curtis",
        ts: "2026-10-10T12:00:00.000Z",
        body: "![[messenger-1-aaa.png]]",
      }),
      msg({
        id: "m2",
        from: "owner",
        ts: "2026-10-11T09:00:00.000Z",
        body: "see this ![[messenger-2-bbb.jpg|300]] and again ![[messenger-2-bbb.jpg]]",
      }),
      msg({
        id: "m3",
        from: "curtis",
        ts: "2026-10-11T10:00:00.000Z",
        body: "sealed",
        encLocked: true,
      }),
      msg({
        id: "m4",
        from: "curtis",
        ts: "2026-10-11T11:00:00.000Z",
        body: "![[dup.png]] ![[gone.png]]",
      }),
    ],
    FILES
  );
  assert.equal(skippedSealed, 1);
  // m4's dup.png is ambiguous and gone.png is missing — neither shows
  // m2 embeds the same file twice — one tile; newest first
  assert.deepEqual(
    items.map((i) => ({ msgId: i.msgId, path: i.path, from: i.from })),
    [
      { msgId: "m2", path: "Messenger/Attachments/messenger-2-bbb.jpg", from: "owner" },
      { msgId: "m1", path: "Messenger/Attachments/messenger-1-aaa.png", from: "curtis" },
    ]
  );
});

test("conversation attachments: the same file sent in two messages is two tiles", () => {
  const { items } = conversationAttachments(
    [
      msg({ id: "a", ts: "2026-10-10T12:00:00.000Z", body: "![[messenger-1-aaa.png]]" }),
      msg({ id: "b", ts: "2026-10-10T13:00:00.000Z", body: "![[messenger-1-aaa.png]]" }),
    ],
    FILES
  );
  assert.equal(items.length, 2);
});

// -- orphan detection ----------------------------------------------------------------

test("orphan detection: only unreferenced folder files qualify", () => {
  const folderFiles = FILES.slice(0, 3); // the Messenger/Attachments trio
  const holders = new Set([
    "Messenger/Attachments/messenger-1-aaa.png", // referenced by a message
    "Messenger/Attachments/messenger-2-bbb.jpg", // referenced by a draft or note
  ]);
  assert.deepEqual(
    findOrphans(folderFiles, holders).map((f) => f.name),
    ["messenger-3-ccc.pdf"]
  );
});

// -- image detection ----------------------------------------------------------------

test("image detection follows the extension, case-insensitively", () => {
  assert.equal(isImageFile("photo.PNG"), true);
  assert.equal(isImageFile("doc.pdf"), false);
  assert.equal(isImageFile("noext"), false);
});
