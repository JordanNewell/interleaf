/**
 * Pure helpers from the chat UI layer (chat-view.ts, dialogs.ts) — the view
 * itself needs a real workspace, but the small decision functions don't.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rememberedWindowInit,
  replyPreviewText,
  unreadBadgeLabel,
} from "../../src/chat-view";
import {
  lightboxSrc,
  effectiveRetention,
  parseRetentionCap,
  retentionCapLabel,
  retentionChoices,
  retentionDaysLabel,
  RETENTION_PRESETS,
} from "../../src/dialogs";

// -- reply chip ----------------------------------------------------------------

test("reply chip preview: normal body names the sender and flattens", () => {
  assert.equal(
    replyPreviewText({ body: "hello there", encLocked: undefined }, "You"),
    "↩ You: hello there"
  );
  assert.equal(
    replyPreviewText({ body: "line one\nline   two", encLocked: false }, "curtis"),
    "↩ curtis: line one line two"
  );
});

test("reply chip preview truncates long bodies", () => {
  const text = replyPreviewText({ body: "x".repeat(200) }, "curtis");
  // "↩ curtis: " (10) + oneLine(_, 70) = 70 chars
  assert.ok(text.length <= 80, `expected a one-liner, got ${text.length} chars`);
  assert.ok(text.startsWith("↩ curtis: x"));
  assert.ok(text.endsWith("…"));
});

test("reply chip preview never shows a sealed body's ciphertext", () => {
  const chip = replyPreviewText(
    { body: "base64+ciphertext==", encLocked: true },
    "curtis"
  );
  assert.equal(chip, "↩ curtis: 🔒 encrypted message");
  assert.ok(!chip.includes("base64"));
});

// -- jump button badge ----------------------------------------------------------

test("unread badge label: empty at zero, plain digits, 99+ cap", () => {
  assert.equal(unreadBadgeLabel(0), "");
  assert.equal(unreadBadgeLabel(1), "1");
  assert.equal(unreadBadgeLabel(42), "42");
  assert.equal(unreadBadgeLabel(99), "99");
  assert.equal(unreadBadgeLabel(100), "99+");
  assert.equal(unreadBadgeLabel(5000), "99+");
});

// -- detached-window geometry -----------------------------------------------------

const SCREEN = { width: 1512, height: 982 };

test("remembered window geometry: a valid rect comes back whole", () => {
  const init = rememberedWindowInit(
    { x: 100, y: 200, width: 500, height: 800 },
    SCREEN
  );
  assert.deepEqual(init, { x: 100, y: 200, size: { width: 500, height: 800 } });
});

test("nothing remembered falls back to no overrides", () => {
  assert.deepEqual(rememberedWindowInit({}, SCREEN), {});
});

test("sizes clamp to something usable", () => {
  const tiny = rememberedWindowInit({ width: 50, height: 60 }, SCREEN);
  assert.deepEqual(tiny.size, { width: 320, height: 400 });
  const huge = rememberedWindowInit({ width: 99999, height: 99999 }, SCREEN);
  assert.deepEqual(huge.size, { width: SCREEN.width, height: SCREEN.height });
  // one missing dimension: no size at all, never a half-remembered window
  assert.equal(rememberedWindowInit({ width: 500 }, SCREEN).size, undefined);
});

test("an off-screen position is dropped while the size survives", () => {
  const init = rememberedWindowInit(
    { x: 20000, y: 20000, width: 500, height: 800 },
    SCREEN
  );
  assert.equal(init.x, undefined);
  assert.equal(init.y, undefined);
  assert.deepEqual(init.size, { width: 500, height: 800 });
});

test("multi-screen setups keep generous bounds (isExtended)", () => {
  const init = rememberedWindowInit(
    { x: 2000, y: 200, width: 500, height: 800 },
    { ...SCREEN, extended: true }
  );
  assert.equal(init.x, 2000);
  // a window dragged fully past the edge is still gone
  const gone = rememberedWindowInit(
    { x: 50000, y: 50000, width: 500, height: 800 },
    { ...SCREEN, extended: true }
  );
  assert.equal(gone.x, undefined);
});

// -- image lightbox predicate ------------------------------------------------------

const img = (closest: (sel: string) => unknown): unknown => ({
  tagName: "IMG",
  src: "app://img.png",
  currentSrc: "",
  closest,
});

test("lightbox picks images inside bubbles, not links or avatars", () => {
  assert.equal(
    lightboxSrc(img((sel) => (sel === ".messenger-bubble" ? {} : null))),
    "app://img.png"
  );
  // not in a bubble (avatar imgs) — no zoom
  assert.equal(lightboxSrc(img(() => null)), null);
  // linked images keep their navigation
  assert.equal(lightboxSrc(img(() => ({}))), null);
  // non-images never zoom
  assert.equal(lightboxSrc({ tagName: "SPAN", src: "x", closest: () => ({}) }), null);
  assert.equal(lightboxSrc(null), null);
});

// -- per-chat retention option model ----------------------------------------------

test("retention presets stay inside the engine's sanitize bounds", () => {
  for (const p of RETENTION_PRESETS) {
    assert.ok(p.days >= 0 && p.days <= 3650, `${p.id} out of bounds`);
    assert.ok(p.id === `d${p.days}` || p.id === "never", `${p.id} id shape`);
  }
  assert.deepEqual(
    RETENTION_PRESETS.map((p) => p.days),
    [1, 7, 30, 365, 0]
  );
});

test("retention choices add a custom entry only for non-preset values", () => {
  // preset and absent values get the plain list
  assert.equal(retentionChoices(undefined).length, RETENTION_PRESETS.length);
  assert.equal(retentionChoices(30).length, RETENTION_PRESETS.length);
  // a hand-edited 90-day override shows itself, not a nearest preset
  const custom = retentionChoices(90);
  assert.equal(custom.length, RETENTION_PRESETS.length + 1);
  const entry = custom[custom.length - 1];
  assert.equal(entry.days, 90);
  assert.equal(entry.label, "90 days");
  assert.equal(entry.id, "d90");
});

test("retention labels: Never at 0, singular/plural days, 1 year", () => {
  assert.equal(retentionDaysLabel(0), "Never");
  assert.equal(retentionDaysLabel(1), "1 day");
  assert.equal(retentionDaysLabel(7), "7 days");
  assert.equal(retentionDaysLabel(365), "1 year");
  assert.equal(retentionCapLabel(0), "no limit");
  // grouping is locale-dependent — only pin the shape
  assert.ok(retentionCapLabel(1000).startsWith("max 1"));
  assert.ok(retentionCapLabel(1000).endsWith(" messages"));
});

test("effective retention: unset dimensions inherit the global policy", () => {
  const global = { days: 30, cap: 1000 };
  // days-only override keeps the global cap
  assert.deepEqual(effectiveRetention(7, undefined, global), { days: 7, cap: 1000 });
  // cap-only override keeps the global age policy
  assert.deepEqual(effectiveRetention(undefined, 100, global), { days: 30, cap: 100 });
  // 0 overrides are real values (keep forever / no limit), not "unset"
  assert.deepEqual(effectiveRetention(0, 0, global), { days: 0, cap: 0 });
  // no overrides = global
  assert.deepEqual(effectiveRetention(undefined, undefined, global), global);
});

test("retention cap input: digits parse and clamp, junk is rejected", () => {
  assert.equal(parseRetentionCap("500"), 500);
  assert.equal(parseRetentionCap(" 0 "), 0);
  assert.equal(parseRetentionCap("999999999"), 100000);
  assert.equal(parseRetentionCap("-5"), null);
  assert.equal(parseRetentionCap("banana"), null);
  assert.equal(parseRetentionCap("1e3"), null);
  assert.equal(parseRetentionCap(""), null);
});
