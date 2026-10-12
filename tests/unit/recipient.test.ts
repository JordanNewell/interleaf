/**
 * The send modal's live recipient status (src/send-modal.ts): the
 * send-into-the-void trap. The bus appends mail whether or not anyone reads
 * it, so an unshared device must hear "no confirmed reader" *before* Send —
 * and a malformed address must say so inline instead of failing after.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { recipientHint } from "../../src/send-modal";

test("empty input stays quiet — the placeholder is instruction enough", () => {
  const hint = recipientHint("", { self: false, confirmed: false });
  assert.equal(hint.tone, "info");
  assert.equal(hint.text, "");
});

test("display names and emails fail shape, inline — the old post-send bounce", () => {
  for (const bad of ["Bob Smith", "bob@corp", "bob smith", "bob!"]) {
    const hint = recipientHint(bad, { self: false, confirmed: true });
    assert.equal(hint.tone, "error", bad);
    assert.match(hint.text, /slug/i);
  }
});

test("reserved names warn: nobody can ever register, so nobody reads", () => {
  for (const name of ["support", "paypal.support", "message-bus"]) {
    const hint = recipientHint(name, { self: false, confirmed: false });
    assert.equal(hint.tone, "warn", name);
    assert.match(hint.text, /reserved/i);
  }
});

test("your own address is confirmed and says the mail stays local", () => {
  const hint = recipientHint("me", { self: true, confirmed: true });
  assert.equal(hint.tone, "ok");
  assert.match(hint.text, /own inbox/i);
});

test("a confirmed reader — inbound mail or receipts — gets a quiet ✓", () => {
  const hint = recipientHint("alice", { self: false, confirmed: true });
  assert.equal(hint.tone, "ok");
  assert.match(hint.text, /reads on this bus/i);
});

test("an unconfirmed address warns about the void, with both escape hatches", () => {
  const hint = recipientHint("alice", { self: false, confirmed: false });
  assert.equal(hint.tone, "warn");
  assert.match(hint.text, /no confirmed reader/i);
  assert.match(hint.text, /synced mail folder/i);
  assert.match(hint.text, /invite code/i);
});

test("no status provider (or a failed check) stays quiet for valid addresses", () => {
  // never nag on information the caller couldn't fetch
  const hint = recipientHint("alice", null);
  assert.equal(hint.tone, "info");
  assert.equal(hint.text, "");
});
