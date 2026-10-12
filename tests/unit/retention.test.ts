/**
 * Per-address retention (roadmap "multi-window/mobile polish, per-address
 * retention"): settings records, the bus's gcPolicySource resolution, and
 * the SPEC §7 GC invariant that mail a live receiver could still reach is
 * never age-dropped.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { DataAdapter } from "obsidian";
import { MailBus } from "../../src/bus";
import { MailboxStore } from "../../src/mailbox/store";
import { sanitizeSettings } from "../../src/settings";
import { FakeAdapter } from "./fake-adapter";

const DAY = 86400000;

// -- settings model --------------------------------------------------------------

test("per-peer retention records sanitize like their globals", () => {
  const s = sanitizeSettings({
    retentionDaysByPeer: { curtis: 7, "noisy-bot": 0, "../evil": 5, bob: "banana", late: 9999 },
    maxInboxMessagesByPeer: { curtis: 200, archive: 0, "../evil": 10, bob: -3 },
  });
  assert.deepEqual(s.retentionDaysByPeer, { curtis: 7, "noisy-bot": 0, late: 3650 });
  // numbers clamp like the globals do (negative → 0 = "uncapped"); junk
  // string values drop the entry entirely — no silent fallback
  assert.deepEqual(s.maxInboxMessagesByPeer, { curtis: 200, archive: 0, bob: 0 });
  // defaults are empty records — no overrides anywhere
  const fresh = sanitizeSettings(undefined);
  assert.deepEqual(fresh.retentionDaysByPeer, {});
  assert.deepEqual(fresh.maxInboxMessagesByPeer, {});
});

// -- GC policy resolution through the bus ----------------------------------------

const seed = async (adapter: FakeAdapter, address: string, count: number): Promise<string[]> => {
  const store = new MailboxStore(adapter as unknown as DataAdapter, "root");
  const ids: string[] = [];
  const base = Date.now() - (count + 1) * DAY;
  for (let i = 1; i <= count; i++) {
    const id = `m${i}`;
    ids.push(id);
    await store.append(address, {
      id,
      from: address === "owner" ? "curtis" : "owner",
      to: address,
      ts: new Date(base + i * 60000).toISOString(),
      replyTo: null,
      body: id,
    });
  }
  return ids;
};

test("bus.gc honors per-address retention overrides from gcPolicySource", async () => {
  const adapter = new FakeAdapter();
  await seed(adapter, "curtis", 4); // all ~4-5 days old
  await seed(adapter, "noisy-bot", 4);
  const bus = new MailBus(new MailboxStore(adapter as unknown as DataAdapter, "root"));
  bus.gcPolicySource = (address) => {
    if (address === "noisy-bot") return { maxAgeMs: 1 * DAY, maxMessages: 0 };
    if (address === "curtis") return { maxAgeMs: 0, maxMessages: 0 }; // keep forever
    return null;
  };

  const dropped = await bus.gc(30 * DAY, 0); // global: keep everything
  assert.ok(dropped >= 4, "the bot's mail aged out under its tighter override");
  const store = new MailboxStore(adapter as unknown as DataAdapter, "root");
  assert.deepEqual((await store.readInbox("noisy-bot")).map((m) => m.id), []);
  // curtis has no retention at all under the override — nothing dropped
  assert.equal((await store.readInbox("curtis")).length, 4);
});

test("bus.gc honors a per-address size cap the global doesn't have", async () => {
  const adapter = new FakeAdapter();
  await seed(adapter, "curtis", 5);
  const bus = new MailBus(new MailboxStore(adapter as unknown as DataAdapter, "root"));
  bus.gcPolicySource = (address) =>
    address === "curtis" ? { maxAgeMs: 0, maxMessages: 2 } : null;

  const dropped = await bus.gc(0, 1000); // global cap never bites
  assert.equal(dropped, 3);
  const store = new MailboxStore(adapter as unknown as DataAdapter, "root");
  assert.deepEqual((await store.readInbox("curtis")).map((m) => m.id), ["m4", "m5"]);
});

// -- SPEC §7: GC must not strand a live receiver ----------------------------------

test("store.gc never age-drops mail newer than a live cursor's ts", async () => {
  const adapter = new FakeAdapter();
  const store = new MailboxStore(adapter as unknown as DataAdapter, "root");
  const now = Date.now();
  const stamp = (minAgo: number): string =>
    new Date(now - minAgo * DAY).toISOString();
  await store.append("curtis", { id: "m1", from: "curtis", to: "owner", ts: stamp(41), replyTo: null, body: "1" });
  const m2 = stamp(40);
  await store.append("curtis", { id: "m2", from: "curtis", to: "owner", ts: m2, replyTo: null, body: "2" });
  await store.append("curtis", { id: "m3", from: "curtis", to: "owner", ts: stamp(39), replyTo: null, body: "3" });
  await store.append("curtis", { id: "m4", from: "curtis", to: "owner", ts: stamp(38), replyTo: null, body: "4" });

  // receiver processed m2 40 days ago and never polled again; everything is
  // past the 30-day retention. Without the cursor, all four would drop.
  await store.gc("curtis", 30 * DAY, 0, { id: "m2", ts: m2 });
  assert.deepEqual(
    (await store.readInbox("curtis")).map((m) => m.id),
    ["m3", "m4"],
    "mail strictly newer than the cursor ts survives the age drop"
  );

  // the size cap still applies regardless of age (§7 grants it that power)
  await store.gc("curtis", 0, 1, { id: "m2", ts: m2 });
  assert.deepEqual((await store.readInbox("curtis")).map((m) => m.id), ["m4"]);
});

test("store.gc with a GC'd cursor id still protects by ts (the fallback case)", async () => {
  const adapter = new FakeAdapter();
  const store = new MailboxStore(adapter as unknown as DataAdapter, "root");
  const now = Date.now();
  const stamp = (daysAgo: number): string => new Date(now - daysAgo * DAY).toISOString();
  await store.append("curtis", { id: "m1", from: "a", to: "curtis", ts: stamp(40), replyTo: null, body: "1" });
  await store.append("curtis", { id: "m2", from: "a", to: "curtis", ts: stamp(39), replyTo: null, body: "2" });

  // cursor points at a block a previous GC already removed; the receiver
  // falls back to ts (§4) and would dispatch everything strictly newer
  await store.gc("curtis", 30 * DAY, 0, { id: "gone", ts: stamp(41) });
  assert.deepEqual(
    (await store.readInbox("curtis")).map((m) => m.id),
    ["m1", "m2"],
    "a ts-fallback receiver must not lose mail to a later GC"
  );
});

test("store.gc without a cursor keeps the plain age behavior", async () => {
  const adapter = new FakeAdapter();
  const store = new MailboxStore(adapter as unknown as DataAdapter, "root");
  const now = Date.now();
  await store.append("curtis", { id: "old", from: "a", to: "curtis", ts: new Date(now - 40 * DAY).toISOString(), replyTo: null, body: "x" });
  await store.append("curtis", { id: "new", from: "a", to: "curtis", ts: new Date(now - DAY).toISOString(), replyTo: null, body: "y" });
  const dropped = await store.gc("curtis", 30 * DAY); // no cursor arg
  assert.equal(dropped, 1);
  assert.deepEqual((await store.readInbox("curtis")).map((m) => m.id), ["new"]);
});

test("bus.gc feeds each inbox's own cursor to the store", async () => {
  const adapter = new FakeAdapter();
  const store = new MailboxStore(adapter as unknown as DataAdapter, "root");
  const bus = new MailBus(store);
  const now = Date.now();
  const t2 = new Date(now - 40 * DAY).toISOString();
  await store.append("curtis", { id: "m1", from: "a", to: "curtis", ts: new Date(now - 41 * DAY).toISOString(), replyTo: null, body: "1" });
  await store.append("curtis", { id: "m2", from: "a", to: "curtis", ts: t2, replyTo: null, body: "2" });
  await store.append("curtis", { id: "m3", from: "a", to: "curtis", ts: new Date(now - 39 * DAY).toISOString(), replyTo: null, body: "3" });
  bus.setCursors({ curtis: { id: "m2", ts: t2 } });

  await bus.gc(30 * DAY, 0);
  assert.deepEqual(
    (await store.readInbox("curtis")).map((m) => m.id),
    ["m3"],
    "m1 (before the cursor) drops; m3 (newer than the cursor ts) stays"
  );
});
