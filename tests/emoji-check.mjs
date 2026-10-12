/**
 * Emoji module self-check (plain node, no framework):
 *   1. EMOJI_DATA parses: ≥300 entries, every line carries an emoji + a
 *      shortcode-safe unique name, emoji chars are unique too,
 *   2. the `#` section headers line up with EMOJI_CATEGORIES (same names,
 *      same order) and every category is non-empty,
 *   3. keyword search finds things (name-prefix ranking first),
 *   4. emoji.ts source patterns: the exports the integrator calls,
 *      capture-phase keydown that stopPropagation()s only while the
 *      autocomplete is open, TreeWalker substitution skipping
 *      pre/code/a/img, and the bubbling "input" dispatch,
 *   5. isEmojiOnly logic (duplicated copy — keep in sync with emoji.ts).
 *
 * Run: node tests/emoji-check.mjs  (exit 0 = pass)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = fs.readFileSync(path.join(ROOT, "src", "appearance", "emoji-data.ts"), "utf8");
const TS = fs.readFileSync(path.join(ROOT, "src", "appearance", "emoji.ts"), "utf8");
// consolidated: the emoji rules live in the styles.css section now
const CSS = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");

const failures = [];
const fail = (msg) => failures.push(msg);

// -- parse EMOJI_DATA ----------------------------------------------------------

const litMatch = DATA.match(/export\s+const\s+EMOJI_DATA\s*=\s*`([\s\S]*?)`/);
if (!litMatch) fail("EMOJI_DATA template literal not found in emoji-data.ts");

const ENTRIES = []; // { emoji, name, keywords, section }
const HEADERS = [];
if (litMatch) {
  for (const raw of litMatch[1].split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      HEADERS.push(line.slice(1).trim());
      continue;
    }
    const parts = line.split(/\s+/);
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      fail(`malformed line (needs emoji + name): "${line}"`);
      continue;
    }
    ENTRIES.push({
      emoji: parts[0],
      name: parts[1],
      keywords: parts.slice(2),
      section: HEADERS[HEADERS.length - 1] ?? "",
    });
  }
}

// 1. volume + per-line shape
if (ENTRIES.length < 300) fail(`expected ≥300 emoji, found ${ENTRIES.length}`);
for (const e of ENTRIES) {
  // every "emoji" token is non-ASCII (shortcode text would mean a swapped line)
  if (/^[\x20-\x7E]+$/.test(e.emoji)) fail(`first token is not an emoji: "${e.emoji}"`);
  if (!/^[a-zA-Z0-9_+-]{2,}$/.test(e.name)) fail(`name not shortcode-safe: "${e.name}"`);
}

const names = ENTRIES.map((e) => e.name);
const dupNames = names.filter((n, i) => names.indexOf(n) !== i);
if (dupNames.length > 0) fail(`duplicate names: ${[...new Set(dupNames)].join(", ")}`);

const chars = ENTRIES.map((e) => e.emoji);
const dupChars = chars.filter((c, i) => chars.indexOf(c) !== i);
if (dupChars.length > 0) fail(`duplicate emoji: ${[...new Set(dupChars)].join(" ")}`);

// 2. categories agree with the data sections
const catsMatch = DATA.match(/export\s+const\s+EMOJI_CATEGORIES[^;]*;/s);
if (!catsMatch) fail("EMOJI_CATEGORIES not found in emoji-data.ts");
const CATS = catsMatch
  ? [...catsMatch[0].matchAll(/\{\s*id:\s*"([a-z-]+)",\s*name:\s*"([^"]+)"\s*\}/g)]
  : [];
if (CATS.length !== 9) fail(`expected 9 categories, found ${CATS.length}`);
const catNames = CATS.map((m) => m[2]);
if (HEADERS.join("|") !== catNames.join("|")) {
  fail(`section headers ≠ EMOJI_CATEGORIES order: [${HEADERS.join("|")}] vs [${catNames.join("|")}]`);
}
for (const name of catNames) {
  const count = ENTRIES.filter((e) => e.section === name).length;
  if (count === 0) fail(`category "${name}" has no entries`);
}

// 3. search (mirror of searchEmoji ranking in emoji.ts — keep in sync)
function search(query) {
  const q = query.trim().toLowerCase();
  const exact = [];
  const prefix = [];
  const rest = [];
  for (const e of ENTRIES) {
    if (e.name === q) exact.push(e);
    else if (e.name.startsWith(q)) prefix.push(e);
    else if (e.name.includes(q) || e.keywords.some((k) => k.startsWith(q) || k.includes(k))) {
      rest.push(e);
    }
  }
  return [...exact, ...prefix, ...rest];
}
for (const q of ["happy", "love", "heart", "cake", "cat"]) {
  if (search(q).length === 0) fail(`keyword search for "${q}" finds nothing`);
}
// exact-name vocabulary a couple of well-known shortcodes must resolve to
const byName = new Map(ENTRIES.map((e) => [e.name, e.emoji]));
for (const n of ["smile", "tada", "+1", "rocket"]) {
  if (!byName.has(n)) fail(`expected shortcode ":${n}:" to exist`);
}
if (search("smile")[0]?.name !== "smile") {
  fail("name-prefix ranking broken: ':smile' should rank the exact name first");
}

// 4. emoji.ts source patterns ---------------------------------------------------

const mustContain = [
  [/export function attachEmojiComposer\(/, "attachEmojiComposer exported"],
  [/export function emojify\(/, "emojify exported"],
  [/export function isEmojiOnly\(/, "isEmojiOnly exported"],
  [/export const SHORTCODES:\s*Map<string,\s*string>/, "SHORTCODES typed Map<string, string>"],
  [/export interface EmojiComposerHooks/, "EmojiComposerHooks exported"],
  [/addEventListener\(\s*"keydown",\s*\w+,\s*true\s*\)/, "capture-phase keydown on the textarea"],
  [/isConnected[\s\S]{0,500}?stopPropagation\(\)/, "stopPropagation guarded behind an open-suggestion check"],
  [/createTreeWalker\(/, "emojify walks text nodes with a TreeWalker"],
  [/const EMOJIFY_SKIP = "pre, code, a, img"/, "emojify skips pre/code/a/img"],
  [/closest\(EMOJIFY_SKIP\)/, "skip resolved via closest()"],
  [/new Event\("input", \{ bubbles: true \}\)/, "inserts dispatch a bubbling input event"],
  [/messenger-emoji-toggle/, "toggle class stamped"],
  [/messenger-emoji-popover/, "popover class stamped"],
  [/messenger-emoji-ac"/, "autocomplete class stamped"],
];
for (const [re, why] of mustContain) {
  if (!re.test(TS)) fail(`emoji.ts pattern missing (${why}): ${re}`);
}

// 4b. emoji CSS anchors + sizing ----------------------------------------------

function ruleBody(selector) {
  const re = new RegExp(
    selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([^}]*)\\}"
  );
  const m = CSS.match(re);
  return m ? m[1] : null;
}
const CSS_CHECKS = [
  [".messenger-emoji-popover", ["position: absolute", "bottom: 100%"], "popover anchors above the composer row"],
  [".messenger-emoji-ac", ["position: absolute", "bottom: 100%"], "autocomplete anchors above the composer row"],
  [".messenger-bubble.messenger-emoji-only", ["font-size: var(--messenger-emoji-jumbo)"], "jumbo emoji-only bubbles (sized by token)"],
  [".messenger-emoji-cell", ["min-width: var(--messenger-emoji-cell)", "height: var(--messenger-emoji-cell)"], "touch-comfortable grid cells (sized by token)"],
  [".messenger-emoji-toggle", ["width: var(--messenger-control-size)", "height: var(--messenger-control-size)", "var(--background-secondary)"], "toggle matches .messenger-send sizing (shared control token)"],
];
for (const [sel, needles, why] of CSS_CHECKS) {
  const body = ruleBody(sel);
  if (body === null) fail(`styles.css emoji rule missing (${why}): ${sel}`);
  else {
    for (const needle of needles) {
      if (!body.includes(needle)) fail(`${sel} lacks "${needle}" (${why})`);
    }
  }
}

// 5. isEmojiOnly (copy — keep in sync with emoji.ts) ---------------------------

const EMOJI_CLUSTER =
  /^(?:\p{Extended_Pictographic}|[\u{FE00}-\u{FE0F}\u200D\u20E3\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}])+$/u;
function isEmojiCluster(token) {
  if (!EMOJI_CLUSTER.test(token)) return false;
  if (/\p{Extended_Pictographic}/u.test(token)) return true;
  return /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(token);
}
function clusterBases(token) {
  let bases = 0;
  let riRun = 0;
  let prev = "";
  const flushRi = () => {
    bases += Math.ceil(riRun / 2);
    riRun = 0;
  };
  for (const cp of token) {
    if (/^[\u{1F1E6}-\u{1F1FF}]$/u.test(cp)) {
      riRun += 1;
      prev = cp;
      continue;
    }
    flushRi();
    if (/\p{Extended_Pictographic}/u.test(cp) && prev !== "\u200D") bases += 1;
    prev = cp;
  }
  flushRi();
  return bases;
}
function isEmojiOnly(text) {
  const tokens = text.trim().split(/\s+/);
  if (tokens.length === 0 || tokens.length > 3) return false;
  let total = 0;
  for (const token of tokens) {
    if (!isEmojiCluster(token)) return false;
    total += clusterBases(token);
  }
  return total >= 1 && total <= 3;
}
const EMOJI_CASES = [
  ["😄", true, "single emoji"],
  ["😄🎉 💙", true, "three space-separated emoji"],
  ["  🔥  ", true, "surrounding whitespace ignored"],
  ["👍🏽", true, "skin tone modifier"],
  ["🧑‍🚒", true, "ZWJ sequence"],
  ["🇺🇸", true, "country flag pair"],
  ["🇺🇸🇬🇧", false, "two glued flags are two emoji"],
  ["hi 😄", false, "text + emoji"],
  ["😄 !", false, "punctuation is not emoji"],
  ["1 2 3", false, "digits are not emoji"],
  ["", false, "empty"],
  ["😄🎉💙💜", false, "four is past the 1–3 window"],
];
for (const [input, expected, why] of EMOJI_CASES) {
  if (isEmojiOnly(input) !== expected) fail(`isEmojiOnly (${why}): "${input}"`);
}

// -- verdict ---------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`emoji-check: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `emoji-check: OK — ${ENTRIES.length} emoji across ${catNames.length} categories (${catNames.join(", ")}), names unique, search + source patterns + isEmojiOnly cases pass`
);
