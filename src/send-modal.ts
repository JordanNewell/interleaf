import { App, FuzzySuggestModal, Modal, Notice, Setting } from "obsidian";
import type { FuzzyMatch } from "obsidian";
import { ADDRESS_RE } from "./mailbox/envelope";
import { isReservedAddress } from "./reserved";

export type AddressProvider = () => Promise<Array<{ address: string; name: string }>>;

/**
 * What the bus knows about a recipient, for the live hint: `self` is the
 * sender's own address, `confirmed` means the address has proven it reads
 * this bus (mail from it has arrived here, or it publishes receipts).
 */
export interface RecipientStatus {
  self: boolean;
  confirmed: boolean;
}

export type HintTone = "info" | "ok" | "warn" | "error";

export interface RecipientHint {
  tone: HintTone;
  text: string;
}

/**
 * The live status line under the To field. The bus appends mail whether or
 * not a human ever reads it (SPEC §8) — on a device whose mail folder isn't
 * shared/synced with anyone, that silence is the whole experience. This
 * turns the send-into-the-void trap into a visible warning before Send,
 * without ever blocking legitimate first contact.
 */
export function recipientHint(
  to: string,
  status: RecipientStatus | null
): RecipientHint {
  if (!to) return { tone: "info", text: "" };
  if (!ADDRESS_RE.test(to)) {
    return {
      tone: "error",
      text: "Addresses are slugs — letters, digits, dots, dashes, underscores. No spaces or @.",
    };
  }
  if (isReservedAddress(to)) {
    return {
      tone: "warn",
      text: `“${to}” is reserved — nobody can register it, so mail sent here is never read.`,
    };
  }
  if (!status) return { tone: "info", text: "" };
  if (status.self) {
    return { tone: "ok", text: "Your own inbox — the mail stays on this vault." };
  }
  if (status.confirmed) {
    return {
      tone: "ok",
      text: "Reads on this bus — mail from them has arrived here, or they publish receipts.",
    };
  }
  return {
    tone: "warn",
    text:
      `No confirmed reader for “${to}” on this bus. The message files locally — ` +
      `it arrives only if both sides share one synced mail folder (Settings → ` +
      `Messenger → storage), or you connect by invite code (Settings → Messenger → Cross-vault mail).`,
  };
}

export class SendMessageModal extends Modal {
  private to = "";
  private body = "";
  private sending = false;
  private toInputEl: HTMLInputElement | null = null;
  private hintEl: HTMLElement | null = null;
  private sendBtnEl: HTMLButtonElement | null = null;
  /** Last hint tone — error shape blocks Send until fixed. */
  private toInvalid = false;
  /** Ignores stale async status checks when the address changes mid-flight. */
  private checkToken = 0;

  constructor(
    app: App,
    private onSend: (to: string, body: string) => Promise<void>,
    private listAddresses?: AddressProvider,
    private recipientStatus?: (to: string) => Promise<RecipientStatus>
  ) {
    super(app);
  }

  onOpen(): void {
    this.titleEl.setText("New message");

    new Setting(this.contentEl)
      .setName("To")
      .setDesc("Address on this vault's bus")
      .addText((text) => {
        text.setPlaceholder("address, e.g. curtis");
        text.onChange((value) => {
          this.to = value.trim();
          void this.refreshHint();
        });
        text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") void this.trySend();
        });
        this.toInputEl = text.inputEl;
      })
      .addExtraButton((btn) => {
        if (!this.listAddresses) return;
        btn
          .setIcon("list")
          .setTooltip("Pick an address")
          .onClick(() => void this.pickAddress());
      });

    this.hintEl = this.contentEl.createDiv({ cls: "messenger-send-hint" });

    const textarea = this.contentEl.createEl("textarea", {
      cls: "messenger-body",
      attr: { placeholder: "Message body (markdown)", rows: "8" },
    });
    textarea.addEventListener("input", () => (this.body = textarea.value));
    textarea.addEventListener("keydown", (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") void this.trySend();
    });

    new Setting(this.contentEl).addButton((button) => {
      button.setCta().setButtonText("Send").onClick(() => void this.trySend());
      this.sendBtnEl = button.buttonEl;
    });

    void this.refreshHint();
  }

  /**
   * Registry + existing inboxes, so the main typo-to-nowhere path is gone —
   * and the live hint answers the question the picker can't: does anyone on
   * this bus actually read this address?
   */
  private async pickAddress(): Promise<void> {
    if (!this.listAddresses) return;
    let entries: Array<{ address: string; name: string }>;
    try {
      entries = await this.listAddresses();
    } catch {
      return;
    }
    if (entries.length === 0) {
      new Notice("No addresses on this bus yet");
      return;
    }
    new AddressSuggestModal(this.app, entries, (address) => {
      this.to = address;
      if (this.toInputEl) this.toInputEl.value = address;
      void this.refreshHint();
    }).open();
  }

  private async refreshHint(): Promise<void> {
    const token = ++this.checkToken;
    const addr = this.to;
    let status: RecipientStatus | null = null;
    if (addr && ADDRESS_RE.test(addr) && this.recipientStatus) {
      try {
        status = await this.recipientStatus(addr);
      } catch {
        status = null; // adapter hiccup — warn about nothing instead
      }
    }
    if (token !== this.checkToken) return;
    const hint = recipientHint(addr, status);
    this.toInvalid = hint.tone === "error";
    this.sendBtnEl?.toggleClass("is-disabled", this.toInvalid);
    if (this.hintEl) {
      this.hintEl.removeClass("is-info", "is-ok", "is-warn", "is-error");
      this.hintEl.setText(hint.text);
      this.hintEl.addClass(`is-${hint.tone}`);
    }
  }

  private async trySend(): Promise<void> {
    if (this.sending) return;
    if (!this.to || !this.body.trim()) {
      new Notice("Need a recipient and a body");
      return;
    }
    if (this.toInvalid) {
      new Notice("That's not a valid address — see the note under the To field");
      return;
    }
    this.sending = true;
    try {
      await this.onSend(this.to, this.body);
      this.close();
    } catch (err) {
      new Notice(`Send failed: ${err instanceof Error ? err.message : String(err)}`);
      this.sending = false;
    }
  }
}

class AddressSuggestModal extends FuzzySuggestModal<{ address: string; name: string }> {
  constructor(
    app: App,
    private entries: Array<{ address: string; name: string }>,
    private onPick: (address: string) => void
  ) {
    super(app);
    this.setPlaceholder("Pick an address…");
  }

  getItems(): Array<{ address: string; name: string }> {
    return this.entries;
  }

  getItemText(entry: { address: string; name: string }): string {
    return entry.name === entry.address ? entry.address : `${entry.name} (${entry.address})`;
  }

  renderSuggestion(
    match: FuzzyMatch<{ address: string; name: string }>,
    el: HTMLElement
  ): void {
    el.setText(this.getItemText(match.item));
  }

  onChooseItem(entry: { address: string; name: string }): void {
    this.onPick(entry.address);
  }
}
