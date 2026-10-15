/**
 * OM-2 mail at the social gate (src/contacts.ts, SPEC §17 + §12): cross-vault
 * blocks carry an `om2` field — they already passed the bridge's signature
 * check and the user's first-contact acceptance there — so classifyInbound's
 * `verified` flag must land them mutual instead of back under Contact
 * requests. Blocks still win; without `om2` the gate is exactly as before.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { DataAdapter } from "obsidian";
import { ContactsStore } from "../../src/contacts";
import { classifyInbound } from "../../src/contacts";
import type { ContactEntry } from "../../src/contacts";
import { FakeAdapter } from "./fake-adapter";

const ME = "owner";
const SYSTEM = "interleaf";

const store = (): { s: ContactsStore; adapter: FakeAdapter } => {
  const adapter = new FakeAdapter();
  return { s: new ContactsStore(adapter as unknown as DataAdapter, "root"), adapter };
};

test("verified mail never un-blocks: the block wins over the upstream edge", async () => {
  const { s } = store();
  await s.upsert({ address: "eve", name: "eve", state: "blocked", updated: "T1" });
  assert.equal(classifyInbound("eve", await s.map(), ME, SYSTEM, true), "blocked");
});

test("verified mail from a total stranger arrives pre-accepted — mutual, not a request", async () => {
  const { s } = store();
  assert.equal(classifyInbound("curtis", await s.map(), ME, SYSTEM, true), "upgrade");
  // the verified branch of applyContactGate: no row yet → mint one mutual
  await s.upsert({ address: "curtis", name: "Curtis", state: "mutual", updated: "T1" });
  assert.equal(classifyInbound("curtis", await s.map(), ME, SYSTEM, true), "contact");
});

test("verified mail promotes a waiting request instead of re-filing it", async () => {
  const { s } = store();
  await s.upsert({ address: "zoe", name: "Zoe", state: "request", updated: "T1" });
  assert.equal(classifyInbound("zoe", await s.map(), ME, SYSTEM, true), "upgrade");
  await s.setState("zoe", "mutual"); // the gate's promote branch
  assert.equal(classifyInbound("zoe", await s.map(), ME, SYSTEM, true), "contact");
});

test("a pending invitation's first §12 delivery upgrades as usual", async () => {
  const { s } = store();
  await s.upsert({ address: "ada", name: "Ada", state: "pending", updated: "T1" });
  assert.equal(classifyInbound("ada", await s.map(), ME, SYSTEM, true), "upgrade");
  await s.setState("ada", "mutual");
  assert.equal(classifyInbound("ada", await s.map(), ME, SYSTEM, true), "contact");
});

test("a mutual contact's verified mail is just contact — nothing to move", async () => {
  const { s } = store();
  await s.upsert({ address: "curtis", name: "Curtis", state: "mutual", updated: "T1" });
  assert.equal(classifyInbound("curtis", await s.map(), ME, SYSTEM, true), "contact");
});

test("self and bus mail never touch the gate, verified or not", () => {
  const m: Map<string, ContactEntry> = new Map();
  assert.equal(classifyInbound(ME, m, ME, SYSTEM, true), "self");
  assert.equal(classifyInbound(SYSTEM, m, ME, SYSTEM, true), "system");
});

test("without om2 nothing changes: strangers wait, pending upgrades", async () => {
  const { s } = store();
  assert.equal(classifyInbound("curtis", await s.map(), ME, SYSTEM), "request", "total stranger");
  assert.equal(classifyInbound("curtis", await s.map(), ME, SYSTEM, false), "request");
  await s.upsert({ address: "zoe", name: "Zoe", state: "request", updated: "T1" });
  assert.equal(classifyInbound("zoe", await s.map(), ME, SYSTEM, false), "request");
  await s.upsert({ address: "ada", name: "Ada", state: "pending", updated: "T2" });
  assert.equal(classifyInbound("ada", await s.map(), ME, SYSTEM, false), "upgrade");
});
