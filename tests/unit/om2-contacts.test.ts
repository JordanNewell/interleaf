import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { FakeAdapter } from "./fake-adapter";
import { ContactsStore, parseContacts } from "../../src/contacts";
import { MailboxStore } from "../../src/mailbox/store";
import { contactsBook } from "../../src/om2/adapters";
import { fingerprint, generateIdentity } from "../../src/om2/crypto/keys";

/** A fresh in-memory vault: one adapter backing both the mailbox and contacts. */
function mkBook() {
  const adapter = new FakeAdapter();
  const store = new MailboxStore(adapter, "root");
  const contacts = new ContactsStore(adapter, "root");
  return { adapter, store, contacts, book: contactsBook(contacts, store) };
}

describe("om2 contacts adapter", () => {
  test("pin creates a mutual row carrying the OM-2 pin", async () => {
    const { contacts, book } = mkBook();
    const id = generateIdentity();
    const fp = fingerprint(id.publicKey);
    const pinned = await book.pin({
      publicKey: id.publicKey,
      handle: "@alice@x.io",
      relays: ["http://relay-a.example"],
    });
    assert.equal(pinned.fp, fp);
    assert.equal(pinned.alias, "alice.x-io");
    assert.deepEqual(pinned.relays, ["http://relay-a.example"]);
    const row = await contacts.get("alice.x-io");
    assert.ok(row);
    assert.equal(row.state, "mutual");
    assert.equal(row.fp, fp);
    assert.equal(row.publicKey !== "", true);
  });

  test("re-pin merges relays, keeps the name, upgrades request → mutual", async () => {
    const { contacts, book } = mkBook();
    const id = generateIdentity();
    await contacts.upsert({
      address: "alice.x-io",
      name: "Alice",
      state: "request",
      updated: new Date().toISOString(),
      fp: fingerprint(id.publicKey),
      publicKey: "stale-enc",
      relays: ["http://old.example"],
    });
    const pinned = await book.pin({
      publicKey: id.publicKey,
      relays: ["http://new.example"],
    });
    assert.deepEqual(pinned.relays.sort(), ["http://new.example", "http://old.example"].sort());
    const row = await contacts.get("alice.x-io");
    assert.equal(row?.state, "mutual");
    assert.equal(row?.name, "Alice"); // a real name is never overwritten by a handle
  });

  test("alias collision gets a pubkey-hash suffix; a different key never steals an alias", async () => {
    const { book } = mkBook();
    const a = generateIdentity();
    const b = generateIdentity();
    // both map to the handle-form alias "bob.x-io"
    const first = await book.pin({ publicKey: a.publicKey, handle: "@bob@x.io", relays: [] });
    const second = await book.pin({ publicKey: b.publicKey, handle: "@bob@x.io", relays: [] });
    assert.notEqual(first.alias, second.alias);
  });

  test("reserved aliases fall back to the fp-suffix form", async () => {
    const { book } = mkBook();
    const id = generateIdentity();
    // "@support@x.io" sanitizes to "support.x-io" — the reserved wall rejects it
    const pinned = await book.pin({ publicKey: id.publicKey, handle: "@support@x.io", relays: [] });
    assert.notEqual(pinned.alias, "support.x-io");
    assert.match(pinned.alias, /support\.x-io-[0-9a-f]{6}|^fp-[0-9a-f]{6}$/);
  });

  test("contacts.md round-trips the OM-2 columns; old 4-column tables still parse", async () => {
    const { contacts, adapter } = mkBook();
    const id = generateIdentity();
    await contacts.upsert({
      address: "fp-abc",
      name: "Remote",
      state: "mutual",
      updated: "2026-10-12T00:00:00.000Z",
      fp: fingerprint(id.publicKey),
      publicKey: "pk-123",
      relays: ["http://r1.example", "http://r2.example"],
    });
    await contacts.upsert({
      address: "local",
      name: "local",
      state: "mutual",
      updated: "2026-10-12T00:00:00.000Z",
    });
    const raw = adapter.files.get("root/contacts.md") ?? "";
    const rows = raw.split("\n").filter((l) => l.startsWith("| fp-"));
    assert.match(rows[0] ?? "", /fp-abc/);
    assert.match(rows[0] ?? "", /http:\/\/r1\.example http:\/\/r2\.example/);

    // a hand-rolled OLD table (pre-OM-2 plugin) parses with no pin fields
    const oldRows = parseContacts(
      ["| address | name | state | updated |", "| --- | --- | --- | --- |", "| bob | Bob | mutual | 2026-01-01T00:00:00.000Z |"].join("\n")
    );
    assert.equal(oldRows.length, 1);
    assert.equal(oldRows[0]?.fp, undefined);
    assert.equal(oldRows[0]?.relays, undefined);
  });
});
