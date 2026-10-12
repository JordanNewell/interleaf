import { test } from "node:test";
import assert from "node:assert/strict";
import { pendingAfter } from "../../src/bus";
import type { MailEnvelope } from "../../src/mailbox/envelope";

const env = (id: string, ts: string): MailEnvelope => ({
  id,
  from: "curtis",
  to: "owner",
  ts,
  replyTo: null,
  body: id,
});

const inbox = [
  env("m1", "2026-10-01T00:00:00.000Z"),
  env("m2", "2026-10-02T00:00:00.000Z"),
  env("m3", "2026-10-03T00:00:00.000Z"),
];

test("no cursor owns the whole inbox", () => {
  assert.deepEqual(pendingAfter(inbox, null).map((m) => m.id), ["m1", "m2", "m3"]);
});

test("a live cursor delivers only what follows it", () => {
  assert.deepEqual(pendingAfter(inbox, { id: "m1", ts: inbox[0]!.ts }).map((m) => m.id), [
    "m2",
    "m3",
  ]);
  assert.deepEqual(pendingAfter(inbox, { id: "m3", ts: inbox[2]!.ts }), []);
});

test("a GC'd cursor id falls back to the timestamp (strictly greater)", () => {
  assert.deepEqual(
    pendingAfter(inbox, { id: "gone", ts: "2026-10-02T00:00:00.000Z" }).map((m) => m.id),
    ["m3"]
  );
  // strictly greater: a message at exactly the cursor ts is NOT re-delivered
  assert.deepEqual(
    pendingAfter([
      env("m1", "2026-10-02T00:00:00.000Z"),
      env("m2", "2026-10-02T00:00:00.000Z"),
    ], { id: "gone", ts: "2026-10-02T00:00:00.000Z" }),
    []
  );
});
