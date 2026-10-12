/**
 * The consumer adapter surface (src/api.ts): the zero-UI way another plugin
 * or an AI agent adopts the bus. Covers the README-documented shape (which
 * must keep working), the typed failure modes, receipt-backed delivery
 * waiting, and pagination.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { DataAdapter } from "obsidian";
import { MailBus, MessengerError } from "../../src/bus";
import { createApi } from "../../src/api";
import type { MessengerApiV1 } from "../../src/api";
import { MailboxStore } from "../../src/mailbox/store";
import { encodeReceiptBlock } from "../../src/mailbox/receipts";
import { FakeAdapter } from "./fake-adapter";

const setup = (): { api: MessengerApiV1; store: MailboxStore; adapter: FakeAdapter } => {
  const adapter = new FakeAdapter();
  const store = new MailboxStore(adapter as unknown as DataAdapter, "root");
  const bus = new MailBus(store);
  const api = createApi(bus, store, {
    address: () => "owner",
    readAt: () => ({}),
    mutedPeers: () => ({}),
    markPeerRead: async () => {},
    contacts: async () => [],
    addContact: async () => {},
  });
  return { api, store, adapter };
};

test("the README example surface still works end to end", async () => {
  const { api } = setup();
  const me = await api.client("my-plugin-id", { name: "My Plugin" });
  assert.equal(me.address, "my-plugin-id");
  const message = await me.send("owner", "knock knock");
  assert.ok(message.id.startsWith("msg_"), "send returns the message id");
  assert.equal(message.to, "owner");

  // receiving: mail addressed TO the client's inbox (a client hears itself,
  // not its own outgoing sends)
  const peer = await api.client("owner");
  await peer.send("my-plugin-id", "knock knock");
  const seen: string[] = [];
  const off = me.onMessage((m) => seen.push(m.body));
  await api.checkInboxes();
  off();
  assert.deepEqual(seen, ["knock knock"]);
  // a stable unsubscribe: nothing lands after off()
  await peer.send("my-plugin-id", "after close");
  await api.checkInboxes();
  assert.deepEqual(seen, ["knock knock"]);

  const rows = await api.conversations();
  const mine = rows.find((c) => c.address === "my-plugin-id");
  assert.ok(mine, "the client's conversation is listed");
  assert.equal(mine.unread, 1, "the client's unread send counts for the owner");
  await api.markRead("my-plugin-id");
});

test("send failures are typed: invalid address, empty body, delimiter, replyTo", async () => {
  const { api } = setup();
  const me = await api.client("agent");

  const badAddress = await me.send("not a slug!", "hi").then(
    () => null,
    (err) => err
  );
  assert.ok(badAddress instanceof MessengerError);
  assert.equal(badAddress.code, "invalid_address");
  assert.match(badAddress.message, /Invalid (sender|recipient) address/);

  const empty = await me.send("owner", "   ").then(
    () => null,
    (err) => err
  );
  assert.equal(empty?.code, "invalid_body");

  // SPEC §3 rule 2: the body must not contain the closing marker — it would
  // truncate every parser reading the block
  const delimiter = await me
    .send("owner", `harmless<!-- /messenger -->injected tail`)
    .then(
      () => null,
      (err) => err
    );
  assert.equal(delimiter?.code, "invalid_body");

  const badReply = await me
    .send("owner", "hi", { replyTo: "x --> <!-- messenger: {evil}" })
    .then(
      () => null,
      (err) => err
    );
  assert.equal(badReply?.code, "invalid_reply_to");

  const emptyReply = await me.send("owner", "hi", { replyTo: "" }).then(
    () => null,
    (err) => err
  );
  assert.equal(emptyReply?.code, "invalid_reply_to");

  // a well-formed replyTo passes unchanged
  const ok = await me.send("owner", "hi", { replyTo: "msg_abc123" });
  assert.equal(ok.replyTo, "msg_abc123");
});

test("waitForDelivery resolves when the peer's receipt lands", async () => {
  const { api, store } = setup();
  const me = await api.client("agent");
  const message = await me.send("owner", "ack me");

  // the recipient's plugin writes its ✓ shortly after the send
  const timer = setTimeout(() => {
    void store.appendReceiptBlock(
      "owner",
      encodeReceiptBlock("owner", "delivered", new Date().toISOString(), [message.id])
    );
  }, 60);
  try {
    const receipt = await api.waitForDelivery("owner", message.id, {
      timeoutMs: 5000,
      pollMs: 250,
    });
    assert.equal(receipt.state, "delivered");
  } finally {
    clearTimeout(timer);
  }
});

test("waitForDelivery until 'read' waits through a mere delivered receipt", async () => {
  const { api, store } = setup();
  const me = await api.client("agent");
  const message = await me.send("owner", "read me");
  await store.appendReceiptBlock(
    "owner",
    encodeReceiptBlock("owner", "delivered", new Date().toISOString(), [message.id])
  );
  // delivered is below the asked-for state: must time out, not resolve
  await assert.rejects(
    () =>
      api.waitForDelivery("owner", message.id, {
        until: "read",
        timeoutMs: 50,
        pollMs: 250,
      }),
    (err: MessengerError) => err.code === "receipt_timeout"
  );
  // …and settles as soon as the read receipt exists
  await store.appendReceiptBlock(
    "owner",
    encodeReceiptBlock("owner", "read", new Date().toISOString(), [message.id])
  );
  const receipt = await api.waitForDelivery("owner", message.id, { until: "read" });
  assert.equal(receipt.state, "read");
});

test("waitForDelivery times out with a typed error when nobody acks", async () => {
  const { api } = setup();
  await assert.rejects(
    () => api.waitForDelivery("owner", "msg_nobody", { timeoutMs: 50, pollMs: 250 }),
    (err: MessengerError) =>
      err.code === "receipt_timeout" && err.message.includes("msg_nobody")
  );
  // a read receipt satisfies a delivered wait — read implies delivered
  const { store } = setup();
  await store.appendReceiptBlock(
    "owner",
    encodeReceiptBlock("owner", "read", new Date().toISOString(), ["msg_seen"])
  );
  const api2 = createApi(new MailBus(store), store, {
    address: () => "owner",
    readAt: () => ({}),
    mutedPeers: () => ({}),
    markPeerRead: async () => {},
    contacts: async () => [],
    addContact: async () => {},
  });
  assert.equal(
    (await api2.waitForDelivery("owner", "msg_seen")).state,
    "read"
  );
});

test("client.sendAndWait resolves with the message and its receipt", async () => {
  const { api, store } = setup();
  const me = await api.client("agent");
  const pending = me.sendAndWait("owner", "hello", {
    timeoutMs: 4000,
    pollMs: 250,
  });
  // the id only exists once the send inside sendAndWait resolves — fish the
  // envelope out of the recipient's inbox, then write its receipt
  const message = await (async () => {
    for (let i = 0; i < 40; i++) {
      const hit = (await store.readInbox("owner")).find(
        (m) => m.body === "hello" && m.from === "agent"
      );
      if (hit) return hit;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error("send never landed");
  })();
  await store.appendReceiptBlock(
    "owner",
    encodeReceiptBlock("owner", "delivered", new Date().toISOString(), [message.id])
  );
  const { message: sent, receipt } = await pending;
  assert.equal(sent.id, message.id);
  assert.equal(receipt.state, "delivered");
});

test("messages(): default page, limit, and backwards walk via before", async () => {
  const { api, store } = setup();
  // seed with explicit, distinct timestamps — rapid sends share a ms stamp
  const base = Date.now() - 60_000;
  for (let i = 1; i <= 5; i++) {
    await store.append("owner", {
      id: `seed_${i}`,
      from: "agent",
      to: "owner",
      ts: new Date(base + i * 1000).toISOString(),
      replyTo: null,
      body: `m${i}`,
    });
  }
  // newest page of 2, oldest-first within the page
  const page = await api.messages("agent", { limit: 2 });
  assert.deepEqual(page.map((m) => m.body), ["m4", "m5"]);
  // walk backwards strictly before the page's oldest
  const older = await api.messages("agent", {
    limit: 2,
    before: page[0]!.ts,
  });
  assert.deepEqual(older.map((m) => m.body), ["m2", "m3"]);
  const oldest = await api.messages("agent", {
    limit: 10,
    before: older[0]!.ts,
  });
  assert.deepEqual(oldest.map((m) => m.body), ["m1"]);
  // default: the whole (short) conversation, oldest first
  assert.deepEqual((await api.messages("agent")).map((m) => m.body), [
    "m1",
    "m2",
    "m3",
    "m4",
    "m5",
  ]);
  // burned mail is absent from the agent read (§16)
  await store.append("owner", {
    id: "seed_burn",
    from: "agent",
    to: "owner",
    ts: new Date(base + 6000).toISOString(),
    replyTo: null,
    body: "vanish",
    exp: new Date(base - 1000).toISOString(),
  });
  assert.ok(!(await api.messages("agent")).some((m) => m.body === "vanish"));
  await assert.rejects(
    () => api.messages("not a slug!"),
    (err: MessengerError) => err.code === "invalid_address"
  );
});

test("conversations(): pagination slices the sorted list", async () => {
  const { api } = setup();
  const me = await api.client("agent");
  // two conversations with mail, distinct timestamps
  await me.send("owner", "earliest");
  await new Promise((r) => setTimeout(r, 10));
  await me.send("agent", "latest");

  const all = await api.conversations();
  assert.ok(all.length >= 2);
  const page = await api.conversations({ limit: 1, offset: 1 });
  assert.deepEqual(page, [all[1]]);
  const offsetOnly = await api.conversations({ offset: all.length });
  assert.deepEqual(offsetOnly, []);
  // no-arg call keeps the original shape (README example)
  for (const c of await api.conversations()) {
    assert.equal(typeof c.address, "string");
    assert.equal(typeof c.unread, "number");
  }
});

test("contacts()/addContact() ride the context; addContact validates the address", async () => {
  const adapter = new FakeAdapter();
  const store = new MailboxStore(adapter as unknown as DataAdapter, "root");
  const added: Array<{ address: string; name: string }> = [];
  const api = createApi(new MailBus(store), store, {
    address: () => "owner",
    readAt: () => ({}),
    mutedPeers: () => ({}),
    markPeerRead: async () => {},
    contacts: async () => [
      {
        address: "curtis",
        name: "Curtis",
        state: "mutual",
        updated: "2026-10-11T00:00:00.000Z",
      },
    ],
    addContact: async (address, name) => {
      added.push({ address, name });
    },
  });
  assert.deepEqual(await api.contacts(), [
    {
      address: "curtis",
      name: "Curtis",
      state: "mutual",
      updated: "2026-10-11T00:00:00.000Z",
    },
  ]);
  await api.addContact("ada", "Ada");
  await api.addContact("bob"); // no name → the address stands in
  assert.deepEqual(added, [
    { address: "ada", name: "Ada" },
    { address: "bob", name: "bob" },
  ]);
  await assert.rejects(
    () => api.addContact("not a slug!"),
    (err: MessengerError) => err.code === "invalid_address"
  );
});

test("client() registers an introduction (§17): contacts the address, never itself", async () => {
  const adapter = new FakeAdapter();
  const store = new MailboxStore(adapter as unknown as DataAdapter, "root");
  const added: string[] = [];
  const api = createApi(new MailBus(store), store, {
    address: () => "owner",
    readAt: () => ({}),
    mutedPeers: () => ({}),
    markPeerRead: async () => {},
    contacts: async () => [],
    addContact: async (address) => {
      added.push(address);
    },
  });
  await api.client("research-agent", { name: "Research Agent" });
  await api.client("owner"); // the user's own address: registry only
  assert.deepEqual(added, ["research-agent"]);
});
