import { test } from "node:test";
import assert from "node:assert/strict";
import { MailboxStore, migrateRoot } from "../../src/mailbox/store";
import { encodeMessage } from "../../src/mailbox/envelope";
import type { MailEnvelope } from "../../src/mailbox/envelope";
import type { DataAdapter } from "obsidian";
import { FakeAdapter } from "./fake-adapter";

const msg = (id: string, ts: string, body = id): MailEnvelope => ({
  id,
  from: "curtis",
  to: "owner",
  ts,
  replyTo: null,
  body,
});

const store = (adapter: FakeAdapter): MailboxStore =>
  new MailboxStore(adapter as unknown as DataAdapter, "root");

const DAY = 86400000;

test("append creates the inbox with a header; readInbox parses it", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.append("curtis", msg("m1", "2026-10-10T00:00:00.000Z"));
  assert.ok((await a.read("root/curtis/inbox.md")).startsWith("# Inbox — curtis"));
  const out = await s.readInbox("curtis");
  assert.equal(out.length, 1);
  assert.equal(out[0]?.id, "m1");
});

test("the stat-validated cache: same file reads once, a changed file re-reads", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.append("curtis", msg("m1", "2026-10-10T00:00:00.000Z"));
  await s.readInbox("curtis");
  await s.readInbox("curtis");
  await s.readInbox("curtis");
  assert.equal(a.reads, 1, "unchanged file should come from cache");
  await s.append("curtis", msg("m2", "2026-10-11T00:00:00.000Z"));
  const out = await s.readInbox("curtis");
  assert.deepEqual(out.map((m) => m.id), ["m1", "m2"]);
});

test("gc drops only messages older than the cutoff (SPEC §7 invariant)", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  const now = Date.now();
  await s.append("curtis", msg("old", new Date(now - 40 * DAY).toISOString()));
  await s.append("curtis", msg("mid", new Date(now - 10 * DAY).toISOString()));
  await s.append("curtis", msg("new", new Date(now - 1 * DAY).toISOString()));
  const dropped = await s.gc("curtis", 30 * DAY);
  assert.equal(dropped, 1);
  const kept = await s.readInbox("curtis");
  assert.deepEqual(kept.map((m) => m.id), ["mid", "new"]);
});

test("gc keeps everything a live cursor could still reach", async () => {
  // A receiver whose cursor sits on "mid" relies on file order; a ts-fallback
  // receiver with an old cursor relies on ts. Either way nothing after the
  // cursor may vanish — and because kept messages are newer than the cutoff,
  // age-only filtering satisfies both.
  const a = new FakeAdapter();
  const s = store(a);
  const now = Date.now();
  await s.append("curtis", msg("m1", new Date(now - 40 * DAY).toISOString()));
  await s.append("curtis", msg("m2", new Date(now - 1 * DAY).toISOString()));
  await s.gc("curtis", 30 * DAY);
  const kept = await s.readInbox("curtis");
  assert.deepEqual(kept.map((m) => m.id), ["m2"]);
  const parsed = (await a.read("root/curtis/inbox.md")).includes("# Inbox — curtis");
  assert.ok(parsed, "rewrite keeps the header");
});

test("outbox: append/read round-trip and gc empty out the file", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  const old = new Date(Date.now() - 2 * DAY).toISOString();
  await s.appendOutbox("owner", msg("s1", old));
  assert.deepEqual((await s.readOutbox("owner")).map((m) => m.id), ["s1"]);
  const dropped = await s.gcOutbox("owner", DAY);
  assert.equal(dropped, 1);
  assert.deepEqual(await s.readOutbox("owner"), []);
});

test("deleteAddress trashes the folder", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.append("curtis", msg("m1", "2026-10-10T00:00:00.000Z"));
  await s.deleteAddress("curtis");
  assert.deepEqual(a.trashed, ["root/curtis"]);
});

test("registry: upsert updates in place; removeRegistry drops only known rows", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.upsertRegistry({ address: "curtis", name: "Curtis", updated: "t1" });
  await s.upsertRegistry({ address: "owner", name: "owner (you)", updated: "t1" });
  await s.upsertRegistry({ address: "curtis", name: "Curtis H.", updated: "t2" });
  const rows = await s.readRegistry();
  assert.deepEqual(rows.map((r) => r.name), ["Curtis H.", "owner (you)"]);
  await s.removeRegistry("nobody");
  assert.equal((await s.readRegistry()).length, 2);
  await s.removeRegistry("curtis");
  assert.deepEqual((await s.readRegistry()).map((r) => r.address), ["owner"]);
});

test("migrateRoot copies managed files, keeps unmanaged, never overwrites", async () => {
  const a = new FakeAdapter();
  a.files.set("old/curtis/inbox.md", encodeMessage(msg("m1", "2026-10-10T00:00:00.000Z")));
  a.files.set("old/registry.md", "# registry\n");
  a.files.set("old/notes.txt", "user data");
  a.dirs.add("old");
  a.dirs.add("old/curtis");
  const result = await migrateRoot(a as unknown as DataAdapter, "old", "new");
  assert.equal(result.copied, 2);
  assert.equal(result.skipped, 1);
  assert.equal(result.trashed, false, "unmanaged files pin the folder down");
  assert.ok(a.files.has("old/notes.txt"));
  assert.ok(a.files.has("new/curtis/inbox.md"));

  // second migration with an existing destination file: skipped, not clobbered
  const again = await migrateRoot(a as unknown as DataAdapter, "old", "new");
  assert.equal(again.skipped >= 1, true);
  assert.ok((await a.read("new/curtis/inbox.md")).includes("m1"));
});

test("migrateRoot trashes the source only when it held nothing unmanaged", async () => {
  const a = new FakeAdapter();
  a.files.set("old/registry.md", "# registry\n");
  a.dirs.add("old");
  const result = await migrateRoot(a as unknown as DataAdapter, "old", "new");
  assert.equal(result.trashed, true);
  assert.deepEqual(a.trashed, ["old"]);
});

const sibling = (id: string, ts: string, body = id): string =>
  "# Inbox — curtis\n\n" + encodeMessage(msg(id, ts, body));

test("adoptConflicts rescues mail trapped in a sync-conflict copy and trashes it", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.append("curtis", msg("m1", "2026-10-10T00:00:00.000Z"));
  // a Dropbox-style conflict sibling holding mail the canonical inbox lacks
  await a.write("root/curtis/inbox (conflicted copy 2026-10-11).md", sibling("m2", "2026-10-11T00:00:00.000Z"));
  const adopted = await s.adoptConflicts("curtis");
  assert.equal(adopted, 1);
  assert.deepEqual((await s.readInbox("curtis")).map((m) => m.id), ["m1", "m2"]);
  assert.ok(a.trashed.includes("root/curtis/inbox (conflicted copy 2026-10-11).md"), "merged sibling is trashed");
  assert.ok(!a.files.has("root/curtis/inbox (conflicted copy 2026-10-11).md"));
});

test("adoptConflicts handles every sync engine's naming and never eats real notes", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.append("curtis", msg("m1", "2026-10-10T00:00:00.000Z"));
  // Syncthing, iCloud, Google Drive shapes — one block each, all adopted
  await a.write("root/curtis/inbox.sync-conflict-20261011-120000.md", sibling("m2", "2026-10-11T00:00:00.000Z"));
  await a.write("root/curtis/inbox 2.md", sibling("m3", "2026-10-12T00:00:00.000Z"));
  await a.write("root/curtis/inbox(1).md", sibling("m4", "2026-10-13T00:00:00.000Z"));
  // a genuine user note that merely starts with "inbox" must be left alone
  await a.write("root/curtis/inbox-notes.md", "# my notes\n\nnot mail");
  const adopted = await s.adoptConflicts("curtis");
  assert.equal(adopted, 3);
  // append-only: adopted blocks land in listing (name) order, newest name last
  assert.deepEqual((await s.readInbox("curtis")).map((m) => m.id), ["m1", "m3", "m4", "m2"]);
  assert.ok(a.files.has("root/curtis/inbox-notes.md"), "user notes survive");
  assert.ok(a.trashed.includes("root/curtis/inbox 2.md"));
});

test("adoptConflicts skips ids the canonical already has, but still cleans the duplicate", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.append("curtis", msg("m1", "2026-10-10T00:00:00.000Z"));
  await a.write("root/curtis/inbox (1).md", sibling("m1", "2026-10-10T00:00:00.000Z"));
  const adopted = await s.adoptConflicts("curtis");
  assert.equal(adopted, 0);
  assert.deepEqual((await s.readInbox("curtis")).map((m) => m.id), ["m1"]);
  assert.ok(a.trashed.includes("root/curtis/inbox (1).md"));
});

test("adoptConflicts rebuilds a lost canonical inbox from its conflict copy", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  // no inbox.md at all — the conflict copy is the only copy of the mail
  await a.write("root/curtis/inbox (conflicted copy).md", sibling("m1", "2026-10-10T00:00:00.000Z"));
  a.dirs.add("root/curtis");
  const adopted = await s.adoptConflicts("curtis");
  assert.equal(adopted, 1);
  assert.deepEqual((await s.readInbox("curtis")).map((m) => m.id), ["m1"]);
  const canonical = await a.read("root/curtis/inbox.md");
  assert.ok(canonical.startsWith("# Inbox — curtis"), "append created the header");
});

test("adoptConflicts leaves a sibling that parses to no message blocks", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await a.write("root/curtis/inbox 2.md", "# Inbox — curtis\n\nno blocks here");
  const adopted = await s.adoptConflicts("curtis");
  assert.equal(adopted, 0);
  assert.ok(a.files.has("root/curtis/inbox 2.md"), "content without mail is not ours to delete");
});

test("gc quota keeps the newest maxMessages per inbox", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  const base = Date.now();
  for (let i = 1; i <= 5; i++) {
    await s.append("curtis", msg(`m${i}`, new Date(base - (6 - i) * 60000).toISOString()));
  }
  const dropped = await s.gc("curtis", 30 * DAY, 3);
  assert.equal(dropped, 2);
  assert.deepEqual((await s.readInbox("curtis")).map((m) => m.id), ["m3", "m4", "m5"]);
});

test("gc quota applies even when retention is disabled (0 days)", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  const base = Date.now();
  for (let i = 1; i <= 4; i++) {
    await s.append("curtis", msg(`m${i}`, new Date(base - (5 - i) * 60000).toISOString()));
  }
  const dropped = await s.gc("curtis", 0, 2);
  assert.equal(dropped, 2);
  assert.deepEqual((await s.readInbox("curtis")).map((m) => m.id), ["m3", "m4"]);
});

test("gc collapses duplicate-id blocks (retransmitted mail) to the first", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.append("curtis", msg("m1", "2026-10-10T00:00:00.000Z"));
  // SPEC §14 retransmission re-appends the identical block — same id
  await s.append("curtis", msg("m1", "2026-10-10T00:00:00.000Z"));
  const dropped = await s.gc("curtis", 30 * DAY);
  assert.equal(dropped, 1);
  assert.deepEqual((await s.readInbox("curtis")).map((m) => m.id), ["m1"]);
});

test("gc skips the read while a file is unchanged and nothing can expire", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.append("curtis", msg("m1", new Date(Date.now() - 1 * DAY).toISOString()));
  await s.gc("curtis", 30 * DAY); // parses once, records the fingerprint
  const readsAfterFirst = a.reads;
  assert.equal(await s.gc("curtis", 30 * DAY), 0);
  assert.equal(a.reads, readsAfterFirst, "unchanged file skips the parse");
  await s.append("curtis", msg("m2", new Date(Date.now() - 1 * DAY).toISOString()));
  assert.equal(await s.gc("curtis", 30 * DAY), 0);
  assert.equal(a.reads, readsAfterFirst + 1, "a changed file is parsed again");
});

// -- SPEC §15 sealed bodies -----------------------------------------------------

/** Deterministic stand-in cipher: XOR-ish transform, no WebCrypto needed. */
const fakeCipher = {
  // reversed bodies: the ciphertext must not contain the plaintext substring
  async seal(body: string) {
    return { iv: "aXY=", ct: `sea:${[...body].reverse().join("")}:sea` };
  },
  async open(iv: string, ct: string) {
    if (iv !== "aXY=" || !ct.startsWith("sea:") || !ct.endsWith(":sea")) {
      throw new Error("bad seal");
    }
    return [...ct.slice(4, -4)].reverse().join("");
  },
};

test("sealing: append writes ciphertext, read opens it and clears the marker", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  s.setCipher(fakeCipher);
  const sealed = await s.append("curtis", msg("m1", "2026-10-10T00:00:00.000Z", "secret text"));
  assert.equal(sealed?.iv, "aXY=");

  const raw = await a.read("root/curtis/inbox.md");
  assert.ok(!raw.includes("secret text"), "plaintext never lands on disk");
  assert.ok(raw.includes('"enc"'), "the header carries the seal");

  const out = await s.readInbox("curtis");
  assert.equal(out[0]?.body, "secret text");
  assert.equal(out[0]?.enc, undefined, "opened bodies lose their seal marker");
  assert.equal(out[0]?.encLocked, undefined);
});

test("locked session: sealed bodies read back flagged, and GC preserves them byte-for-byte", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  s.setCipher(fakeCipher);
  await s.append("curtis", msg("old", new Date(Date.now() - 40 * DAY).toISOString(), "old secret"));
  await s.append("curtis", msg("new", new Date(Date.now() - 1 * DAY).toISOString(), "new secret"));
  const rawBefore = await a.read("root/curtis/inbox.md");

  // the session locks: key gone, sealed mail reads as locked ciphertext
  s.setCipher(null);
  const locked = await s.readInbox("curtis");
  assert.equal(locked.length, 2);
  assert.ok(locked.every((m) => m.encLocked === true));
  assert.ok(!locked.some((m) => m.body.includes("secret")));

  // a GC pass while locked rewrites the file — ciphertext must survive intact
  await s.gc("curtis", 30 * DAY);
  const rawAfter = await a.read("root/curtis/inbox.md");
  assert.ok(!rawAfter.includes("terces dlo"), "the aged-out sealed block is dropped");
  assert.ok(rawAfter.includes("terces wen"), "kept block intact");

  // unlocking again still opens what survived
  s.setCipher(fakeCipher);
  const kept = await s.readInbox("curtis");
  assert.deepEqual(kept.map((m) => m.id), ["new"]);
  assert.equal(kept[0]?.body, "new secret");
});

test("pre-sealed copies (retransmission memory) append as-is without any key", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  s.setCipher(fakeCipher);
  const sealed = await s.append("curtis", msg("m1", "2026-10-10T00:00:00.000Z", "secret"));
  assert.ok(sealed);
  s.setCipher(null);
  // retransmit the stored ciphertext copy: written unchanged, still openable later
  const out = await s.append("curtis", {
    ...msg("m1", "2026-10-10T00:00:00.000Z", sealed.ct),
    enc: { v: 1, iv: sealed.iv },
  });
  assert.equal(out?.ct, sealed.ct);
  s.setCipher(fakeCipher);
  const read = await s.readInbox("curtis");
  assert.equal(read.length, 2, "duplicate block stays (GC collapses it)");
  assert.ok(read.every((m) => m.body === "secret"));
});

test("a present-but-wrong key keeps bodies locked and ciphertext intact", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  s.setCipher(fakeCipher);
  const rawBefore = await (async () => {
    await s.append("curtis", msg("m1", "2026-10-10T00:00:00.000Z", "under key A"));
    return a.read("root/curtis/inbox.md");
  })();
  // a different (or restored-wrong) vault key: every open must fail
  s.setCipher({
    async seal(body) {
      return { iv: "other", ct: body };
    },
    async open() {
      throw new Error("auth failed");
    },
  });
  const read = await s.readInbox("curtis");
  assert.equal(read.length, 1);
  assert.equal(read[0]?.encLocked, true, "a failed open leaves the seal marker");
  assert.ok(!read[0]!.body.includes("under key A"), "ciphertext is not mangled into plaintext");
  // the file on disk is untouched — the right key can still come back
  assert.equal(await a.read("root/curtis/inbox.md"), rawBefore);
});

// -- SPEC §16 burn ---------------------------------------------------------------

test("readInbox hides burn-expired mail", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  const past = new Date(Date.now() - 60_000).toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();
  await s.append("curtis", { ...msg("gone", "2026-10-10T00:00:00.000Z", "burned"), exp: past });
  await s.append("curtis", { ...msg("live", "2026-10-10T00:01:00.000Z", "alive"), exp: future });
  const out = await s.readInbox("curtis");
  assert.deepEqual(out.map((m) => m.id), ["live"]);
  // the block is still on disk until a sweep claims it
  assert.ok((await a.read("root/curtis/inbox.md")).includes("burned"));
});

test("sweepBurned drops burned blocks and keeps the rest", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.append("curtis", msg("keep", new Date().toISOString(), "stays"));
  await s.append("curtis", { ...msg("burn", new Date().toISOString(), "burned"), exp: new Date(Date.now() - 1000).toISOString() });
  const dropped = await s.sweepBurned("curtis", (m) => m.id === "burn");
  assert.equal(dropped, 1);
  assert.deepEqual((await s.readInbox("curtis")).map((m) => m.id), ["keep"]);
  assert.ok((await a.read("root/curtis/inbox.md")).includes("stays"));
});

test("sweepBurned on a file with no burn fields skips the read", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.append("curtis", msg("m1", new Date().toISOString()));
  await s.sweepBurned("curtis", () => true); // records the no-burn-fields fingerprint
  const reads = a.reads;
  await s.sweepBurned("curtis", () => true);
  assert.equal(a.reads, reads, "nothing time-sensitive aboard — no reparse");
});

test("locked session: the burn sweep drops burned ciphertext, keeps the rest byte-for-byte", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  s.setCipher(fakeCipher);
  await s.append("curtis", {
    ...msg("gone", new Date(Date.now() - 60_000).toISOString(), "burned secret"),
    exp: new Date(Date.now() - 1000).toISOString(),
  });
  await s.append("curtis", msg("keep", new Date().toISOString(), "kept secret"));

  // the session locks mid-conversation: no key, sealed bodies stay ciphertext
  s.setCipher(null);
  const rawBefore = await a.read("root/curtis/inbox.md");
  assert.ok(rawBefore.includes("terces denrub") && rawBefore.includes("terces tpek"));

  // SPEC §16 rule 2 — the sweep runs without the key: the burned block's
  // ciphertext dies with its envelope, the kept block is re-encoded from the
  // parsed header + ciphertext, never from a plaintext nobody has
  const dropped = await s.sweepBurned("curtis", (m) => m.id === "gone");
  assert.equal(dropped, 1);
  const rawAfter = await a.read("root/curtis/inbox.md");
  assert.ok(!rawAfter.includes("terces denrub"), "burned ciphertext is gone");
  const blockOf = (raw: string, needle: string): string =>
    raw.split(/(?=<!-- messenger:)/).find((b) => b.includes(needle)) ?? "";
  assert.equal(
    blockOf(rawAfter, "terces tpek"),
    blockOf(rawBefore, "terces tpek"),
    "kept sealed block survives byte-for-byte"
  );

  // unlocking afterwards still opens what survived — nothing was corrupted
  s.setCipher(fakeCipher);
  const kept = await s.readInbox("curtis");
  assert.deepEqual(kept.map((m) => m.id), ["keep"]);
  assert.equal(kept[0]?.body, "kept secret");
});

test("rewriteAll seals everything, then unseals everything", async () => {
  const a = new FakeAdapter();
  const s = store(a);
  await s.append("curtis", msg("m1", new Date().toISOString(), "plain one"));
  await s.append("curtis", msg("m2", new Date().toISOString(), "plain two"));
  await s.appendOutbox("owner", msg("m1", new Date().toISOString(), "plain one"));

  s.setCipher(fakeCipher);
  const sealed = await s.rewriteAll(true);
  assert.equal(sealed.messages, 3, "two inbox blocks plus the outbox copy");
  assert.ok(!(await a.read("root/curtis/inbox.md")).includes("plain one"));

  const opened = await s.rewriteAll(false);
  assert.equal(opened.messages, 3);
  const raw = await a.read("root/curtis/inbox.md");
  assert.ok(raw.includes("plain one") && raw.includes("plain two"));
});
