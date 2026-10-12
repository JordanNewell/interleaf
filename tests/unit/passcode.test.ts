import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  ENCRYPTION_PASSCODE_MIN,
  PASSCODE_MAX,
  PASSCODE_MIN,
  constantTimeEqual,
  hashPasscode,
  isStrongPasscode,
  isValidPasscode,
  makeSalt,
  sha256Hex,
  verifyPasscode,
} from "../../src/passcode";

test("sha256 matches FIPS test vectors", () => {
  assert.equal(
    sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
  assert.equal(
    sha256Hex(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  );
});

test("sha256 matches node's crypto across padding edge lengths", () => {
  // lengths around 55/64 bytes exercise one-block, boundary, and multi-block paths
  for (const len of [1, 31, 55, 56, 63, 64, 65, 100, 200, 1000]) {
    const input = "x".repeat(len) + String(len);
    assert.equal(sha256Hex(input), createHash("sha256").update(input).digest("hex"));
  }
  // non-ASCII must hash as UTF-8, not UTF-16
  const unicode = "passcode — p@sswörd 密码 🔐";
  assert.equal(sha256Hex(unicode), createHash("sha256").update(unicode).digest("hex"));
});

test("salts are well-formed and unique", () => {
  const a = makeSalt();
  const b = makeSalt();
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.match(b, /^[0-9a-f]{32}$/);
  assert.notEqual(a, b);
});

test("hashing is deterministic and salt-sensitive", () => {
  const salt = makeSalt();
  assert.equal(hashPasscode("1234", salt), hashPasscode("1234", salt));
  // same code, different vault → unrelated hashes
  assert.notEqual(hashPasscode("1234", salt), hashPasscode("1234", makeSalt()));
  // same salt, wrong code → different hash
  assert.notEqual(hashPasscode("1235", salt), hashPasscode("1234", salt));
});

test("verify accepts the right passcode and rejects everything else", () => {
  const salt = makeSalt();
  const hash = hashPasscode("hunter2!", salt);
  assert.equal(verifyPasscode("hunter2!", salt, hash), true);
  assert.equal(verifyPasscode("hunter2", salt, hash), false);
  assert.equal(verifyPasscode("", salt, hash), false);
  assert.equal(verifyPasscode("hunter2!", "", hash), false);
  assert.equal(verifyPasscode("hunter2!", salt, ""), false);
});

test("passcodes are trimmed before hashing", () => {
  const salt = makeSalt();
  const hash = hashPasscode("  1234  ", salt);
  assert.equal(verifyPasscode("1234", salt, hash), true);
});

test("validity gates at the documented length bounds", () => {
  assert.equal(isValidPasscode("a".repeat(PASSCODE_MIN - 1)), false);
  assert.equal(isValidPasscode("a".repeat(PASSCODE_MIN)), true);
  assert.equal(isValidPasscode("a".repeat(PASSCODE_MAX)), true);
  assert.equal(isValidPasscode("a".repeat(PASSCODE_MAX + 1)), false);
  // whitespace-only padding can't sneak under the minimum
  assert.equal(isValidPasscode("  ab  "), false);
});

test("constantTimeEqual compares without length or prefix leaks", () => {
  assert.equal(constantTimeEqual("aa", "aa"), true);
  assert.equal(constantTimeEqual("aa", "ab"), false);
  assert.equal(constantTimeEqual("aa", "aaa"), false);
  assert.equal(constantTimeEqual("", ""), true);
});

test("the encryption floor demands length and a non-digit", () => {
  assert.equal(ENCRYPTION_PASSCODE_MIN, 8);
  // too short for key duty
  assert.equal(isStrongPasscode("abc123"), false);
  assert.equal(isStrongPasscode("1234567"), false);
  // digits-only is guessable at PBKDF2 speed no matter the length label
  assert.equal(isStrongPasscode("12345678"), false);
  assert.equal(isStrongPasscode("1234567890123"), false);
  // length plus any non-digit character passes
  assert.equal(isStrongPasscode("1234567a"), true);
  assert.equal(isStrongPasscode("correct horse"), true);
  // the UI-gate floor is unchanged below it — short PINs still lock the app
  assert.equal(isValidPasscode("1234"), true);
  assert.equal(isStrongPasscode("1234"), false);
});
