import { test } from "node:test";
import assert from "node:assert/strict";
import {
  encodeReceiptBlock,
  parseReceipts,
  pruneReceiptLines,
} from "../../src/mailbox/receipts";

test("receipt lines parse to id → state/ts", () => {
  const content =
    encodeReceiptBlock("owner", "delivered", "2026-10-10T12:00:05.000Z", ["m1", "m2"]) +
    encodeReceiptBlock("owner", "read", "2026-10-10T12:01:00.000Z", ["m1"]);
  const out = parseReceipts(content);
  assert.deepEqual(
    out.get("m1"),
    { state: "read", ts: "2026-10-10T12:01:00.000Z" }
  );
  assert.deepEqual(
    out.get("m2"),
    { state: "delivered", ts: "2026-10-10T12:00:05.000Z" }
  );
});

test("read supersedes delivered regardless of file order", () => {
  const content =
    encodeReceiptBlock("owner", "read", "2026-10-10T12:00:00.000Z", ["m1"]) +
    encodeReceiptBlock("owner", "delivered", "2026-10-10T12:05:00.000Z", ["m1"]);
  assert.equal(parseReceipts(content).get("m1")?.state, "read");
});

test("malformed lines are skipped, never thrown", () => {
  const content =
    "<!-- receipts: {broken -->\n" +
    "<!-- receipts: {\"state\":\"weird\",\"ts\":\"x\",\"ids\":[\"m1\"]} -->\n" +
    "<!-- receipts: {\"state\":\"read\",\"ts\":\"2026-10-10T12:00:00.000Z\",\"ids\":[\"ok\",42]} -->\n";
  const out = parseReceipts(content);
  assert.equal(out.size, 1);
  assert.ok(out.has("ok"));
});

test("prune keeps lines newer than the cutoff, drops undated junk", () => {
  const keep = encodeReceiptBlock("owner", "read", "2026-10-10T12:00:00.000Z", ["a"]);
  const drop = encodeReceiptBlock("owner", "read", "2020-01-01T00:00:00.000Z", ["b"]);
  const content = keep + drop + "<!-- receipts: junk -->\n";
  const pruned = pruneReceiptLines(content, Date.parse("2026-01-01T00:00:00.000Z"));
  assert.ok(pruned.includes('"a"'));
  assert.ok(!pruned.includes('"b"'));
});

test("prune to empty returns '' (caller deletes the file)", () => {
  const content = encodeReceiptBlock("owner", "read", "2020-01-01T00:00:00.000Z", ["a"]);
  assert.equal(pruneReceiptLines(content, Date.parse("2026-01-01T00:00:00.000Z")), "");
});
