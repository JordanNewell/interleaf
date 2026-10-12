import { App, Modal, Notice, Setting } from "obsidian";
import { ADDRESS_RE } from "./mailbox/envelope";
import { isReservedAddress } from "./reserved";
import { AddContactModal } from "./dialogs";
import {
  ENCRYPTION_PASSCODE_MIN,
  PASSCODE_MIN,
  isStrongPasscode,
  isValidPasscode,
} from "./passcode";
import type ObsidianMessengerPlugin from "./main";

/**
 * First-run welcome / sign-up: pick the address this vault knows you by,
 * optionally a display name, and — mandatory — a passcode. It is the first
 * level of security: Messenger asks for it on startup and guards any
 * conversation you lock. Closing without saving keeps onboarding open, so
 * the modal returns next launch until a passcode exists.
 */
export class OnboardingModal extends Modal {
  private address: string;
  private displayName = "";
  private passcode = "";
  private confirm = "";
  private encrypt = true;
  private saved = false;
  private saving = false;
  private ctaEl: HTMLButtonElement | null = null;
  private hintEl: HTMLElement | null = null;
  private passcodeHintEl: HTMLElement | null = null;
  /** Ignores stale async checks when the address changes faster than disk. */
  private checkToken = 0;
  /** Optional cross-vault mail (OM-2): off until toggled, needs a relay URL. */
  private om2Enabled = false;
  private om2Relay = "";
  private om2RelayEl: HTMLElement | null = null;

  constructor(
    app: App,
    private plugin: ObsidianMessengerPlugin
  ) {
    super(app);
    this.address = plugin.settings.address;
  }

  onOpen(): void {
    this.modalEl.addClass("messenger-onboard");
    this.titleEl.setText("Welcome to Messenger");

    this.contentEl.createDiv({ cls: "messenger-onboard-lede" }, (el) =>
      el.setText(
        "Pick the address this vault knows you by. Messages are markdown " +
          "notes inside your vault — nothing leaves it unless you later " +
          "share the mail folder or turn on cross-vault mail."
      )
    );

    new Setting(this.contentEl)
      .setName("Your address")
      .setDesc("Slug-like: letters, digits, dots, dashes, underscores.")
      .addText((text) => {
        text.setValue(this.address).onChange((value) => {
          this.address = value.trim();
          void this.validate();
        });
        text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") void this.trySave();
        });
      });

    new Setting(this.contentEl)
      .setName("Display name")
      .setDesc("Optional — shown in conversation lists instead of the raw address.")
      .addText((text) =>
        text
          .setPlaceholder(this.address)
          .setValue(this.plugin.settings.displayName)
          .onChange((value) => (this.displayName = value.trim()))
      );

    // -- Level 1 of security: the passcode is required to finish sign-up ------
    const passcodeDesc = (): string =>
      this.encrypt
        ? `Required — locks Messenger on startup, and with encryption on it also derives the encryption key, so it must hold up to guessing: at least ${ENCRYPTION_PASSCODE_MIN} characters, not digits-only.`
        : `Required — locks Messenger on startup and any conversation you lock. ` +
          `At least ${PASSCODE_MIN} characters. It guards the app, not the files: ` +
          `mail stays plain markdown in the vault.`;
    const passcodeSetting = new Setting(this.contentEl).setName("Passcode");
    passcodeSetting.descEl.setText(passcodeDesc());
    passcodeSetting.addText((text) => {
      text.inputEl.type = "password";
      // new-password → managers offer to save the passcode at sign-up
      text.inputEl.autocomplete = "new-password";
      text.onChange((value) => {
        this.passcode = value;
        void this.validate();
      });
    });

    new Setting(this.contentEl)
      .setName("Confirm passcode")
      .addText((text) => {
        text.inputEl.type = "password";
        text.inputEl.autocomplete = "new-password";
        text.onChange((value) => {
          this.confirm = value;
          void this.validate();
        });
        text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") void this.trySave();
        });
      });

    this.passcodeHintEl = this.contentEl.createDiv({ cls: "messenger-onboard-hint" });
    this.hintEl = this.contentEl.createDiv({ cls: "messenger-onboard-hint" });

    // seal bodies at rest with the key derived from the passcode just chosen
    new Setting(this.contentEl)
      .setName("Encrypt messages")
      .setDesc(
        "Recommended — store message bodies as ciphertext keyed by your passcode, " +
          "readable only in Messenger after unlocking. You can turn this off later in Settings."
      )
      .addToggle((toggle) =>
        toggle.setValue(this.encrypt).onChange((value) => {
          this.encrypt = value;
          passcodeSetting.descEl.setText(passcodeDesc());
          void this.validate();
        })
      );

    // -- optional, skippable: the first run's natural next step, offered —
    // never demanded. Contact entries are about other addresses, so they
    // save immediately and survive whatever happens to this modal.
    new Setting(this.contentEl)
      .setName("Add contacts")
      .setDesc(
        "Optional — from this device's contacts, a .vcf file, or by hand. " +
          "Invitations turn mutual when they reply. Skip freely; the people-plus " +
          "button in the chat does this anytime."
      )
      .addButton((button) =>
        button
          .setButtonText("Add contacts…")
          .onClick(() => new AddContactModal(this.app, this.plugin).open())
      );

    // -- optional, skippable: cross-vault mail. The relay URL is the only
    // input; the keypair mints under the passcode being set below, so the
    // secret is never asked twice.
    new Setting(this.contentEl)
      .setName("Cross-vault mail")
      .setDesc(
        "Optional — end-to-end-encrypted messaging to vaults that share nothing " +
          "with this one, through a relay (a dumb mailbox for sealed boxes it " +
          "cannot read). Self-host later with `npm run relay`; skip freely."
      )
      .addToggle((toggle) =>
        toggle.setValue(this.om2Enabled).onChange((value) => {
          this.om2Enabled = value;
          if (this.om2RelayEl) this.om2RelayEl.style.display = value ? "" : "none";
        })
      );
    const om2Wrap = this.contentEl.createDiv({ cls: "messenger-onboard-om2" });
    if (!this.om2Enabled) om2Wrap.style.display = "none";
    this.om2RelayEl = om2Wrap;
    new Setting(om2Wrap)
      .setName("Relay URL")
      .setDesc("Where your sealed mail waits — e.g. http://127.0.0.1:7788 for a local relay.")
      .addText((text) => {
        text.setPlaceholder("https://relay.example.com");
        text.setValue(this.om2Relay);
        text.onChange((value) => (this.om2Relay = value.trim().replace(/\/+$/, "")));
      });

    // Obsidian Sync skips dot-folders — a chat-only user on a synced vault
    // would silently never see mail on their other devices
    if (this.plugin.store.hidden && this.plugin.syncEnabled()) {
      this.contentEl.createDiv({ cls: "messenger-onboard-hint is-warn" }, (el) =>
        el.setText(
          "Obsidian Sync doesn't carry hidden folders — turn off “Hide mail " +
            "storage” in Settings → Messenger so your mail follows you between devices."
        )
      );
    }

    new Setting(this.contentEl).addButton((button) => {
      button.setCta().setButtonText("Start chatting").onClick(() => void this.trySave());
      this.ctaEl = button.buttonEl;
    });

    void this.validate();
  }

  /** Passcode fields are the gate: "" = fine, anything else explains itself. */
  private passcodeProblem(): string {
    if (!this.passcode && !this.confirm) {
      return `Set a passcode — required to finish sign-up (min ${PASSCODE_MIN} characters).`;
    }
    if (this.encrypt ? !isStrongPasscode(this.passcode) : !isValidPasscode(this.passcode)) {
      return this.encrypt
        ? `At least ${ENCRYPTION_PASSCODE_MIN} characters, not digits-only — it derives the encryption key.`
        : `At least ${PASSCODE_MIN} characters.`;
    }
    if (this.confirm !== this.passcode) {
      return "Passcodes don't match yet.";
    }
    return "";
  }

  private async trySave(): Promise<void> {
    if (
      !ADDRESS_RE.test(this.address) ||
      // a pre-existing identity keeps its name even after the list grows —
      // only *changes to* a reserved name refuse (SPEC §2 grandfathering)
      (isReservedAddress(this.address) &&
        this.address !== this.plugin.settings.address) ||
      this.passcodeProblem() !== "" ||
      this.saving
    ) {
      return;
    }
    if (this.om2Enabled && !/^https?:\/\//.test(this.om2Relay)) {
      // a toggle without a relay would silently never deliver — treat it as off
      this.om2Enabled = false;
    }
    this.saving = true;
    try {
      // save first, close second — a failure keeps the modal up to retry
      await this.plugin.completeOnboarding(
        this.address,
        this.displayName,
        this.passcode.trim(),
        this.encrypt,
        this.om2Enabled ? { relayUrl: this.om2Relay } : undefined
      );
      this.saved = true;
      this.close();
    } catch (err) {
      new Notice(`Couldn't save: ${err instanceof Error ? err.message : String(err)}`);
      this.saving = false;
    }
  }

  private async validate(): Promise<void> {
    const token = ++this.checkToken;
    const addr = this.address;
    const valid = ADDRESS_RE.test(addr);
    const reserved =
      isReservedAddress(addr) && addr !== this.plugin.settings.address;
    const problem = this.passcodeProblem();
    if (this.ctaEl) this.ctaEl.disabled = !valid || reserved || problem !== "";
    if (this.passcodeHintEl) this.passcodeHintEl.setText(problem);

    let message = "";
    let warn = false;
    if (!addr) {
      message = "Pick an address — it's how this vault reaches you.";
    } else if (!valid) {
      message = "Letters, digits, dots, dashes, underscores — up to 64 characters.";
    } else if (reserved) {
      message = `“${addr}” is reserved — no one can register it, so no mail can arrive looking official under it.`;
    } else {
      // adopting an address that already has mail is legitimate (upgrades,
      // re-runs) but the user should know they're continuing an identity
      let count = 0;
      try {
        count = (await this.plugin.store.readInbox(addr)).length;
      } catch {
        // mailbox not created yet — nothing to inherit
      }
      if (token !== this.checkToken) return;
      if (count > 0) {
        warn = true;
        message =
          addr === this.plugin.settings.address
            ? `You have ${count} message${count === 1 ? "" : "s"} here already.`
            : `“${addr}” already has ${count} message${count === 1 ? "" : "s"} on this bus — you'll continue that identity.`;
      }
    }
    if (this.hintEl) {
      this.hintEl.setText(message);
      this.hintEl.toggleClass("is-warn", warn);
    }
  }

  onClose(): void {
    if (this.saved) return;
    // no passcode, no completed sign-up: onboarding stays open and the
    // modal returns next launch
    void this.plugin.dismissOnboarding();
  }
}
