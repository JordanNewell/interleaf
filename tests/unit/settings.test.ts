import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, sanitizeSettings } from "../../src/settings";

test("missing data falls back to defaults", () => {
  const s = sanitizeSettings(undefined);
  assert.equal(s.address, DEFAULT_SETTINGS.address);
  assert.equal(s.pollSeconds, DEFAULT_SETTINGS.pollSeconds);
  assert.equal(s.hiddenStorage, true);
  assert.deepEqual(s.mutedPeers, {});
  assert.deepEqual(s.drafts, {});
});

test("numbers are clamped to their documented ranges", () => {
  const s = sanitizeSettings({
    pollSeconds: 99999,
    retentionDays: -5,
    wallpaperIntensity: 500,
    bubbleAlpha: 2,
  });
  assert.equal(s.pollSeconds, 3600);
  assert.equal(s.retentionDays, 0);
  assert.equal(s.wallpaperIntensity, 100);
  assert.equal(s.bubbleAlpha, 30);
});

test("non-numeric junk falls back instead of crashing", () => {
  const s = sanitizeSettings({ pollSeconds: "banana", retentionDays: null });
  assert.equal(s.pollSeconds, DEFAULT_SETTINGS.pollSeconds);
  assert.equal(s.retentionDays, DEFAULT_SETTINGS.retentionDays);
});

test("an invalid address resets to the default, never propagates", () => {
  assert.equal(sanitizeSettings({ address: "not a slug!" }).address, "owner");
  assert.equal(sanitizeSettings({ address: "curtis" }).address, "curtis");
});

test("per-peer wallpaper 'custom' is rejected (global-only choice)", () => {
  const s = sanitizeSettings({ wallpaperByPeer: { curtis: "custom", bob: "dusk" } });
  assert.equal(s.wallpaperByPeer.curtis, undefined);
  assert.equal(s.wallpaperByPeer.bob, "dusk");
});

test("tints must be color-syntax; an explicit '' (no tint) survives", () => {
  const s = sanitizeSettings({
    wallpaperTint: "url(javascript:alert(1))",
    wallpaperTintByPeer: { curtis: "", bob: "#8a9bb8", evil: "blue; } body {" },
  });
  assert.equal(s.wallpaperTint, "");
  assert.equal(s.wallpaperTintByPeer.curtis, "");
  assert.equal(s.wallpaperTintByPeer.bob, "#8a9bb8");
  assert.equal(s.wallpaperTintByPeer.evil, undefined);
});

test("avatars and drafts keep only address-keyed, size-capped entries", () => {
  const s = sanitizeSettings({
    avatars: { curtis: "img.png", "../evil": "x" },
    drafts: { curtis: "wip", "../evil": "x" },
  });
  assert.deepEqual(Object.keys(s.avatars), ["curtis"]);
  assert.deepEqual(Object.keys(s.drafts), ["curtis"]);
});

test("cursors keep only well-formed entries", () => {
  const s = sanitizeSettings({
    cursors: {
      curtis: { id: "msg_a", ts: "2026-10-10T00:00:00.000Z" },
      broken: { id: "msg_a" },
      worse: "nope",
    },
  });
  assert.deepEqual(Object.keys(s.cursors), ["curtis"]);
});

test("mutedPeers keeps only explicit true flags on valid addresses", () => {
  const s = sanitizeSettings({ mutedPeers: { curtis: true, bob: false, x: 1 } });
  assert.deepEqual(s.mutedPeers, { curtis: true });
});

test("passcode material is all-or-nothing and strictly shaped", () => {
  const hash = "a".repeat(64);
  const salt = "b".repeat(32);
  // a valid pair survives intact
  const ok = sanitizeSettings({ passcodeHash: hash, passcodeSalt: salt });
  assert.equal(ok.passcodeHash, hash);
  assert.equal(ok.passcodeSalt, salt);
  // anything malformed is dropped — never a lock nobody can open
  const bad = sanitizeSettings({
    passcodeHash: "not hex!",
    passcodeSalt: "tooshort",
    lockOnStart: true,
  });
  assert.equal(bad.passcodeHash, "");
  assert.equal(bad.passcodeSalt, "");
  // defaults: no passcode, lock-on-start armed for when one gets set
  const fresh = sanitizeSettings(undefined);
  assert.equal(fresh.passcodeHash, "");
  assert.equal(fresh.passcodeSalt, "");
  assert.equal(fresh.lockOnStart, true);
});

test("lockedPeers keeps only explicit true flags on valid addresses", () => {
  const s = sanitizeSettings({
    lockedPeers: { curtis: true, bob: false, "../evil": true },
  });
  assert.deepEqual(s.lockedPeers, { curtis: true });
});

test("encryption material survives only as a complete, well-formed set", () => {
  const hash = "a".repeat(64);
  const salt = "b".repeat(32);
  const wrapped = "A".repeat(80);
  const ok = sanitizeSettings({
    passcodeHash: hash,
    passcodeSalt: salt,
    encryptMail: true,
    keySalt: salt,
    wrappedKey: wrapped,
  });
  assert.equal(ok.encryptMail, true);
  assert.equal(ok.keySalt, salt);
  assert.equal(ok.wrappedKey, wrapped);

  // any missing piece kills the flag and the orphans with it
  const noKey = sanitizeSettings({
    passcodeHash: hash,
    passcodeSalt: salt,
    encryptMail: true,
    wrappedKey: wrapped,
  });
  assert.equal(noKey.encryptMail, false);
  assert.equal(noKey.keySalt, "");

  const badWrapped = sanitizeSettings({
    passcodeHash: hash,
    passcodeSalt: salt,
    encryptMail: true,
    keySalt: salt,
    wrappedKey: "not!base64##",
  });
  assert.equal(badWrapped.encryptMail, false);
  assert.equal(badWrapped.wrappedKey, "");
});

test("encryptMail survives without a passcodeHash — the bundle is the credential", () => {
  // the no-oracle format: no fast verifier is stored next to the wrapped key
  const salt = "b".repeat(32);
  const wrapped = "A".repeat(80);
  const s = sanitizeSettings({
    encryptMail: true,
    keySalt: salt,
    wrappedKey: wrapped,
    kdfIterations: 600_000,
    authMode: "passcode",
  });
  assert.equal(s.encryptMail, true, "a hash must not be required anymore");
  assert.equal(s.keySalt, salt);
  assert.equal(s.wrappedKey, wrapped);
  assert.equal(s.kdfIterations, 600_000);
});

test("kdfIterations: absent means the legacy count; junk and out-of-range clamp", () => {
  const salt = "b".repeat(32);
  const wrapped = "A".repeat(80);
  const material = { keySalt: salt, wrappedKey: wrapped };

  const legacy = sanitizeSettings({ encryptMail: true, ...material });
  assert.equal(legacy.kdfIterations, 200_000, "pre-count vaults were all 200k");

  assert.equal(
    sanitizeSettings({ encryptMail: true, ...material, kdfIterations: 600_000 }).kdfIterations,
    600_000
  );
  assert.equal(
    sanitizeSettings({ encryptMail: true, ...material, kdfIterations: "banana" }).kdfIterations,
    200_000
  );
  assert.equal(
    sanitizeSettings({ encryptMail: true, ...material, kdfIterations: 99_999_999 }).kdfIterations,
    5_000_000,
    "clamped to the documented ceiling"
  );
  // without encryption there is no wrap to count for
  assert.equal(sanitizeSettings({ kdfIterations: 600_000 }).kdfIterations, 200_000);
});

test("authMode 'key' survives only as a complete key-mode bundle", () => {
  const salt = "b".repeat(32);
  const wrapped = "A".repeat(80);
  const material = { keySalt: salt, wrappedKey: wrapped };

  const keyMode = sanitizeSettings({ encryptMail: true, ...material, authMode: "key" });
  assert.equal(keyMode.authMode, "key");

  // a hash alongside means passcode mode — the fast verifier can't be trusted
  // to be key-less
  assert.equal(
    sanitizeSettings({
      encryptMail: true,
      ...material,
      passcodeHash: "a".repeat(64),
      passcodeSalt: "c".repeat(32),
      authMode: "key",
    }).authMode,
    "passcode"
  );
  // no bundle, no key mode
  assert.equal(sanitizeSettings({ authMode: "key" }).authMode, "passcode");
});

test("unacked entries keep their seal and burn fields", () => {
  const s = sanitizeSettings({
    unacked: {
      msg_ok: {
        message: {
          id: "msg_ok",
          from: "owner",
          to: "curtis",
          ts: "2026-10-10T00:00:00.000Z",
          replyTo: null,
          body: "enc[stays]enc",
          enc: { v: 1, iv: "aXY=" },
          exp: "2026-10-11T00:00:00.000Z",
          bar: 3600,
        },
        sentAt: "2026-10-10T00:00:01.000Z",
        attempts: 0,
      },
    },
  });
  const kept = s.unacked.msg_ok?.message;
  assert.equal(kept?.enc?.iv, "aXY=");
  assert.equal(kept?.exp, "2026-10-11T00:00:00.000Z");
  assert.equal(kept?.bar, 3600);
  assert.equal(kept?.body, "enc[stays]enc");
});
