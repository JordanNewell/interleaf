import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ADDRESS_RE,
  encodeMessage,
  isExpired,
  newMessageId,
  parseInbox,
} from "../../src/mailbox/envelope";
import type { MailEnvelope } from "../../src/mailbox/envelope";

const msg = (over: Partial<MailEnvelope> = {}): MailEnvelope => ({
  id: "msg_abc123",
  from: "curtis",
  to: "owner",
  ts: "2026-10-10T12:00:00.000Z",
  replyTo: null,
  body: "hello\nworld",
  ...over,
});

test("encode → parse round-trips the envelope", () => {
  const inbox = encodeMessage(msg());
  const out = parseInbox(inbox);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0], msg());
});

test("multi-line bodies survive; trailing whitespace is trimmed", () => {
  const body = "one\n\n- two\n- three\n\n\n";
  const out = parseInbox(encodeMessage(msg({ body })));
  assert.equal(out[0]?.body, "one\n\n- two\n- three");
});

test("two messages in one file parse independently", () => {
  const inbox = encodeMessage(msg({ id: "msg_a" })) + encodeMessage(msg({ id: "msg_b", body: "second" }));
  const out = parseInbox(inbox);
  assert.deepEqual(out.map((m) => m.id), ["msg_a", "msg_b"]);
});

test("replyTo round-trips and defaults to null when absent", () => {
  const withReply = parseInbox(encodeMessage(msg({ replyTo: "msg_x" })));
  assert.equal(withReply[0]?.replyTo, "msg_x");
  const header = encodeMessage(msg());
  assert.ok(header.includes('"replyTo":null'));
});

test("OM-2 extension fields round-trip as the om2 object", () => {
  const om2 = {
    v: 2,
    from2: "fp_abc",
    to2: "fp_def",
    sender: "base64urlkey",
    sig: "base64sig",
  };
  const out = parseInbox(encodeMessage(msg({ om2 })));
  assert.deepEqual(out[0]?.om2, om2);
});

test("malformed blocks are skipped, never thrown", () => {
  const junk = "<!-- messenger: {not json} -->\nbody\n<!-- /messenger -->\n\n";
  const missing = "<!-- messenger: {\"id\":\"x\",\"from\":\"a\"} -->\nbody\n<!-- /messenger -->\n\n";
  const good = encodeMessage(msg({ id: "msg_ok" }));
  const out = parseInbox(junk + missing + good + "# Inbox — header noise\n");
  assert.deepEqual(out.map((m) => m.id), ["msg_ok"]);
});

test("ids are unique enough and well-formed", () => {
  const seen = new Set(Array.from({ length: 1000 }, () => newMessageId()));
  assert.equal(seen.size, 1000);
  for (const id of seen) assert.ok(id.startsWith("msg_"));
});

test("addresses: slug-like, no leading separator, ≤64 chars", () => {
  for (const ok of ["owner", "curtis", "research-agent", "a.b_c-d", "A9"]) {
    assert.ok(ADDRESS_RE.test(ok), ok);
  }
  for (const bad of ["", ".hidden", "-lead", "_lead", "has space", "x".repeat(65)]) {
    assert.ok(!ADDRESS_RE.test(bad), bad);
  }
});

// -- SPEC §15 sealed bodies / §16 burn fields ----------------------------------

test("a sealed body round-trips with its marker and stays locked-flagged", () => {
  const sealed = msg({ body: "BASE64CIPHERTEXT==", enc: { v: 1, iv: "aXY=" } });
  const out = parseInbox(encodeMessage(sealed))[0];
  assert.equal(out?.enc?.v, 1);
  assert.equal(out?.enc?.iv, "aXY=");
  assert.equal(out?.body, "BASE64CIPHERTEXT==");
  assert.equal(out?.encLocked, true, "parse alone must not claim the body is open");
});

test("burn fields round-trip, and junk burn values are dropped", () => {
  const exp = new Date("2027-01-01T00:00:00.000Z").toISOString();
  const out = parseInbox(encodeMessage(msg({ exp, bar: 3600 })))[0];
  assert.equal(out?.exp, exp);
  assert.equal(out?.bar, 3600);

  // hand-forged junk: unparseable deadline, out-of-range window
  const junk =
    `<!-- messenger: {"id":"msg_j","from":"a","to":"b","ts":"2026-10-10T00:00:00.000Z",` +
    `"replyTo":null,"exp":"not a date","bar":-5} -->\nbody\n<!-- /messenger -->\n\n`;
  const parsed = parseInbox(junk)[0];
  assert.equal(parsed?.exp, undefined);
  assert.equal(parsed?.bar, undefined);
});

test("isExpired: only a parseable, passed deadline counts", () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  const past = new Date(Date.now() - 60_000).toISOString();
  assert.equal(isExpired(msg({ exp: past })), true);
  assert.equal(isExpired(msg({ exp: future })), false);
  assert.equal(isExpired(msg()), false);
});
