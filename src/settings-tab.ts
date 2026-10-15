import { App, Notice, PluginSettingTab } from "obsidian";
import type { Setting, SettingDefinitionItem, SettingGroupItem } from "obsidian";
import type ObsidianMessengerPlugin from "./main";
import { ADDRESS_RE } from "./mailbox/envelope";
import { isReservedAddress } from "./reserved";
import { chooseVaultImage } from "./appearance/avatar";
import { WALLPAPERS } from "./appearance/wallpaper";
import { PasscodePromptModal, SetPasscodeModal, VaultKeyModal } from "./dialogs";
import { AddContactModal } from "./dialogs";
import { IdentityModal, IdentitySetupModal } from "./om2/modals";
import {
  retentionCapLabel,
  retentionDaysLabel,
} from "./dialogs";
import { generateVaultKeyString } from "./crypto";
import type { ContactEntry } from "./contacts";

/** Stored tints may be any CSS color; the picker only accepts #rrggbb. */
const isHexColor = (s: string): boolean => /^#[0-9a-f]{6}$/i.test(s.trim());

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const n =
    value == null ? NaN : typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

/**
 * The settings tab, declared the 1.13 way: getSettingDefinitions() describes
 * every row (so Obsidian's settings search can index them), and simple
 * controls read/write plugin.settings through getControlValue /
 * setControlValue. Rows with bespoke flows — passcode modals, storage
 * migration, the async blocked-contact list — use `render` items and keep
 * their imperative Setting builders.
 */
export class MessengerSettingTab extends PluginSettingTab {
  private plugin: ObsidianMessengerPlugin;
  /** Blocked contacts load async; cached so definitions can read it sync. */
  private blockedContacts: ContactEntry[] = [];
  private blockedLoaded = false;

  constructor(app: App, plugin: ObsidianMessengerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * One line per conversation carrying a retention override, for the storage
   * section's readout — "curtis: 7 days, max 500 messages". Only dimensions
   * actually overridden are named.
   */
  private retentionOverrideLines(): string[] {
    const days = this.plugin.settings.retentionDaysByPeer;
    const caps = this.plugin.settings.maxInboxMessagesByPeer;
    const peers = [...new Set([...Object.keys(days), ...Object.keys(caps)])].sort();
    return peers.map((peer) => {
      const parts: string[] = [];
      if (days[peer] !== undefined) parts.push(retentionDaysLabel(days[peer]));
      if (caps[peer] !== undefined) parts.push(retentionCapLabel(caps[peer]));
      return `${peer}: ${parts.join(", ")}`;
    });
  }

  /**
   * Kick off (once) the async blocked-contact load; `update()` repaints when
   * it lands. The definitions below stay synchronous and read the cache.
   */
  private ensureBlockedContacts(): void {
    if (this.blockedLoaded) return;
    this.blockedLoaded = true;
    void this.plugin.listContacts().then((contacts) => {
      this.blockedContacts = contacts.filter((c) => c.state === "blocked");
      this.update();
    });
  }

  private hasBlockedContacts(): boolean {
    this.ensureBlockedContacts();
    return this.blockedContacts.length > 0;
  }

  // -- value plumbing -----------------------------------------------------------

  getControlValue(key: string): unknown {
    return (this.plugin.settings as unknown as Record<string, unknown>)[key];
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    const s = this.plugin.settings;
    switch (key) {
      case "displayName":
        s.displayName =
          typeof value === "string" ? value.trim().slice(0, 80) : "";
        await this.plugin.saveSettings();
        await this.plugin.store.upsertRegistry({
          address: s.address,
          name: this.plugin.selfRegistryName(),
          updated: new Date().toISOString(),
        });
        return;
      case "root": {
        const t =
          typeof value === "string" ? value.trim().replace(/^\/+|\/+$/g, "") : "";
        if (!t) return;
        s.root = t;
        if (!s.hiddenStorage) {
          this.plugin.store.setRoot(t);
          await this.plugin.store.ensureRoot();
        }
        break;
      }
      case "attachmentsFolder": {
        const t =
          typeof value === "string" ? value.trim().replace(/^\/+|\/+$/g, "") : "";
        if (!t) return;
        s.attachmentsFolder = t;
        break;
      }
      case "pollSeconds":
        s.pollSeconds = clampInt(value, 1, 3600, s.pollSeconds);
        break;
      case "retentionDays":
        s.retentionDays = clampInt(value, 0, 3650, s.retentionDays);
        break;
      case "maxInboxMessages":
        s.maxInboxMessages = clampInt(value, 0, 100000, s.maxInboxMessages);
        break;
      case "lockOnStart":
        s.lockOnStart = value === true;
        break;
      case "notifyPopup":
        s.notifyPopup = value === true;
        break;
      case "notifySound":
        s.notifySound = value === true;
        break;
      case "sendReadReceipts":
        s.sendReadReceipts = value === true;
        break;
      case "keepOutbox":
        s.keepOutbox = value === true;
        this.plugin.bus.keepOutbox = s.keepOutbox;
        break;
      case "stripHtml":
        s.stripHtml = value === true;
        break;
      case "debug":
        s.debug = value === true;
        break;
      case "whoCanReachMe":
        s.whoCanReachMe = value === "contacts" ? "contacts" : "everyone";
        break;
      case "om2RelayUrl": {
        const t = typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
        s.om2.relayUrl = /^https?:\/\//.test(t) ? t : "";
        // enabled only ever means "enabled AND reachable" — a cleared relay
        // silences the bridge until a URL is back
        s.om2.enabled = s.om2.enabled && s.om2.relayUrl !== "";
        await this.plugin.saveSettings();
        await this.plugin.stopOm2();
        await this.plugin.tryStartOm2();
        return;
      }
      case "om2Handle": {
        const t = typeof value === "string" ? value.trim() : "";
        s.om2.handle = /^@[^@\s]+@[^@\s]+$/.test(t) ? t : "";
        break;
      }
      case "wallpaper":
        if (typeof value === "string" && value) s.wallpaper = value;
        break;
      case "wallpaperIntensity":
        s.wallpaperIntensity = clampInt(value, 0, 100, s.wallpaperIntensity);
        break;
      case "wallpaperTintStrength":
        s.wallpaperTintStrength = clampInt(value, 0, 100, s.wallpaperTintStrength);
        break;
      case "bubbleAlpha":
        s.bubbleAlpha = clampInt(value, 30, 100, s.bubbleAlpha);
        break;
      default:
        return;
    }
    await this.plugin.saveSettings();
    if (key === "stripHtml" || key === "wallpaper") {
      this.plugin.refreshChatViews();
    }
    if (
      key === "wallpaperIntensity" ||
      key === "wallpaperTintStrength" ||
      key === "bubbleAlpha"
    ) {
      this.plugin.updateChatAppearance();
    }
    // the wallpaper's "Custom image…" row exists only after a re-render
    if (key === "wallpaper") this.update();
  }

  // -- definitions ---------------------------------------------------------------

  getSettingDefinitions(): SettingDefinitionItem[] {
    const plugin = this.plugin;
    const s = plugin.settings;
    const keyMode = plugin.isKeyMode();
    const hasPasscode = plugin.hasPasscode();
    const encrypted = plugin.isEncrypted();
    const repaint = (): void => this.update();

    /** A bare caption line: the row shell is emptied, the hint div drawn in. */
    const hintRow = (cls: string, text: string): SettingGroupItem => ({
      name: "",
      searchable: false,
      render: (setting) => {
        setting.settingEl.empty();
        setting.settingEl.createDiv({ cls }, (el) => el.setText(text));
      },
    });

    /** A monospace status line under a setting (per-chat retention overrides). */
    const statusRow = (line: string): SettingGroupItem => ({
      name: line,
      searchable: false,
      render: (setting) => {
        setting.settingEl.empty();
        setting.settingEl.createDiv({ cls: "messenger-setting-status" }, (el) =>
          el.setText(line)
        );
      },
    });

    const identity: SettingDefinitionItem = {
      type: "group",
      heading: "Identity",
      items: [
        {
          name: "Your address",
          desc: "The address other participants use to reach you. Changing it moves your inbox, read state, and registry entry with you — press Enter or leave the field to apply.",
          render: (setting) => {
            setting
              .setName("Your address")
              .setDesc(
                "The address other participants use to reach you. Changing it moves your inbox, read state, and registry entry with you — press Enter or leave the field to apply."
              )
              .addText((text) => {
                text.setValue(s.address);
                // migration is a real file move, so it commits on blur/Enter —
                // not on every keystroke
                const commit = async (): Promise<void> => {
                  const t = text.inputEl.value.trim();
                  if (t === s.address) return;
                  if (!ADDRESS_RE.test(t)) {
                    new Notice("Invalid address — keep it slug-like, e.g. owner");
                    text.inputEl.value = s.address;
                    return;
                  }
                  if (isReservedAddress(t)) {
                    new Notice(
                      `“${t}” is reserved — no one can register it or a handle built from it (SPEC §2)`
                    );
                    text.inputEl.value = s.address;
                    return;
                  }
                  try {
                    await plugin.changeAddress(t);
                    new Notice(`Now known as ${t}`);
                    repaint();
                  } catch (err) {
                    new Notice(
                      `Couldn't change address: ${err instanceof Error ? err.message : String(err)}`
                    );
                  }
                };
                text.inputEl.addEventListener("blur", () => void commit());
                text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void commit();
                  }
                });
              });
          },
        },
        {
          name: "Display name",
          desc: "Shown in conversation lists instead of the raw address. Empty = use the address.",
          control: {
            type: "text",
            key: "displayName",
          },
        },
      ],
    };

    const security: SettingDefinitionItem = {
      type: "group",
      heading: "Security — passcode & encryption",
      items: [
        {
          name: "Passcode",
          desc: keyMode
            ? "Messenger unlocks with a generated vault key kept in your password manager — no passcode is set."
            : encrypted
              ? "Your passcode derives the encryption key — it is verified by unwrapping that key, and nothing about it is stored on disk."
              : hasPasscode
                ? "A passcode is set. It locks Messenger on startup and guards conversations you lock (right-click a conversation → Lock conversation)."
                : "No passcode set — it is the first level of security: it locks Messenger on startup and guards conversations you lock. New vaults are asked for one during setup.",
          render: (setting) => {
            setting
              .setName("Passcode")
              .setDesc(
                keyMode
                  ? "Messenger unlocks with a generated vault key kept in your password manager — no passcode is set."
                  : encrypted
                    ? "Your passcode derives the encryption key — it is verified by unwrapping that key, and nothing about it is stored on disk."
                    : hasPasscode
                      ? "A passcode is set. It locks Messenger on startup and guards conversations you lock (right-click a conversation → Lock conversation)."
                      : "No passcode set — it is the first level of security: it locks Messenger on startup and guards conversations you lock. New vaults are asked for one during setup."
              )
              .addButton((btn) =>
                btn
                  .setButtonText(
                    keyMode
                      ? "Switch to passcode…"
                      : hasPasscode
                        ? "Change passcode…"
                        : "Set passcode…"
                  )
                  .onClick(() => new SetPasscodeModal(this.app, plugin, repaint).open())
              );
          },
        },
        {
          name: "Encrypt messages at rest",
          desc: encrypted
            ? "Message bodies are stored as AES-256-GCM ciphertext; the key exists only in memory after you unlock. A stolen copy of the vault (or its backup) is unreadable without your unlock secret. Turning this off decrypts every stored message."
            : hasPasscode
              ? "Store message bodies as ciphertext (AES-256-GCM) keyed by your passcode — readable only inside Messenger after unlocking. Turning it on re-encrypts all existing mail."
              : "Store message bodies as ciphertext (AES-256-GCM). Unlock with a generated vault key kept in your password manager — the strongest option, since the key can't be brute-forced or forgotten-guessed.",
          render: (setting) => {
            setting
              .setName("Encrypt messages at rest")
              .setDesc(
                encrypted
                  ? "Message bodies are stored as AES-256-GCM ciphertext; the key exists only in memory after you unlock. A stolen copy of the vault (or its backup) is unreadable without your unlock secret. Turning this off decrypts every stored message."
                  : hasPasscode
                    ? "Store message bodies as ciphertext (AES-256-GCM) keyed by your passcode — readable only inside Messenger after unlocking. Turning it on re-encrypts all existing mail."
                    : "Store message bodies as ciphertext (AES-256-GCM). Unlock with a generated vault key kept in your password manager — the strongest option, since the key can't be brute-forced or forgotten-guessed."
              )
              .addToggle((toggle) => {
                toggle.setValue(encrypted);
                toggle.onChange(async (value) => {
                  if (value === encrypted) return;
                  if (value) {
                    if (hasPasscode && !keyMode) {
                      new PasscodePromptModal(this.app, {
                        title: "Turn on encryption",
                        desc:
                          "Enter your passcode to mint the encryption key (at least 8 characters, not digits-only — change it first if it's weaker). Existing messages are re-written as ciphertext — this can take a moment on large mailboxes.",
                        cta: "Encrypt",
                        verify: (input) => plugin.verifyAuth(input),
                        onSuccess: async (passcode) => {
                          try {
                            await plugin.enableEncryption(passcode);
                          } catch (err) {
                            new Notice(
                              `Encryption failed: ${err instanceof Error ? err.message : String(err)}`
                            );
                          }
                          repaint();
                        },
                      }).open();
                    } else {
                      // no passcode: seal with a generated key revealed once below
                      const key = generateVaultKeyString();
                      new VaultKeyModal(this.app, key, {
                        apply: (k) => plugin.enableKeyEncryption(k),
                        onDone: repaint,
                      }).open();
                    }
                  } else {
                    new PasscodePromptModal(this.app, {
                      title: "Turn off encryption",
                      desc: keyMode
                        ? "Paste your vault key to decrypt every stored message back to plain markdown. This ends with no passcode set — add one afterwards if you want the app lock."
                        : "Enter your passcode to decrypt every stored message back to plain markdown.",
                      cta: "Decrypt",
                      placeholder: keyMode ? "Vault key" : undefined,
                      verify: (input) => plugin.verifyAuth(input),
                      onSuccess: async (secret) => {
                        try {
                          await plugin.disableEncryption(secret);
                        } catch (err) {
                          new Notice(
                            `Decryption failed: ${err instanceof Error ? err.message : String(err)}`
                          );
                        }
                        repaint();
                      },
                    }).open();
                  }
                });
              });
          },
        },
        {
          name: "Unlock method",
          desc: keyMode
            ? "Vault key — a 125-bit generated key in your password manager derives the encryption key. Brute-forcing it is out of reach for any attacker holding your files."
            : "Passcode — the encryption key is derived from your passcode (Argon2id, memory-hard). Its strength sets the real security of a stolen backup: use a long random passphrase, or switch to a generated vault key.",
          visible: encrypted,
          render: (setting) => {
            setting
              .setName("Unlock method")
              .setDesc(
                keyMode
                  ? "Vault key — a 125-bit generated key in your password manager derives the encryption key. Brute-forcing it is out of reach for any attacker holding your files."
                  : "Passcode — the encryption key is derived from your passcode (Argon2id, memory-hard). Its strength sets the real security of a stolen backup: use a long random passphrase, or switch to a generated vault key."
              )
              .addButton((btn) =>
                btn
                  .setButtonText(keyMode ? "Switch to passcode…" : "Switch to vault key…")
                  .onClick(() => {
                    if (keyMode) {
                      new SetPasscodeModal(this.app, plugin, repaint).open();
                      return;
                    }
                    new PasscodePromptModal(this.app, {
                      title: "Switch to vault key",
                      desc:
                        "Enter your current passcode once. A generated key replaces it as the unlock secret — store that key in your password manager when it is shown.",
                      cta: "Continue",
                      verify: (input) => plugin.verifyAuth(input),
                      onSuccess: async (current) => {
                        const key = generateVaultKeyString();
                        new VaultKeyModal(this.app, key, {
                          apply: (k) => plugin.switchToKeyMode(current, k),
                          onDone: repaint,
                        }).open();
                      },
                    }).open();
                  })
              );
          },
        },
        {
          name: "Regenerate vault key",
          desc: "Mint a fresh key — for rotation after a suspected leak, or a lost password-manager entry while still unlocked. No mail is re-encrypted; the old key stops working immediately.",
          visible: encrypted && keyMode,
          render: (setting) => {
            setting
              .setName("Regenerate vault key")
              .setDesc(
                "Mint a fresh key — for rotation after a suspected leak, or a lost password-manager entry while still unlocked. No mail is re-encrypted; the old key stops working immediately."
              )
              .addButton((btn) =>
                btn.setButtonText("Regenerate…").onClick(() => {
                  new PasscodePromptModal(this.app, {
                    title: "Regenerate vault key",
                    desc: "Paste your current vault key to mint a replacement.",
                    cta: "Continue",
                    placeholder: "Vault key",
                    verify: (input) => plugin.verifyAuth(input),
                    onSuccess: async (current) => {
                      const key = generateVaultKeyString();
                      new VaultKeyModal(this.app, key, {
                        apply: (k) => plugin.switchToKeyMode(current, k),
                        onDone: repaint,
                      }).open();
                    },
                  }).open();
                })
              );
          },
        },
        {
          name: "Lock Messenger on startup",
          desc: "Ask for the unlock secret before Messenger opens after Obsidian restarts. Conversations you locked ask for it either way.",
          visible: hasPasscode,
          control: {
            type: "toggle",
            key: "lockOnStart",
          },
        },
        {
          name: "Lock now",
          desc: "Immediately put Messenger behind the lock — handy when stepping away.",
          visible: hasPasscode,
          render: (setting) => {
            setting
              .setName("Lock now")
              .setDesc("Immediately put Messenger behind the lock — handy when stepping away.")
              .addButton((btn) =>
                btn.setButtonText("Lock").onClick(() => {
                  plugin.lockMessenger();
                  new Notice("Messenger locked");
                })
              );
          },
        },
        {
          name: "Remove passcode",
          desc: encrypted
            ? "Turn off message encryption first — a passcode cannot be removed while it protects the encryption key."
            : "Turn the passcode off entirely. Conversation locks are removed with it — there would be nothing to unlock them with.",
          visible: hasPasscode && !keyMode,
          render: (setting) => {
            setting
              .setName("Remove passcode")
              .setDesc(
                encrypted
                  ? "Turn off message encryption first — a passcode cannot be removed while it protects the encryption key."
                  : "Turn the passcode off entirely. Conversation locks are removed with it — there would be nothing to unlock them with."
              )
              .addButton((btn) =>
                btn
                  .setDestructive()
                  .setButtonText("Remove…")
                  .setDisabled(encrypted)
                  .onClick(() =>
                    new PasscodePromptModal(this.app, {
                      title: "Remove passcode",
                      desc: "Enter your current passcode to turn all Messenger locks off.",
                      cta: "Remove passcode",
                      verify: (input) => plugin.verifyAuth(input),
                      onSuccess: async () => {
                        try {
                          await plugin.clearPasscode();
                          new Notice("Passcode removed");
                        } catch (err) {
                          new Notice(
                            err instanceof Error ? err.message : String(err)
                          );
                        }
                        repaint();
                      },
                    }).open()
                  )
              );
          },
        },
        hintRow(
          "messenger-onboard-hint",
          encrypted
            ? "Encryption covers message bodies at rest: a stolen vault or backup shows only ciphertext, and no fast passcode verifier is stored — every guess an attacker makes costs a full key derivation. Envelope metadata (sender, recipient, time) stays readable so the bus keeps working, and anything running inside Obsidian still reads mail through the API once unlocked. For the outer layer, enable your device's own lock — Obsidian mobile's app lock / biometrics, or your OS user password on desktop; plugins can't trigger those themselves."
            : "Level-1 security: the passcode keeps casual snoops out of the Messenger app, but without encryption messages remain plain markdown files in your vault (SPEC §8). For the outer layer, enable your device's own lock — Obsidian mobile's app lock / biometrics, or your OS user password on desktop; plugins can't trigger those themselves."
        ),
      ],
    };

    const appearance: SettingDefinitionItem = {
      type: "group",
      heading: "Appearance",
      items: [
        {
          name: "Chat wallpaper",
          desc: "Background art behind conversations. Each conversation can pick its own from the image button in the chat header.",
          control: {
            type: "dropdown",
            key: "wallpaper",
            options: {
              none: "None",
              ...Object.fromEntries(WALLPAPERS.map((w) => [w.id, w.name])),
              custom: "Custom image…",
            },
          },
        },
        {
          name: "Wallpaper image",
          desc:
            s.customWallpaperPath ||
            "Not set — chats show a plain background until an image is chosen.",
          visible: s.wallpaper === "custom",
          render: (setting) => {
            setting
              .setName("Wallpaper image")
              .setDesc(
                s.customWallpaperPath ||
                  "Not set — chats show a plain background until an image is chosen."
              )
              .addButton((btn) =>
                btn.setButtonText("Choose image").onClick(async () => {
                  const path = await chooseVaultImage(this.app);
                  if (path === null) return;
                  s.customWallpaperPath = path;
                  await plugin.saveSettings();
                  plugin.refreshChatViews();
                  repaint();
                })
              );
          },
        },
        {
          name: "Wallpaper intensity",
          desc: "How strongly the wallpaper art shows over your theme. 0% is the pure theme.",
          control: {
            type: "slider",
            key: "wallpaperIntensity",
            min: 0,
            max: 100,
            step: 5,
          },
        },
        {
          name: "Tint color",
          desc: "A soft color wash over conversations (works without a wallpaper; each chat can pick its own from the header menu).",
          render: (setting) => {
            const tint = s.wallpaperTint;
            setting
              .setName("Tint color")
              .setDesc(
                "A soft color wash over conversations (works without a wallpaper; " +
                  "each chat can pick its own from the header menu)."
              )
              .addColorPicker((picker) =>
                picker
                  .setValue(isHexColor(tint) ? tint : "#8a9bb8")
                  .onChange(async (value) => {
                    s.wallpaperTint = value;
                    await plugin.saveSettings();
                    plugin.updateChatAppearance();
                  })
              )
              .addExtraButton((btn) =>
                btn
                  .setIcon("rotate-ccw")
                  .setTooltip("Clear tint")
                  .onClick(async () => {
                    s.wallpaperTint = "";
                    await plugin.saveSettings();
                    plugin.updateChatAppearance();
                    repaint();
                  })
              );
          },
        },
        {
          name: "Tint strength",
          desc: "How strongly the tint color washes over the chat.",
          control: {
            type: "slider",
            key: "wallpaperTintStrength",
            min: 0,
            max: 100,
            step: 5,
          },
        },
        {
          name: "Bubble opacity",
          desc: "How opaque message bubbles sit over wallpaper and tint. Lower shows more of the background.",
          control: {
            type: "slider",
            key: "bubbleAlpha",
            min: 30,
            max: 100,
            step: 1,
          },
        },
        {
          name: "Your profile picture",
          desc:
            (s.avatars[s.address] ? `Current: ${s.avatars[s.address]}. ` : "") +
            "A vault image shown beside your messages in conversations you're in; without one you get a generated gradient with your initials.",
          render: (setting) => {
            const myAvatar = s.avatars[s.address];
            setting
              .setName("Your profile picture")
              .setDesc(
                (myAvatar ? `Current: ${myAvatar}. ` : "") +
                  "A vault image shown beside your messages in conversations you're in; " +
                  "without one you get a generated gradient with your initials."
              )
              .addButton((btn) =>
                btn.setButtonText("Choose image").onClick(async () => {
                  const path = await chooseVaultImage(this.app);
                  if (path === null) return;
                  s.avatars[s.address] = path;
                  await plugin.saveSettings();
                  plugin.refreshChatViews();
                  repaint();
                })
              )
              .addButton((btn) =>
                btn
                  .setButtonText("Clear")
                  .setDisabled(!myAvatar)
                  .onClick(async () => {
                    delete s.avatars[s.address];
                    await plugin.saveSettings();
                    plugin.refreshChatViews();
                    repaint();
                  })
              );
          },
        },
      ],
    };

    const storage: SettingDefinitionItem = {
      type: "group",
      heading: "Mail storage & delivery",
      items: [
        {
          name: "Hide mail storage",
          desc:
            "Keep inboxes in a hidden app folder (" +
            `${this.app.vault.configDir}/plugins/interleaf/mailbox` +
            ") so the vault stays clean — users just chat, and the markdown stays out of sight. " +
            "Turn off to store mail as normal vault notes in the folder below " +
            "(the visible folder is also what Obsidian Sync carries between devices; " +
            "iCloud/Dropbox/Syncthing-style folder sync works either way).",
          render: (setting) => {
            setting
              .setName("Hide mail storage")
              .setDesc(
                "Keep inboxes in a hidden app folder (" +
                  `${this.app.vault.configDir}/plugins/interleaf/mailbox` +
                  ") so the vault stays clean — users just chat, and the markdown stays out of sight. " +
                  "Turn off to store mail as normal vault notes in the folder below " +
                  "(the visible folder is also what Obsidian Sync carries between devices; " +
                  "iCloud/Dropbox/Syncthing-style folder sync works either way)."
              )
              .addToggle((toggle) =>
                toggle.setValue(s.hiddenStorage).onChange(async (value) => {
                  // the migration moves real files — not toggleable mid-run
                  toggle.setDisabled(true);
                  try {
                    await plugin.applyStorageMode(value);
                  } finally {
                    toggle.setDisabled(false);
                  }
                  repaint();
                })
              );
          },
        },
        hintRow(
          "messenger-onboard-hint is-warn",
          "Obsidian Sync is on, but it doesn't carry hidden folders — turn off " +
            "“Hide mail storage” so your mail follows you between devices."
        ),
        {
          name: "Mailbox root folder",
          desc: "Folder holding one inbox.md per address (when storage is visible). Created if missing.",
          control: {
            type: "text",
            key: "root",
            validate: (value) => (value.trim() ? undefined : "Name a folder."),
          },
        },
        {
          name: "Attachments folder",
          desc: "Visible vault folder for images pasted or dropped into the composer. Created if missing.",
          control: {
            type: "text",
            key: "attachmentsFolder",
            validate: (value) => (value.trim() ? undefined : "Name a folder."),
          },
        },
        {
          name: "Poll interval (seconds)",
          desc: "Idle seconds between inbox checks (1–3600). Window focus, sending, and landed sync writes all check sooner. Default 5.",
          control: {
            type: "number",
            key: "pollSeconds",
            min: 1,
            max: 3600,
            step: 1,
          },
        },
        {
          name: "Retention (days)",
          desc: "Messages older than this are deleted during hourly cleanup. 0 disables. Per-conversation overrides: right-click a conversation → Retention…",
          control: {
            type: "number",
            key: "retentionDays",
            min: 0,
            max: 3650,
            step: 1,
          },
        },
        // compact overview of the per-conversation overrides, when any exist
        ...this.retentionOverrideLines().map(statusRow),
        {
          name: "Inbox size limit",
          desc: "Keep inboxes fast and cheap to sync: beyond this many messages per inbox, the oldest are deleted during hourly cleanup regardless of age. 0 disables.",
          control: {
            type: "number",
            key: "maxInboxMessages",
            min: 0,
            max: 100000,
            step: 1,
          },
        },
      ],
    };

    const notifications: SettingDefinitionItem = {
      type: "group",
      heading: "Notifications & receipts",
      items: [
        {
          name: "Pop up on new messages",
          desc: "Show a clickable notice when mail arrives for you. Clicking it opens the conversation.",
          control: { type: "toggle", key: "notifyPopup" },
        },
        {
          name: "Sound on new messages",
          desc: "Play a short synthesized chime when mail arrives for you (no audio files needed).",
          control: { type: "toggle", key: "notifySound" },
        },
        {
          name: "Send read receipts",
          desc: "Let senders see ✓✓ when you have read their mail. Delivery receipts (✓) are always sent.",
          control: { type: "toggle", key: "sendReadReceipts" },
        },
        {
          name: "Keep a copy of sent mail",
          desc: "Append outgoing messages to your own outbox.md (SPEC §13) so sent history survives even if the recipient's folder is deleted. Off by default — your half of a conversation already lives in the recipient's inbox.",
          control: { type: "toggle", key: "keepOutbox" },
        },
        {
          name: "Escape raw HTML in messages",
          desc: "Best-effort removal of script/iframe/handler markup from rendered message bodies. Off by default — inbound mail renders like any vault note, and anything on the bus is written by things you already trust.",
          control: { type: "toggle", key: "stripHtml" },
        },
        {
          name: "Debug notifications",
          desc: "Show a notice whenever the loop processes messages.",
          control: { type: "toggle", key: "debug" },
        },
      ],
    };

    // blocked conversations are invisible everywhere else — this is the way
    // back; the rows appear once the async contact load lands
    const blockedVisible = (): boolean => this.hasBlockedContacts();
    const contacts: SettingDefinitionItem = {
      type: "group",
      heading: "Contacts & privacy",
      items: [
        {
          name: "Who can reach me",
          desc: "Everyone: mail from strangers lands under quiet Contact requests. Contacts only: the conversation list keeps to people you've added. Mail written straight to the vault's files can always land (SPEC §8) — there the gate is quiet, not absent.",
          control: {
            type: "dropdown",
            key: "whoCanReachMe",
            options: { everyone: "Everyone", contacts: "Contacts only" },
          },
        },
        {
          name: "Add contacts",
          desc: "From this device's contacts picker (where the system provides one), a .vcf file, or by hand.",
          render: (setting) => {
            setting
              .setName("Add contacts")
              .setDesc(
                "From this device's contacts picker (where the system provides one), a .vcf file, or by hand."
              )
              .addButton((btn) =>
                btn
                  .setButtonText("Add contacts…")
                  .onClick(() => new AddContactModal(this.app, plugin).open())
              );
          },
        },
        {
          name: "Blocked addresses",
          desc: "Unblocking returns the conversation as a contact request to review again.",
          searchable: false,
          visible: blockedVisible,
        },
        ...this.blockedContacts.map(
          (entry): SettingGroupItem => ({
            name: entry.address,
            desc: entry.name === entry.address ? "" : entry.name,
            searchable: false,
            visible: blockedVisible,
            render: (setting: Setting) => {
              setting
                .setName(entry.address)
                .setDesc(entry.name === entry.address ? "" : entry.name)
                .addButton((b) =>
                  b.setButtonText("Unblock").onClick(() =>
                    void plugin
                      .unblockContact(entry.address)
                      .then(() => {
                        this.blockedContacts = this.blockedContacts.filter(
                          (c) => c.address !== entry.address
                        );
                        repaint();
                      })
                  )
                );
            },
          })
        ),
      ],
    };

    // Cross-vault mail (OM-2): transport for vaults that share nothing. The
    // identity row is bespoke — creating/regenerating needs the unlock secret,
    // so it opens its own modal rather than a bare toggle.
    const om2: SettingDefinitionItem = {
      type: "group",
      heading: "Cross-vault mail",
      items: [
        {
          name: "Enable cross-vault mail",
          desc: "Keypair identity + end-to-end-encrypted delivery through a relay — talk to vaults that share no folder with this one. Turning it on creates your signing key (wrapped under your unlock secret).",
          render: (setting) => {
            setting
              .setName("Enable cross-vault mail")
              .setDesc(
                "Keypair identity + end-to-end-encrypted delivery through a relay — talk to vaults that share no folder with this one. Turning it on creates your signing key (wrapped under your unlock secret)."
              )
              .addToggle((t) =>
                t
                  .setValue(s.om2.enabled)
                  .onChange((value) =>
                    void (async () => {
                      if (value) {
                        new IdentitySetupModal(this.app, plugin, "create").open();
                      } else {
                        s.om2.enabled = false;
                        await plugin.saveSettings();
                        await plugin.disableOm2();
                        this.update();
                      }
                    })()
                  )
              );
          },
        },
        {
          name: "Relay URL",
          desc: "Where your inbound mail waits (a dumb per-fingerprint mailbox for sealed boxes — it cannot read anything). Self-host one with `npm run relay`.",
          control: { type: "text", key: "om2RelayUrl" },
        },
        {
          name: "Handle (optional)",
          desc: "A name like @alice@example.com that rides along with your mail as from2, so contacts see a name instead of a fingerprint.",
          control: { type: "text", key: "om2Handle" },
        },
        {
          name: "Your identity",
          render: (setting) => {
            setting
              .setName("Your identity")
              .setDesc(
                plugin.om2Fp
                  ? `Live — ${plugin.om2Fp}. The invite code / QR is what you share.`
                  : "Not created yet — enable cross-vault mail above to mint one."
              )
              .addButton((btn) =>
                btn
                  .setButtonText("Show invite / QR…")
                  .onClick(() => new IdentityModal(this.app, plugin).open())
              )
              .addExtraButton((btn) =>
                btn
                  .setIcon("refresh-cw")
                  .setTooltip("Regenerate keypair (every contact must re-add you)")
                  .onClick(() => new IdentitySetupModal(this.app, plugin, "regenerate").open())
              );
          },
        },
      ],
    };

    return [identity, security, appearance, storage, notifications, contacts, om2];
  }
}
