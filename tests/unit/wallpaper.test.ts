import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyWallpaper,
  resolveTint,
  resolveWallpaper,
} from "../../src/appearance/wallpaper";
import type { MessengerSettings } from "../../src/settings";

test("wallpaper precedence: per-peer override → global → none", () => {
  assert.equal(resolveWallpaper("curtis", "aurora", { curtis: "dusk" }), "dusk");
  assert.equal(resolveWallpaper("curtis", "aurora", {}), "aurora");
  assert.equal(resolveWallpaper("curtis", undefined, undefined), "none");
  // an explicit per-peer "none" really means off, not "fall back"
  assert.equal(resolveWallpaper("curtis", "aurora", { curtis: "none" }), "none");
});

test("unusable ids (renamed built-in, hand-edited data.json) fall through", () => {
  assert.equal(resolveWallpaper("curtis", "deleted-id", undefined), "none");
  assert.equal(resolveWallpaper("curtis", "aurora", { curtis: "deleted-id" }), "aurora");
});

test("tint precedence: per-peer (including explicit '') → global", () => {
  assert.equal(resolveTint("curtis", "#ff0000", { curtis: "" }), "");
  assert.equal(resolveTint("curtis", "#ff0000", { curtis: "#00ff00" }), "#00ff00");
  assert.equal(resolveTint("curtis", "#ff0000", {}), "#ff0000");
  assert.equal(resolveTint("curtis", undefined, undefined), "");
});

test("applyWallpaper paints the blend vars for the resolved wallpaper", () => {
  const calls: Record<string, string> = {};
  const wrap = {
    dataset: {} as Record<string, string>,
    classList: { toggle: (_c: string, _v?: boolean) => {} },
    style: {
      setProperty: (k: string, v: string) => (calls[k] = v),
      removeProperty: (k: string) => delete calls[k],
    },
  } as unknown as HTMLElement;
  const plugin = {
    app: { vault: { getFileByPath: () => null } },
    settings: {
      wallpaper: "dusk",
      wallpaperByPeer: {},
      wallpaperIntensity: 60,
      wallpaperTint: "#123456",
      wallpaperTintByPeer: {},
      wallpaperTintStrength: 40,
      bubbleAlpha: 88,
    },
  } as unknown as Parameters<typeof applyWallpaper>[2];
  applyWallpaper(wrap, "curtis", plugin);
  assert.equal(wrap.dataset.wallpaper, "dusk");
  assert.equal(calls["--messenger-wallpaper-opacity"], "0.6");
  assert.equal(calls["--messenger-wallpaper-tint"], "#123456");
  assert.equal(calls["--messenger-tint-alpha"], "0.4");
  assert.equal(calls["--messenger-bubble-alpha"], "88%");
});

test("settings type accepts the wallpaper fields the plugin ships", () => {
  const s: MessengerSettings = {
    ...DEFAULT,
    wallpaperTintByPeer: { curtis: "" },
  };
  assert.ok("wallpaperTintByPeer" in s);
});

const DEFAULT = {
  address: "owner",
  displayName: "",
  onboarded: false,
  root: "Messenger",
  hiddenStorage: true,
  pollSeconds: 10,
  retentionDays: 30,
  debug: false,
  cursors: {},
  readAt: {},
  notifyPopup: true,
  notifySound: true,
  sendReadReceipts: true,
  mutedPeers: {},
  drafts: {},
  attachmentsFolder: "Messenger/Attachments",
  keepOutbox: false,
  stripHtml: false,
  wallpaper: "aurora",
  wallpaperByPeer: {},
  customWallpaperPath: "",
  wallpaperIntensity: 100,
  wallpaperTint: "",
  wallpaperTintByPeer: {},
  wallpaperTintStrength: 25,
  bubbleAlpha: 88,
  avatars: {},
  recentEmoji: [],
} as MessengerSettings;
