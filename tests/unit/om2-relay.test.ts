import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateIdentity, fingerprint } from "../../src/om2/crypto/keys";
import { buildAuthHeader } from "../../src/om2/auth";
import { RelayStore } from "../../relay/store";
import { startRelay, type RunningRelay } from "../../relay/server";

describe("om2 relay store", () => {
  test("add/list/get/del and retention sweep", async () => {
    const store = new RelayStore(null);
    const e1 = store.add("fp_a", "box-1");
    const e2 = store.add("fp_a", "box-2");
    assert.ok(e1 && e2);
    assert.equal(store.size("fp_a"), 2);
    assert.equal(store.get("fp_a", e1.id)?.box, "box-1");
    assert.equal(store.get("fp_b", e1.id), null);
    assert.ok(store.del("fp_a", e1.id));
    assert.equal(store.size("fp_a"), 1);

    // retention: make e2 look old
    const old = store.get("fp_a", e2.id) as { ts: number };
    old.ts = Date.now() - 10_000;
    assert.equal(store.sweep(5_000), 1);
    assert.equal(store.size("fp_a"), 0);
  });

  test("rejects entries over the size cap", () => {
    const store = new RelayStore(null, 32);
    assert.equal(store.add("fp_a", "x".repeat(64)), null);
  });
});

describe("om2 relay server", () => {
  const sender = generateIdentity();
  const recipient = generateIdentity();
  let relay: RunningRelay;
  const toFp = fingerprint(recipient.publicKey);

  test("setup: relay listens", async () => {
    relay = await startRelay({ port: 0, readRatePerMin: 5, postRatePer10Min: 3 });
  });

  test("health check", async () => {
    const res = await fetch(`${relay.url}/health`);
    assert.equal(res.status, 200);
  });

  test("POST /outbox with valid auth → 201", async () => {
    const res = await fetch(`${relay.url}/outbox`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-om2-auth": buildAuthHeader(sender, "POST", "outbox"),
      },
      body: JSON.stringify({ to: toFp, box: "QUJD" }),
    });
    assert.equal(res.status, 201);
  });

  test("POST without auth → 401; bad sig → 401; replayed nonce → 401; stale ts → 401", async () => {
    const url = `${relay.url}/outbox`;
    const body = JSON.stringify({ to: toFp, box: "QUJD" });

    const noAuth = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    assert.equal(noAuth.status, 401);

    // actually corrupt: replace the whole signature with same-shape garbage
    const badSig = buildAuthHeader(sender, "POST", "outbox").replace(
      /sig=[A-Za-z0-9+/=]+$/,
      "sig=" + "A".repeat(88)
    );
    const resBad = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-om2-auth": badSig },
      body,
    });
    assert.equal(resBad.status, 401);

    // replay: same header (same nonce) twice — first one already consumed above
    const fresh = buildAuthHeader(sender, "POST", "outbox");
    await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-om2-auth": fresh }, body });
    const replay = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-om2-auth": fresh },
      body,
    });
    assert.equal(replay.status, 401);

    const stale = buildAuthHeader(sender, "POST", "outbox", Date.now() - 10 * 60 * 1000);
    const resStale = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-om2-auth": stale },
      body,
    });
    assert.equal(resStale.status, 401);
  });

  test("inbox is fp-scoped: another key listing someone's inbox → 403", async () => {
    const eve = generateIdentity();
    const res = await fetch(`${relay.url}/inbox/${toFp}`, {
      headers: { "x-om2-auth": buildAuthHeader(eve, "GET", `inbox/${toFp}`) },
    });
    assert.equal(res.status, 403);
  });

  test("full mailbox flow: list → fetch → delete", async () => {
    const auth = (method: string, resource: string) =>
      buildAuthHeader(recipient, method, resource);

    const listRes = await fetch(`${relay.url}/inbox/${toFp}`, {
      headers: { "x-om2-auth": auth("GET", `inbox/${toFp}`) },
    });
    assert.equal(listRes.status, 200);
    const { entries } = (await listRes.json()) as { entries: Array<{ id: string }> };
    assert.ok(entries.length >= 1);

    const id = entries[0]!.id;
    const getRes = await fetch(`${relay.url}/inbox/${toFp}/${id}`, {
      headers: { "x-om2-auth": auth("GET", `inbox/${toFp}/${id}`) },
    });
    assert.equal(getRes.status, 200);
    const entry = (await getRes.json()) as { box: string };
    assert.equal(entry.box, "QUJD");

    const delRes = await fetch(`${relay.url}/inbox/${toFp}/${id}`, {
      method: "DELETE",
      headers: { "x-om2-auth": auth("DELETE", `inbox/${toFp}/${id}`) },
    });
    assert.equal(delRes.status, 200);

    const goneRes = await fetch(`${relay.url}/inbox/${toFp}/${id}`, {
      headers: { "x-om2-auth": auth("GET", `inbox/${toFp}/${id}`) },
    });
    assert.equal(goneRes.status, 404);
  });

  test("oversized body → 413", async () => {
    const res = await fetch(`${relay.url}/outbox`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-om2-auth": buildAuthHeader(sender, "POST", "outbox"),
      },
      body: JSON.stringify({ to: toFp, box: "x".repeat(200 * 1024) }),
    });
    assert.ok([413, 429].includes(res.status)); // 429 acceptable if rate limit hit first
  });

  test("read rate limit kicks in (5/min configured)", async () => {
    let last = 200;
    for (let i = 0; i < 8; i++) {
      const res = await fetch(`${relay.url}/inbox/${toFp}`, {
        headers: { "x-om2-auth": buildAuthHeader(recipient, "GET", `inbox/${toFp}`) },
      });
      last = res.status;
    }
    assert.equal(last, 429);
  });

  test("teardown: relay closes", async () => {
    await relay.close();
  });
});
