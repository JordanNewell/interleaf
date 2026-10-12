import { App, Modal, Notice, Setting, TFile } from "obsidian";
import type ObsidianMessengerPlugin from "../main";
import { drawInviteQr, inviteQrPng } from "./qr-card";
import { decodeInvite, type ContactInvite } from "./invite";

/**
 * Cross-vault identity surfaces: the setup modal (passcode-gated create /
 * regenerate) and the identity card (fingerprint, invite code / link / QR).
 * The QR is rendered locally by the vendored encoder — nothing leaves the
 * vault by showing it.
 */

export class IdentitySetupModal extends Modal {
  private secret = "";
  private busy = false;
  private errorEl: HTMLElement | null = null;

  constructor(
    app: App,
    private plugin: ObsidianMessengerPlugin,
    private mode: "create" | "regenerate"
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("messenger-identity-setup");
    this.titleEl.setText(this.mode === "create" ? "Enable cross-vault mail" : "Regenerate identity");
    this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
      el.setText(
        this.mode === "create"
          ? "Cross-vault mail needs a signing keypair for this vault. Your unlock secret wraps it at rest — it never touches disk unwrapped."
          : "A new keypair replaces the old one. Every cross-vault contact must re-add you from your new invite — there is no silent re-pin (§5.3)."
      )
    );
    new Setting(this.contentEl)
      .setName("Unlock secret")
      .setDesc("The passcode (or vault key) that unlocks Messenger")
      .addText((t) => {
        t.inputEl.type = "password";
        t.setPlaceholder("Your unlock secret");
        t.onChange((v) => {
          this.secret = v;
          void this.paint();
        });
      });
    this.errorEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });
    new Setting(this.contentEl).addButton((b) => {
      b.setCta().setButtonText(this.mode === "create" ? "Create identity" : "Regenerate");
      b.buttonEl.disabled = true;
      b.onClick(() => void this.submit(b.buttonEl));
    });
  }

  private async paint(): Promise<void> {
    // CTA enables only for a plausible secret; the real check is verifyAuth
    const ctas = this.contentEl.querySelectorAll("button");
    ctas.forEach((el) => (el.disabled = this.secret.length < 4 || this.busy));
  }

  private async submit(btn: HTMLButtonElement): Promise<void> {
    if (this.busy || this.secret.length < 4) return;
    this.busy = true;
    btn.disabled = true;
    try {
      if (!(await this.plugin.verifyAuth(this.secret))) {
        if (this.errorEl) this.errorEl.setText("Wrong unlock secret.");
        this.busy = false;
        btn.disabled = false;
        return;
      }
      if (this.mode === "create") {
        this.plugin.settings.om2.enabled = true;
        await this.plugin.saveSettings();
        await this.plugin.createOm2Identity(this.secret);
        new Notice("Messenger: cross-vault mail is on — share your invite code", 8_000);
      } else {
        await this.plugin.regenerateOm2Identity(this.secret);
      }
      this.close();
    } catch (err) {
      if (this.errorEl) this.errorEl.setText(err instanceof Error ? err.message : String(err));
      this.busy = false;
      btn.disabled = false;
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class IdentityModal extends Modal {
  constructor(app: App, private plugin: ObsidianMessengerPlugin) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("messenger-identity-modal");
    this.titleEl.setText("Cross-vault identity");

    const invite = this.plugin.om2Invite();
    const fp = this.plugin.om2Fp;

    this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
      el.setText(
        "This is your cross-vault identity: a keypair whose fingerprint is who you are on relays. " +
          "Share the invite so people can reach this vault — trust still anchors in comparing safety numbers out-of-band."
      )
    );

    if (!fp || !invite) {
      this.contentEl.createDiv({ cls: "messenger-onboard-hint" }, (el) =>
        el.setText(
          "No live identity — enable Cross-vault mail (and set a relay) in Settings → Messenger first."
        )
      );
      return;
    }

    new Setting(this.contentEl).setName("Fingerprint").addText((t) => {
      t.setValue(fp).inputEl.readOnly = true;
    });

    const qrWrap = this.contentEl.createDiv({ cls: "messenger-invite-qr" });
    const canvas = qrWrap.createEl("canvas", { cls: "messenger-invite-qr-canvas" });
    const inviteObj = this.toInvite(invite);
    if (!inviteObj) {
      qrWrap.setText("(QR unavailable)");
      return;
    }
    try {
      drawInviteQr(canvas, inviteObj);
    } catch (err) {
      console.error("[message-bus] qr render failed", err);
      qrWrap.setText("(QR unavailable)");
    }

    const codeArea = this.contentEl.createEl("textarea", { cls: "messenger-invite-code" });
    codeArea.readOnly = true;
    codeArea.rows = 3;
    codeArea.value = invite.code;

    new Setting(this.contentEl)
      .addButton((b) =>
        b.setIcon("copy").setButtonText("Copy invite code").onClick(() => {
          void navigator.clipboard.writeText(invite.code);
          new Notice("Invite code copied");
        })
      )
      .addButton((b) =>
        b.setIcon("copy").setButtonText("Copy link").onClick(() => {
          void navigator.clipboard.writeText(invite.link);
          new Notice("Invite link copied");
        })
      )
      .addButton((b) =>
        b.setIcon("copy").setButtonText("Copy QR image").onClick(() => void this.copyQrImage(invite))
      )
      .addButton((b) =>
        b.setIcon("save").setButtonText("Save QR to vault").onClick(() => void this.saveQrToVault(invite))
      );
  }

  private toInvite(invite: { code: string; link: string }): ContactInvite | null {
    // re-parse the code — decodeInvite validates shape and normalizes the relay
    return decodeInvite(invite.code);
  }

  private async copyQrImage(invite: { code: string; link: string }): Promise<void> {
    const parsed = this.toInvite(invite);
    if (!parsed) return;
    try {
      const png = await inviteQrPng(parsed);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": new Blob([png], { type: "image/png" }) }),
      ]);
      new Notice("QR image copied");
    } catch (err) {
      console.error("[message-bus] qr copy failed", err);
      new Notice("Couldn't copy the image here — use “Save QR to vault” instead");
    }
  }

  private async saveQrToVault(invite: { code: string; link: string }): Promise<void> {
    const parsed = this.toInvite(invite);
    if (!parsed) return;
    try {
      const png = await inviteQrPng(parsed);
      const path = await uniqueVaultPath(this.plugin, "message-bus-invite-qr.png");
      await this.plugin.app.vault.createBinary(path, png);
      new Notice(`Saved to the vault: ${path}`);
    } catch (err) {
      new Notice(`Couldn't save: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/** A vault path that isn't taken yet: invite-qr.png, invite-qr-2.png, … */
async function uniqueVaultPath(plugin: ObsidianMessengerPlugin, filename: string): Promise<string> {
  const dot = filename.lastIndexOf(".");
  const base = dot >= 0 ? filename.slice(0, dot) : filename;
  const ext = dot >= 0 ? filename.slice(dot) : "";
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? filename : `${base}-${n}${ext}`;
    if (!(plugin.app.vault.getAbstractFileByPath(candidate) instanceof TFile)) return candidate;
  }
  return `${base}-${Date.now()}${ext}`;
}
