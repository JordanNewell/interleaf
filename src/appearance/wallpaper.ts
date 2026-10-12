/**
 * Chat wallpapers: pure-CSS art keyed by `data-wallpaper` on the thread
 * wrap (every visual lives in styles/wallpaper.css). Resolution is kept
 * free of Obsidian types so tests/wallpaper-check.mjs can pin the
 * precedence rules without booting the app.
 */
import type ObsidianMessengerPlugin from "../main";
import type { MessengerSettings } from "../settings";

export interface WallpaperDef {
  id: string;
  /** Shown in the settings dropdown. */
  name: string;
  /** One-line description of the art, for the dropdown's desc line. */
  hint: string;
}

/** Built-ins; each id must have a matching block in styles/wallpaper.css. */
export const WALLPAPERS: WallpaperDef[] = [
  { id: "aurora", name: "Aurora", hint: "Teal and violet ribbons over a deep sky (default)" },
  { id: "dusk", name: "Dusk", hint: "Rose fading into indigo" },
  { id: "midnight", name: "Midnight", hint: "Near-black blue with a low glow" },
  { id: "mist", name: "Mist", hint: "Soft grey-lavender haze" },
  { id: "meadow", name: "Meadow", hint: "Fresh greens on a morning wash" },
  { id: "sunset", name: "Sunset", hint: "Amber melting into coral" },
  { id: "ink", name: "Ink", hint: "Deep monochrome with paper grain" },
  { id: "paper", name: "Paper", hint: "Warm off-white sheet, subtle fibers" },
];

/**
 * Wallpaper + tint settings ship with the settings-tab wiring; declared
 * locally as optional so this module compiles before MessengerSettings grows
 * the fields.
 */
type WallpaperSettings = {
  wallpaper?: string;
  wallpaperByPeer?: Record<string, string>;
  customWallpaperPath?: string;
  wallpaperIntensity?: number;
  wallpaperTint?: string;
  wallpaperTintByPeer?: Record<string, string>;
  wallpaperTintStrength?: number;
  bubbleAlpha?: number;
};

const EXTRA_IDS = new Set(["none", "custom"]);

const isWallpaperId = (id: string | undefined): id is string =>
  typeof id === "string" &&
  (EXTRA_IDS.has(id) || WALLPAPERS.some((w) => w.id === id));

const clamp = (n: number | undefined, min: number, max: number, fallback: number): number => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
};

/**
 * Precedence: per-peer override → global → "none". Unusable ids (a built-in
 * renamed between versions, hand-edited data.json) fall through instead of
 * painting nothing, and an explicit per-peer "none" really means off.
 */
export function resolveWallpaper(
  peer: string | null,
  globalId: string | undefined,
  byPeer: Record<string, string> | undefined
): string {
  const perPeer = peer ? byPeer?.[peer] : undefined;
  if (isWallpaperId(perPeer)) return perPeer;
  if (isWallpaperId(globalId)) return globalId;
  return "none";
}

/**
 * Tint precedence mirrors the wallpaper's, except "" is meaningful per-peer:
 * it is an explicit "no tint in this conversation", not a missing choice.
 */
export function resolveTint(
  peer: string | null,
  globalTint: string | undefined,
  byPeer: Record<string, string> | undefined
): string {
  const perPeer = peer ? byPeer?.[peer] : undefined;
  if (typeof perPeer === "string") return perPeer.trim();
  return typeof globalTint === "string" ? globalTint.trim() : "";
}

export function wallpaperIdFor(
  peer: string | null,
  settings: MessengerSettings
): string {
  const ws = settings as MessengerSettings & WallpaperSettings;
  return resolveWallpaper(peer, ws.wallpaper, ws.wallpaperByPeer);
}

/**
 * Paint the thread wrap for `peer`: dataset id for the art layer, CSS vars
 * for the blend controls (all defaults live in styles.css, so an unset var
 * still renders — TS only ever refines). Idempotent — safe on every
 * re-render, since the diff is one dataset attr plus a handful of vars.
 */
export function applyWallpaper(
  wrapEl: HTMLElement,
  peer: string | null,
  plugin: ObsidianMessengerPlugin
): void {
  const ws = plugin.settings as MessengerSettings & WallpaperSettings;
  const id = wallpaperIdFor(peer, plugin.settings);
  wrapEl.dataset.wallpaper = id;

  wrapEl.style.setProperty(
    "--messenger-wallpaper-opacity",
    String(clamp(ws.wallpaperIntensity, 0, 100, 100) / 100)
  );

  const tint = resolveTint(peer, ws.wallpaperTint, ws.wallpaperTintByPeer);
  wrapEl.classList.toggle("is-tinted", tint !== "");
  wrapEl.style.setProperty(
    "--messenger-wallpaper-tint",
    tint !== "" ? tint : "transparent"
  );
  wrapEl.style.setProperty(
    "--messenger-tint-alpha",
    String(clamp(ws.wallpaperTintStrength, 0, 100, 25) / 100)
  );
  wrapEl.style.setProperty(
    "--messenger-bubble-alpha",
    `${clamp(ws.bubbleAlpha, 30, 100, 88)}%`
  );

  if (id === "custom") {
    const file = ws.customWallpaperPath
      ? plugin.app.vault.getFileByPath(ws.customWallpaperPath)
      : null;
    if (file) {
      // app:// resource URLs may contain spaces — quote for CSS url()
      wrapEl.style.setProperty(
        "--messenger-wallpaper-image",
        `url("${plugin.app.vault.getResourcePath(file)}")`
      );
      return;
    }
    // missing/blank path: no CSS block exists for "custom", so this
    // degrades to the plain no-wallpaper look
  }
  wrapEl.style.removeProperty("--messenger-wallpaper-image");
}
