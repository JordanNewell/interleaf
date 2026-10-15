import { App, Modal, Notice, Setting, TFile, setIcon } from "obsidian";
import {
  ENCRYPTION_PASSCODE_MIN,
  PASSCODE_MIN,
  isStrongPasscode,
  isValidPasscode,
} from "./passcode";
import { normalizeVaultKey } from "./crypto";
import { ADDRESS_RE } from "./mailbox/envelope";
import { suggestAddress } from "./contacts";
import { isReservedAddress } from "./reserved";
import { decodeInvite, inviteFingerprint, type ContactInvite } from "./om2/invite";
import { aliasCandidate } from "./om2/alias";
import { fingerprint, fromB64u } from "./om2/crypto/keys";
import {
  deviceContactsAvailable,
  parseVcf,
  pickDeviceContacts,
  readVcfFile,
} from "./contact-import";
import type { PickedContact } from "./contact-import";
import type ObsidianMessengerPlugin from "./main";
import {
  conversationAttachments,
  findOrphans,
  isImageFile,
  parseEmbedTargets,
  resolveEmbedTarget,
} from "./attachments";

/** A destructive-action gate — confirm is the only path to the callback. */
export class ConfirmModal extends Modal {
  constructor(
    app: App,
    private opts: {
      title: string;
      message: string;
      cta: string;
      onConfirm: () => void | Promise<void>;
    }
  ) {
    super(app);
  }

  onOpen(): void {
    this.titleEl.setText(this.opts.title);
    this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
      el.setText(this.opts.message)
    );
    new Setting(this.contentEl)
      .addButton((b) =>
        b.setButtonText("Cancel").onClick(() => this.close())
      )
      .addButton((b) =>
        b
          .setButtonText(this.opts.cta)
          .setDestructive()
          .onClick(() => {
            this.close();
            void this.opts.onConfirm();
          })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/** Rename how a peer appears in conversation lists — the registry row. */
export class RenameAddressModal extends Modal {
  private value: string;
  private saving = false;

  constructor(
    app: App,
    private readonly address: string,
    private readonly currentName: string,
    private readonly onSave: (name: string) => Promise<void>
  ) {
    super(app);
    this.value = currentName;
  }

  onOpen(): void {
    this.titleEl.setText(`Rename ${this.address}`);
    new Setting(this.contentEl)
      .setName("Display name")
      .setDesc("Shown in conversation lists. Empty = use the address.")
      .addText((text) => {
        text.setValue(this.currentName).onChange((v) => (this.value = v.trim()));
        text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") void this.trySave();
        });
      });
    new Setting(this.contentEl).addButton((b) =>
      b.setCta().setButtonText("Save").onClick(() => void this.trySave())
    );
  }

  private async trySave(): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    try {
      await this.onSave(this.value);
      this.close();
    } finally {
      this.saving = false;
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/**
 * Ask for the existing unlock secret — the gate for unlocking-sensitive
 * actions (removing a conversation's lock, turning the passcode off, touching
 * the encryption key). `verify` decides correctness — it may be async, since
 * with encryption on every check is a full key unwrap; `onSuccess` runs only
 * after a correct entry and receives the entered secret (key work needs it).
 */
export class PasscodePromptModal extends Modal {
  private errorEl: HTMLElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private buttonEl: HTMLButtonElement | null = null;
  private busy = false;

  constructor(
    app: App,
    private opts: {
      title: string;
      desc?: string;
      cta?: string;
      placeholder?: string;
      verify: (input: string) => boolean | Promise<boolean>;
      onSuccess: (input: string) => void | Promise<void>;
    }
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("messenger-passcode-modal");
    this.titleEl.setText(this.opts.title);
    const desc = this.opts.desc;
    if (desc) {
      this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
        el.setText(desc)
      );
    }
    const placeholder = this.opts.placeholder ?? "Passcode";
    const input = this.contentEl.createEl("input", {
      cls: "messenger-passcode-input",
      type: "password",
      attr: {
        placeholder,
        "aria-label": placeholder,
        name: "messenger-secret",
        autocomplete: "current-password",
        autocapitalize: "off",
        autocorrect: "off",
        spellcheck: "false",
      },
    });
    this.inputEl = input;
    this.errorEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });
    new Setting(this.contentEl).addButton((b) => {
      b.setCta()
        .setButtonText(this.opts.cta ?? "Continue")
        .onClick(() => void this.tryContinue());
      this.buttonEl = b.buttonEl;
    });
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") void this.tryContinue();
    });
    window.setTimeout(() => input.focus(), 0);
  }

  private async tryContinue(): Promise<void> {
    const input = this.inputEl;
    if (!input || this.busy) return;
    const label = this.opts.placeholder ?? "passcode";
    this.busy = true;
    if (this.buttonEl) this.buttonEl.disabled = true;
    let ok = false;
    try {
      ok = await this.opts.verify(input.value);
    } finally {
      this.busy = false;
      if (this.buttonEl) this.buttonEl.disabled = false;
    }
    if (!ok) {
      this.errorEl?.setText(`Wrong ${label.toLowerCase()} — try again.`);
      input.select();
      return;
    }
    this.close();
    void this.opts.onSuccess(input.value);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/**
 * Set or change the passcode. Changing requires the current one first, so a
 * borrowed, unlocked session can't silently swap in a known code. While
 * encryption is on, the new passcode protects the vault key, so the stronger
 * floor (length, no digits-only) applies and the current one is verified by
 * unwrapping the key.
 */
export class SetPasscodeModal extends Modal {
  private current = "";
  private next = "";
  private confirm = "";
  private hintEl: HTMLElement | null = null;
  private ctaEl: HTMLButtonElement | null = null;
  private saving = false;

  constructor(
    app: App,
    private plugin: ObsidianMessengerPlugin,
    private readonly onSaved?: () => void
  ) {
    super(app);
  }

  /** The floor for the new passcode: the stronger one when it wraps a key. */
  private get strongRequired(): boolean {
    return this.plugin.isEncrypted();
  }

  private get minChars(): number {
    return this.strongRequired ? ENCRYPTION_PASSCODE_MIN : PASSCODE_MIN;
  }

  private validNext(): boolean {
    return this.strongRequired
      ? isStrongPasscode(this.next)
      : isValidPasscode(this.next);
  }

  onOpen(): void {
    this.modalEl.addClass("messenger-passcode-modal");
    const changing = this.plugin.hasPasscode();
    const keyMode = this.plugin.isKeyMode();
    this.titleEl.setText(
      changing ? (keyMode ? "Switch to passcode" : "Change passcode") : "Set a passcode"
    );
    this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
      el.setText(
        keyMode
          ? "Replace the generated vault key with a passcode you memorize. It will derive the encryption key — at least 8 characters, not digits-only; the stronger it is, the more a stolen backup is worth protecting."
          : this.strongRequired
            ? `This passcode derives the encryption key — it is the only thing standing between a stolen backup and your messages. At least ${ENCRYPTION_PASSCODE_MIN} characters, not digits-only; a stored-in-your-password-manager random string is even better.`
            : "The passcode locks Messenger on startup and guards conversations you lock. " +
              `At least ${PASSCODE_MIN} characters — it guards the app, it does not encrypt your mail.`
      )
    );

    if (changing) {
      new Setting(this.contentEl)
        .setName(keyMode ? "Current vault key" : "Current passcode")
        .addText((text) => {
          text.inputEl.type = "password";
          text.inputEl.autocomplete = "current-password";
          if (keyMode) text.setPlaceholder("XXXXX-XXXXX-XXXXX-XXXXX-XXXXX");
          text.onChange((v) => (this.current = v));
        });
    }

    new Setting(this.contentEl)
      .setName("New passcode")
      .addText((text) => {
        text.inputEl.type = "password";
        // new-password is the token that makes managers offer to SAVE the
        // secret at the moment it's created instead of trying to fill one
        text.inputEl.autocomplete = "new-password";
        text.onChange((v) => {
          this.next = v;
          this.validate();
        });
      });
    new Setting(this.contentEl)
      .setName("Confirm new passcode")
      .addText((text) => {
        text.inputEl.type = "password";
        text.inputEl.autocomplete = "new-password";
        text.onChange((v) => {
          this.confirm = v;
          this.validate();
        });
        text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") void this.trySave();
        });
      });

    this.hintEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });
    new Setting(this.contentEl).addButton((b) => {
      b.setCta().setButtonText("Save passcode").onClick(() => void this.trySave());
      this.ctaEl = b.buttonEl;
    });
    this.validate();
    window.setTimeout(() => {
      const first = this.contentEl.querySelector<HTMLInputElement>(
        "input[type='password']"
      );
      first?.focus();
    }, 0);
  }

  private validate(): void {
    let message = "";
    if (this.next || this.confirm) {
      if (!this.validNext()) {
        message = this.strongRequired
          ? `At least ${ENCRYPTION_PASSCODE_MIN} characters, not digits-only (max 64).`
          : `At least ${PASSCODE_MIN} characters (max 64).`;
      } else if (this.confirm && this.confirm !== this.next) {
        message = "Passcodes don't match yet.";
      }
    }
    this.hintEl?.setText(message);
    if (this.ctaEl) {
      this.ctaEl.disabled = !this.validNext() || this.next !== this.confirm;
    }
  }

  private async trySave(): Promise<void> {
    if (this.saving || !this.validNext() || this.next !== this.confirm) return;
    if (this.plugin.hasPasscode() && !(await this.plugin.verifyAuth(this.current))) {
      this.hintEl?.setText("Current passcode is wrong.");
      return;
    }
    this.saving = true;
    try {
      if (this.plugin.hasPasscode()) {
        // changePasscode re-wraps the vault key when encryption is on
        const ok = await this.plugin.changePasscode(this.current, this.next.trim());
        if (!ok) {
          this.hintEl?.setText(
            this.plugin.isKeyMode()
              ? "Wrong vault key — or the new passcode is too weak."
              : "Current passcode is wrong — or the new passcode is too weak."
          );
          return;
        }
      } else {
        await this.plugin.setPasscode(this.next.trim());
      }
      new Notice("Passcode saved");
      this.close();
      this.onSaved?.();
    } finally {
      this.saving = false;
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/**
 * The one-time reveal of a generated vault key: copy it to a password
 * manager, then prove the save by pasting it back. `apply` — the call that
 * actually switches encryption to this key — only runs after the paste
 * matches, so dismissing the modal changes nothing and strands nothing.
 * The key is never shown again; a lost one means the encrypted mail is
 * unrecoverable by design.
 */
export class VaultKeyModal extends Modal {
  private confirm = "";
  private hintEl: HTMLElement | null = null;
  private ctaEl: HTMLButtonElement | null = null;
  private applying = false;
  private applied = false;

  constructor(
    app: App,
    private readonly key: string,
    private readonly opts: {
      apply: (key: string) => Promise<void>;
      onDone: () => void;
    }
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("messenger-passcode-modal");
    this.titleEl.setText("Your vault key");
    this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
      el.setText(
        "This key encrypts your messages — Messenger cannot show it again. " +
          "Copy it into your password manager (or print it and lock it away) " +
          "now: if it is lost, the encrypted mail cannot be recovered by anyone."
      )
    );
    this.contentEl.createDiv({ cls: "messenger-vault-key" }, (el) =>
      el.setText(this.key)
    );
    new Setting(this.contentEl).addButton((b) =>
      b.setButtonText("Copy key").onClick(() => {
        void navigator.clipboard
          ?.writeText(this.key)
          .then(() => new Notice("Key copied"))
          .catch(() => new Notice("Copy failed — select the key manually"));
      })
    );
    new Setting(this.contentEl)
      .setName("Paste the key to confirm you saved it")
      .addText((text) => {
        text.setPlaceholder("XXXXX-XXXXX-XXXXX-XXXXX-XXXXX");
        // password-typed + new-password: managers that didn't catch the copy
        // still offer to save here, and the keyboard won't "helpfully"
        // capitalize or correct the pasted key
        text.inputEl.type = "password";
        text.inputEl.autocomplete = "new-password";
        text.inputEl.autocapitalize = "off";
        text.inputEl.setAttribute("autocorrect", "off");
        text.inputEl.spellcheck = false;
        text.onChange((v) => {
          this.confirm = v;
          this.validate();
        });
        text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") void this.finish();
        });
      });
    this.hintEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });
    new Setting(this.contentEl).addButton((b) => {
      b.setCta().setButtonText("Encrypt with this key").onClick(() => void this.finish());
      this.ctaEl = b.buttonEl;
    });
    this.validate();
  }

  private matches(): boolean {
    return normalizeVaultKey(this.confirm) === this.key;
  }

  private validate(): void {
    const typed = this.confirm.trim();
    this.hintEl?.setText(
      typed && !this.matches() ? "Doesn't match the generated key yet." : ""
    );
    if (this.ctaEl) this.ctaEl.disabled = !this.matches();
  }

  private async finish(): Promise<void> {
    if (!this.matches() || this.applying) return;
    this.applying = true;
    if (this.ctaEl) this.ctaEl.disabled = true;
    try {
      await this.opts.apply(this.key);
      this.applied = true;
      this.close();
    } catch (err) {
      new Notice(`Couldn't switch encryption: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.applying = false;
    }
  }

  onClose(): void {
    this.contentEl.empty();
    // refresh the settings display whether or not the switch went through
    this.opts.onDone();
  }
}

// -- add contacts (device picker, vCard, by hand) ----------------------------------

/** One reviewable row of the add-contact modal. */
export interface ContactDraft {
  name: string;
  address: string;
  include: boolean;
}

/**
 * Picked/imported contact → review draft, with an address suggested from
 * the email local part, phone digits, or name (de-duplicated against
 * everything that already owns an address here).
 */
export function draftFromPicked(
  picked: PickedContact,
  taken: Iterable<string>
): ContactDraft {
  return {
    name: picked.name || picked.email || picked.tel || "",
    address: suggestAddress(picked, taken),
    include: true,
  };
}

/**
 * Add contacts three ways: the system picker (where the webview has the
 * Contact Picker API — mobile mostly), a .vcf import everywhere, and a
 * by-hand row. Every path lands in the same review list — name and address
 * editable, junk skippable — because a device contact has no OM address;
 * the suggestion is a starting point, never a guess the user must accept.
 */
export interface AddContactOptions {
  /** A pasted/scanned invite code (`osinv1-…`) — opens straight on that person. */
  inviteCode?: string;
}

export class AddContactModal extends Modal {
  private drafts: ContactDraft[] = [];
  private taken = new Set<string>();
  private rowsEl: HTMLElement | null = null;
  private hintEl: HTMLElement | null = null;
  private ctaEl: HTMLButtonElement | null = null;
  private saving = false;
  private inviteInputEl: HTMLInputElement | null = null;
  private invitePanelEl: HTMLElement | null = null;

  constructor(
    app: App,
    private plugin: ObsidianMessengerPlugin,
    private options: AddContactOptions = {}
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("messenger-add-contact-modal");
    this.titleEl.setText("Add contacts");
    this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
      el.setText(
        "Pick people from this device's contacts, import a .vcf file, add one by hand — " +
          "or paste an invite code to reach a vault that shares nothing with this one. " +
          "A new contact starts as an invitation — it becomes mutual when they reply or you accept their request."
      )
    );
    void this.plugin.knownAddresses().then((rows) => {
      this.taken = new Set(rows.map((r) => r.address));
    });

    // the cross-vault route first: one paste (or a scanned QR) is a whole card
    const inviteWrap = this.contentEl.createDiv({ cls: "messenger-invite-paste" });
    new Setting(inviteWrap)
      .setName("Connect across vaults")
      .setDesc("Paste an invite code (osinv1-…) or a whole invite link / “DM me” text.")
      .addText((t) => {
        t.setPlaceholder("osinv1-…");
        this.inviteInputEl = t.inputEl;
        t.inputEl.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            void this.processInvite(this.inviteInputEl?.value ?? "");
          }
        });
      })
      .addButton((b) =>
        b.setCta().setButtonText("Connect").onClick(() => void this.processInvite(this.inviteInputEl?.value ?? ""))
      );
    this.invitePanelEl = this.contentEl.createDiv({ cls: "messenger-invite-panel" });

    if (deviceContactsAvailable()) {
      new Setting(this.contentEl).addButton((b) =>
        b
          .setIcon("users")
          .setButtonText("Choose from device contacts")
          .onClick(() => void this.pickFromDevice())
      );
    } else {
      this.contentEl.createDiv({ cls: "messenger-onboard-hint" }, (el) =>
        el.setText(
          "This device's contact picker isn't available here (desktop, or a webview without it) — import a .vcf file instead."
        )
      );
    }

    // the vCard route works everywhere there are files: hidden input, real button
    const fileInput = this.contentEl.createEl("input", {
      cls: "messenger-vcf-input",
      type: "file",
      attr: { accept: ".vcf,text/vcard", "aria-hidden": "true", tabindex: "-1" },
    });
    fileInput.addEventListener("change", () => void this.importVcf(fileInput));
    new Setting(this.contentEl)
      .addButton((b) =>
        b.setIcon("file-up").setButtonText("Import .vcf file").onClick(() => fileInput.click())
      )
      .addExtraButton((b) =>
        b.setIcon("user-plus").setTooltip("Add by hand").onClick(() => {
          this.drafts.push({ name: "", address: "", include: true });
          this.renderRows();
        })
      );

    this.rowsEl = this.contentEl.createDiv({ cls: "messenger-add-contact-rows" });
    this.hintEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });
    new Setting(this.contentEl).addButton((b) => {
      b.setCta().setButtonText("Add contacts").onClick(() => void this.save());
      this.ctaEl = b.buttonEl;
    });
    this.renderRows();

    if (this.options.inviteCode) {
      if (this.inviteInputEl) this.inviteInputEl.value = this.options.inviteCode;
      void this.processInvite(this.options.inviteCode);
    }
  }

  /** Decode a pasted code and render the cross-vault review panel. */
  private async processInvite(raw: string): Promise<void> {
    const panel = this.invitePanelEl;
    if (!panel || this.saving) return;
    const invite = decodeInvite(raw);
    if (!invite) {
      panel.empty();
      panel.createDiv({ cls: "messenger-passcode-error" }, (el) =>
        el.setText("No invite code found in that text.")
      );
      return;
    }
    if (!this.plugin.om2Ready) {
      panel.empty();
      panel.createDiv({ cls: "messenger-passcode-error" }, (el) =>
        el.setText(
          "Cross-vault mail isn't running — enable it and set a relay in Settings → Messenger → Cross-vault mail."
        )
      );
      return;
    }
    this.renderInviteReview(panel, invite);
  }

  /** Who the invite is, where they receive mail, and the request CTA. */
  private renderInviteReview(panel: HTMLElement, invite: ContactInvite): void {
    panel.empty();
    const fp = inviteFingerprint(invite);
    const suggestion = aliasCandidate({ fp, handle: invite.handle }, fromB64u(invite.publicKey));
    let name = invite.handle ? invite.handle.replace(/^@(.+)@.+$/, "$1") : suggestion;
    panel.createDiv({ cls: "messenger-confirm-text" }, (el) =>
      el.setText(
        `Inviter ${fp} — receives mail on ${invite.relay}. ` +
          `Accepting later proves key continuity, not identity: compare safety numbers out-of-band.`
      )
    );
    new Setting(panel)
      .setName("Name in your list")
      .addText((t) => {
        t.setValue(name);
        t.onChange((v) => (name = v.trim()));
      })
      .addButton((b) =>
        b
          .setCta()
          .setButtonText("Send contact request")
          .onClick((evt) => {
            const btn = evt.target as HTMLButtonElement | null;
            void this.sendInvite(invite, name, btn);
          })
      );
  }

  private async sendInvite(invite: ContactInvite, name: string, btn: HTMLButtonElement | null): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    if (btn) btn.disabled = true;
    try {
      const { fp } = await this.plugin.sendOm2Request(invite.publicKey, invite.relay);
      const keyBytes = fromB64u(invite.publicKey);
      let address = aliasCandidate({ fp, handle: invite.handle }, keyBytes);
      for (let n = 2; (this.taken.has(address) || isReservedAddress(address)) && n < 100; n++) {
        address = `${address}-${n}`.slice(0, 64);
      }
      await this.plugin.contacts.upsert({
        address,
        name: name || `${fp.slice(0, 11)}…`,
        state: "pending",
        updated: new Date().toISOString(),
        fp,
        publicKey: invite.publicKey,
        relays: [invite.relay],
      });
      new Notice("Request sent — you'll connect automatically when they accept");
      this.close();
    } catch (err) {
      new Notice(`Couldn't send the request: ${err instanceof Error ? err.message : String(err)}`);
      this.saving = false;
      if (btn) btn.disabled = false;
    }
  }

  private async pickFromDevice(): Promise<void> {
    const picked = await pickDeviceContacts();
    if (picked === null) {
      new Notice("Couldn't open this device's contacts picker");
      return;
    }
    if (picked.length > 0) this.addDrafts(picked);
  }

  private async importVcf(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = ""; // the same file can be re-picked after a failed review
    if (!file) return;
    try {
      const picked = parseVcf(await readVcfFile(file));
      if (picked.length === 0) {
        new Notice("No contacts found in that file");
        return;
      }
      this.addDrafts(picked);
    } catch (err) {
      new Notice(
        `Couldn't read the file: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  private addDrafts(picked: PickedContact[]): void {
    for (const contact of picked) {
      const draft = draftFromPicked(contact, this.taken);
      this.drafts.push(draft);
      // later rows must not suggest the slug an earlier row just claimed
      if (draft.address) this.taken.add(draft.address);
    }
    this.renderRows();
  }

  private renderRows(): void {
    const rowsEl = this.rowsEl;
    if (!rowsEl) return;
    rowsEl.empty();
    this.drafts.forEach((draft, i) => {
      const row = rowsEl.createDiv({ cls: "messenger-add-contact-row" });
      const check = row.createEl("input", {
        cls: "messenger-add-contact-check",
        type: "checkbox",
      });
      check.checked = draft.include;
      check.setAttribute("aria-label", "Include this contact");
      check.addEventListener("change", () => {
        draft.include = check.checked;
        this.paintValidity();
      });
      const name = row.createEl("input", {
        cls: "messenger-add-contact-name",
        type: "text",
        attr: { placeholder: "Name", "aria-label": "Contact name" },
      });
      name.value = draft.name;
      name.addEventListener("input", () => (draft.name = name.value.trim()));
      const address = row.createEl("input", {
        cls: "messenger-add-contact-address",
        type: "text",
        attr: {
          placeholder: "address",
          "aria-label": "Messenger address",
          autocapitalize: "off",
          autocorrect: "off",
          spellcheck: "false",
        },
      });
      address.value = draft.address;
      address.addEventListener("input", () => {
        draft.address = address.value.trim();
        row.toggleClass("is-invalid", !this.rowOk(draft));
        this.paintValidity();
      });
      row.toggleClass("is-invalid", !this.rowOk(draft));
      const remove = row.createEl("button", {
        cls: "messenger-add-contact-remove clickable-icon",
      });
      setIcon(remove, "x");
      remove.setAttribute("aria-label", "Remove this row");
      remove.addEventListener("click", () => {
        this.drafts.splice(i, 1);
        this.renderRows();
      });
    });
    this.paintValidity();
  }

  /** An included row is ok with a well-formed address; excluded rows always are. */
  private rowOk(draft: ContactDraft): boolean {
    return !draft.include || ADDRESS_RE.test(draft.address);
  }

  private paintValidity(): void {
    const invalid = this.drafts.filter((d) => d.include && !ADDRESS_RE.test(d.address));
    const valid = this.drafts.filter((d) => d.include && ADDRESS_RE.test(d.address));
    this.hintEl?.setText(
      invalid.length > 0 ? "Addresses use letters, digits, . _ and - (max 64)." : ""
    );
    if (this.ctaEl) this.ctaEl.disabled = valid.length === 0;
  }

  private async save(): Promise<void> {
    if (this.saving) return;
    const valid = this.drafts.filter((d) => d.include && ADDRESS_RE.test(d.address));
    if (valid.length === 0) return;
    this.saving = true;
    try {
      for (const draft of valid) await this.plugin.addContact(draft.address, draft.name);
      new Notice(valid.length === 1 ? "Contact added" : `${valid.length} contacts added`);
      this.close();
    } catch (err) {
      new Notice(
        `Couldn't add contact: ${err instanceof Error ? err.message : String(err)}`
      );
      this.saving = false;
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

// -- image lightbox --------------------------------------------------------------

/**
 * Which image (if any) a click inside the thread should zoom. Structural, not
 * instanceof-based, so it unit-tests under plain node: an <img> that lives in
 * a message bubble and is not wrapped in a link (linked images keep their
 * link). Returns the URL to show.
 */
export function lightboxSrc(target: unknown): string | null {
  if (!target || typeof target !== "object") return null;
  const el = target as {
    tagName?: unknown;
    src?: unknown;
    currentSrc?: unknown;
    closest?: (selector: string) => unknown;
  };
  if (typeof el.tagName !== "string" || el.tagName.toUpperCase() !== "IMG") {
    return null;
  }
  if (typeof el.closest !== "function") return null;
  if (!el.closest(".messenger-bubble")) return null; // avatars etc. stay put
  if (el.closest("a")) return null; // linked images navigate, not zoom
  const live = typeof el.currentSrc === "string" ? el.currentSrc : "";
  return live || (typeof el.src === "string" ? el.src : "") || null;
}

/**
 * Full-size view of an embedded image (attachments, vault embeds): the
 * picture centered on a dim backdrop, as large as it naturally is. Click the
 * backdrop or press Esc to close — Modal gives us both for free.
 */
export class ImageLightboxModal extends Modal {
  constructor(app: App, private readonly src: string) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("messenger-lightbox");
    const img = this.contentEl.createEl("img", {
      cls: "messenger-lightbox-img",
      attr: { src: this.src, alt: "Attached image" },
    });
    img.addEventListener("click", () => this.close());
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

// -- per-chat retention -----------------------------------------------------------

/**
 * The retention presets the picker offers (days; 0 = keep forever). Values
 * must stay inside the engine's sanitize bound (0..3650).
 */
export interface RetentionChoice {
  /** Stable dropdown value. */
  id: string;
  label: string;
  days: number;
}

export const RETENTION_PRESETS: RetentionChoice[] = [
  { id: "d1", label: "1 day", days: 1 },
  { id: "d7", label: "7 days", days: 7 },
  { id: "d30", label: "30 days", days: 30 },
  { id: "d365", label: "1 year", days: 365 },
  { id: "never", label: "Never", days: 0 },
];

/**
 * The picker's options for a conversation: the presets, plus a "custom"
 * entry when the stored override isn't one of them (a hand-edited data.json,
 * an older preset set) — the current value always shows as itself, never as
 * a silently-reinterpreted nearest preset.
 */
export function retentionChoices(currentDays: number | undefined): RetentionChoice[] {
  if (
    currentDays === undefined ||
    RETENTION_PRESETS.some((p) => p.days === currentDays)
  ) {
    return RETENTION_PRESETS;
  }
  return [
    ...RETENTION_PRESETS,
    { id: `d${currentDays}`, label: retentionDaysLabel(currentDays), days: currentDays },
  ];
}

/** Human label for a days value: 0 reads "Never", 1 "1 day", N "N days". */
export function retentionDaysLabel(days: number): string {
  if (days <= 0) return "Never";
  if (days === 1) return "1 day";
  if (days === 365) return "1 year";
  return `${days} days`;
}

/** Human label for an inbox cap: 0 reads "no limit". */
export function retentionCapLabel(cap: number): string {
  return cap <= 0 ? "no limit" : `max ${cap.toLocaleString()} messages`;
}

/**
 * What actually applies to one conversation given its overrides and the
 * global defaults — an override that leaves a dimension unset inherits the
 * global one (that is the engine's per-address policy contract).
 */
export function effectiveRetention(
  daysOverride: number | undefined,
  capOverride: number | undefined,
  defaults: { days: number; cap: number }
): { days: number; cap: number } {
  return {
    days: daysOverride ?? defaults.days,
    cap: capOverride ?? defaults.cap,
  };
}

/** Parse the cap field: an integer 0–100000, or null when it isn't one. */
export function parseRetentionCap(raw: string): number | null {
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.min(100000, Math.max(0, Math.round(n)));
}

/**
 * Set how long one conversation's mail is kept — the per-address override of
 * the global retention/inbox-cap settings (engine: gcPolicySource). Off =
 * this conversation inherits the defaults; the saved override always keeps
 * both dimensions explicit-or-inherited, so partial overrides behave like
 * they read. Data in, callback out: the caller owns settings and saving.
 */
export class PeerRetentionModal extends Modal {
  private override: boolean;
  private days: number;
  private capText: string;
  private hintEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private ctaEl: HTMLButtonElement | null = null;
  private saving = false;

  constructor(
    app: App,
    private readonly opts: {
      peer: string;
      name: string;
      current: { days?: number; cap?: number };
      /** The global retention defaults this override inherits from. */
      defaults: { days: number; cap: number };
      /** Both fields undefined = "reset to the global default". */
      onSave: (next: { days?: number; cap?: number }) => Promise<void>;
    }
  ) {
    super(app);
    this.override =
      opts.current.days !== undefined || opts.current.cap !== undefined;
    this.days = opts.current.days ?? opts.defaults.days;
    this.capText = opts.current.cap === undefined ? "" : String(opts.current.cap);
  }

  private get cap(): number | undefined {
    const t = this.capText.trim();
    if (t === "") return undefined; // inherit the global cap
    return parseRetentionCap(t) ?? -1; // -1 = invalid, blocks saving
  }

  private paintStatus(): void {
    const eff = this.override
      ? effectiveRetention(this.days, this.cap === -1 ? undefined : this.cap, this.opts.defaults)
      : effectiveRetention(undefined, undefined, this.opts.defaults);
    const whose = this.override ? "This conversation" : "Default policy";
    this.statusEl?.setText(
      `${whose}: ${retentionDaysLabel(eff.days)}, ${retentionCapLabel(eff.cap)}`
    );
    const bad = this.override && this.cap === -1;
    this.hintEl?.setText(
      bad ? "Inbox size limit must be a whole number (0 = no limit)." : ""
    );
    if (this.ctaEl) this.ctaEl.disabled = bad;
  }

  onOpen(): void {
    this.modalEl.addClass("messenger-retention-modal");
    this.titleEl.setText(`Retention — ${this.opts.name}`);
    this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
      el.setText(
        `How long mail in this conversation is kept. Cleanup runs hourly and applies to ${this.opts.peer}'s inbox, outbox, and receipts — other conversations keep the default policy.`
      )
    );
    this.statusEl = this.contentEl.createDiv({ cls: "messenger-onboard-hint" });
    this.statusEl.setText("");

    const controls = this.contentEl.createDiv();
    // chosen once from the starting value so a non-preset global (say 90
    // days) still shows itself instead of a nearest-preset lie
    const choices = retentionChoices(this.days);

    const setDisabled = (disabled: boolean): void => {
      for (const setting of [pickerSetting, capSetting]) {
        setting.settingEl.dataset.disabled = disabled ? "true" : "false";
      }
    };

    new Setting(controls)
      .setName("Custom policy for this conversation")
      .setDesc("Off = follow the defaults from Settings → Messenger.")
      .addToggle((toggle) =>
        toggle.setValue(this.override).onChange((value) => {
          this.override = value;
          setDisabled(!value);
          this.paintStatus();
        })
      );

    const pickerSetting = new Setting(controls)
      .setName("Keep messages for")
      .setDesc("Older messages are deleted during cleanup.")
      .addDropdown((drop) => {
        for (const choice of choices) drop.addOption(choice.id, choice.label);
        drop.setValue(choices.find((c) => c.days === this.days)?.id ?? "d30");
        drop.onChange((value) => {
          const choice = choices.find((c) => c.id === value);
          if (choice) this.days = choice.days;
          this.paintStatus();
        });
      });

    const capSetting = new Setting(controls)
      .setName("Inbox size limit")
      .setDesc(
        `Beyond this many messages the oldest go during cleanup. Empty = the default limit (${this.opts.defaults.cap === 0 ? "no limit" : this.opts.defaults.cap.toLocaleString()}); 0 = no limit.`
      )
      .addText((text) => {
        text.setPlaceholder("default");
        text.setValue(this.capText);
        text.inputEl.inputMode = "numeric";
        text.onChange((value) => {
          this.capText = value;
          this.paintStatus();
        });
      });

    if (!this.override) setDisabled(true);

    this.hintEl = this.contentEl.createDiv({ cls: "messenger-passcode-error" });

    new Setting(this.contentEl)
      .addButton((b) => {
        b.setCta().setButtonText("Save").onClick(() => void this.save());
        this.ctaEl = b.buttonEl;
      })
      .addExtraButton((b) =>
        b
          .setIcon("rotate-ccw")
          .setTooltip("Reset to default")
          .onClick(() => void this.save(true))
      );
    this.paintStatus();
  }

  private async save(reset = false): Promise<void> {
    if (this.saving) return;
    if (this.override && !reset && this.cap === -1) return;
    const next =
      reset || !this.override
        ? {}
        : { days: this.days, cap: this.cap === -1 ? undefined : this.cap };
    this.saving = true;
    try {
      await this.opts.onSave(next);
      if (reset) new Notice(`Retention for ${this.opts.name} reset to default`);
      this.close();
    } catch (err) {
      new Notice(
        `Couldn't save retention: ${err instanceof Error ? err.message : String(err)}`
      );
      this.saving = false;
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

// -- attachments -------------------------------------------------------------------

/** One tile of an attachments sheet: a vault file carried by a message. */
export interface SheetAttachmentItem {
  file: TFile;
  /** Sender address from the envelope. */
  from: string;
  ts: string;
}

/** Tile markup shared by the per-conversation sheet and the global browser. */
function renderAttachmentTile(
  app: App,
  container: HTMLElement,
  item: SheetAttachmentItem,
  senderLabel: string
): void {
  const { file, ts } = item;
  const tile = container.createDiv({ cls: "messenger-att-tile clickable-icon" });
  const when = new Date(ts);
  tile.setAttribute(
    "aria-label",
    `${file.name} — ${senderLabel}, ${when.toLocaleString()}`
  );
  tile.title = tile.getAttribute("aria-label") ?? file.name;
  if (isImageFile(file.name)) {
    tile.createEl("img", {
      cls: "messenger-att-img",
      attr: { src: app.vault.getResourcePath(file), alt: file.name },
    });
    tile.addEventListener("click", () => {
      new ImageLightboxModal(app, app.vault.getResourcePath(file)).open();
    });
  } else {
    setIcon(
      tile.createDiv({ cls: "messenger-att-file-icon" }),
      file.extension === "md" ? "file-text" : "file"
    );
    tile.createDiv({ cls: "messenger-att-file-ext" }, (el) =>
      el.setText(file.extension || "file")
    );
    tile.addEventListener("click", () => {
      void app.workspace.getLeaf(true).openFile(file);
    });
  }
}

/**
 * The iMessage-style media sheet for one conversation: every vault file any
 * message in the thread embeds, newest first. Sealed-and-locked messages
 * can't be scanned and are counted honestly instead of guessed at.
 */
export class ConversationAttachmentsModal extends Modal {
  constructor(
    app: App,
    private opts: {
      title: string;
      items: SheetAttachmentItem[];
      skippedSealed: number;
      senderLabel: (address: string) => string;
    }
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("messenger-attachments-modal");
    this.titleEl.setText(`Attachments — ${this.opts.title}`);
    if (this.opts.items.length === 0) {
      this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
        el.setText(
          this.opts.skippedSealed > 0
            ? "No readable attachments — sealed messages in this conversation weren't scanned."
            : "No attachments in this conversation yet. Drop or paste an image in the composer to send one."
        )
      );
      return;
    }
    const grid = this.contentEl.createDiv({ cls: "messenger-att-grid" });
    for (const item of this.opts.items) {
      renderAttachmentTile(this.app, grid, item, this.opts.senderLabel(item.from));
    }
    if (this.opts.skippedSealed > 0) {
      this.contentEl.createDiv({ cls: "messenger-att-note" }, (el) =>
        el.setText(
          `${this.opts.skippedSealed} sealed message${
            this.opts.skippedSealed === 1 ? "" : "s"
          } in this conversation weren't scanned.`
        )
      );
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

interface AttachmentGroup {
  address: string;
  label: string;
  items: SheetAttachmentItem[];
}

/**
 * Every attachment in the vault, grouped by conversation, plus the cleanup
 * handle: files in the attachments folder that no surviving message, draft,
 * or note still references (GC'd threads, burned mail, pasted-then-deleted
 * embeds). Blocked and passcode-locked conversations keep their files —
 * cleanup never deletes on their behalf — but aren't listed.
 */
export class AllAttachmentsModal extends Modal {
  private groups: AttachmentGroup[] = [];
  private orphans: TFile[] = [];

  constructor(app: App, private plugin: ObsidianMessengerPlugin) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("messenger-attachments-modal");
    this.titleEl.setText("Attachments");
    this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
      el.setText("Loading…")
    );
    void this.gather().then(() => this.render());
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private async gather(): Promise<void> {
    const app = this.app;
    const folder = this.plugin.settings.attachmentsFolder;
    const files = app.vault.getFiles();
    const fileByPath = new Map(files.map((f) => [f.path, f]));
    const refs = files.map((f) => ({ path: f.path, name: f.name }));
    const folderFiles = files.filter((f) => f.path.startsWith(`${folder}/`));
    const holders = new Set<string>();

    // conversations: registry names, contact states, and the merged threads
    const me = this.plugin.settings.address;
    const [registry, contactStates, addresses] = await Promise.all([
      this.plugin.store.readRegistry(),
      this.plugin.contacts.map(),
      this.plugin.store.listAddresses(),
    ]);
    const nameOf = (addr: string): string =>
      addr === me ? "You" : (registry.find((r) => r.address === addr)?.name ?? addr);
    for (const addr of addresses) {
      const { items } = conversationAttachments(
        await this.plugin.bus.loadConversation(me, addr),
        refs
      );
      const sheetItems: SheetAttachmentItem[] = [];
      for (const item of items) {
        holders.add(item.path);
        const file = fileByPath.get(item.path);
        if (file) sheetItems.push({ file, from: item.from, ts: item.ts });
      }
      const hidden =
        addr !== me &&
        (contactStates.get(addr)?.state === "blocked" ||
          this.plugin.isPeerLocked(addr));
      if (!hidden && sheetItems.length > 0) {
        this.groups.push({ address: addr, label: nameOf(addr), items: sheetItems });
      }
    }
    this.groups.sort((a, b) => {
      const last = (g: AttachmentGroup): string => g.items[0]?.ts ?? "";
      return last(b).localeCompare(last(a)) || a.address.localeCompare(b.address);
    });

    // drafts: a pasted-but-unsent image lives only in the draft text
    for (const draft of Object.values(this.plugin.settings.drafts)) {
      for (const target of parseEmbedTargets(draft)) {
        const path = resolveEmbedTarget(target, refs);
        if (path) holders.add(path);
      }
    }

    // every note's links — resolved ones by path, unresolved ones by name —
    // so an embed in an ordinary note can never count as an orphan
    const resolvedLinks = app.metadataCache.resolvedLinks;
    for (const targets of Object.values(resolvedLinks)) {
      for (const target of Object.keys(targets)) holders.add(target);
    }
    for (const sources of Object.values(app.metadataCache.unresolvedLinks)) {
      for (const link of Object.keys(sources)) {
        const path = resolveEmbedTarget(link, refs);
        if (path) holders.add(path);
      }
    }

    this.orphans = findOrphans(folderFiles, holders);
  }

  private render(): void {
    this.contentEl.empty();
    const folder = this.plugin.settings.attachmentsFolder;
    this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
      el.setText(
        this.groups.length === 0 && this.orphans.length === 0
          ? `No attachments anywhere yet — files land in ${folder}/ when you paste or drop one into a composer.`
          : `${this.groups.length} conversation${
              this.groups.length === 1 ? "" : "s"
            } · ${this.orphans.length} unreferenced file${
              this.orphans.length === 1 ? "" : "s"
            } in ${folder}/`
      )
    );

    for (const group of this.groups) {
      const head = this.contentEl.createDiv({ cls: "messenger-att-group" });
      head.createDiv({ cls: "messenger-att-group-name" }, (el) =>
        el.setText(group.label)
      );
      head.createDiv({ cls: "messenger-att-group-addr" }, (el) =>
        el.setText(group.address)
      );
      const grid = this.contentEl.createDiv({ cls: "messenger-att-grid" });
      for (const item of group.items) {
        renderAttachmentTile(
          this.app,
          grid,
          item,
          item.from === this.plugin.settings.address ? "You" : group.label
        );
      }
    }

    if (this.orphans.length > 0) {
      const head = this.contentEl.createDiv({ cls: "messenger-att-group" });
      setIcon(head.createDiv({ cls: "messenger-att-group-icon" }), "trash-2");
      head.createDiv({ cls: "messenger-att-group-name" }, (el) =>
        el.setText("Not referenced by any message, draft, or note")
      );
      const list = this.contentEl.createDiv({ cls: "messenger-att-orphans" });
      for (const file of this.orphans) {
        const row = list.createDiv({ cls: "messenger-att-orphan-row" });
        setIcon(row.createDiv({ cls: "messenger-att-orphan-icon" }), "file");
        const label = row.createDiv({ cls: "messenger-att-orphan-label" });
        label.createDiv({ cls: "messenger-att-orphan-name" }, (el) =>
          el.setText(file.name)
        );
        label.createDiv({ cls: "messenger-att-orphan-meta" }, (el) =>
          el.setText(
            `${formatBytes(file.stat.size)} · ${new Date(file.stat.mtime).toLocaleDateString()}`
          )
        );
      }
      new Setting(this.contentEl)
        .setDesc(
          "Unreferenced files are orphans of GC'd or burned messages, or embeds deleted before sending. Trashing them cannot be undone from here."
        )
        .addButton((b) =>
          b
            .setButtonText(`Move ${this.orphans.length} to trash`)
            .setDestructive()
            .onClick(() => this.confirmCleanup())
        );
    }
  }

  private confirmCleanup(): void {
    const count = this.orphans.length;
    if (count === 0) return;
    new ConfirmModal(this.app, {
      title: "Delete unreferenced attachments",
      message: `Move ${count} file${
        count === 1 ? "" : "s"
      } from the attachments folder to the system trash? Every surviving message, draft, and note was checked — nothing that links them remains.`,
      cta: "Move to trash",
      onConfirm: async () => {
        let moved = 0;
        for (const file of this.orphans) {
          try {
            await this.app.fileManager.trashFile(file);
            moved++;
          } catch (err) {
            console.warn("[interleaf] attachment cleanup skipped", file.path, err);
          }
        }
        new Notice(`Moved ${moved} file${moved === 1 ? "" : "s"} to trash`);
        this.groups = [];
        this.orphans = [];
        this.contentEl.empty();
        this.contentEl.createDiv({ cls: "messenger-confirm-text" }, (el) =>
          el.setText("Loading…")
        );
        void this.gather().then(() => this.render());
      },
    }).open();
  }
}

/** KB/MB with one decimal; bytes stay integers. */
function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
