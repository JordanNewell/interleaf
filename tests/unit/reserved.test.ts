/**
 * Reserved addresses (src/reserved.ts, SPEC §2): the anti-spoof list —
 * every entry must be a valid §2 address, matching is case-insensitive and
 * token-aware (composed handles reject too), and ordinary names stay
 * registrable.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ADDRESS_RE } from "../../src/mailbox/envelope";
import {
  BUS_ADDRESS,
  RESERVED_ADDRESSES,
  isReservedAddress,
} from "../../src/reserved";

test("every reserved entry is a valid §2 address, lowercase and unique", () => {
  for (const a of RESERVED_ADDRESSES) {
    assert.match(a, ADDRESS_RE);
    assert.equal(a, a.toLowerCase());
  }
  assert.equal(new Set(RESERVED_ADDRESSES).size, RESERVED_ADDRESSES.length);
  // the bus's own address must be on the list — it's the weightiest name
  assert.ok(RESERVED_ADDRESSES.includes(BUS_ADDRESS));
});

test("the weight tiers are all present: authority, finance, government, platforms", () => {
  for (const name of [
    "admin", // authority
    "support",
    "paypal", // finance / payment apps
    "venmo",
    "wells-fargo",
    "binance",
    "police", // government & emergency
    "911",
    "112",
    "irs",
    "uscis",
    "cloudflare", // cloud & security vendors
    "okta",
    "aws",
    "apple", // platform impersonation
    "telegram",
    "anthropic", // AI labs
    "chatgpt",
    "walmart", // Fortune-500-scale consumer brands
    "boeing",
    "target",
    "harvard", // academia
    "fafsa", // the offices scammers impersonate
    "registrar",
    "financial-aid",
    "pope", // religious titles & institutions
    "vatican",
    "bishop",
    "elon-musk", // most-impersonated public figures
    "satoshi-nakamoto",
    "mrbeast",
    "cristiano-ronaldo", // athletes
    "lionel-messi",
    "lottery", // scam phrases
    "seed-phrase",
    "verified",
    "cnn", // news brands
    "bbc",
    "governor", // political titles
    "registry", // the bus's own files
  ]) {
    assert.ok(RESERVED_ADDRESSES.includes(name), `${name} missing from the list`);
  }
  // a serious posture is a broad posture — the list runs to hundreds of names
  assert.ok(RESERVED_ADDRESSES.length >= 500, `list too thin: ${RESERVED_ADDRESSES.length}`);
});

test("people are reserved by full distinctive name, never by common given names", () => {
  // muhammad and jesus are among the most common given names on earth —
  // blocking them blocks real people, not borrowed weight. Same for the
  // surname-turned-handle cases below.
  for (const name of ["muhammad", "mohammed", "jesus", "ali", "jordan", "drake", "taylor", "gates", "jobs"]) {
    assert.equal(isReservedAddress(name), false, `${name} should stay registrable`);
  }
  // the distinctive surname of a mega-impersonated figure is reserved, so
  // composed scam handles reject too
  for (const handle of ["musk-giveaway", "trump-crypto", "messi-fan-club", "pope-francis-donation"]) {
    assert.ok(isReservedAddress(handle), `${handle} should reject`);
  }
});

test("isReservedAddress matches any casing or padding", () => {
  assert.ok(isReservedAddress("support"));
  assert.ok(isReservedAddress("Support"));
  assert.ok(isReservedAddress("  ADMIN "));
  assert.ok(isReservedAddress("no-reply"));
});

test("composed handles reject: a reserved token anywhere in the name", () => {
  assert.ok(isReservedAddress("support-team"));
  assert.ok(isReservedAddress("admin-team"));
  assert.ok(isReservedAddress("paypal-support"));
  assert.ok(isReservedAddress("service.admin"));
  assert.ok(isReservedAddress("google_docs"));
  assert.ok(isReservedAddress("POLICE.desk"));
});

test("ordinary addresses stay registrable", () => {
  assert.equal(isReservedAddress("owner"), false);
  assert.equal(isReservedAddress("curtis"), false);
  // a reserved *substring* is not a reserved *token* — whole words only
  assert.equal(isReservedAddress("supportive"), false);
  assert.equal(isReservedAddress("teams"), false);
  assert.equal(isReservedAddress("history"), false);
  assert.equal(isReservedAddress(""), false);
});
