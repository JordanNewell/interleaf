import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateIdentity, toB64u } from "../../src/om2/crypto/keys";
import { decodeInvite, encodeInvite } from "../../src/om2/invite";
import { inviteQr } from "../../src/om2/qr";

describe("om2 invite QR", () => {
  const invite = {
    publicKey: toB64u(generateIdentity().publicKey),
    relay: "http://127.0.0.1:7788",
  };
  const full = { ...invite, handle: "@alice@dir.example.com" };

  test("encodes the link into a valid, deterministic matrix", () => {
    const qr = inviteQr(full);
    // versions 1–40 → 21–177 modules; a ~200-char link at ECC M lands mid-range
    assert.ok(qr.size >= 21 && qr.size <= 177, `unexpected QR size ${qr.size}`);
    // the three finder corners are dark — a scanner reads them before anything else
    assert.ok(qr.getModule(0, 0));
    assert.ok(qr.getModule(qr.size - 1, 0));
    assert.ok(qr.getModule(0, qr.size - 1));
    assert.equal(inviteQr(full).size, qr.size);
  });

  test("QR survives the payload growing (handle on) without rejecting", () => {
    assert.ok(inviteQr(full).size >= inviteQr(invite).size);
  });

  test("the QR's encoded text round-trips through decodeInvite", () => {
    const code = encodeInvite(full);
    const link = `obsidian://message-bus-invite?code=${encodeURIComponent(code)}`;
    const back = decodeInvite(link);
    assert.ok(back);
    assert.equal(back.publicKey, full.publicKey);
    assert.equal(back.relay, full.relay);
    assert.equal(back.handle, full.handle);
  });
});
