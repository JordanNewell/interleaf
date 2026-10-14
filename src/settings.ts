import type { Cursor } from "./bus";
import { ADDRESS_RE, MAX_BAR_SECONDS } from "./mailbox/envelope";
import type { MailEnvelope } from "./mailbox/envelope";
import type { UnackedSend } from "./retransmit";
import { WALLPAPERS } from "./appearance/wallpaper";
import { LEGACY_KDF, LEGACY_PBKDF2_ITERATIONS, type KdfId } from "./crypto";

export interface MessengerSettings {
  /** This participant's own address. */
  address: string;
  /** Optional display name for the registry/conversation list. Empty = use the address. */
  displayName: string;
  /** The welcome modal has been shown (completed or dismissed) — don't nag again. */
  onboarded: boolean;
  /** Folder holding one inbox.md per address when storage is visible. */
  root: string;
  /** Keep mail in a dot-folder inside .obsidian — invisible to Obsidian. */
  hiddenStorage: boolean;
  /** Effective root used last, so switching modes can migrate the files. */
  lastRoot?: string;
  /** Idle seconds between inbox polls; focus, sends, and landed sync writes poll sooner. */
  pollSeconds: number;
  /** Messages older than this are GC'd hourly. 0 disables. */
  retentionDays: number;
  /** Auto-delete oldest messages beyond this many per inbox, regardless of age. 0 disables. */
  maxInboxMessages: number;
  /**
   * Per-address retention overrides (peer address → days). A peer present
   * here uses this value instead of retentionDays; 0 disables age GC for
   * that peer (keep-forever). Honored for the peer's inbox, outbox, and
   * receipts. Additive roadmap item: per-address retention.
   */
  retentionDaysByPeer: Record<string, number>;
  /** Per-address inbox size cap overrides (peer address → max messages; 0 = uncapped). */
  maxInboxMessagesByPeer: Record<string, number>;
  /** Sends still awaiting their delivery receipt, for retransmission (SPEC §14). */
  unacked: Record<string, UnackedSend>;
  debug: boolean;
  cursors: Record<string, Cursor>;
  /** Per-peer ISO timestamp of the last message the chat view has shown. */
  readAt: Record<string, string>;
  /** Pop up a clickable notice when mail arrives for you. */
  notifyPopup: boolean;
  /** Play a short synthesized sound when mail arrives for you. */
  notifySound: boolean;
  /** Let senders see ✓✓ when you have read their mail. */
  sendReadReceipts: boolean;
  /** Peers whose incoming mail never chimes or pops up (address → true). */
  mutedPeers: Record<string, boolean>;
  /**
   * The social gate's strictness: "everyone" leaves delivery open (strangers
   * land under quiet Contact requests), "contacts" keeps the list to people
   * you've added. The shared-vault file bus is never refused — §8, mail
   * lands in files.
   */
  whoCanReachMe: "everyone" | "contacts";
  /** Per-peer unsent composer text, persisted across restarts. */
  drafts: Record<string, string>;
  /** Visible vault folder for images pasted into the composer. */
  attachmentsFolder: string;
  /** Append a sender-side copy of outgoing mail to <root>/<me>/outbox.md. */
  keepOutbox: boolean;
  /** Best-effort removal of raw HTML from rendered message bodies. */
  stripHtml: boolean;
  /** Chat wallpaper: a WALLPAPERS id, "none", or "custom". */
  wallpaper: string;
  /** Per-conversation wallpaper overrides (peer address → id). */
  wallpaperByPeer: Record<string, string>;
  /** Vault image path used when wallpaper is "custom". */
  customWallpaperPath: string;
  /** How strongly the wallpaper art shows, 0 (pure theme) – 100. */
  wallpaperIntensity: number;
  /** CSS color washed over the thread; "" = no tint. */
  wallpaperTint: string;
  /** Per-conversation tint overrides ("" = explicitly untinted). */
  wallpaperTintByPeer: Record<string, string>;
  /** How strongly the tint color applies, 0–100. */
  wallpaperTintStrength: number;
  /** Bubble opacity over wallpaper/tint, 30–100 (percent). */
  bubbleAlpha: number;
  /** Profile pictures: address → vault-relative image path. */
  avatars: Record<string, string>;
  /** Recently picked emoji, most recent first. */
  recentEmoji: string[];
  /**
   * Salted SHA-256 of the passcode (64 hex chars). Empty = no passcode set.
   * Deliberately empty while encryptMail is on: a fast hash next to the
   * wrapped key would be an offline brute-force oracle for the same secret.
   */
  passcodeHash: string;
  /** Per-vault random salt for passcodeHash (32 hex chars). */
  passcodeSalt: string;
  /** Require the passcode before Messenger opens after Obsidian restarts. */
  lockOnStart: boolean;
  /** Conversations gated behind the passcode (peer address → true). */
  lockedPeers: Record<string, boolean>;
  /** Seal message bodies at rest (SPEC §15). Requires a passcode or vault key. */
  encryptMail: boolean;
  /** KDF salt for the vault-key KEK (32 hex chars). */
  keySalt: string;
  /** The vault key, wrapped by the KEK from the unlock secret (base64 iv+ct). */
  wrappedKey: string;
  /** PBKDF2 rounds the wrappedKey was sealed with (absent = legacy 200k; only read when kdf is "pbkdf2"). */
  kdfIterations: number;
  /** KDF the wrappedKey was sealed with (absent in old data.json = pbkdf2 era). */
  kdf: KdfId;
  /** What unlocks the vault key: a memorized passcode or a generated key. */
  authMode: "passcode" | "key";
  /**
   * Detached chat window's last known geometry, remembered across sessions
   * (desktop popout). All optional — absent until the window is moved/sized.
   */
  chatWinX?: number;
  chatWinY?: number;
  chatWinWidth?: number;
  chatWinHeight?: number;
  /**
   * Cross-vault mail (OM-2, src/om2/): keypair identity + E2E-sealed relay
   * transport. The identity seed itself lives wrapped under the passcode in
   * the plugin's om2 dir — never here.
   */
  om2: {
    /** Master switch; the bridge also requires a relayUrl. */
    enabled: boolean;
    /** This vault's relay (where inbound mail waits). Blank = off. */
    relayUrl: string;
    /** Optional handle, e.g. `@alice@example.com` — travels as from2. */
    handle: string;
  };
}

export const DEFAULT_SETTINGS: MessengerSettings = {
  address: "owner",
  displayName: "",
  onboarded: false,
  root: "Messenger",
  hiddenStorage: true,
  pollSeconds: 5,
  retentionDays: 30,
  maxInboxMessages: 1000,
  retentionDaysByPeer: {},
  maxInboxMessagesByPeer: {},
  unacked: {},
  debug: false,
  cursors: {},
  readAt: {},
  notifyPopup: true,
  notifySound: true,
  sendReadReceipts: true,
  mutedPeers: {},
  whoCanReachMe: "everyone",
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
  passcodeHash: "",
  passcodeSalt: "",
  lockOnStart: true,
  lockedPeers: {},
  encryptMail: false,
  keySalt: "",
  wrappedKey: "",
  kdfIterations: LEGACY_PBKDF2_ITERATIONS,
  kdf: LEGACY_KDF,
  authMode: "passcode",
  om2: { enabled: false, relayUrl: "", handle: "" },
};

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  // Number(null) is 0 — null and undefined must fall back, not clamp to min
  const n =
    value == null ? NaN : typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** clampInt without a fallback: a non-number just means "not remembered". */
function optInt(value: unknown, min: number, max: number): number | undefined {
  const n = typeof value === "number" && Number.isFinite(value) ? value : NaN;
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.round(value as number)));
}

const WALLPAPER_IDS = new Set([...WALLPAPERS.map((w) => w.id), "none", "custom"]);

export function sanitizeSettings(raw: unknown): MessengerSettings {
  const r = (raw ?? {}) as Partial<MessengerSettings>;
  const address =
    typeof r.address === "string" && ADDRESS_RE.test(r.address)
      ? r.address
      : DEFAULT_SETTINGS.address;
  const root =
    typeof r.root === "string" && r.root.trim()
      ? r.root.trim().replace(/^\/+|\/+$/g, "")
      : DEFAULT_SETTINGS.root;
  const cursors: Record<string, Cursor> = {};
  if (r.cursors && typeof r.cursors === "object") {
    for (const [key, value] of Object.entries(r.cursors)) {
      const c = value as Partial<Cursor> | null;
      if (
        c &&
        typeof c === "object" &&
        typeof c.id === "string" &&
        typeof c.ts === "string"
      ) {
        cursors[key] = { id: c.id, ts: c.ts };
      }
    }
  }
  const readAt: Record<string, string> = {};
  if (r.readAt && typeof r.readAt === "object") {
    for (const [key, value] of Object.entries(r.readAt)) {
      if (ADDRESS_RE.test(key) && typeof value === "string") readAt[key] = value;
    }
  }
  // "custom" is a global-only choice — a stale per-peer copy just falls back
  const wallpaperByPeer: Record<string, string> = {};
  if (r.wallpaperByPeer && typeof r.wallpaperByPeer === "object") {
    for (const [key, value] of Object.entries(r.wallpaperByPeer)) {
      if (
        ADDRESS_RE.test(key) &&
        typeof value === "string" &&
        WALLPAPER_IDS.has(value) &&
        value !== "custom"
      ) {
        wallpaperByPeer[key] = value;
      }
    }
  }
  // colors travel straight into a CSS var — keep to color syntax characters
  // so nothing else can ride along
  const safeColor = (value: unknown): string =>
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 40 &&
    /^[#(),.%\s\w-]+$/.test(value.trim())
      ? value.trim()
      : "";
  const wallpaperTintByPeer: Record<string, string> = {};
  if (r.wallpaperTintByPeer && typeof r.wallpaperTintByPeer === "object") {
    for (const [key, value] of Object.entries(r.wallpaperTintByPeer).slice(0, 500)) {
      if (ADDRESS_RE.test(key)) {
        const tint = safeColor(value);
        // "" is a real per-peer choice ("no tint here"), so it is kept too
        if (typeof value === "string" && (tint !== "" || value.trim() === "")) {
          wallpaperTintByPeer[key] = tint;
        }
      }
    }
  }
  const avatars: Record<string, string> = {};
  if (r.avatars && typeof r.avatars === "object") {
    for (const [key, value] of Object.entries(r.avatars).slice(0, 500)) {
      if (ADDRESS_RE.test(key) && typeof value === "string" && value.trim()) {
        avatars[key] = value.trim().slice(0, 500);
      }
    }
  }
  // keyed by peer address, boolean-valued — the only record type that repeats
  const flagRecord = (raw: unknown): Record<string, boolean> => {
    const out: Record<string, boolean> = {};
    if (raw && typeof raw === "object") {
      for (const [key, value] of Object.entries(raw).slice(0, 500)) {
        if (ADDRESS_RE.test(key) && value === true) out[key] = true;
      }
    }
    return out;
  };
  const mutedPeers = flagRecord(r.mutedPeers);
  const lockedPeers = flagRecord(r.lockedPeers);
  const drafts: Record<string, string> = {};
  if (r.drafts && typeof r.drafts === "object") {
    for (const [key, value] of Object.entries(r.drafts).slice(0, 100)) {
      if (ADDRESS_RE.test(key) && typeof value === "string") {
        drafts[key] = value.slice(0, 20000);
      }
    }
  }
  const recentEmoji: string[] = [];
  if (Array.isArray(r.recentEmoji)) {
    for (const code of r.recentEmoji) {
      if (recentEmoji.length >= 24) break;
      if (typeof code === "string" && code.trim()) {
        recentEmoji.push(code.trim().slice(0, 16));
      }
    }
  }
  // remembered sends for retransmission (SPEC §14): id-keyed, the id must
  // match the envelope, and every field is re-validated from scratch
  const unacked: Record<string, UnackedSend> = {};
  if (r.unacked && typeof r.unacked === "object") {
    for (const [key, value] of Object.entries(r.unacked).slice(0, 50)) {
      const u = value as Partial<UnackedSend> | null;
      const m = u?.message as Partial<MailEnvelope> | null | undefined;
      if (
        u &&
        typeof u === "object" &&
        m &&
        typeof m === "object" &&
        key.length <= 64 &&
        typeof m.id === "string" &&
        m.id === key &&
        typeof m.from === "string" &&
        ADDRESS_RE.test(m.from) &&
        typeof m.to === "string" &&
        ADDRESS_RE.test(m.to) &&
        typeof m.ts === "string" &&
        Number.isFinite(Date.parse(m.ts)) &&
        (m.replyTo === null || (typeof m.replyTo === "string" && m.replyTo.length <= 64)) &&
        typeof m.body === "string" &&
        typeof u.sentAt === "string" &&
        Number.isFinite(Date.parse(u.sentAt)) &&
        typeof u.attempts === "number" &&
        Number.isFinite(u.attempts)
      ) {
        // sealed copy (SPEC §15): keep only a well-formed seal — a broken one
        // would make the stored body undecryptable ciphertext either way
        const seal = m.enc as Partial<MailEnvelope["enc"]> | null | undefined;
        const enc =
          seal &&
          typeof seal === "object" &&
          seal.v === 1 &&
          typeof seal.iv === "string" &&
          seal.iv.length > 0 &&
          seal.iv.length <= 64
            ? { v: 1 as const, iv: seal.iv }
            : undefined;
        const exp =
          typeof m.exp === "string" && Number.isFinite(Date.parse(m.exp))
            ? m.exp
            : undefined;
        const bar =
          typeof m.bar === "number" &&
          Number.isFinite(m.bar) &&
          m.bar >= 1 &&
          m.bar <= MAX_BAR_SECONDS
            ? Math.round(m.bar)
            : undefined;
        const message: MailEnvelope = {
          id: m.id,
          from: m.from,
          to: m.to,
          ts: m.ts,
          replyTo: typeof m.replyTo === "string" ? m.replyTo : null,
          body: m.body.slice(0, 20000),
        };
        if (enc) message.enc = enc;
        if (exp) message.exp = exp;
        if (bar) message.bar = bar;
        unacked[key] = {
          message,
          sentAt: u.sentAt,
          attempts: Math.min(10, Math.max(0, Math.round(u.attempts))),
        };
      }
    }
  }
  // per-address retention overrides: address-keyed ints in the same ranges
  // as their globals. Junk values drop the entry (a fallback "default" here
  // would silently change what GC does to a peer); presence is the override.
  const intRecord = (
    raw: unknown,
    min: number,
    max: number
  ): Record<string, number> => {
    const out: Record<string, number> = {};
    if (raw && typeof raw === "object") {
      for (const [key, value] of Object.entries(raw).slice(0, 500)) {
        if (!ADDRESS_RE.test(key)) continue;
        const n = clampInt(value, min, max, NaN);
        if (Number.isFinite(n)) out[key] = n;
      }
    }
    return out;
  };
  const retentionDaysByPeer = intRecord(r.retentionDaysByPeer, 0, 3650);
  const maxInboxMessagesByPeer = intRecord(r.maxInboxMessagesByPeer, 0, 100000);
  // passcode + encryption material, validated as sets: a lone hash without
  // its salt, or a wrapped key without the salt or passcode it needs, can
  // never be opened — drop the orphan rather than leave a lock nobody undoes
  const passcodeHash =
    typeof r.passcodeHash === "string" && /^[0-9a-f]{64}$/.test(r.passcodeHash)
      ? r.passcodeHash
      : "";
  const passcodeSalt =
    typeof r.passcodeSalt === "string" && /^[0-9a-f]{32}$/.test(r.passcodeSalt)
      ? r.passcodeSalt
      : "";
  const keySalt =
    typeof r.keySalt === "string" && /^[0-9a-f]{32}$/.test(r.keySalt) ? r.keySalt : "";
  // iv(12) + AES-GCM(32-byte key + 16-byte tag) ≈ 80 base64 chars; slack allowed
  const wrappedKey =
    typeof r.wrappedKey === "string" &&
    r.wrappedKey.length >= 40 &&
    r.wrappedKey.length <= 200 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(r.wrappedKey)
      ? r.wrappedKey
      : "";
  // no passcodeHash requirement: with sealing on, the bundle alone is the
  // credential — a hash must not be demanded (it's deliberately absent in
  // new vaults, and requiring it would brick sealed ones on the next load)
  const encryptMail = r.encryptMail === true && keySalt !== "" && wrappedKey !== "";
  // vaults wrapped before the round count was persisted carry no field —
  // they were all sealed at the legacy count
  const kdfIterations = clampInt(
    r.kdfIterations,
    100_000,
    5_000_000,
    LEGACY_PBKDF2_ITERATIONS
  );
  // same absence-means-legacy rule for the KDF id itself
  const kdf: KdfId = r.kdf === "argon2id" ? "argon2id" : LEGACY_KDF;
  const authMode =
    encryptMail && r.authMode === "key" && passcodeHash === "" ? "key" : "passcode";
  return {
    address,
    displayName:
      typeof r.displayName === "string" ? r.displayName.trim().slice(0, 80) : "",
    onboarded: typeof r.onboarded === "boolean" ? r.onboarded : false,
    root,
    hiddenStorage:
      typeof r.hiddenStorage === "boolean"
        ? r.hiddenStorage
        : DEFAULT_SETTINGS.hiddenStorage,
    lastRoot: typeof r.lastRoot === "string" && r.lastRoot.trim() ? r.lastRoot : undefined,
    pollSeconds: clampInt(r.pollSeconds, 1, 3600, DEFAULT_SETTINGS.pollSeconds),
    retentionDays: clampInt(r.retentionDays, 0, 3650, DEFAULT_SETTINGS.retentionDays),
    maxInboxMessages: clampInt(
      r.maxInboxMessages,
      0,
      100000,
      DEFAULT_SETTINGS.maxInboxMessages
    ),
    retentionDaysByPeer,
    maxInboxMessagesByPeer,
    unacked,
    debug: typeof r.debug === "boolean" ? r.debug : DEFAULT_SETTINGS.debug,
    cursors,
    readAt,
    notifyPopup:
      typeof r.notifyPopup === "boolean" ? r.notifyPopup : DEFAULT_SETTINGS.notifyPopup,
    notifySound:
      typeof r.notifySound === "boolean" ? r.notifySound : DEFAULT_SETTINGS.notifySound,
    sendReadReceipts:
      typeof r.sendReadReceipts === "boolean"
        ? r.sendReadReceipts
        : DEFAULT_SETTINGS.sendReadReceipts,
    mutedPeers,
    whoCanReachMe: r.whoCanReachMe === "contacts" ? "contacts" : "everyone",
    drafts,
    attachmentsFolder:
      typeof r.attachmentsFolder === "string" &&
      r.attachmentsFolder.trim().replace(/^\/+|\/+$/g, "")
        ? r.attachmentsFolder.trim().replace(/^\/+|\/+$/g, "")
        : DEFAULT_SETTINGS.attachmentsFolder,
    keepOutbox:
      typeof r.keepOutbox === "boolean" ? r.keepOutbox : DEFAULT_SETTINGS.keepOutbox,
    stripHtml:
      typeof r.stripHtml === "boolean" ? r.stripHtml : DEFAULT_SETTINGS.stripHtml,
    wallpaper:
      typeof r.wallpaper === "string" && WALLPAPER_IDS.has(r.wallpaper)
        ? r.wallpaper
        : DEFAULT_SETTINGS.wallpaper,
    wallpaperByPeer,
    customWallpaperPath:
      typeof r.customWallpaperPath === "string"
        ? r.customWallpaperPath.trim().slice(0, 500)
        : "",
    wallpaperIntensity: clampInt(
      r.wallpaperIntensity,
      0,
      100,
      DEFAULT_SETTINGS.wallpaperIntensity
    ),
    wallpaperTint: safeColor(r.wallpaperTint),
    wallpaperTintByPeer,
    wallpaperTintStrength: clampInt(
      r.wallpaperTintStrength,
      0,
      100,
      DEFAULT_SETTINGS.wallpaperTintStrength
    ),
    bubbleAlpha: clampInt(
      r.bubbleAlpha,
      30,
      100,
      DEFAULT_SETTINGS.bubbleAlpha
    ),
    avatars,
    recentEmoji,
    passcodeHash,
    passcodeSalt,
    lockOnStart:
      typeof r.lockOnStart === "boolean" ? r.lockOnStart : DEFAULT_SETTINGS.lockOnStart,
    lockedPeers,
    encryptMail,
    keySalt: encryptMail ? keySalt : "",
    wrappedKey: encryptMail ? wrappedKey : "",
    kdfIterations: encryptMail ? kdfIterations : LEGACY_PBKDF2_ITERATIONS,
    kdf: encryptMail ? kdf : LEGACY_KDF,
    authMode: encryptMail ? authMode : "passcode",
    // remembered detached-window geometry (UI polish): finite integers in a
    // generous range — negative coordinates are legitimate on multi-monitor
    // setups, and the restore-time helper re-validates against live screens
    chatWinX: optInt(r.chatWinX, -32768, 32767),
    chatWinY: optInt(r.chatWinY, -32768, 32767),
    chatWinWidth: optInt(r.chatWinWidth, 320, 32767),
    chatWinHeight: optInt(r.chatWinHeight, 400, 32767),
    om2: sanitizeOm2(r.om2),
  };
}

/** Cross-vault mail settings: shape-checked field by field, defaults win otherwise. */
function sanitizeOm2(raw: unknown): MessengerSettings["om2"] {
  const r = (raw ?? {}) as Partial<MessengerSettings["om2"]>;
  const relayUrl =
    typeof r.relayUrl === "string" && /^https?:\/\//.test(r.relayUrl.trim())
      ? r.relayUrl.trim().replace(/\/+$/, "")
      : "";
  const handle =
    typeof r.handle === "string" && /^@[^@\s]+@[^@\s]+$/.test(r.handle.trim())
      ? r.handle.trim()
      : "";
  return {
    enabled: r.enabled === true && relayUrl !== "",
    relayUrl,
    handle,
  };
}
