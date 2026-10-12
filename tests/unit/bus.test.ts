import { test } from "node:test";
import assert from "node:assert/strict";
import { MailBus, MessengerError } from "../../src/bus";
import { MailboxStore } from "../../src/mailbox/store";
import type { MailEnvelope } from "../../src/mailbox/envelope";
import type { DataAdapter } from "obsidian";
import { FakeAdapter } from "./fake-adapter";

test("send fires the onSend hook with the envelope that landed", async () => {
  const a = new FakeAdapter();
  const sent: MailEnvelope[] = [];
  const bus = new MailBus(new MailboxStore(a as unknown as DataAdapter, "root"), {
    onSend: (m) => sent.push(m),
  });
  const message = await bus.send("curtis", "owner", "knock knock");
  assert.deepEqual(sent.map((m) => m.id), [message.id]);
  assert.equal(sent[0]?.to, "owner");
});

test("a failing onSend hook never fails the send", async () => {
  const a = new FakeAdapter();
  const errors: unknown[] = [];
  const bus = new MailBus(new MailboxStore(a as unknown as DataAdapter, "root"), {
    onSend: () => {
      throw new Error("hook blew up");
    },
    onError: (err) => errors.push(err),
  });
  const message = await bus.send("curtis", "owner", "hello");
  assert.ok(message.id);
  assert.equal(errors.length, 1);
  // the append happened before the hook — mail is on the bus
  const inbox = await a.read("root/owner/inbox.md");
  assert.ok(inbox.includes("hello"));
});

test("send rejects the §3 rule-2 violation: a body carrying the closing marker", async () => {
  const a = new FakeAdapter();
  const bus = new MailBus(new MailboxStore(a as unknown as DataAdapter, "root"));
  await assert.rejects(
    () => bus.send("curtis", "owner", `fine<!-- /messenger -->injected`),
    (err: MessengerError) => err.code === "invalid_body" && err instanceof Error
  );
  // nothing half-written lands in the inbox
  assert.equal(await a.exists("root/owner/inbox.md"), false);
});

test("send failures carry typed codes (agent-consumable)", async () => {
  const a = new FakeAdapter();
  const bus = new MailBus(new MailboxStore(a as unknown as DataAdapter, "root"));
  await assert.rejects(
    () => bus.send("not a slug!", "owner", "x"),
    (err: MessengerError) => err.code === "invalid_address"
  );
  await assert.rejects(
    () => bus.send("curtis", "bad addr", "x"),
    (err: MessengerError) => err.code === "invalid_address"
  );
  await assert.rejects(
    () => bus.send("curtis", "owner", "\t \n"),
    (err: MessengerError) => err.code === "invalid_body"
  );
  await assert.rejects(
    () => bus.send("curtis", "owner", "x", { replyTo: "--> <!-- messenger: {" }),
    (err: MessengerError) => err.code === "invalid_reply_to"
  );
});

test("an outbox failure never fails a delivered send (§13 is a convenience copy)", async () => {
  // an adapter that breaks on every write to an outbox file
  class OutboxHater extends FakeAdapter {
    async write(path: string, data: string): Promise<void> {
      if (path.endsWith("outbox.md")) throw new Error("disk full");
      return super.write(path, data);
    }
    async append(path: string, data: string): Promise<void> {
      if (path.endsWith("outbox.md")) throw new Error("disk full");
      return super.append(path, data);
    }
  }
  const a = new OutboxHater();
  const errors: Array<[unknown, string]> = [];
  const bus = new MailBus(new MailboxStore(a as unknown as DataAdapter, "root"), {
    onError: (err, address) => errors.push([err, address]),
  });
  bus.keepOutbox = true;
  const message = await bus.send("curtis", "owner", "delivered regardless");
  assert.ok(message.id.startsWith("msg_"), "the send resolved");
  assert.ok((await a.read("root/owner/inbox.md")).includes("delivered regardless"));
  assert.equal(errors.length, 1, "the outbox failure is reported, not thrown");
  assert.equal(errors[0]?.[1], "curtis");
});

// -- SPEC §15/§16: sealing and burning -------------------------------------------

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

test("send with a key seals the body and hands the sealed copy to onSend", async () => {
  const a = new FakeAdapter();
  const store = new MailboxStore(a as unknown as DataAdapter, "root");
  store.setCipher(fakeCipher);
  const sent: MailEnvelope[] = [];
  const bus = new MailBus(store, { onSend: (m) => sent.push(m) });

  const message = await bus.send("curtis", "owner", "plain words");
  assert.equal(message.enc?.v, 1);
  assert.equal(message.body, "sea:sdrow nialp:sea", "returned copy is ciphertext");
  assert.equal(sent[0]?.body, "sea:sdrow nialp:sea", "hook copy is ciphertext too");
  assert.ok(!(await a.read("root/owner/inbox.md")).includes("plain words"));

  // reading back through the bus opens it again
  const read = await bus.loadConversation("owner", "curtis");
  assert.equal(read[read.length - 1]?.body, "plain words");
  assert.equal(read[read.length - 1]?.enc, undefined);
});

test("burn options stamp exp/bar on the envelope", async () => {
  const a = new FakeAdapter();
  const bus = new MailBus(new MailboxStore(a as unknown as DataAdapter, "root"));
  const before = Date.now();
  const burn = await bus.send("curtis", "owner", "vanishing", {
    burnAfterMs: 3_600_000,
    burnOnReadSec: 60,
  });
  assert.equal(burn.bar, 60);
  const expAt = Date.parse(burn.exp ?? "");
  assert.ok(expAt >= before + 3_600_000 && expAt <= Date.now() + 3_600_000);

  const plain = await bus.send("curtis", "owner", "stays");
  assert.equal(plain.exp, undefined);
  assert.equal(plain.bar, undefined);
});

test("loadConversation drops burn-after-read mail once displayed", async () => {
  const a = new FakeAdapter();
  const bus = new MailBus(new MailboxStore(a as unknown as DataAdapter, "root"));
  let readAt: Record<string, string> = {};
  bus.readAtSource = () => readAt;

  await bus.send("curtis", "owner", "read me then burn", { burnOnReadSec: 1 });
  assert.equal((await bus.loadConversation("owner", "curtis")).length, 1);

  // displayed 10 s ago, window 1 s → gone from the view
  readAt = { curtis: new Date(Date.now() - 10_000).toISOString() };
  assert.equal((await bus.loadConversation("owner", "curtis")).length, 0);
});

test("burnSweep prunes burned blocks from disk (exp and bar paths)", async () => {
  const a = new FakeAdapter();
  const store = new MailboxStore(a as unknown as DataAdapter, "root");
  const bus = new MailBus(store);
  bus.keepOutbox = true;

  await bus.send("curtis", "owner", "gone soon", { burnAfterMs: 1 });
  await bus.send("curtis", "owner", "burn on read", { burnOnReadSec: 1 });
  await bus.send("curtis", "owner", "keeper");
  await new Promise((r) => setTimeout(r, 5)); // let the 1 ms deadline pass

  // displayed 10 s ago burns the bar message (conversation {owner, curtis})
  const readAt = { curtis: new Date(Date.now() - 10_000).toISOString() };
  // both copies burn: the delivered block and the sender's outbox copy
  const dropped = await bus.burnSweep("owner", readAt);
  assert.equal(dropped, 4);
  const kept = await bus.loadConversation("owner", "curtis");
  assert.deepEqual(kept.map((m) => m.body), ["keeper"]);
  // the outbox copies burned with them
  const raw = await a.read("root/curtis/outbox.md");
  assert.ok(raw.includes("keeper"));
  assert.ok(!raw.includes("gone soon") && !raw.includes("burn on read"));
});

test("burnSweep while the vault is locked: sealed burned mail dies, sealed keepers survive (§16.2)", async () => {
  const a = new FakeAdapter();
  const store = new MailboxStore(a as unknown as DataAdapter, "root");
  store.setCipher(fakeCipher);
  const bus = new MailBus(store);
  bus.keepOutbox = true;

  await bus.send("curtis", "owner", "sealed and expiring", { burnAfterMs: 1 });
  await bus.send("curtis", "owner", "sealed burns on read", { burnOnReadSec: 1 });
  await bus.send("curtis", "owner", "sealed keeper", { burnOnReadSec: 3_600 });
  await new Promise((r) => setTimeout(r, 5)); // let the 1 ms deadline pass
  const ct = async (body: string): Promise<string> => (await fakeCipher.seal(body)).ct;

  // the session locks: the vault key is gone and every body on disk is sealed
  store.setCipher(null);
  // displayed 10 s ago: the 1 s bar window has closed, the 1 h one has not
  const readAt = { curtis: new Date(Date.now() - 10_000).toISOString() };
  const dropped = await bus.burnSweep("owner", readAt);
  // both burned messages went from inbox AND outbox; the keeper stayed twice
  assert.equal(dropped, 4);

  const raw = await a.read("root/owner/inbox.md");
  assert.ok(!raw.includes(await ct("sealed and expiring")), "exp ciphertext dropped");
  assert.ok(!raw.includes(await ct("sealed burns on read")), "bar ciphertext dropped");
  assert.ok(raw.includes(await ct("sealed keeper")), "unburned ciphertext untouched");
  assert.ok(!raw.includes("sealed keeper"), "the sweep never decrypted anything");

  // unlocking afterwards opens exactly the survivor — nothing was corrupted
  store.setCipher(fakeCipher);
  const kept = await bus.loadConversation("owner", "curtis");
  assert.deepEqual(kept.map((m) => m.body), ["sealed keeper"]);
  assert.equal(kept[0]?.enc, undefined);
});
