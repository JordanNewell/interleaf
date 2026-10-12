/**
 * Wallpaper module self-check (plain node, no framework):
 *   1. every id in WALLPAPERS has a CSS block in the wallpapers section of
 *      styles.css and vice versa (plus "none"),
 *   2. the "none" state paints no gradient,
 *   3. resolveWallpaper's precedence (per-peer → global → "none") — tsc
 *      emits no JS, so the ~5-line resolver is duplicated below; keep the
 *      copy in sync with src/appearance/wallpaper.ts,
 *   4. source-text patterns for the DOM side (dataset attr, custom-image
 *      resolution, inline-style cleanup) and the readability CSS.
 *
 * Run: node tests/wallpaper-check.mjs  (exit 0 = pass)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TS = fs.readFileSync(path.join(ROOT, "src", "appearance", "wallpaper.ts"), "utf8");
// consolidated: the wallpaper rules live in the styles.css section now
const CSS = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");

const failures = [];
const fail = (msg) => failures.push(msg);

// -- extract WALLPAPERS from the TS source ----------------------------------

const arrayMatch = TS.match(/export const WALLPAPERS[^=]*=\s*\[([\s\S]*?)\];/);
if (!arrayMatch) fail("WALLPAPERS array not found in wallpaper.ts");
const DEFS = arrayMatch
  ? [...arrayMatch[1].matchAll(/\{\s*id:\s*"([a-z-]+)",\s*name:\s*"([^"]+)",\s*hint:\s*"([^"]+)"\s*\}/g)]
  : [];
const IDS = DEFS.map((m) => m[1]);

if (!arrayMatch || DEFS.length === 0) fail("no wallpaper defs parsed from wallpaper.ts");
if (IDS.length < 8) fail(`expected at least 8 built-ins, found ${IDS.length}`);
if (new Set(IDS).size !== IDS.length) fail(`duplicate ids in WALLPAPERS: ${IDS}`);
for (const [, id, name, hint] of DEFS) {
  if (!id) fail("def with empty id");
  if (!name.trim()) fail(`def ${id}: empty name`);
  if (!hint.trim()) fail(`def ${id}: empty hint`);
}

// -- parse the CSS into (selector, body) rule blocks -------------------------

function parseRules(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [];
  let sel = "";
  let body = "";
  let depth = 0;
  for (const ch of stripped) {
    if (ch === "{") {
      depth++;
      if (depth === 1) {
        sel = body;
        body = "";
      } else body += ch;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        rules.push({ sel: sel.trim(), body: body.trim() });
        body = ""; // or the next selector arrives with this body prepended
      } else body += ch;
    } else if (depth >= 1 || ch !== "\n") {
      body += ch;
    }
  }
  return rules;
}
const RULES = parseRules(CSS);

// -- 1. TS ids and CSS blocks agree ------------------------------------------

const CSS_IDS = new Set(
  [...CSS.matchAll(/data-wallpaper="([a-z-]+)"/g)].map((m) => m[1])
);
const EXPECTED = new Set([...IDS, "none"]);

for (const id of EXPECTED) {
  if (!CSS_IDS.has(id)) fail(`id "${id}" has no CSS block in styles.css`);
}
for (const id of CSS_IDS) {
  if (!EXPECTED.has(id)) fail(`CSS block for "${id}" has no WALLPAPERS entry`);
}

// every built-in must actually paint something layered, on the ::before art layer
for (const rule of RULES) {
  const m = rule.sel.match(
    /\.messenger-thread-wrap\[data-wallpaper="([a-z-]+)"\](::before)?$/
  );
  if (m && m[1] !== "none") {
    if (m[2] !== "::before") {
      fail(`wallpaper "${m[1]}" paints on the wrap itself, not the ::before layer: ${rule.sel}`);
    }
    if (!rule.body.includes("gradient(")) {
      fail(`wallpaper "${m[1]}" paints no gradient`);
    }
  }
}

// -- 2. "none" is pristine ----------------------------------------------------

// the readability rules mention "none" inside :not(...) — only the plain
// [data-wallpaper="none"] state itself must stay gradient-free
const noneRules = RULES.filter(
  (r) => /\[data-wallpaper="none"\]/.test(r.sel) && !/:\s*not\(/.test(r.sel)
);
if (noneRules.length === 0) fail('no explicit [data-wallpaper="none"] rule');
for (const r of noneRules) {
  if (/gradient\(/.test(r.body)) fail(`"none" rule paints a gradient: ${r.sel}`);
  if (!/background:\s*(none|transparent)/.test(r.body)) {
    fail(`"none" rule should paint nothing — got: ${r.body}`);
  }
}

// -- 3. precedence logic (copies of the resolvers — keep in sync) -------------

const EXTRA_IDS = new Set(["none", "custom"]);
const isWallpaperId = (id) =>
  typeof id === "string" && (EXTRA_IDS.has(id) || IDS.includes(id));

// mirrors resolveWallpaper in src/appearance/wallpaper.ts
function resolveWallpaper(peer, global, byPeer) {
  const perPeer = peer ? byPeer?.[peer] : undefined;
  if (isWallpaperId(perPeer)) return perPeer;
  if (isWallpaperId(global)) return global;
  return "none";
}

// mirrors resolveTint in src/appearance/wallpaper.ts — unlike wallpaper,
// a per-peer "" is a REAL choice ("no tint here"), not a missing one
function resolveTint(peer, global, byPeer) {
  const perPeer = peer ? byPeer?.[peer] : undefined;
  if (typeof perPeer === "string") return perPeer.trim();
  return typeof global === "string" ? global.trim() : "";
}

const CASES = [
  // [peer, global, byPeer, expected, why]
  ["alice", "aurora", { alice: "sunset" }, "sunset", "per-peer override wins over global"],
  ["alice", "aurora", { alice: "none" }, "none", "explicit per-peer off beats global"],
  ["alice", "aurora", { bob: "mist" }, "aurora", "other peers' overrides don't leak"],
  ["alice", "aurora", {}, "aurora", "no per-peer entry falls to global"],
  ["alice", "aurora", { alice: "bogus" }, "aurora", "stale per-peer id falls to global"],
  [null, "aurora", { alice: "sunset" }, "aurora", "list view (no peer) uses global"],
  ["alice", undefined, undefined, "none", "missing fields (pre-integration) mean off"],
  ["alice", "custom", undefined, "custom", "custom is a valid global choice"],
  ["alice", "bogus", { alice: "ink" }, "ink", "invalid global still honors per-peer"],
  ["alice", "bogus", undefined, "none", "invalid global lands on none"],
];
for (const [peer, global, byPeer, expected, why] of CASES) {
  const got = resolveWallpaper(peer, global, byPeer);
  if (got !== expected) fail(`precedence (${why}): expected ${expected}, got ${got}`);
}

const TINT_CASES = [
  ["alice", "#3af", { alice: "#f93" }, "#f93", "per-peer tint wins over global"],
  ["alice", "#3af", { alice: "" }, "", "per-peer \"\" is an explicit no-tint"],
  ["alice", "#3af", { bob: "#f93" }, "#3af", "other peers' tints don't leak"],
  ["alice", "#3af", undefined, "#3af", "no per-peer entry falls to global"],
  ["alice", "", { alice: "#f93" }, "#f93", "per-peer works with empty global"],
  [null, "#3af", { alice: "#f93" }, "#3af", "list view (no peer) uses global"],
  ["alice", undefined, undefined, "", "missing fields mean no tint"],
];
for (const [peer, global, byPeer, expected, why] of TINT_CASES) {
  const got = resolveTint(peer, global, byPeer);
  if (got !== expected) fail(`tint precedence (${why}): expected "${expected}", got "${got}"`);
}

// -- 4. DOM + readability + blend-control source patterns ----------------------

const mustContain = [
  [TS, "wrapEl.dataset.wallpaper = id", "applyWallpaper stamps data-wallpaper"],
  [TS, 'getFileByPath(ws.customWallpaperPath)', "custom wallpaper resolves a vault TFile"],
  [TS, "getResourcePath(file)", "custom wallpaper uses the vault resource URL"],
  [TS, 'removeProperty("--messenger-wallpaper-image")', "non-custom clears the custom image var (idempotent)"],
  [TS, "export function wallpaperIdFor", "wallpaperIdFor exported"],
  [TS, "export function resolveTint", "resolveTint exported"],
  [TS, '"--messenger-wallpaper-opacity"', "intensity drives the art layer's opacity"],
  [TS, '"--messenger-wallpaper-tint"', "tint color drives the wash layer"],
  [TS, '"--messenger-tint-alpha"', "tint strength drives the wash opacity"],
  [TS, '"--messenger-bubble-alpha"', "bubble opacity is user-tunable"],
  [TS, 'classList.toggle("is-tinted"', "tinted class gates the readability rules"],
  [TS, "import type ObsidianMessengerPlugin", "plugin import is type-only (no runtime cycle)"],
  [CSS, "transition: opacity 240ms ease", "gentle 240ms layer transitions"],
  [CSS, ":not([data-wallpaper=\"none\"]) .messenger-thread", "thread goes transparent over wallpaper"],
  [CSS, "--messenger-wallpaper-opacity: 1;", "opacity var default lives in CSS"],
  [CSS, "--messenger-wallpaper-tint: transparent;", "tint var default lives in CSS"],
  [CSS, "--messenger-bubble-alpha: 88%;", "bubble alpha var default lives in CSS"],
];
for (const [src, needle, why] of mustContain) {
  if (!src.includes(needle)) fail(`source pattern missing (${why}): ${needle}`);
}

// layering: art on ::before, tint on ::after, content above both
const beforeRule = RULES.find((r) => r.sel === ".messenger-thread-wrap::before");
const afterRule = RULES.find((r) => r.sel === ".messenger-thread-wrap::after");
if (!beforeRule) fail("no ::before art layer rule");
if (!afterRule) fail("no ::after tint layer rule");
for (const [r, name] of [[beforeRule, "::before"], [afterRule, "::after"]]) {
  if (r && !/pointer-events:\s*none/.test(r.body)) fail(`${name} layer must not eat clicks`);
  if (r && !/z-index:\s*0/.test(r.body)) fail(`${name} layer must sit below content`);
}
if (!RULES.some((r) => r.sel === ".messenger-thread-wrap > *" && /z-index:\s*1/.test(r.body))) {
  fail("content children must be raised above the art/tint layers");
}
// the tint layer must fade with the user's strength var
if (afterRule && !afterRule.body.includes("opacity: var(--messenger-tint-alpha")) {
  fail("::after tint layer ignores --messenger-tint-alpha");
}

// bubbles: translucent via color-mix, alpha driven by the user's
// bubble-opacity var — gated on wallpaper OR tint. (The old solid fallback
// line is gone: every client at minAppVersion 1.13.0 renders color-mix
// natively, and the duplicate background tripped the CSS lint.)
const bubbleRules = RULES.filter(
  (r) => /\.messenger-bubble/.test(r.sel) && r.body.includes("color-mix(")
);
if (bubbleRules.length < 2) fail("expected theirs + mine bubble readability rules");
for (const r of bubbleRules) {
  const isMine = /\.mine/.test(r.sel);
  const varName = isMine ? "--interactive-accent" : "--background-primary";
  const solid = new RegExp(`background:\\s*var\\(${varName}\\);`).test(r.body);
  const mixed = r.body.includes(
    `color-mix(in srgb, var(${varName}) var(--messenger-bubble-alpha, 88%), transparent)`
  );
  if (solid) {
    fail(`bubble readability rule duplicates background (CSS lint) (${varName}): ${r.sel}`);
  }
  if (!mixed) {
    fail(`bubble readability rule lacks color-mix (${varName}): ${r.sel}`);
  }
}
if (!bubbleRules.some((r) => r.sel.includes(".is-tinted"))) {
  fail("tint alone must also trigger translucent bubbles");
}

// day dividers / load-earlier pills get the same treatment (gated rules only
// — the base pill rules are opaque by design when no wallpaper/tint is active)
const pillRules = RULES.filter(
  (r) =>
    r.sel.includes(".is-tinted") &&
    (/\.messenger-day/.test(r.sel) || /\.messenger-load-earlier/.test(r.sel))
);
if (pillRules.length === 0) fail("no gated readability rule for day/load-earlier pills");
for (const r of pillRules) {
  if (!r.body.includes("calc(var(--messenger-bubble-alpha, 88%) - 6%)")) {
    fail(`pill rule not translucent via bubble alpha: ${r.sel}`);
  }
}

// -- verdict -------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`wallpaper-check: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `wallpaper-check: OK — ${IDS.length} wallpapers (${IDS.join(", ")}) paint on the ::before layer, none is pristine, wallpaper + tint precedence cases pass, blend vars wired`
);
