/**
 * The social gate (src/contacts.ts, SPEC §17): the contacts.md store, the
 * inbound classifier, and import suggestions.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { DataAdapter } from "obsidian";
import { ContactsStore } from "../../src/contacts";
import { classifyInbound, parseContacts, suggestAddress } from "../../src/contacts";
import { FakeAdapter } from "./fake-adapter";

const ME = "owner";
const SYSTEM = "message-bus";

const store = (): { s: ContactsStore; adapter: FakeAdapter } => {
  const adapter = new FakeAdapter();
  return { s: new ContactsStore(adapter as unknown as DataAdapter, "root"), adapter };
};

// -- the store ------------------------------------------------------------------

test("upsert renders a table that parses back; pipes escape; junk rows drop", async () => {
  const { s, adapter } = store();
  await s.upsert({ address: "curtis", name: "Curtis | the one", state: "mutual", updated: "T1" });
  await s.upsert({ address: "ada", name: "Ada", state: "pending", updated: "T2" });
  const text = await adapter.read("root/contacts.md");
  assert.match(text, /# Messenger contacts/);
  assert.match(text, /not authentication/);
  const back = parseContacts(text);
  assert.deepEqual(back, [
    { address: "ada", name: "Ada", state: "pending", updated: "T2" },
    { address: "curtis", name: "Curtis | the one", state: "mutual", updated: "T1" },
  ]);
  // hand edits: junk and fragment rows drop, never throw
  assert.deepEqual(parseContacts("no table at all\n| oops |\n| --- | --- | --- | --- |"), []);
});

test("upsert rewrites (never appends) and replaces its own row", async () => {
  const { s, adapter } = store();
  await s.upsert({ address: "curtis", name: "Curtis", state: "pending", updated: "T1" });
  await s.upsert({ address: "curtis", name: "Curtis", state: "mutual", updated: "T2" });
  await s.upsert({ address: "ada", name: "Ada", state: "pending", updated: "T3" });
  const text = await adapter.read("root/contacts.md");
  assert.equal(text.split("| curtis |").length - 1, 1, "one curtis row");
  assert.deepEqual((await s.list()).map((e) => e.address), ["ada", "curtis"]);
  assert.deepEqual(await s.get("curtis"), {
    address: "curtis",
    name: "Curtis",
    state: "mutual",
    updated: "T2",
  });
});

test("setState and remove move a contact through its states", async () => {
  const { s } = store();
  await s.upsert({ address: "zoe", name: "Zoe", state: "request", updated: "T1" });
  await s.setState("zoe", "mutual");
  assert.equal((await s.get("zoe"))?.state, "mutual");
  await s.setState("zoe", "mutual"); // idempotent
  assert.equal((await s.get("zoe"))?.state, "mutual");
  await s.setState("ghost", "mutual"); // unknown address: no-op
  assert.equal(await s.get("ghost"), null);
  await s.remove("zoe");
  assert.equal(await s.get("zoe"), null);
  await s.remove("zoe"); // removing again is fine
});

test("seed marks every existing conversation mutual, exactly once", async () => {
  const { s } = store();
  assert.equal(await s.seed(["curtis", "ada", "not a slug!"]), true);
  const entries = await s.list();
  assert.deepEqual(entries.map((e) => e.address), ["ada", "curtis"]);
  assert.ok(entries.every((e) => e.state === "mutual"));
  // once the file exists, later seeding changes nothing — new strangers
  // must not be grandfathered into mutual
  await s.upsert({ address: "zoe", name: "zoe", state: "request", updated: "T1" });
  assert.equal(await s.seed(["latecomer"]), false);
  assert.equal((await s.get("latecomer")) ?? null, null);
  assert.equal((await s.get("zoe"))?.state, "request");
});

test("setRoot moves to a fresh contacts file (storage-mode switch)", async () => {
  const adapter = new FakeAdapter();
  const s = new ContactsStore(adapter as unknown as DataAdapter, "root");
  await s.upsert({ address: "curtis", name: "Curtis", state: "mutual", updated: "T1" });
  s.setRoot("elsewhere");
  assert.deepEqual(await s.list(), []);
  await s.upsert({ address: "ada", name: "Ada", state: "pending", updated: "T2" });
  // a second store over the same files sees the new root's row only
  const back = new ContactsStore(adapter as unknown as DataAdapter, "elsewhere");
  assert.deepEqual((await back.list()).map((e) => e.address), ["ada"]);
});

// -- the classifier and gates -----------------------------------------------------

test("classifyInbound: every branch of the social state", async () => {
  const { s } = store();
  const m = await s.map();
  assert.equal(classifyInbound(ME, m, ME, SYSTEM), "self");
  assert.equal(classifyInbound(SYSTEM, m, ME, SYSTEM), "system");
  assert.equal(classifyInbound("curtis", m, ME, SYSTEM), "request", "total stranger");

  await s.upsert({ address: "curtis", name: "curtis", state: "request", updated: "T1" });
  assert.equal(classifyInbound("curtis", await s.map(), ME, SYSTEM), "request");

  await s.setState("curtis", "mutual");
  assert.equal(classifyInbound("curtis", await s.map(), ME, SYSTEM), "contact");

  await s.upsert({ address: "ada", name: "Ada", state: "pending", updated: "T2" });
  assert.equal(classifyInbound("ada", await s.map(), ME, SYSTEM), "upgrade");

  await s.upsert({ address: "eve", name: "eve", state: "blocked", updated: "T3" });
  assert.equal(classifyInbound("eve", await s.map(), ME, SYSTEM), "blocked");
});

test("the handshake: stranger files a request; a pending contact's reply upgrades", async () => {
  const { s } = store();
  // inbound half of main.ts's applyContactGate, exercised on the store
  const classify = async (from: string) =>
    classifyInbound(from, await s.map(), ME, SYSTEM);
  // stranger writes me → filed as a request
  assert.equal(await classify("curtis"), "request");
  await s.upsert({ address: "curtis", name: "Curtis", state: "request", updated: "T1" });
  // outbound half of applyContactSendGate: I answer → the request is accepted
  await s.setState("curtis", "mutual");
  assert.equal(await classify("curtis"), "contact");
  // I invite someone first; their reply upgrades the invitation
  await s.upsert({ address: "ada", name: "Ada", state: "pending", updated: "T2" });
  assert.equal(await classify("ada"), "upgrade");
  await s.setState("ada", "mutual");
  assert.equal(await classify("ada"), "contact");
});

// -- import suggestions -------------------------------------------------------------

test("suggestAddress: email local part, phone digits, then the name", () => {
  assert.equal(suggestAddress({ name: "Ada Lovelace", email: "ada@calc.org", tel: "" }, []), "ada");
  assert.equal(suggestAddress({ name: "Grace Hopper", email: "", tel: "+1 (202) 555-0100" }, []), "12025550100");
  assert.equal(suggestAddress({ name: "Kurt Gödel", email: "", tel: "" }, []), "kurt-godel");
  assert.equal(suggestAddress({ name: "", email: "", tel: "" }, []), "");
});

test("suggestAddress: sanitizes to the §2 slug shape and de-duplicates", () => {
  assert.equal(suggestAddress({ email: "Ada.Lovelace@EXAMPLE.com" }, []), "ada.lovelace");
  assert.equal(suggestAddress({ email: "-weird-_name-@" }, []), "weird-_name");
  assert.equal(
    suggestAddress({ email: "x".repeat(100) + "@a.co" }, []),
    "x".repeat(64),
    "capped at 64"
  );
  assert.equal(suggestAddress({ email: "ada@" }, ["ada", "ada-2"]), "ada-3");
  assert.equal(suggestAddress({ name: "ada" }, ["ada"]), "ada-2");
  // a taken base gets a suffix; the next source is only reached when the
  // whole suffix range is somehow exhausted
  assert.equal(suggestAddress({ name: "zoe", email: "ada@" }, ["ada"]), "ada-2");
});

test("suggestAddress: never suggests a reserved name — the next source wins", () => {
  // support@… is reserved; the phone digits become the suggestion instead
  assert.equal(
    suggestAddress({ name: "Pay Desk", email: "support@bank.example", tel: "+1 555 010 2222" }, []),
    "15550102222"
  );
  // every source reserved → nothing offered; the review row starts empty
  assert.equal(suggestAddress({ email: "admin@", name: "Police" }, []), "");
});
