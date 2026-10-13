import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { FakeAdapter } from "./fake-adapter";
import { ContactsStore } from "../../src/contacts";
import { MailboxStore } from "../../src/mailbox/store";
import { canonicalMessage } from "../../src/om2/crypto/canon";
import {
  fingerprint,
  generateIdentity,
  signDetached,
  toB64,
  toB64u,
  type Identity,
} from "../../src/om2/crypto/keys";
import { sealJson } from "../../src/om2/crypto/seal";
import { buildAuthHeader } from "../../src/om2/auth";
import { Bridge, type Om2Contacts, type WireMessage } from "../../src/om2/bridge";
import { contactsBook } from "../../src/om2/adapters";
import type { Om2KeyValueStore, Om2MailStore } from "../../src/om2/types";
import { startRelay, type RunningRelay } from "../../relay/server";
import { newMessageId } from "../../src/mailbox/envelope";

/**
 * The OM-2 verification ladder and the first-contact handshake, against real
 * relays and real bridges (docs/first-contact.md §2–§4). In-memory vaults:
 * one FakeAdapter backs the mailbox and the contact book, so the exact
 * adapter wiring the plugin uses is what the tests drive.
 */

const POLL = { inboundPollMs: 120, outboundPollMs: 100 };

function memoryKv(): Om2KeyValueStore {
  const map = new Map<string, string>();
  return {
    async read(p) {
      return map.get(p) ?? null;
    },
    async write(p, d) {
      map.set(p, d);
    },
  };
}

interface Vault {
  adapter: FakeAdapter;
  store: MailboxStore;
  contacts: ContactsStore;
  identity: Identity;
  bridge: Bridge;
  myFp: string;
  relayUrl: string;
  events: string[];
}

async function mkVault(name: string, relayUrl: string): Promise<Vault> {
  const adapter = new FakeAdapter();
  const store = new MailboxStore(adapter, "root");
  const contacts = new ContactsStore(adapter, "root");
  const identity = generateIdentity();
  const events: string[] = [];
  const bridge = new Bridge({
    mail: contactsMailStore(store),
    kv: memoryKv(),
    identity,
    contacts: contactsBook(contacts, store) as Om2Contacts,
    relayUrl,
    ...POLL,
    maxSendAttempts: 2,
    onEvent: (ev) => events.push(ev.type),
  });
  await bridge.start();
  return { adapter, store, contacts, identity, bridge, myFp: fingerprint(identity.publicKey), relayUrl, events };
}

/** Same wiring as src/om2/adapters.ts, local so the test file needs no obsidian import. */
function contactsMailStore(store: MailboxStore): Om2MailStore {
  return {
    async ensureInbox(address) {
      await store.ensureAddress(address);
    },
    async appendMessage(address, message) {
      await store.append(address, message);
    },
    async readInbox(address) {
      return store.readInbox(address);
    },
    async upsertRegistry(entry) {
      await store.upsertRegistry(entry);
    },
  };
}

async function mkRelay(): Promise<RunningRelay> {
  return startRelay({
    port: 0,
    readRatePerMin: 100_000,
    postRatePer10Min: 100_000,
  });
}

async function stopVault(v: Vault): Promise<void> {
  await v.bridge.stop();
}

async function waitFor(
  predicate: () => Promise<boolean> | boolean,
  what = "condition",
  timeoutMs = 8000
): Promise<void> {
  const start = Date.now();
  while (!(await predicate())) {
    if (Date.now() - start > timeoutMs) throw new Error(`timeout waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 40));
  }
}

/** Build + sign a wire the way a real sender would (or a hostile one, via opts). */
function buildWire(
  identity: Identity,
  to: string,
  body: string,
  opts?: { fp?: string; pk?: string; relay?: string; handle?: string; replyTo?: string | null }
): WireMessage {
  const fp = fingerprint(identity.publicKey);
  const wire: WireMessage = {
    id: newMessageId(),
    ts: new Date().toISOString(),
    replyTo: opts?.replyTo ?? null,
    from: {
      fp: opts?.fp ?? fp,
      handle: opts?.handle,
      pk: opts?.pk ?? toB64u(identity.publicKey),
      relay: opts?.relay,
    },
    to,
    body,
    sig: "",
  };
  wire.sig = toB64(
    signDetached(
      identity,
      canonicalMessage({
        id: wire.id,
        from2: wire.from.handle ?? wire.from.fp,
        to2: wire.to,
        ts: wire.ts,
        replyTo: wire.replyTo,
        body: wire.body,
      })
    )
  );
  return wire;
}

async function postBox(
  relayUrl: string,
  sender: Identity,
  toPublicKey: Uint8Array,
  wire: WireMessage,
  boxOverride?: string
): Promise<void> {
  const toFp = fingerprint(toPublicKey);
  const box = boxOverride ?? sealJson(toPublicKey, wire).box;
  const res = await fetch(`${relayUrl.replace(/\/$/, "")}/outbox`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-om2-auth": buildAuthHeader(sender, "POST", "outbox") },
    body: JSON.stringify({ to: toFp, box }),
  });
  assert.equal(res.status, 201);
}

describe("om2 verification ladder", () => {
  test("a verified stranger knocks → quarantined; the intro stays on the relay", async () => {
    const relay = await mkRelay();
    const alice = await mkVault("alice", relay.url);
    const mallory = generateIdentity();
    await postBox(relay.url, mallory, alice.identity.publicKey, buildWire(mallory, alice.myFp, "hello?"));
    await waitFor(
      () => alice.bridge.quarantineList().some((q) => q.fp === fingerprint(mallory.publicKey)),
      "quarantine"
    );
    // §3.3: an impostor can knock, never enter — nothing in the owner inbox,
    // and the intro itself is HELD, not deleted, so accepting gets it.
    const ownerMail = await alice.store.readInbox("owner");
    assert.equal(ownerMail.some((m) => m.from !== "owner" && m.id !== undefined && m.body === "hello?"), false);
    assert.ok(relay.store.size(alice.myFp) >= 1);
    await stopVault(alice);
    await relay.close();
  });

  test("accept pins the requester with the return address (§9) and flushes held mail", async () => {
    const relay = await mkRelay();
    const alice = await mkVault("alice", relay.url);
    const bob = generateIdentity();
    await postBox(relay.url, bob, alice.identity.publicKey, buildWire(bob, alice.myFp, "hi!", { relay: relay.url }));
    const bobFp = fingerprint(bob.publicKey);
    await waitFor(() => alice.bridge.quarantineList().some((q) => q.fp === bobFp), "quarantine");
    await alice.bridge.accept(bobFp);
    const row = await alice.contacts.list();
    const pinned = row.find((e) => e.fp === bobFp);
    assert.ok(pinned, "accept must pin the requester");
    assert.equal(pinned.state, "mutual");
    // §9 v1.1: the return address the intro carried is where replies go
    assert.deepEqual(pinned.relays, [relay.url]);
    await stopVault(alice);
    await relay.close();
  });

  test("full handshake over one relay: request → quarantine → accept → auto-reply → auto-pin → two-way mail", async () => {
    const relay = await mkRelay();
    const alice = await mkVault("alice", relay.url);
    const bob = await mkVault("bob", relay.url);

    // bob → alice: a request to a bare public key, no pinned contact anywhere
    await bob.bridge.sendRequest(alice.identity.publicKey, relay.url, "let's talk");
    const bobFp = bob.myFp;
    await waitFor(() => alice.bridge.quarantineList().some((q) => q.fp === bobFp), "alice quarantine");
    await alice.bridge.accept(bobFp);

    // the auto-reply completes bob's half: REQUESTED → PINNED (the only auto-pin)
    await waitFor(async () => (await bob.contacts.list()).some((e) => e.fp === alice.myFp), "bob auto-pin");

    // two-way ordinary mail
    const bobAliasForAlice = (await bob.contacts.list()).find((e) => e.fp === alice.myFp)?.address;
    assert.ok(bobAliasForAlice);
    await alice.bridge.ensureContactFolders();
    const aliceAliasForBob = (await alice.contacts.list()).find((e) => e.fp === bobFp)?.address;
    assert.ok(aliceAliasForBob);
    await bob.store.append(bobAliasForAlice, {
      id: newMessageId(),
      from: "owner",
      to: bobAliasForAlice,
      ts: new Date().toISOString(),
      replyTo: null,
      body: "first real message",
    });
    await waitFor(async () => {
      const inbox = await alice.store.readInbox("owner");
      return inbox.some((m) => m.body === "first real message");
    }, "delivery to alice");
    const delivered = (await alice.store.readInbox("owner")).find((m) => m.body === "first real message");
    assert.ok(delivered);
    assert.equal(delivered?.from, aliceAliasForBob);
    assert.ok(delivered?.om2, "verified mail carries om2 fields");
    assert.equal(delivered?.om2?.sender, toB64u(bob.identity.publicKey));

    await stopVault(alice);
    await stopVault(bob);
    await relay.close();
  });

  test("cross-relay first contact: the auto-reply follows the requester's return address (§9)", async () => {
    const relayA = await mkRelay(); // alice's relay
    const relayB = await mkRelay(); // bob's relay
    const alice = await mkVault("alice", relayA.url);
    const bob = await mkVault("bob", relayB.url);

    // bob posts his intro through ALICE's relay, but receives on relay B
    await bob.bridge.sendRequest(alice.identity.publicKey, relayA.url, "cross-relay hello");
    await waitFor(() => alice.bridge.quarantineList().some((q) => q.fp === bob.myFp), "quarantine");
    await alice.bridge.accept(bob.myFp);

    // the reply must land on relay B — before the §9 fix it went to alice's
    // own relay (the sendBlock fallback) and stranded there
    const aliceRow = (await alice.contacts.list()).find((e) => e.fp === bob.myFp);
    assert.deepEqual(aliceRow?.relays, [relayB.url]);
    await waitFor(async () => {
      const list = relayB.store.list(bob.myFp);
      return list.length > 0;
    }, "auto-reply on bob's relay");
    await waitFor(async () => (await bob.contacts.list()).some((e) => e.fp === alice.myFp), "bob auto-pin");
    const ownerMail = await bob.store.readInbox("owner");
    assert.ok(ownerMail.some((m) => m.body.includes("accepted")), "held auto-reply delivered after pin");

    await stopVault(alice);
    await stopVault(bob);
    await relayA.close();
    await relayB.close();
  });

  test("pinned sender's ordinary mail dedupes against relay redelivery", async () => {
    const relay = await mkRelay();
    const alice = await mkVault("alice", relay.url);
    const bob = await mkVault("bob", relay.url);
    await bob.bridge.sendRequest(alice.identity.publicKey, relay.url);
    await waitFor(() => alice.bridge.quarantineList().some((q) => q.fp === bob.myFp), "quarantine");
    await alice.bridge.accept(bob.myFp);
    await waitFor(async () => (await bob.contacts.list()).some((e) => e.fp === alice.myFp), "bob auto-pin");

    const alias = (await bob.contacts.list()).find((e) => e.fp === alice.myFp)?.address;
    await bob.store.append(alias ?? "", {
      id: "msg_dupe",
      from: "owner",
      to: alias ?? "",
      ts: new Date().toISOString(),
      replyTo: null,
      body: "once only",
    });
    await waitFor(async () => {
      const inbox = await alice.store.readInbox("owner");
      return inbox.filter((m) => m.id === "msg_dupe").length === 1;
    }, "first delivery");

    // redeliver the same inner id under a fresh envelope — the seen-set skips it
    const wire = buildWire(bob.identity, alice.myFp, "once only", {});
    wire.id = "msg_dupe";
    wire.sig = toB64(
      signDetached(
        bob.identity,
        canonicalMessage({
          id: wire.id,
          from2: wire.from.handle ?? wire.from.fp,
          to2: wire.to,
          ts: wire.ts,
          replyTo: wire.replyTo,
          body: wire.body,
        })
      )
    );
    await postBox(relay.url, bob.identity, alice.identity.publicKey, wire);
    await new Promise((r) => setTimeout(r, 700)); // a couple of poll passes
    const inbox = await alice.store.readInbox("owner");
    assert.equal(inbox.filter((m) => m.id === "msg_dupe").length, 1);
    await stopVault(alice);
    await stopVault(bob);
    await relay.close();
  });

  test("an impostor claiming a pinned fp is rejected and deleted", async () => {
    const relay = await mkRelay();
    const alice = await mkVault("alice", relay.url);
    const bob = await mkVault("bob", relay.url);
    await bob.bridge.sendRequest(alice.identity.publicKey, relay.url);
    await waitFor(() => alice.bridge.quarantineList().some((q) => q.fp === bob.myFp), "quarantine");
    await alice.bridge.accept(bob.myFp);
    await waitFor(async () => (await bob.contacts.list()).some((e) => e.fp === alice.myFp), "bob auto-pin");

    // eve signs her own wire but claims bob's fp — the pin's key won't verify it
    const eve = generateIdentity();
    await postBox(
      relay.url,
      eve,
      alice.identity.publicKey,
      buildWire(eve, alice.myFp, "i am bob", { fp: bob.myFp })
    );
    await new Promise((r) => setTimeout(r, 700));
    assert.equal(relay.store.size(alice.myFp), 0, "rejected mail is deleted");
    const inbox = await alice.store.readInbox("owner");
    assert.equal(inbox.some((m) => m.body === "i am bob"), false);
    await stopVault(alice);
    await stopVault(bob);
    await relay.close();
  });

  test("tampered ciphertext is poison — deleted, never delivered", async () => {
    const relay = await mkRelay();
    const alice = await mkVault("alice", relay.url);
    const stranger = generateIdentity();
    const wire = buildWire(stranger, alice.myFp, "hello?", { relay: relay.url });
    const sealed = sealJson(alice.identity.publicKey, wire);
    const raw = Buffer.from(sealed.box, "base64");
    raw[raw.length - 1] = (raw[raw.length - 1] as number) ^ 1;
    await postBox(relay.url, stranger, alice.identity.publicKey, wire, raw.toString("base64"));
    await new Promise((r) => setTimeout(r, 700));
    assert.equal(relay.store.size(alice.myFp), 0); // poison is deleted
    const inbox = await alice.store.readInbox("owner");
    assert.equal(inbox.some((m) => m.body === "hello?"), false);
    await stopVault(alice);
    await relay.close();
  });

  test("decline blocks the fp — later boxes are held silent forever", async () => {
    const relay = await mkRelay();
    const alice = await mkVault("alice", relay.url);
    const annoying = generateIdentity();
    const annoyingFp = fingerprint(annoying.publicKey);
    await postBox(relay.url, annoying, alice.identity.publicKey, buildWire(annoying, alice.myFp, "hi", { relay: relay.url }));
    await waitFor(() => alice.bridge.quarantineList().some((q) => q.fp === annoyingFp), "quarantine");
    await alice.bridge.decline(annoyingFp);

    // a second box from the blocked fp: held on the relay, never delivered
    await postBox(relay.url, annoying, alice.identity.publicKey, buildWire(annoying, alice.myFp, "again?"));
    await new Promise((r) => setTimeout(r, 700));
    const inbox = await alice.store.readInbox("owner");
    assert.equal(inbox.some((m) => m.body === "again?"), false);
    assert.ok(alice.bridge.isBlocked(annoyingFp));
    await stopVault(alice);
    await relay.close();
  });

  test("a pinned key announcing a different key is quarantined, never re-pinned (§5.3)", async () => {
    const relay = await mkRelay();
    const alice = await mkVault("alice", relay.url);
    const bob = await mkVault("bob", relay.url);
    await bob.bridge.sendRequest(alice.identity.publicKey, relay.url);
    await waitFor(() => alice.bridge.quarantineList().some((q) => q.fp === bob.myFp), "quarantine");
    await alice.bridge.accept(bob.myFp);
    await waitFor(async () => (await bob.contacts.list()).some((e) => e.fp === alice.myFp), "bob auto-pin");

    // bob's REAL key signs an announcement of a different key — the pin's key
    // verifies the signature, so this is §5.3 key change, not an impostor.
    const newKey = generateIdentity();
    await postBox(
      relay.url,
      bob.identity,
      alice.identity.publicKey,
      buildWire(bob.identity, alice.myFp, "i rotated my key", { pk: toB64u(newKey.publicKey) })
    );
    await waitFor(
      async () => (await Promise.resolve(alice.bridge.quarantineList())).some((q) => q.fp === bob.myFp && q.publicKey === toB64u(newKey.publicKey)),
      "key-change quarantine"
    );
    // the pinned row keeps the OLD key
    const row = (await alice.contacts.list()).find((e) => e.fp === bob.myFp);
    assert.equal(row?.publicKey, toB64u(bob.identity.publicKey));
    assert.equal(row?.state, "mutual");
    await stopVault(alice);
    await stopVault(bob);
    await relay.close();
  });

  test("unsigned and fp-mismatched strangers are rejected + deleted", async () => {
    const relay = await mkRelay();
    const alice = await mkVault("alice", relay.url);
    const stranger = generateIdentity();

    // unsigned: no from.pk carried
    const unsigned = buildWire(stranger, alice.myFp, "no key");
    unsigned.from.pk = undefined;
    const sealed1 = sealJson(alice.identity.publicKey, unsigned);
    await postBox(relay.url, stranger, alice.identity.publicKey, unsigned, sealed1.box);

    // fp mismatch: key hashes to a different fp than claimed
    const other = generateIdentity();
    const mismatched = buildWire(stranger, alice.myFp, "wrong fp", { fp: fingerprint(other.publicKey) });
    await postBox(relay.url, stranger, alice.identity.publicKey, mismatched);

    await new Promise((r) => setTimeout(r, 700));
    assert.equal(relay.store.size(alice.myFp), 0);
    const inbox = await alice.store.readInbox("owner");
    assert.equal(inbox.some((m) => m.body === "no key" || m.body === "wrong fp"), false);
    await stopVault(alice);
    await relay.close();
  });

  test("quarantine cap sweeps the oldest knock (20 slots)", async () => {
    const relay = await mkRelay();
    const alice = await mkVault("alice", relay.url);
    for (let i = 0; i < 23; i++) {
      const s = generateIdentity();
      await postBox(relay.url, s, alice.identity.publicKey, buildWire(s, alice.myFp, `knock ${i}`, { relay: relay.url }));
    }
    await waitFor(() => alice.bridge.quarantineList().length >= 20, "cap reached");
    await new Promise((r) => setTimeout(r, 300));
    assert.ok(alice.bridge.quarantineList().length <= 20, "cap enforced");
    await stopVault(alice);
    await relay.close();
  });

  test("send failures bounce back into the sender's inbox after max attempts", async () => {
    const deadRelay = "http://127.0.0.1:9"; // nothing listens here
    const bob = await mkVault("bob", deadRelay);
    const aliceId = generateIdentity();
    await bob.contacts.upsert({
      address: "alice",
      name: "alice",
      state: "mutual",
      updated: new Date().toISOString(),
      fp: fingerprint(aliceId.publicKey),
      publicKey: toB64u(aliceId.publicKey),
      relays: [], // falls back to bob's own (dead) relay url
    });
    await bob.store.append("alice", {
      id: "msg_bounce",
      from: "owner",
      to: "alice",
      ts: new Date().toISOString(),
      replyTo: null,
      body: "into the void",
    });
    await waitFor(async () => {
      const inbox = await bob.store.readInbox("owner");
      return inbox.some((m) => m.from === "bridge" && m.body.includes("Delivery failed"));
    }, "bounce notice");
    await stopVault(bob);
  });

  test("sealed outbound blocks (locked vault) are skipped, not garbled", async () => {
    const relay = await mkRelay();
    const bob = await mkVault("bob", relay.url);
    const aliceId = generateIdentity();
    await bob.contacts.upsert({
      address: "alice",
      name: "alice",
      state: "mutual",
      updated: new Date().toISOString(),
      fp: fingerprint(aliceId.publicKey),
      publicKey: toB64u(aliceId.publicKey),
      relays: [],
    });
    // an enc-marked block stands in for "body is ciphertext while locked"
    await bob.store.append("alice", {
      id: "msg_locked",
      from: "owner",
      to: "alice",
      ts: new Date().toISOString(),
      replyTo: null,
      body: "ciphertext-not-plaintext",
      enc: { v: 1, iv: "0123456789abcdef" },
    });
    await new Promise((r) => setTimeout(r, 800));
    assert.equal(relay.store.size(fingerprint(aliceId.publicKey)), 0, "never signed while sealed");
    await stopVault(bob);
    await relay.close();
  });

  test("a contact request is retried, then throws with the attempt count", async () => {
    const relay = await mkRelay();
    const alice = await mkVault("alice", relay.url);
    let posts = 0;
    const flaky = new Bridge({
      mail: contactsMailStore(alice.store),
      kv: memoryKv(),
      identity: generateIdentity(),
      contacts: contactsBook(alice.contacts, alice.store) as Om2Contacts,
      relayUrl: relay.url,
      ...POLL,
      requestAttempts: 3,
      requestRetryDelayMs: 1,
      fetchImpl: (async () => {
        posts++;
        throw new TypeError("fetch failed");
      }) as typeof fetch,
      onEvent: () => {},
    });
    await flaky.start();
    await assert.rejects(
      () => flaky.sendRequest(generateIdentity().publicKey, relay.url, "knock"),
      /failed after 3 attempts/
    );
    assert.equal(posts, 3, "retried before giving up");
    await flaky.stop();
    await stopVault(alice);
    await relay.close();
  });

  test("an expired outgoing request no longer auto-pins — the reply knocks like anyone else", async () => {
    const relay = await mkRelay();
    const bob = generateIdentity();
    const adapter = new FakeAdapter();
    const store = new MailboxStore(adapter, "root");
    const contacts = new ContactsStore(adapter, "root");
    const identity = generateIdentity();
    const events: string[] = [];
    const kv = memoryKv();
    // pre-seed a state file whose outgoing request is three weeks old
    await kv.write(
      "bridge-state.json",
      JSON.stringify({
        version: 2,
        sent: {},
        seen: {},
        attempts: {},
        outgoing: { [fingerprint(bob.publicKey)]: { ts: Date.now() - 21 * 86_400_000 } },
      })
    );
    const alice = new Bridge({
      mail: contactsMailStore(store),
      kv,
      identity,
      contacts: contactsBook(contacts, store) as Om2Contacts,
      relayUrl: relay.url,
      ...POLL,
      onEvent: (ev) => events.push(ev.type),
    });
    await alice.start();
    await postBox(relay.url, bob, identity.publicKey, buildWire(bob, fingerprint(identity.publicKey), "finally replying"));
    await waitFor(() => events.includes("quarantined"), "quarantine, not auto-pin");
    assert.equal(events.includes("autopinned"), false, "stale request must not authorize auto-pin");
    await alice.stop();
    await relay.close();
  });

  test("a contact with no relay on file gets the no-relay bounce text, not a mystery", async () => {
    const deadRelay = "http://127.0.0.1:9"; // nothing listens here
    const bob = await mkVault("bob", deadRelay);
    const aliceId = generateIdentity();
    await bob.contacts.upsert({
      address: "alice",
      name: "alice",
      state: "mutual",
      updated: new Date().toISOString(),
      fp: fingerprint(aliceId.publicKey),
      publicKey: toB64u(aliceId.publicKey),
      relays: [],
    });
    await bob.store.append("alice", {
      id: "msg_norelay",
      from: "owner",
      to: "alice",
      ts: new Date().toISOString(),
      replyTo: null,
      body: "into the void",
    });
    await waitFor(async () => {
      const inbox = await bob.store.readInbox("owner");
      return inbox.some(
        (m) => m.from === "bridge" && m.body.includes("no relay on file for this contact")
      );
    }, "no-relay bounce notice");
    await stopVault(bob);
  });
});
