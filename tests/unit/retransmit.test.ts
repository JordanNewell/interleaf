import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RETRANSMIT_AFTER_MS,
  RETRANSMIT_MAX_AGE_MS,
  RETRANSMIT_MAX_ATTEMPTS,
  planRetransmit,
} from "../../src/retransmit";
import type { UnackedSend } from "../../src/retransmit";

const NOW = Date.parse("2026-10-10T12:00:00.000Z");

const entry = (overrides: Partial<UnackedSend> = {}): UnackedSend => ({
  message: {
    id: "msg_1",
    from: "owner",
    to: "curtis",
    ts: "2026-10-10T11:00:00.000Z",
    replyTo: null,
    body: "hello",
  },
  sentAt: new Date(NOW - 1000).toISOString(),
  attempts: 0,
  ...overrides,
});

test("retransmit: within the grace period it waits", () => {
  const sentAt = new Date(NOW - RETRANSMIT_AFTER_MS / 2).toISOString();
  assert.equal(planRetransmit(entry({ sentAt }), true, new Map(), NOW), "wait");
});

test("retransmit: past the grace with no ✓, it re-sends unchanged", () => {
  const sentAt = new Date(NOW - RETRANSMIT_AFTER_MS * 2).toISOString();
  assert.equal(planRetransmit(entry({ sentAt }), true, new Map(), NOW), "retransmit");
});

test("retransmit: a delivered or read receipt clears the debt", () => {
  const sentAt = new Date(NOW - RETRANSMIT_AFTER_MS * 10).toISOString();
  const delivered = new Map([["msg_1", { state: "delivered" }]]);
  const read = new Map([["msg_1", { state: "read" }]]);
  assert.equal(planRetransmit(entry({ sentAt }), true, delivered, NOW), "clear");
  assert.equal(planRetransmit(entry({ sentAt }), true, read, NOW), "clear");
});

test("retransmit: no receipts file means no ACK channel — never duplicate", () => {
  // remote OM-2 peers and scripts never publish receipts; re-sending to
  // them would duplicate everything they receive (SPEC §14)
  const sentAt = new Date(NOW - RETRANSMIT_MAX_AGE_MS / 2).toISOString();
  assert.equal(planRetransmit(entry({ sentAt }), false, null, NOW), "wait");
});

test("retransmit: gives up after the attempt cap or the age cap", () => {
  const stale = new Date(NOW - RETRANSMIT_AFTER_MS * 10).toISOString();
  assert.equal(
    planRetransmit(entry({ sentAt: stale, attempts: RETRANSMIT_MAX_ATTEMPTS }), true, new Map(), NOW),
    "drop"
  );
  // §14 "stop entirely once the message is more than a day old" — the
  // MESSAGE ages out, not the last attempt: make both the send and the
  // envelope ancient
  const ancient = new Date(NOW - RETRANSMIT_MAX_AGE_MS - 1000).toISOString();
  const oldMessage = entry({ sentAt: ancient });
  oldMessage.message = { ...oldMessage.message, ts: ancient };
  assert.equal(planRetransmit(oldMessage, true, new Map(), NOW), "drop");
});

test("retransmit: a day-old message stops even though a recent attempt reset sentAt", () => {
  // the sender retransmitted 2 minutes ago (sentAt moved forward), but the
  // message itself is 25h old — §14 says stop entirely
  const sentAt = new Date(NOW - 2 * 60_000).toISOString();
  const old = entry({ sentAt, attempts: 1 });
  old.message = {
    ...old.message,
    ts: new Date(NOW - 25 * 60 * 60 * 1000).toISOString(),
  };
  assert.equal(planRetransmit(old, true, new Map(), NOW), "drop");
});

test("retransmit: an undatable entry drops rather than loops", () => {
  assert.equal(planRetransmit(entry({ sentAt: "banana" }), true, new Map(), NOW), "drop");
  // an undatable envelope ts falls back to the send ts for aging
  const weird = entry({ sentAt: new Date(NOW - 1000).toISOString() });
  weird.message = { ...weird.message, ts: "not a date" };
  assert.equal(planRetransmit(weird, true, new Map(), NOW), "wait");
});
