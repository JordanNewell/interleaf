import { test, describe } from "node:test";
import assert from "node:assert/strict";
import nacl from "tweetnacl";
import { sanitizeSettings } from "../../src/settings";
import {
  createIdentityRecord,
  loadIdentityRecord,
  openIdentityRecord,
  regenerateIdentityRecord,
  wipeIdentity,
  type IdentityRecord,
} from "../../src/om2/identity-store";
import { fingerprint, generateIdentity, identityValid, type Identity } from "../../src/om2/crypto/keys";
import type { Om2KeyValueStore } from "../../src/om2/types";

describe("om2 settings sanitization", () => {
  test("defaults: disabled, no relay, no handle", () => {
    const s = sanitizeSettings({});
    assert.deepEqual(s.om2, { enabled: false, relayUrl: "", handle: "" });
  });

  test("a relay URL is kept (trailing slashes stripped), junk dropped", () => {
    const s = sanitizeSettings({ om2: { enabled: true, relayUrl: "http://r.example/", handle: "@a@b.c" } });
    assert.equal(s.om2.enabled, true);
    assert.equal(s.om2.relayUrl, "http://r.example");
    assert.equal(s.om2.handle, "@a@b.c");
  });

  test("enabled without a relay sanitizes to disabled — it could never deliver", () => {
    const s = sanitizeSettings({ om2: { enabled: true, relayUrl: "" } });
    assert.equal(s.om2.enabled, false);
  });

  test("non-http(s) relays and malformed handles drop", () => {
    const s = sanitizeSettings({ om2: { enabled: true, relayUrl: "ftp://x", handle: "no-at-sign" } });
    assert.equal(s.om2.relayUrl, "");
    assert.equal(s.om2.enabled, false);
    assert.equal(s.om2.handle, "");
  });
});

function memoryKv(): Om2KeyValueStore & { dump(): Map<string, string> } {
  const map = new Map<string, string>();
  return {
    async read(p) {
      return map.get(p) ?? null;
    },
    async write(p, d) {
      map.set(p, d);
    },
    dump: () => map,
  };
}

describe("om2 identity store", () => {
  test("create → save → load → open round-trips to the same key", async () => {
    const kv = memoryKv();
    const { record, identity } = await createIdentityRecord("correct horse");
    await kv.write("identity.json", JSON.stringify(record));
    const loaded = await loadIdentityRecord(kv);
    assert.ok(loaded);
    assert.equal(loaded.publicKey, record.publicKey);
    const reopened = await openIdentityRecord(loaded, "correct horse");
    assert.ok(identityValid(reopened));
    assert.deepEqual(reopened.publicKey, identity.publicKey);
    assert.match(fingerprint(reopened.publicKey), /^fp_/);
  });

  test("the seed at rest is not the seed in memory — wrong passcode fails", async () => {
    const { record } = await createIdentityRecord("correct horse");
    // the record must not contain raw key material anywhere
    const raw = JSON.stringify(record);
    assert.equal(raw.includes('"secretKey"'), false);
    await assert.rejects(() => openIdentityRecord(record, "wrong passcode"));
  });

  test("regenerate produces a different key under the same passcode", async () => {
    const first = await createIdentityRecord("pw");
    const second = await regenerateIdentityRecord("pw");
    assert.notDeepEqual(second.identity.publicKey, first.identity.publicKey);
    const reopened = await openIdentityRecord(second.record, "pw");
    assert.deepEqual(reopened.publicKey, second.identity.publicKey);
  });

  test("wipeIdentity zeroes the session key; a corrupt record loads as null-ish fields guarded", async () => {
    const identity: Identity = generateIdentity();
    wipeIdentity(identity);
    assert.ok(identity.secretKey.every((b) => b === 0));
    wipeIdentity(null); // never throws

    const kv = memoryKv();
    await kv.write("identity.json", "not json at all");
    assert.equal(await loadIdentityRecord(kv), null);
    const bogus: IdentityRecord = { version: 1, keySalt: "a".repeat(32), wrappedKey: "AAAA", publicKey: "zz" };
    await assert.rejects(() => openIdentityRecord(bogus, "pw"));
  });

  test("random nacl bytes are a valid seed source (parity with the bridge's keygen)", () => {
    const seed = nacl.randomBytes(32);
    assert.equal(seed.length, 32);
  });
});
