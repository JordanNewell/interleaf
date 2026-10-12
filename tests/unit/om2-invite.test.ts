import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { fingerprint, generateIdentity, toB64u } from "../../src/om2/crypto/keys";
import { decodeInvite, encodeInvite, inviteFingerprint } from "../../src/om2/invite";

describe("om2 contact invites", () => {
  const key = generateIdentity().publicKey;
  const invite = {
    publicKey: toB64u(key),
    relay: "http://127.0.0.1:7788/",
    handle: "@alice@dir.example.com",
  };

  test("encode → decode round-trips, relay trailing slash trimmed", () => {
    const back = decodeInvite(encodeInvite(invite));
    assert.ok(back);
    assert.equal(back.publicKey, invite.publicKey);
    assert.equal(back.relay, "http://127.0.0.1:7788");
    assert.equal(back.handle, invite.handle);
    assert.equal(inviteFingerprint(back), fingerprint(key));
  });

  test("handle is optional, absent on the other side when omitted", () => {
    const bare = decodeInvite(encodeInvite({ publicKey: invite.publicKey, relay: invite.relay }));
    assert.ok(bare);
    assert.equal(bare.handle, undefined);
  });

  test("decodes both deep-link flavors and codes quoted inside text", () => {
    const code = encodeInvite(invite);
    assert.deepEqual(decodeInvite(`obsidian://message-bus-invite?code=${code}`), decodeInvite(code));
    // legacy Social links still decode — the code itself is what matters
    assert.deepEqual(decodeInvite(`obsidian://social-invite?code=${code}`), decodeInvite(code));
    assert.deepEqual(decodeInvite(`hey, add me: "${code}" — thanks`), decodeInvite(code));
  });

  test("rejects malformed payloads", () => {
    assert.equal(decodeInvite(""), null);
    assert.equal(decodeInvite("not an invite"), null);
    assert.equal(decodeInvite("osinv1-!!!not-base64url!!!"), null);
    // well-formed envelope, bad contents
    const wrap = (o: unknown) =>
      `osinv1-${toB64u(new TextEncoder().encode(JSON.stringify(o)))}`;
    assert.equal(decodeInvite(wrap({ v: 2, k: invite.publicKey, r: invite.relay })), null);
    assert.equal(decodeInvite(wrap({ v: 1, k: "aGVsbG8", r: invite.relay })), null); // not 32 bytes
    assert.equal(decodeInvite(wrap({ v: 1, k: invite.publicKey, r: "ftp://nope" })), null);
    // a malformed OPTIONAL handle is dropped, not fatal — key + relay are what matter
    const laxHandle = decodeInvite(wrap({ v: 1, k: invite.publicKey, r: invite.relay, h: "no-at-sign" }));
    assert.ok(laxHandle);
    assert.equal(laxHandle.handle, undefined);
  });
});
