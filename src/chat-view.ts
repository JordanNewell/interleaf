import {
  Events,
  ItemView,
  MarkdownRenderer,
  Menu,
  Modal,
  Notice,
  Platform,
  setIcon,
  TFile,
} from "obsidian";
import type { App, ViewStateResult, WorkspaceLeaf } from "obsidian";
import { ADDRESS_RE } from "./mailbox/envelope";
import type { MailEnvelope } from "./mailbox/envelope";
import { BUS_ADDRESS, isReservedAddress } from "./reserved";
import { encodeReceiptBlock, parseReceipts } from "./mailbox/receipts";
import type { ReceiptEntry } from "./mailbox/receipts";
import type ObsidianMessengerPlugin from "./main";
import { SendMessageModal } from "./send-modal";
import { MessageSearchModal } from "./search";
import {
  AddContactModal,
  ConfirmModal,
  ConversationAttachmentsModal,
  ImageLightboxModal,
  lightboxSrc,
  PasscodePromptModal,
  PeerRetentionModal,
  RenameAddressModal,
} from "./dialogs";
import { conversationAttachments } from "./attachments";
import type { ContactState } from "./contacts";
import { playSendSound } from "./audio";
import { chooseVaultImage, paintAvatar } from "./appearance/avatar";
import { applyWallpaper, WALLPAPERS } from "./appearance/wallpaper";
import { attachEmojiComposer, emojify, isEmojiOnly, SHORTCODES } from "./appearance/emoji";
import {
  attachRowSwipeActions,
  attachSwipeReply,
  haptic,
  isTouchPrimary,
  prefersReducedMotion,
  watchKeyboard,
} from "./mobile";
import type { RowAction } from "./mobile";

export const VIEW_TYPE_MESSENGER_CHAT = "messenger-chat";

/** Consecutive messages from the same sender within this window share a meta row. */
const GROUP_GAP_MS = 5 * 60 * 1000;
/** Bubbles rendered initially; older ones load on demand. */
const PAGE_SIZE = 60;
/** How far from the bottom still counts as "watching the tail". */
const PINNED_PX = 48;
const SAVE_READ_DEBOUNCE_MS = 1500;
/** How long a list row that just received mail keeps its fresh highlight. */
const FRESH_ROW_MS = 1800;

/**
 * Composer growth ceiling. CSS owns the number (--messenger-composer-max in
 * styles.css, 120px on phones), so theme overrides apply without a TS edit;
 * this just reads the resolved value back, falling back if a theme breaks it.
 */
function composerMaxPx(el: HTMLElement): number {
  const px = parseFloat(getComputedStyle(el).maxHeight);
  return Number.isFinite(px) && px > 0 ? px : 160;
}

/** One choice from the burn picker (SPEC §16). Exactly one field is set. */
interface BurnChoice {
  label: string;
  afterMs?: number;
  onReadSec?: number;
}

/** The picker's offers: burn-after-send, then burn-after-read. */
const BURN_CHOICES: BurnChoice[] = [
  { label: "1 hour", afterMs: 3_600_000 },
  { label: "1 day", afterMs: 86_400_000 },
  { label: "1 week", afterMs: 7 * 86_400_000 },
  { label: "1 hour after reading", onReadSec: 3_600 },
  { label: "1 day after reading", onReadSec: 86_400 },
];

/** Human label for a message's burn fields, for tooltips. */
function burnLabel(msg: MailEnvelope): string {
  if (msg.bar) {
    const mins = Math.round(msg.bar / 60);
    const window = mins >= 1440 ? `${Math.round(mins / 1440)} day(s)` : mins >= 60 ? `${Math.round(mins / 60)} hour(s)` : `${mins} minute(s)`;
    return `Disappears ${window} after being read`;
  }
  if (msg.exp) {
    const at = new Date(msg.exp);
    const sameDay = new Date().toDateString() === at.toDateString();
    return `Disappears ${sameDay ? at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : at.toLocaleString()}`;
  }
  return "";
}

interface ConversationRow {
  address: string;
  name: string;
  preview: string;
  lastTs: string | null;
  unread: number;
  /** Behind its per-conversation lock right now — content stays hidden. */
  locked: boolean;
  /** Social-gate state (SPEC §17); null = no contacts.md row. */
  contact: ContactState | null;
}

/**
 * The chat experience, locked to one renderer: the only input is parsed
 * OM-1 envelopes, the only output is bubbles + composer. Inboxes stay the
 * record of truth; anything unparsable never renders here.
 */
export class MessengerChatView extends ItemView {
  private peer: string | null = null;
  private threadEl: HTMLElement | null = null;
  private threadWrapEl: HTMLElement | null = null;
  private scrollDownBtn: HTMLElement | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private replyChipEl: HTMLElement | null = null;
  private replyTextEl: HTMLElement | null = null;
  private replyTo: MailEnvelope | null = null;
  private draftTimer: number | null = null;
  private listFilter = "";
  /** Whether the Contact requests section is expanded in the list. */
  private requestsOpen = false;
  private cachedRows: ConversationRow[] = [];
  private visibleCount = PAGE_SIZE;
  private sending = false;
  /** Peers already warned this session that nobody on the bus reads them. */
  private voidWarned = new Set<string>();
  private refreshTimer: number | null = null;
  private saveTimer: number | null = null;
  private searchEl: HTMLInputElement | null = null;
  private threadFingerprint = "";
  // in-thread message search
  private searchOpen = false;
  private searchQuery = "";
  private threadSearchBtn: HTMLElement | null = null;
  private threadSearchRow: HTMLElement | null = null;
  private threadSearchInput: HTMLInputElement | null = null;
  private threadSearchCount: HTMLElement | null = null;
  // touch experience state
  private unwatchKeyboard: (() => void) | null = null;
  /** The thread's bottom edge is in view — keyboard shifts re-pin to it. */
  private pinned = true;
  /** Conversation that should still show its "New messages" divider. */
  private unreadDividerPeer: string | null = null;
  /** Registry display name for the open peer — feeds the leaf title. */
  private peerName = "";
  /** Disappearing-message choice for the composer (SPEC §16), null = keep. */
  private burnChoice: BurnChoice | null = null;
  /**
   * Rendered-bubble cache: message id → the markdown render's child nodes
   * (cloned). Thread rebuilds clone instead of re-running the markdown
   * renderer — the single most expensive step per refresh. Keys carry the
   * sealed flag so unlocking swaps renders, and the epoch (stripHtml) clears
   * everything when rendering itself would change.
   */
  private bodyCache = new Map<string, Node[]>();
  private bodyCacheEpoch = "";
  /** lastTs per address at the previous list paint — drives the fresh flash. */
  private rowLastTs = new Map<string, string>();
  private freshUntil = new Map<string, number>();
  /** List scroll to restore after a background refresh rebuilds the list. */
  private listScrollRestore: number | null = null;
  /** New messages that landed below the viewport — the jump button's count. */
  private newBelow = 0;
  private newBelowEl: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: ObsidianMessengerPlugin) {
    super(leaf);
    this.navigation = false;
  }

  getViewType(): string {
    return VIEW_TYPE_MESSENGER_CHAT;
  }

  getDisplayText(): string {
    // an open conversation titles the tab like a native screen, not a plugin view
    return this.peerName || "Messenger";
  }

  getIcon(): string {
    return "mail";
  }

  /** The conversation currently open, for notification suppression upstream. */
  get activePeer(): string | null {
    return this.peer;
  }

  getState(): Record<string, unknown> {
    return { peer: this.peer ?? undefined };
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
    const raw = (state as { peer?: unknown } | null)?.peer;
    const peer = typeof raw === "string" && ADDRESS_RE.test(raw) ? raw : null;
    if (peer !== this.peer) {
      this.peer = peer;
      if (this.contentEl.hasChildNodes()) await this.render();
    }
  }

  async onOpen(): Promise<void> {
    // Visible roots show up as real notes, so vault "modify" gives instant
    // refreshes. Hidden (dot-folder) roots never fire vault events — the bus
    // announces deliveries (`messenger:message`) and poll passes
    // (`messenger:tick`) on the workspace instead.
    this.registerEvent(
      this.plugin.app.vault.on("modify", (file) => {
        if (file instanceof TFile) this.onFileModified(file);
      })
    );
    this.registerEvent(
      (this.app.workspace as unknown as Events).on(
        "messenger:message",
        () => this.queueRefresh()
      )
    );
    this.registerEvent(
      (this.app.workspace as unknown as Events).on("messenger:tick", () => {
        // poll cadence: enough for ✓✓ receipts, but only worth touching an
        // open thread — rebuilding the list here would fight the search box
        if (this.peer) this.queueRefresh();
      })
    );
    // contentEl itself survives render() (only its children swap), so this
    // one listener walks every future view: reply → search → list → filter
    this.registerDomEvent(this.contentEl, "keydown", (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (this.peer) {
        if (this.replyTo) {
          this.clearReply();
        } else if (this.searchOpen) {
          this.searchOpen = false;
          this.searchQuery = "";
          this.threadFingerprint = "";
          void this.render().then(() => {
            if (!Platform.isMobile) this.textarea?.focus();
          });
        } else {
          this.showList();
        }
      } else if (this.listFilter) {
        this.listFilter = "";
        void this.render();
      }
    });
    await this.render();
  }

  async onClose(): Promise<void> {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    if (this.draftTimer !== null) window.clearTimeout(this.draftTimer);
    this.unwatchKeyboard?.();
    this.unwatchKeyboard = null;
    await this.persistReadNow();
  }

  /** Re-read getDisplayText into the leaf's tab/header (internal, best effort). */
  private updateLeafTitle(): void {
    try {
      (this.leaf as unknown as { updateHeader?: () => void }).updateHeader?.();
    } catch {
      // internal API drifted — the tab just keeps its previous title
    }
  }

  /** Switch the view to one conversation. Called from the list and from main. */
  async openConversation(peer: string, messageId?: string): Promise<void> {
    this.peer = peer;
    this.visibleCount = PAGE_SIZE;
    this.replyTo = null;
    this.searchOpen = false;
    this.searchQuery = "";
    this.pinned = true;
    this.unreadDividerPeer = peer;
    this.burnChoice = null;
    this.newBelow = 0;
    await this.render();
    if (messageId) await this.revealMessage(peer, messageId);
    if (!Platform.isMobile) this.textarea?.focus();
  }

  /**
   * Land on one message inside the open thread: expand pages until it exists
   * in the DOM, then scroll + flash. Notices instead of failing silently when
   * the message has been GC'd out from under a search hit.
   */
  private async revealMessage(peer: string, messageId: string): Promise<void> {
    const thread = this.threadEl;
    if (!thread) return;
    const selector = `[data-mid="${CSS.escape(messageId)}"]`;
    let guard = 0;
    while (!thread.querySelector(selector) && guard++ < 25) {
      this.visibleCount += PAGE_SIZE * 4;
      await this.fillThread(thread, peer);
    }
    if (thread.querySelector(selector)) this.jumpToMessage(thread, messageId);
    else new Notice("That message is no longer in this conversation");
  }

  private showList(): void {
    this.peer = null;
    this.replyTo = null;
    this.searchOpen = false;
    this.searchQuery = "";
    this.peerName = "";
    this.unreadDividerPeer = null;
    this.burnChoice = null;
    void this.render();
  }

  // -- refresh ---------------------------------------------------------------

  /** Full re-render — the plugin calls this after appearance settings change. */
  async refresh(): Promise<void> {
    await this.render();
  }

  /**
   * Blend-control repaint: wallpaper/tint vars only, no thread rebuild —
   * cheap enough to run on every slider tick in the settings tab.
   */
  refreshAppearance(): void {
    const wrap = this.threadWrapEl;
    if (wrap && wrap.isConnected) applyWallpaper(wrap, this.peer, this.plugin);
  }

  private onFileModified(file: TFile): void {
    if (!file.path.startsWith(`${this.plugin.store.rootPath}/`)) return;
    if (!this.peer) {
      this.queueRefresh();
      return;
    }
    const interesting = new Set([
      this.plugin.store.inboxPath(this.plugin.settings.address),
      this.plugin.store.inboxPath(this.peer),
      // the peer's acknowledgments drive ✓ / ✓✓ on my outgoing bubbles
      this.plugin.store.receiptsPath(this.peer),
    ]);
    if (interesting.has(file.path)) this.queueRefresh();
  }

  /** Coalesce bursts of file writes into one re-render. */
  private queueRefresh(): void {
    // refreshing the list swaps the search input out from under the cursor;
    // the next event after blur catches up instead
    if (
      !this.peer &&
      this.searchEl &&
      this.searchEl === document.activeElement
    ) {
      return;
    }
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      if (this.peer) void this.refreshThreadOnly();
      else void this.render();
    }, 100);
  }

  /** Re-render only the thread so a half-typed draft in the composer survives. */
  private async refreshThreadOnly(): Promise<void> {
    const peer = this.peer;
    const thread = this.threadEl;
    if (!peer || !thread || !thread.isConnected) return;
    // poll passes arrive whether or not anything changed; skip the churn
    // (scroll, hover, selection) when neither inbox nor receipts moved
    const mine = await this.plugin.store.readInbox(this.plugin.settings.address);
    const theirs = await this.plugin.store.readInbox(peer);
    const receipts = await this.plugin.store.readReceiptsRaw(peer);
    const all = [...mine, ...theirs];
    const last = all[all.length - 1];
    const fingerprint = `${mine.length}:${theirs.length}:${last?.id ?? ""}:${receipts.length}:${receipts.slice(-200)}:${this.plugin.settings.readAt[peer] ?? ""}`;
    if (fingerprint === this.threadFingerprint && thread.querySelector(".messenger-msg")) {
      return;
    }
    this.threadFingerprint = fingerprint;
    const pinned =
      thread.scrollHeight - thread.scrollTop - thread.clientHeight < PINNED_PX;
    const before = thread.querySelectorAll(".messenger-msg").length;
    await this.fillThread(thread, peer);
    const after = thread.querySelectorAll(".messenger-msg").length;
    if (pinned) {
      thread.scrollTop = thread.scrollHeight;
    } else if (after > before) {
      // new mail while the user is scrolled up — flag the jump button and
      // count what landed below the viewport (iMessage's unread pill)
      this.newBelow += after - before;
      this.paintNewBelow();
      this.scrollDownBtn?.addClass("has-new");
    }
  }

  // -- data --------------------------------------------------------------------

  /**
   * The conversation is the pair {me, peer}: mail they sent me (my inbox)
   * plus mail I sent them (their inbox — the sender keeps no copy), and my
   * outbox copies when that setting is on. The merge lives on the bus so
   * export, the API, and search all see the exact same thread.
   */
  private conversationWith(peer: string): Promise<MailEnvelope[]> {
    return this.plugin.bus.loadConversation(this.plugin.settings.address, peer);
  }

  private async conversationRows(): Promise<ConversationRow[]> {
    const me = this.plugin.settings.address;
    const readAt = this.plugin.settings.readAt;
    const [addresses, registry, mine, contacts] = await Promise.all([
      this.plugin.store.listAddresses(),
      this.plugin.store.readRegistry(),
      this.plugin.store.readInbox(me),
      this.plugin.contacts.map(),
    ]);
    const names = new Map(registry.map((r) => [r.address, r.name]));
    const unreadBySender = new Map<string, number>();
    for (const m of mine) {
      if (m.from === me || m.ts <= (readAt[m.from] ?? "")) continue;
      unreadBySender.set(m.from, (unreadBySender.get(m.from) ?? 0) + 1);
    }
    const rows = await Promise.all(
      // every conversation loads concurrently — serialized, N inboxes cost
      // N sequential stat round-trips on every list paint
      addresses.map(async (address): Promise<ConversationRow> => {
        const messages = await this.conversationWith(address);
        const last = messages[messages.length - 1] ?? null;
        return {
          address,
          name: names.get(address) ?? address,
          preview: last
            ? last.encLocked
              ? "🔒 Encrypted message"
              : oneLine(last.body, 90)
            : "No messages yet",
          lastTs: last?.ts ?? null,
          unread: address === me ? 0 : (unreadBySender.get(address) ?? 0),
          locked: this.plugin.isPeerLocked(address),
          contact: contacts.get(address)?.state ?? null,
        };
      })
    );
    // blocked conversations are invisible — settings is the only way back
    const visible = rows.filter((r) => r.contact !== "blocked");
    visible.sort(
      (a, b) =>
        (b.lastTs ?? "").localeCompare(a.lastTs ?? "") ||
        a.address.localeCompare(b.address)
    );
    return visible;
  }

  /** Record that the user has seen this conversation up to now, and let the
   *  senders know (✓✓) by appending read receipts to my receipts file. */
  private markRead(peer: string, unreadIds: string[]): void {
    const me = this.plugin.settings.address;
    const next = new Date().toISOString();
    if ((this.plugin.settings.readAt[peer] ?? "") >= next) return;
    this.plugin.settings.readAt[peer] = next;
    // a fresh read timestamp starts burn-after-read clocks (SPEC §16) — the
    // thread's change fingerprint must notice even when no file changed
    this.threadFingerprint = "";
    void this.plugin.updateBadge();
    // ...and burn-after-read mail owes its disk copy to this very read, not
    // to the next maintenance pass
    this.plugin.requestBurnSweep();
    if (
      unreadIds.length > 0 &&
      peer !== me &&
      this.plugin.settings.sendReadReceipts
    ) {
      void this.plugin.store
        .appendReceiptBlock(
          me,
          encodeReceiptBlock(me, "read", next, unreadIds)
        )
        .catch((err) =>
          console.error("[message-bus] read receipt failed", err)
        );
    }
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void this.plugin.saveSettings();
    }, SAVE_READ_DEBOUNCE_MS);
  }

  private async persistReadNow(): Promise<void> {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
      await this.plugin.saveSettings();
    }
    if (this.draftTimer !== null) {
      window.clearTimeout(this.draftTimer);
      this.draftTimer = null;
      await this.plugin.saveSettings();
    }
  }

  // -- rendering ---------------------------------------------------------------

  private async render(): Promise<void> {
    // data-view is a stable hook for theme snippets and devtools debugging:
    // "lock" | "list" | "conversation" (documented in THEME.md)
    this.contentEl.dataset.view = this.plugin.isMessengerLocked()
      ? "lock"
      : this.peer
        ? "conversation"
        : "list";
    // an app-lock screen already on screen never needs refreshing — and
    // rebuilding it on every poll tick would yank focus out of a half-typed
    // passcode
    if (
      this.plugin.isMessengerLocked() &&
      this.contentEl.querySelector(":scope > .messenger-lock")
    ) {
      return;
    }
    // a background refresh of the list must not yank the user's scroll —
    // capture it before the rebuild, restore it after
    if (!this.peer && this.contentEl.dataset.view === "list") {
      this.listScrollRestore =
        this.contentEl.querySelector(".messenger-list-body")?.scrollTop ?? null;
    }
    this.contentEl.empty();
    this.contentEl.addClass("messenger-chat");
    this.threadEl = null;
    this.threadWrapEl = null;
    this.scrollDownBtn = null;
    this.newBelowEl = null;
    this.textarea = null;
    this.searchEl = null;
    // the app lock comes first — with it engaged nothing else renders, not
    // even the conversation list
    if (this.plugin.isMessengerLocked()) {
      this.renderAppLock();
      this.updateLeafTitle();
      return;
    }
    if (this.peer) await this.renderConversation(this.peer);
    else await this.renderList();
    this.updateLeafTitle();
  }

  // -- locks (level-1 security) --------------------------------------------------

  /**
   * The shared lock card: icon, explanation, one input. Wrong entries shake
   * and clear; a correct one calls back to re-render whatever it was
   * guarding. tryUnlock may derive the vault key, so it can be async.
   */
  private buildLockCard(
    parent: HTMLElement,
    opts: {
      title: string;
      desc: string;
      /** What the user types: a memorized passcode or a pasted vault key. */
      secretLabel: string;
      tryUnlock: (input: string) => boolean | Promise<boolean>;
      onUnlocked: () => void;
    }
  ): void {
    const card = parent.createDiv({ cls: "messenger-lock" });
    setIcon(card.createDiv({ cls: "messenger-lock-icon" }), "lock");
    card.createDiv({ cls: "messenger-lock-title" }, (el) => el.setText(opts.title));
    card.createDiv({ cls: "messenger-lock-desc" }, (el) => el.setText(opts.desc));
    const errorEl = card.createDiv({ cls: "messenger-lock-error" });
    const row = card.createDiv({ cls: "messenger-lock-row" });
    const input = row.createEl("input", {
      cls: "messenger-lock-input",
      type: "password",
      attr: {
        placeholder: opts.secretLabel,
        "aria-label": opts.secretLabel,
        name: "messenger-secret",
        // standard credential tokens: password managers (1Password,
        // Bitwarden, iCloud Keychain, Android autofill) offer the saved
        // credential on current-password fields — "off" hides us from them
        autocomplete: "current-password",
        autocapitalize: "off",
        autocorrect: "off",
        spellcheck: "false",
        enterkeyhint: "go",
      },
    });
    const button = row.createEl("button", {
      cls: "messenger-lock-btn",
      text: "Unlock",
    });
    let busy = false;
    const attempt = (): void => {
      if (busy) return; // key derivation can take a beat — never double-fire
      busy = true;
      void Promise.resolve(opts.tryUnlock(input.value))
        .then((ok) => {
          busy = false;
          if (ok) {
            opts.onUnlocked();
            return;
          }
          errorEl.setText(`Wrong ${opts.secretLabel.toLowerCase()} — try again.`);
          card.addClass("is-error");
          window.setTimeout(() => card.removeClass("is-error"), 500);
          input.select();
        })
        .catch(() => {
          busy = false;
          errorEl.setText("Unlock failed — try again.");
        });
    };
    button.addEventListener("click", attempt);
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") attempt();
    });
    window.setTimeout(() => input.focus(), 0);
  }

  /** App lock: the whole view — list included — behind the unlock secret. */
  private renderAppLock(): void {
    this.peerName = "";
    const keyMode = this.plugin.isKeyMode();
    this.buildLockCard(this.contentEl, {
      title: "Messenger is locked",
      desc: keyMode
        ? "Paste the vault key from your password manager to open Messenger."
        : "Enter your passcode to open Messenger.",
      secretLabel: keyMode ? "Vault key" : "Passcode",
      tryUnlock: (input) => this.plugin.tryUnlockMessenger(input),
      onUnlocked: () => void this.render(),
    });
  }

  /**
   * One conversation behind its lock: the usual header (so back still works)
   * with a lock card where the thread would be. Nothing renders, marks read,
   * or receipts until the passcode is entered.
   */
  private renderPeerLock(peer: string, name: string): void {
    const me = this.plugin.settings.address;
    const shown = peer === me ? `${name} (you)` : name;
    const wrap = this.contentEl.createDiv({ cls: "messenger-conversation is-locked" });
    const head = wrap.createDiv({ cls: "messenger-chat-head" });
    const back = head.createDiv({ cls: "messenger-back clickable-icon" });
    setIcon(back, isTouchPrimary() ? "chevron-left" : "arrow-left");
    back.setAttribute("aria-label", "All conversations");
    back.addEventListener("click", () => this.showList());
    head.createDiv({ cls: "messenger-chat-head-name" }, (el) => el.setText(shown));
    setIcon(head.createDiv({ cls: "messenger-lock-badge" }), "lock");
    this.buildLockCard(wrap, {
      title: "This conversation is locked",
      desc: this.plugin.isKeyMode()
        ? `Paste the vault key from your password manager to read your conversation with ${shown}.`
        : `Enter your passcode to read your conversation with ${shown}.`,
      secretLabel: this.plugin.isKeyMode() ? "Vault key" : "Passcode",
      tryUnlock: (input) => this.plugin.tryUnlockPeer(peer, input),
      onUnlocked: () => void this.openConversation(peer),
    });
  }

  private async renderList(): Promise<void> {
    const me = this.plugin.settings.address;
    const wrap = this.contentEl.createDiv({ cls: "messenger-list" });

    const head = wrap.createDiv({ cls: "messenger-list-head" });
    head.createDiv({ cls: "messenger-list-title" }, (el) =>
      el.setText("Messenger")
    );
    const headActions = head.createDiv({ cls: "messenger-list-head-actions" });
    const addContacts = headActions.createEl("button", {
      cls: "messenger-new-msg clickable-icon",
    });
    setIcon(addContacts, "user-plus");
    addContacts.setAttribute("aria-label", "Add contacts");
    addContacts.addEventListener("click", () =>
      new AddContactModal(this.app, this.plugin).open()
    );
    const compose = headActions.createEl("button", {
      cls: "messenger-new-msg clickable-icon",
    });
    setIcon(compose, "plus");
    compose.setAttribute("aria-label", "New message");
    compose.addEventListener("click", () => {
      new SendMessageModal(
        this.app,
        async (to, body) => {
          await this.plugin.bus.send(this.plugin.settings.address, to, body);
          new Notice(`Delivered to inbox of ${to}`);
          if (!this.peer) void this.render();
        },
        () => this.plugin.knownAddresses(),
        async (to) => ({
          self: to === this.plugin.settings.address,
          confirmed: await this.plugin.isConfirmedRecipient(to),
        })
      ).open();
    });
    const searchMessages = headActions.createEl("button", {
      cls: "messenger-new-msg clickable-icon",
    });
    setIcon(searchMessages, "search");
    searchMessages.setAttribute("aria-label", "Search messages");
    searchMessages.addEventListener("click", () =>
      new MessageSearchModal(this.app, this.plugin).open()
    );

    const searchWrap = wrap.createDiv({ cls: "messenger-list-search" });
    const search = searchWrap.createEl("input", {
      cls: "messenger-search-input",
      type: "search",
      attr: { placeholder: "Search conversations…", "aria-label": "Search conversations" },
    });
    search.value = this.listFilter;
    this.searchEl = search;
    // queueRefresh skips paints while this box has focus (a rebuild would
    // swap the input mid-keystroke); blur is the catch-up moment for
    // whatever mail arrived meanwhile — otherwise the list stays stale
    // until the next delivery
    search.addEventListener("blur", () => {
      if (!this.peer && this.searchEl === search) this.queueRefresh();
    });

    const bodyEl = wrap.createDiv({ cls: "messenger-list-body" });
    this.cachedRows = await this.conversationRows();
    search.addEventListener("input", () => {
      this.listFilter = search.value;
      this.renderConvRows(bodyEl, me);
    });
    this.renderConvRows(bodyEl, me);
    if (this.listScrollRestore !== null) {
      bodyEl.scrollTop = this.listScrollRestore;
      this.listScrollRestore = null;
    }
  }

  private renderConvRows(bodyEl: HTMLElement, me: string): void {
    bodyEl.empty();
    // requests live under their own divider (SPEC §17): quiet until accepted
    const isRequest = (r: ConversationRow): boolean =>
      r.address !== me && r.contact === "request";
    const requests = this.cachedRows.filter(isRequest);
    const shown = this.cachedRows.filter((r) => !isRequest(r));
    if (this.cachedRows.length === 0) {
      const empty = bodyEl.createDiv({ cls: "messenger-empty" });
      setIcon(empty.createDiv({ cls: "messenger-empty-icon" }), "inbox");
      empty.createDiv({ cls: "messenger-empty-text" }, (el) =>
        el.setText("No inboxes yet — send a message or add a contact to create one.")
      );
      // the empty state is the moment of intent: both first actions as
      // buttons, mirroring the header's compose and people-plus
      const actions = empty.createDiv({ cls: "messenger-empty-actions" });
      const addContacts = actions.createEl("button", {
        cls: "mod-cta",
        text: "Add contacts",
      });
      addContacts.addEventListener("click", () =>
        new AddContactModal(this.app, this.plugin).open()
      );
      const send = actions.createEl("button", { text: "Send a message" });
      send.addEventListener("click", () => {
        new SendMessageModal(
          this.app,
          async (to, body) => {
            await this.plugin.bus.send(this.plugin.settings.address, to, body);
            new Notice(`Delivered to inbox of ${to}`);
            if (!this.peer) void this.render();
          },
          () => this.plugin.knownAddresses(),
          async (to) => ({
            self: to === this.plugin.settings.address,
            confirmed: await this.plugin.isConfirmedRecipient(to),
          })
        ).open();
      });
      return;
    }
    const q = this.listFilter.trim().toLowerCase();
    // a locked row never matches on message content — only its name/address
    const filterRows = (rows: ConversationRow[]): ConversationRow[] =>
      q
        ? rows.filter((r) => {
            const hay = r.locked
              ? `${r.address} ${r.name}`.toLowerCase()
              : `${r.address} ${r.name} ${r.preview}`.toLowerCase();
            return hay.includes(q);
          })
        : rows;
    const rows = filterRows(shown);
    const requestRows = filterRows(requests);
    if (rows.length === 0 && requestRows.length === 0) {
      bodyEl.createDiv({ cls: "messenger-empty" }, (el) =>
        el.setText(`No conversations match “${this.listFilter.trim()}”`)
      );
      return;
    }
    for (const row of rows) {
      const item = bodyEl.createDiv({ cls: "messenger-conv" });
      item.dataset.addr = row.address;
      // mail that moved this row since the last paint keeps a brief highlight
      // — guarded by a timestamp so re-renders (filter typing) don't restart it
      const prevTs = this.rowLastTs.get(row.address);
      if (row.lastTs && prevTs !== undefined && row.lastTs > prevTs) {
        this.freshUntil.set(row.address, Date.now() + FRESH_ROW_MS);
      }
      if (row.lastTs !== null) this.rowLastTs.set(row.address, row.lastTs);
      if ((this.freshUntil.get(row.address) ?? 0) > Date.now()) {
        item.addClass("is-fresh");
      }
      item.createDiv({ cls: "messenger-avatar" }, (el) => {
        paintAvatar(el, row.address, this.plugin);
      });
      const main = item.createDiv({ cls: "messenger-conv-main" });
      const top = main.createDiv({ cls: "messenger-conv-top" });
      top.createDiv({ cls: "messenger-conv-name" }, (el) =>
        el.setText(row.address === me ? `${row.name} (you)` : row.name)
      );
      if (row.locked) {
        const lockedIcon = top.createDiv({ cls: "messenger-conv-locked" });
        setIcon(lockedIcon, "lock");
        lockedIcon.setAttribute("aria-label", "Locked conversation");
      }
      if (this.plugin.settings.mutedPeers[row.address]) {
        const muted = top.createDiv({ cls: "messenger-conv-muted" });
        setIcon(muted, "bell-off");
        muted.setAttribute("aria-label", "Notifications muted");
      }
      if (row.contact === "pending") {
        const pending = top.createDiv({ cls: "messenger-conv-pending" });
        setIcon(pending, "clock");
        pending.setAttribute("aria-label", "Invitation sent — mutual once they reply");
      }
      top.createDiv({ cls: "messenger-conv-time" }, (el) =>
        el.setText(row.lastTs ? fmtListTime(row.lastTs) : "")
      );
      const bottom = main.createDiv({ cls: "messenger-conv-bottom" });
      bottom.createDiv({ cls: "messenger-conv-preview" }, (el) =>
        el.setText(row.locked ? "Locked conversation" : row.preview)
      );
      // the unread count is message metadata a locked chat shouldn't leak
      if (row.unread > 0 && !row.locked) {
        bottom.createDiv({ cls: "messenger-unread" }, (el) =>
          el.setText(String(row.unread > 99 ? "99+" : row.unread))
        );
      }
      // iOS Mail-style swipe actions — attached before the click handler so
      // the "tap to dismiss" guard can suppress opening the conversation
      this.attachRowActions(item, row, me);
      item.addEventListener("click", () => void this.openConversation(row.address));
      item.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
        this.openConversationMenu(row.address, evt);
      });
    }
    if (requestRows.length > 0) this.renderRequestRows(bodyEl, me, requestRows);
  }

  /**
   * The Contact requests section: a divider carrying the count, then the
   * awaiting rows with inline accept/decline. Collapsed by default — the
   * whole point is that strangers stay quiet until you look.
   */
  private renderRequestRows(
    bodyEl: HTMLElement,
    me: string,
    requests: ConversationRow[]
  ): void {
    const divider = bodyEl.createDiv({ cls: "messenger-requests-divider" });
    divider.setAttribute("role", "button");
    divider.setAttribute(
      "aria-label",
      this.requestsOpen ? "Collapse contact requests" : "Expand contact requests"
    );
    divider.createDiv({ cls: "messenger-requests-label" }, (el) =>
      el.setText("Contact requests")
    );
    divider.createDiv({ cls: "messenger-unread messenger-requests-count" }, (el) =>
      el.setText(String(requests.length))
    );
    setIcon(
      divider.createDiv({ cls: "messenger-requests-chevron" }),
      this.requestsOpen ? "chevron-down" : "chevron-right"
    );
    divider.addEventListener("click", () => {
      this.requestsOpen = !this.requestsOpen;
      this.renderConvRows(bodyEl, me);
    });
    if (!this.requestsOpen) return;
    for (const row of requests) {
      const item = bodyEl.createDiv({ cls: "messenger-conv is-request" });
      item.dataset.addr = row.address;
      item.createDiv({ cls: "messenger-avatar" }, (el) => {
        paintAvatar(el, row.address, this.plugin);
      });
      const main = item.createDiv({ cls: "messenger-conv-main" });
      const top = main.createDiv({ cls: "messenger-conv-top" });
      top.createDiv({ cls: "messenger-conv-name" }, (el) => el.setText(row.name));
      // reserved senders can't be real registrants — flag the request itself
      if (isReservedAddress(row.address)) {
        top.createDiv({ cls: "messenger-reserved-flag" }, (el) =>
          el.setText("reserved name")
        );
      }
      top.createDiv({ cls: "messenger-conv-time" }, (el) =>
        el.setText(row.lastTs ? fmtListTime(row.lastTs) : "")
      );
      main.createDiv({ cls: "messenger-conv-bottom" }, (el) =>
        el.createDiv({ cls: "messenger-conv-preview" }, (p) =>
          p.setText(row.locked ? "Locked conversation" : row.preview)
        )
      );
      const actions = top.createDiv({ cls: "messenger-request-actions" });
      const accept = actions.createEl("button", {
        cls: "messenger-request-accept",
        attr: { "aria-label": `Accept ${row.name}` },
      });
      setIcon(accept, "check");
      accept.addEventListener("click", (evt) => {
        evt.stopPropagation();
        void this.plugin.acceptContact(row.address);
      });
      const decline = actions.createEl("button", {
        cls: "messenger-request-decline",
        attr: { "aria-label": `Decline ${row.name}` },
      });
      setIcon(decline, "x");
      decline.addEventListener("click", (evt) => {
        evt.stopPropagation();
        void this.plugin.blockContact(row.address);
      });
      attachRowSwipeActions(item, [
        {
          id: "accept",
          label: "Accept",
          icon: "check",
          cls: "is-read",
          run: () => void this.plugin.acceptContact(row.address),
        },
        {
          id: "decline",
          label: "Decline",
          icon: "x",
          cls: "is-delete",
          run: () => void this.plugin.blockContact(row.address),
        },
      ]);
      // viewing is allowed — decline stays one tap away
      item.addEventListener("click", () => void this.openConversation(row.address));
      item.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
        this.openConversationMenu(row.address, evt);
      });
    }
  }

  /** Swipe-left actions on a list row: mark read when unread, plus delete. */
  private attachRowActions(item: HTMLElement, row: ConversationRow, me: string): void {
    const actions: RowAction[] = [];
    // marking a locked chat read would acknowledge mail nobody unlocked to
    // see — skip the action until the passcode has been entered
    if (row.unread > 0 && row.address !== me && !row.locked) {
      actions.push({
        id: "read",
        label: "Read",
        icon: "check-check",
        cls: "is-read",
        run: () => void this.plugin.markPeerRead(row.address),
      });
    }
    actions.push({
      id: "delete",
      label: "Delete",
      icon: "trash-2",
      cls: "is-delete",
      run: () => this.confirmDeleteConversation(row.address, row.name),
    });
    attachRowSwipeActions(item, actions, {
      // a full-width flick only ever commits the safe action
      fullAction: actions.length > 1 ? "read" : undefined,
    });
  }

  /** The destructive gate shared by the context menu and the swipe action. */
  private confirmDeleteConversation(address: string, name: string): void {
    new ConfirmModal(this.app, {
      title: `Delete conversation with ${name}?`,
      message:
        "The inbox, receipts, and read state for this address are moved to the system trash. Mail you sent that lives in their inbox goes with it.",
      cta: "Delete",
      onConfirm: async () => {
        await this.plugin.deleteConversation(address);
        if (this.peer === address) this.showList();
        else void this.render();
      },
    }).open();
  }

  /**
   * Per-chat retention override (global retention/inbox-cap settings, scoped
   * to one address). An empty save deletes both keys — absent = default.
   */
  private openRetentionModal(address: string, name: string): void {
    const s = this.plugin.settings;
    new PeerRetentionModal(this.app, {
      peer: address,
      name,
      current: {
        days: s.retentionDaysByPeer[address],
        cap: s.maxInboxMessagesByPeer[address],
      },
      defaults: { days: s.retentionDays, cap: s.maxInboxMessages },
      onSave: async (next) => {
        if (next.days === undefined) delete s.retentionDaysByPeer[address];
        else s.retentionDaysByPeer[address] = next.days;
        if (next.cap === undefined) delete s.maxInboxMessagesByPeer[address];
        else s.maxInboxMessagesByPeer[address] = next.cap;
        await this.plugin.saveSettings();
      },
    }).open();
  }

  /**
   * Right-click / long-press on a conversation row: the per-conversation
   * actions that have nowhere else to live — mute, rename, reveal the source
   * file, export, delete.
   */
  private openConversationMenu(
    address: string,
    evt: MouseEvent
  ): void {
    const me = this.plugin.settings.address;
    const muted = this.plugin.settings.mutedPeers[address] === true;
    const registryName = (): string => {
      const rows = this.cachedRows.find((r) => r.address === address);
      return rows?.name ?? address;
    };
    const menu = new Menu();
    menu.addItem((item) =>
      item.setTitle("Open").onClick(() => void this.openConversation(address))
    );
    if (!this.plugin.isPeerLocked(address)) {
      menu.addItem((item) =>
        item
          .setTitle("Mark read")
          .setIcon("check-check")
          .onClick(() => void this.plugin.markPeerRead(address))
      );
    }
    // the social gate (SPEC §17): accept/decline for waiting requests,
    // remove/block for live contacts
    const contact =
      this.cachedRows.find((r) => r.address === address)?.contact ?? null;
    if (address !== me && contact === "request") {
      menu.addItem((item) =>
        item
          .setTitle("Accept contact")
          .setIcon("user-check")
          .onClick(() => void this.plugin.acceptContact(address))
      );
      menu.addItem((item) =>
        item
          .setTitle("Decline contact…")
          .setIcon("x")
          .onClick(() =>
            new ConfirmModal(this.app, {
              title: `Decline ${registryName()}?`,
              message:
                "The conversation disappears from Messenger and their mail stays silent — file-bus mail can still land (SPEC §8) but shows nothing. Undo from Settings → Messenger → Blocked addresses.",
              cta: "Decline",
              onConfirm: () => void this.plugin.blockContact(address),
            }).open()
          )
      );
    } else if (address !== me) {
      if (contact === "mutual" || contact === "pending") {
        menu.addItem((item) =>
          item
            .setTitle("Remove contact")
            .setIcon("user-minus")
            .onClick(() => void this.plugin.removeContact(address))
        );
      }
      menu.addItem((item) =>
        item
          .setTitle("Block contact…")
          .setIcon("shield-x")
          .onClick(() =>
            new ConfirmModal(this.app, {
              title: `Block ${registryName()}?`,
              message:
                "The conversation disappears from Messenger and their mail stays silent — file-bus mail can still land (SPEC §8) but shows nothing. Undo from Settings → Messenger → Blocked addresses.",
              cta: "Block",
              onConfirm: () => void this.plugin.blockContact(address),
            }).open()
          )
      );
    }
    menu.addItem((item) =>
      item
        .setTitle(muted ? "Unmute notifications" : "Mute notifications")
        .setIcon(muted ? "bell" : "bell-off")
        .onClick(async () => {
          if (muted) delete this.plugin.settings.mutedPeers[address];
          else this.plugin.settings.mutedPeers[address] = true;
          await this.plugin.saveSettings();
          void this.render();
        })
    );
    // per-conversation passcode lock — only meaningful once a passcode exists
    if (this.plugin.hasPasscode()) {
      if (this.plugin.settings.lockedPeers[address] === true) {
        menu.addItem((item) =>
          item
            .setTitle("Remove conversation lock…")
            .setIcon("lock-open")
            .onClick(() =>
              new PasscodePromptModal(this.app, {
                title: "Remove conversation lock",
                desc:
                  `Enter your unlock secret to unlock ${registryName()} for good — ` +
                  "anyone using this vault will be able to open it freely.",
                cta: "Remove lock",
                verify: (input) => this.plugin.verifyAuth(input),
                onSuccess: () => void this.plugin.setPeerLocked(address, false),
              }).open()
            )
        );
      } else {
        menu.addItem((item) =>
          item
            .setTitle("Lock conversation")
            .setIcon("lock")
            .onClick(() => void this.plugin.setPeerLocked(address, true))
        );
      }
    }
    if (address !== me) {
      menu.addItem((item) =>
        item
          .setTitle("Rename…")
          .setIcon("pencil")
          .onClick(
            () =>
              new RenameAddressModal(this.app, address, registryName(), async (name) => {
                await this.plugin.store.upsertRegistry({
                  address,
                  name: name || address,
                  updated: new Date().toISOString(),
                });
                await this.plugin.saveSettings();
                this.plugin.refreshChatViews();
              }).open()
          )
      );
    }
    // per-chat retention override (engine: gcPolicySource) — presence of a
    // key is the override; the modal deletes keys to reset
    menu.addItem((item) =>
      item
        .setTitle("Retention…")
        .setIcon("calendar-clock")
        .onClick(() => this.openRetentionModal(address, registryName()))
    );
    menu.addSeparator();
    menu.addItem((item) =>
      item
        .setTitle("Export conversation…")
        .setIcon("download")
        .onClick(async () => {
          const file = await this.plugin.exportConversation(address);
          if (file) await this.app.workspace.getLeaf(true).openFile(file);
        })
    );
    menu.addItem((item) =>
      item.setTitle("Reveal source file").setIcon("file-text").onClick(() => {
        if (this.plugin.store.hidden) {
          this.plugin.revealFile(this.plugin.store.inboxPath(address));
          return;
        }
        const file = this.app.vault.getAbstractFileByPath(
          this.plugin.store.inboxPath(address)
        );
        if (file instanceof TFile) void this.app.workspace.getLeaf(true).openFile(file);
        else new Notice("No inbox file yet — nothing sent to this address");
      })
    );
    menu.addSeparator();
    menu.addItem((item) =>
      item
        .setTitle("Delete conversation…")
        .setIcon("trash-2")
        .onClick(() => this.confirmDeleteConversation(address, registryName()))
    );
    menu.showAtMouseEvent(evt);
  }

  private async renderConversation(peer: string): Promise<void> {
    const me = this.plugin.settings.address;
    const [registry, contacts] = await Promise.all([
      this.plugin.store.readRegistry(),
      this.plugin.contacts.map(),
    ]);
    const name = registry.find((r) => r.address === peer)?.name ?? peer;
    const contactState = peer === me ? null : (contacts.get(peer)?.state ?? null);
    this.peerName = peer === me ? `${name} (you)` : name;

    // a locked conversation stops here: no thread, no composer, no receipts
    if (this.plugin.isPeerLocked(peer)) {
      this.renderPeerLock(peer, name);
      return;
    }

    const wrap = this.contentEl.createDiv({ cls: "messenger-conversation" });

    const head = wrap.createDiv({ cls: "messenger-chat-head" });
    const back = head.createDiv({ cls: "messenger-back clickable-icon" });
    setIcon(back, isTouchPrimary() ? "chevron-left" : "arrow-left");
    back.setAttribute("aria-label", "All conversations");
    back.addEventListener("click", () => this.showList());
    const headAvatar = head.createDiv({
      cls: "messenger-avatar messenger-avatar-sm messenger-avatar-clickable",
    });
    paintAvatar(headAvatar, peer, this.plugin);
    // a control now, not decoration — the module painted it aria-hidden
    headAvatar.removeAttribute("aria-hidden");
    headAvatar.setAttribute("aria-label", "Set profile picture");
    headAvatar.title = "Set profile picture";
    headAvatar.addEventListener("click", () =>
      void this.pickPeerAvatar(peer, headAvatar)
    );
    const headText = head.createDiv();
    headText.createDiv({ cls: "messenger-chat-head-name" }, (el) =>
      el.setText(peer === me ? `${name} (you)` : name)
    );
    headText.createDiv({ cls: "messenger-chat-head-addr" }, (el) =>
      el.setText(peer)
    );
    // the social-gate state under the address (SPEC §17): mutual contacts
    // say so, invitations say they're waiting, requests ask for an answer
    if (contactState && contactState !== "blocked") {
      const badge = headText.createDiv({
        cls: `messenger-contact-badge is-${contactState}`,
      });
      setIcon(
        badge.createDiv({ cls: "messenger-contact-badge-icon" }),
        contactState === "mutual" ? "user-check" : contactState === "pending" ? "clock" : "user-plus"
      );
      badge.createDiv({ cls: "messenger-contact-badge-text" }, (el) =>
        el.setText(
          contactState === "mutual"
            ? "Mutual contact"
            : contactState === "pending"
              ? "Invitation sent — mutual when they reply"
              : "Contact request"
        )
      );
    }

    const attBtn = head.createDiv({
      cls: "messenger-att-button clickable-icon",
    });
    setIcon(attBtn, "paperclip");
    attBtn.setAttribute("aria-label", "Conversation attachments");
    attBtn.title = "Conversation attachments";
    attBtn.addEventListener("click", () =>
      void this.openAttachmentSheet(peer, name)
    );

    // a reserved peer address (SPEC §2) is self-declared by definition — no
    // one can register one, so whoever writes under it is spoofing weight
    // the name implies. The bus's own address is the one legitimate sender.
    if (peer !== me && peer !== BUS_ADDRESS && isReservedAddress(peer)) {
      const banner = wrap.createDiv({ cls: "messenger-spoof-banner" });
      setIcon(banner.createDiv({ cls: "messenger-spoof-banner-icon" }), "shield-alert");
      banner.createDiv({ cls: "messenger-spoof-banner-text" }, (el) =>
        el.setText(
          `“${peer}” is a reserved name — real Messenger mail never comes from it. Treat this as untrusted (SPEC §8).`
        )
      );
    }

    const threadWrap = wrap.createDiv({ cls: "messenger-thread-wrap" });
    if (this.searchOpen) {
      this.threadSearchRow = wrap.createDiv({ cls: "messenger-thread-search" });
      const input = this.threadSearchRow.createEl("input", {
        cls: "messenger-thread-search-input",
        type: "search",
        attr: { placeholder: "Search in this conversation…", "aria-label": "Search in conversation" },
      });
      input.value = this.searchQuery;
      this.threadSearchInput = input;
      this.threadSearchCount = this.threadSearchRow.createDiv({
        cls: "messenger-thread-search-count",
      });
      const close = this.threadSearchRow.createDiv({
        cls: "messenger-thread-search-close clickable-icon",
      });
      setIcon(close, "x");
      close.setAttribute("aria-label", "Close search");
      close.addEventListener("click", () => {
        this.searchOpen = false;
        this.searchQuery = "";
        this.threadFingerprint = "";
        void this.render();
      });
      // trailing debounce: the thread re-filter is cloned-from-cache cheap,
      // but keystrokes shouldn't queue fills (and racing fills could land
      // out of order and leave a stale result painted)
      let searchTimer: number | null = null;
      this.registerDomEvent(input, "input", () => {
        this.searchQuery = input.value;
        this.threadFingerprint = "";
        if (searchTimer !== null) window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => {
          searchTimer = null;
          void this.fillThread(this.threadEl ?? thread, peer);
        }, 100);
      });
      window.setTimeout(() => input.focus(), 0);
    } else {
      this.threadSearchRow = null;
      this.threadSearchInput = null;
      this.threadSearchCount = null;
    }
    applyWallpaper(threadWrap, peer, this.plugin);
    this.threadWrapEl = threadWrap;
    this.threadSearchBtn = head.createDiv({
      cls: "messenger-thread-search-btn clickable-icon",
    });
    setIcon(this.threadSearchBtn, "search");
    this.threadSearchBtn.setAttribute("aria-label", "Search in conversation");
    this.threadSearchBtn.toggleClass("is-active", this.searchOpen);
    this.threadSearchBtn.addEventListener("click", () => {
      this.searchOpen = !this.searchOpen;
      if (!this.searchOpen) {
        this.searchQuery = "";
        this.threadFingerprint = "";
      }
      void this.render();
    });
    const wallpaperBtn = head.createDiv({
      cls: "messenger-wallpaper-btn clickable-icon",
    });
    setIcon(wallpaperBtn, "image");
    wallpaperBtn.setAttribute("aria-label", "Conversation wallpaper");
    wallpaperBtn.addEventListener("click", (evt) =>
      this.openWallpaperMenu(peer, evt, threadWrap)
    );
    const thread = threadWrap.createDiv({ cls: "messenger-thread" });
    this.threadEl = thread;
    thread.setAttr("role", "log");
    thread.setAttr("aria-label", "Messages");
    this.scrollDownBtn = threadWrap.createDiv({
      cls: "messenger-scroll-down clickable-icon",
    });
    setIcon(this.scrollDownBtn, "arrow-down");
    this.scrollDownBtn.setAttribute("aria-label", "Jump to latest");
    this.newBelowEl = this.scrollDownBtn.createDiv({
      cls: "messenger-scroll-down-count",
    });
    this.paintNewBelow();
    this.scrollDownBtn.addEventListener("click", () => {
      this.clearNewBelow();
      thread.scrollTo({
        top: thread.scrollHeight,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    });
    this.registerDomEvent(
      thread,
      "scroll",
      () => {
        const near =
          thread.scrollHeight - thread.scrollTop - thread.clientHeight < PINNED_PX;
        this.pinned = near;
        this.scrollDownBtn?.toggleClass("is-visible", !near);
        if (near) {
          this.scrollDownBtn?.removeClass("has-new");
          this.clearNewBelow();
        }
      },
      { passive: true }
    );
    // embedded images (composer attachments, vault embeds) open full-size —
    // a click on the thumbnail should never navigate the leaf away
    this.registerDomEvent(thread, "click", (e: MouseEvent) => {
      const src = lightboxSrc(e.target);
      if (src) {
        e.preventDefault();
        new ImageLightboxModal(this.app, src).open();
      }
    });

    const composerWrap = wrap.createDiv();
    await this.fillThread(thread, peer);
    thread.scrollTop = thread.scrollHeight;
    this.pinned = true;
    this.renderComposer(composerWrap, peer, name);

    // The on-screen keyboard can resize or overlay the window depending on
    // host; either way the thread re-pins to the bottom when it opens.
    this.unwatchKeyboard?.();
    this.unwatchKeyboard = watchKeyboard(this.contentEl, (opening) => {
      if (opening && this.pinned && this.threadEl) {
        this.threadEl.scrollTop = this.threadEl.scrollHeight;
      }
    });
  }

  private async fillThread(thread: HTMLElement, peer: string): Promise<void> {
    const me = this.plugin.settings.address;
    const messages = await this.conversationWith(peer);
    const registry = await this.plugin.store.readRegistry();
    const names = new Map(registry.map((r) => [r.address, r.name]));
    // the peer's acknowledgments for my outgoing mail (✓ delivered, ✓✓ read)
    const receipts = parseReceipts(await this.plugin.store.readReceiptsRaw(peer));
    const byId = new Map(messages.map((m) => [m.id, m]));
    const keepScroll = thread.scrollTop > 0 ? thread.scrollTop : null;
    const keepPinned =
      thread.scrollHeight - thread.scrollTop - thread.clientHeight < PINNED_PX;
    // in-thread search narrows what renders, never what gets marked read
    const q = this.searchQuery.trim().toLowerCase();
    const filtered =
      q && this.searchOpen
        ? messages.filter(
            (m) =>
              m.body.toLowerCase().includes(q) || m.from.toLowerCase().includes(q)
          )
        : messages;
    if (this.threadSearchCount && this.threadSearchCount.isConnected) {
      this.threadSearchCount.setText(
        q ? `${filtered.length} of ${messages.length}` : ""
      );
    }
    thread.empty();

    if (messages.length === 0) {
      const empty = thread.createDiv({ cls: "messenger-empty" });
      setIcon(empty.createDiv({ cls: "messenger-empty-icon" }), "message-circle");
      empty.createDiv({ cls: "messenger-empty-text" }, (el) =>
        el.setText("No messages yet — say hi.")
      );
      return;
    }
    if (filtered.length === 0) {
      const empty = thread.createDiv({ cls: "messenger-empty" });
      setIcon(empty.createDiv({ cls: "messenger-empty-icon" }), "search-x");
      empty.createDiv({ cls: "messenger-empty-text" }, (el) =>
        el.setText(`No messages match “${this.searchQuery.trim()}”`)
      );
      return;
    }

    const fromIdx = Math.max(0, filtered.length - this.visibleCount);
    const shown = filtered.slice(fromIdx);

    // Unread spans are computed before the render loop so the "New messages"
    // divider can land ahead of the first unseen bubble.
    const since = this.plugin.settings.readAt[peer] ?? "";
    const unreadIds = messages
      .filter((m) => m.from === peer && m.ts > since)
      .map((m) => m.id);
    const unreadSet = new Set(unreadIds);
    const showDivider =
      unreadSet.size > 0 &&
      this.unreadDividerPeer === peer &&
      !q && // a narrowed search view has no meaningful "new" position
      this.searchOpen === false;

    if (fromIdx > 0) {
      const earlier = thread.createDiv({
        cls: "messenger-load-earlier clickable-icon",
      });
      earlier.setText(`Load ${fromIdx} earlier messages`);
      earlier.addEventListener("click", () =>
        void this.expandEarlier(thread, peer)
      );
    }

    /** Does the next message continue this sender's visual group? */
    const groupedWithNext = (i: number, msg: MailEnvelope): boolean => {
      const next = shown[i + 1];
      return (
        next !== undefined &&
        next.from === msg.from &&
        sameDay(msg.ts, next.ts) &&
        Date.parse(next.ts) - Date.parse(msg.ts) < GROUP_GAP_MS
      );
    };

    // a change in stripHtml changes every render, not just new ones
    const epoch = this.plugin.settings.stripHtml ? "1" : "0";
    if (epoch !== this.bodyCacheEpoch) {
      this.bodyCacheEpoch = epoch;
      this.bodyCache.clear();
    }

    let prev: MailEnvelope | null = null;
    let dividerDone = false;
    // cache misses collected during the skeleton pass, rendered in parallel
    const pending: Array<{ msg: MailEnvelope; bubble: HTMLElement; key: string; start: number }> = [];
    for (let i = 0; i < shown.length; i++) {
      const msg = shown[i];
      if (!prev || !sameDay(prev.ts, msg.ts)) {
        thread.createDiv({ cls: "messenger-day" }, (el) =>
          el.setText(dayLabel(msg.ts))
        );
        prev = null;
      }
      const mine = msg.from === me;
      const grouped =
        prev !== null &&
        prev.from === msg.from &&
        Date.parse(msg.ts) - Date.parse(prev.ts) < GROUP_GAP_MS;
      const groupLast = !groupedWithNext(i, msg);

      if (showDivider && !dividerDone && unreadSet.has(msg.id)) {
        const divider = thread.createDiv({ cls: "messenger-unread-divider" }, (el) =>
          el.createSpan({ text: "New messages" })
        );
        // after scrolling back through history, the divider is the way home:
        // tap it to land on the first unseen message again
        divider.setAttribute("role", "button");
        divider.setAttribute("tabindex", "0");
        divider.addEventListener("click", () =>
          this.jumpToMessage(thread, msg.id)
        );
        dividerDone = true;
      }

      const row = thread.createDiv({
        cls: `messenger-msg ${mine ? "mine" : "theirs"}`,
      });
      row.dataset.mid = msg.id;
      if (grouped) row.addClass("is-grouped");
      if (groupLast) row.addClass("is-group-last");

      const actions = row.createDiv({ cls: "messenger-msg-actions" });
      const replyBtn = actions.createDiv({
        cls: "messenger-msg-action clickable-icon",
      });
      setIcon(replyBtn, "reply");
      replyBtn.setAttribute("aria-label", "Reply");
      replyBtn.addEventListener("click", () => this.setReply(msg));
      // plaintext only — a sealed body is ciphertext until unlock
      if (!msg.encLocked) {
        const copyBtn = actions.createDiv({
          cls: "messenger-msg-action clickable-icon",
        });
        setIcon(copyBtn, "copy");
        copyBtn.setAttribute("aria-label", "Copy text");
        copyBtn.addEventListener("click", () => {
          void navigator.clipboard
            ?.writeText(msg.body)
            .then(() => new Notice("Copied message text"))
            .catch(() => new Notice("Copy failed — select the text manually"));
        });
      }
      if (msg.exp || msg.bar) {
        const burn = actions.createDiv({ cls: "messenger-msg-burn" });
        setIcon(burn, "timer");
        burn.setAttribute("aria-label", burnLabel(msg));
        burn.title = burnLabel(msg);
      }

      if (!mine) {
        row.createDiv({ cls: "messenger-avatar messenger-avatar-sm" }, (el) => {
          paintAvatar(el, msg.from, this.plugin);
          el.addEventListener("click", () => void this.openConversation(msg.from));
        });
      }

      const col = row.createDiv({ cls: "messenger-msg-col" });
      if (!grouped) {
        const who = mine ? "You" : (names.get(msg.from) ?? msg.from);
        const meta = col.createDiv({ cls: "messenger-msg-meta" });
        meta.createSpan({ text: `${who} · ${fmtTime(msg.ts)}` });
        // cross-vault mail: verified in-process (OM-2 edge); the Social plugin
        // remains a fallback for mail it signed under the old split
        if (!mine && msg.om2) {
          const slot = meta.createSpan({ cls: "messenger-om2-badge is-pending" });
          setIcon(slot, "shield");
          slot.setAttribute("aria-label", "Checking signature…");
          void this.plugin.verifyMessage(msg).then((badge) => {
            if (!badge || !slot.isConnected) return;
            paintBadge(slot, badge);
          });
        } else if (!mine) {
          const badge = socialBadgeFor(msg);
          if (badge) paintBadge(meta.createSpan(), badge);
        }
      }
      const bubble = col.createDiv({ cls: "messenger-bubble" });
      if (msg.replyTo) {
        const original = byId.get(msg.replyTo);
        const quote = bubble.createDiv({ cls: "messenger-quote" });
        if (original) {
          quote.dataset.mid = original.id;
          const who = original.from === me ? "You" : (names.get(original.from) ?? original.from);
          quote.setText(
            original.encLocked
              ? `↩ ${who}: 🔒 encrypted message`
              : `↩ ${who}: ${oneLine(original.body, 60)}`
          );
          // the quote may point further back than the loaded page — expand
          // pages until it exists, exactly like a global-search jump
          quote.addEventListener("click", () =>
            void this.revealMessage(peer, original.id)
          );
        } else {
          quote.setText("↩ quoting an earlier message");
        }
      }
      if (msg.encLocked) {
        // sealed at rest and no key in session (SPEC §15) — never render
        // the ciphertext; the placeholder is all there is to say
        bubble.addClass("is-sealed");
        bubble.createDiv({ cls: "messenger-sealed" }, (el) =>
          el.setText("🔒 Encrypted message — unlock Messenger to read it")
        );
      } else {
        // a cached render clones in microseconds; only true misses pay for
        // the markdown renderer — and they pay together, after the loop.
        // Sealed messages never enter the cache, so id alone is a safe key.
        const key = msg.id;
        const cached = this.bodyCache.get(key);
        if (cached) {
          bubble.append(...cached.map((n) => n.cloneNode(true)));
          if (q) this.highlightMatches(bubble, q);
        } else {
          pending.push({ msg, bubble, key, start: bubble.childNodes.length });
        }
        // :shortcode: → emoji; jumbo when nothing else is there
        bubble.toggleClass("messenger-emoji-only", isEmojiOnly(expandShortcodes(msg.body)));
      }
      if (mine) this.renderStatus(col, receipts.get(msg.id));
      // touch equivalent of the reply button: swipe the bubble rightward —
      // attached after the bubble exists, since the gesture targets it
      attachSwipeReply(row, () => this.setReply(msg));
      prev = msg;
    }

    // Second pass: the misses render concurrently into their (already
    // attached) bubbles — a long first paint costs one markdown pass, not
    // one per bubble, and every later refresh clones instead.
    if (pending.length > 0) {
      const sourcePath = this.plugin.store.inboxPath(peer);
      await Promise.all(
        pending.map(({ msg, bubble, key, start }) =>
          MarkdownRenderer.render(
            this.app,
            this.plugin.settings.stripHtml ? stripRawHtml(msg.body) : msg.body,
            bubble,
            sourcePath,
            this
          ).then(() => {
            emojify(bubble);
            this.rememberBody(key, bubble, start);
            if (q) this.highlightMatches(bubble, q);
          })
        )
      );
    }

    if (peer === this.peer) this.markRead(peer, unreadIds);
    if (keepScroll !== null && !keepPinned) thread.scrollTop = keepScroll;
  }

  /** Reveal one more page of history, holding the scroll anchor steady. */
  private async expandEarlier(
    thread: HTMLElement,
    peer: string
  ): Promise<void> {
    const prevTop = thread.scrollTop;
    const prevHeight = thread.scrollHeight;
    this.visibleCount += PAGE_SIZE;
    await this.fillThread(thread, peer);
    thread.scrollTop = thread.scrollHeight - prevHeight + prevTop;
  }

  /**
   * Stash a clone of a fresh render, from `start` on so the quote chip (a
   * sibling added before the markdown) stays out of the cache. The live DOM
   * keeps getting mutated by search highlighting; the cache copy never is.
   */
  private rememberBody(key: string, bubble: HTMLElement, start: number): void {
    if (this.bodyCache.size > 800) {
      // generation trim: Map iterates in insertion order, so the oldest
      // third (bubbles from before the current page) goes first
      let drop = 300;
      for (const k of this.bodyCache.keys()) {
        if (drop-- <= 0) break;
        this.bodyCache.delete(k);
      }
    }
    this.bodyCache.set(
      key,
      Array.from(bubble.childNodes)
        .slice(start)
        .map((n) => n.cloneNode(true))
    );
  }

  /** ✓ delivered / ✓✓ read, iMessage-style, under my outgoing bubbles. */
  private renderStatus(col: HTMLElement, entry: ReceiptEntry | undefined): void {
    if (!entry) return;
    const row = col.createDiv({
      cls: `messenger-status ${entry.state === "read" ? "is-read" : ""}`,
    });
    const checks = entry.state === "read" ? 2 : 1;
    for (let i = 0; i < checks; i++) {
      setIcon(row.createSpan({ cls: "messenger-status-check" }), "check");
    }
    row.title =
      entry.state === "read"
        ? `Read ${fmtTime(entry.ts)}`
        : `Delivered ${fmtTime(entry.ts)}`;
  }

  /** Paint the jump button's "N new" pill from this.newBelow. */
  private paintNewBelow(): void {
    this.newBelowEl?.setText(unreadBadgeLabel(this.newBelow));
    this.newBelowEl?.toggleClass("is-visible", this.newBelow > 0);
  }

  private clearNewBelow(): void {
    if (this.newBelow === 0) return;
    this.newBelow = 0;
    this.paintNewBelow();
  }

  private jumpToMessage(thread: HTMLElement, mid: string): void {
    const target = thread.querySelector<HTMLElement>(
      `[data-mid="${CSS.escape(mid)}"]`
    );
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "center",
    });
    target.addClass("flash");
    window.setTimeout(() => target.removeClass("flash"), 1400);
  }

  /** Wrap case-insensitive query matches in rendered text with <mark>. */
  private highlightMatches(el: HTMLElement, q: string): void {
    const needle = q.toLowerCase();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const targets: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node as Text;
      // code, links, and quote chips: a hit there reads as a false positive
      if (text.parentElement?.closest("code, pre, a, .messenger-quote")) continue;
      if (text.textContent && text.textContent.toLowerCase().includes(needle)) {
        targets.push(text);
      }
    }
    for (const text of targets) {
      const frag = createFragment();
      let rest = text.textContent ?? "";
      let lower = rest.toLowerCase();
      let idx = lower.indexOf(needle);
      while (idx >= 0) {
        frag.append(rest.slice(0, idx));
        frag.createEl("mark", {
          cls: "messenger-hl",
          text: rest.slice(idx, idx + q.length),
        });
        rest = rest.slice(idx + q.length);
        lower = rest.toLowerCase();
        idx = lower.indexOf(needle);
      }
      frag.append(rest);
      text.replaceWith(frag);
    }
  }

  // -- composer ----------------------------------------------------------------

  private renderComposer(
    parent: HTMLElement,
    peer: string,
    name: string
  ): void {
    const composer = parent.createDiv({ cls: "messenger-composer" });

    this.replyChipEl = composer.createDiv({ cls: "messenger-reply-chip" });
    this.replyChipEl.addClass("is-hidden");
    setIcon(this.replyChipEl.createDiv({ cls: "messenger-reply-icon" }), "reply");
    this.replyTextEl = this.replyChipEl.createDiv({ cls: "messenger-reply-text" });
    const cancel = this.replyChipEl.createDiv({
      cls: "messenger-reply-cancel clickable-icon",
    });
    setIcon(cancel, "x");
    cancel.setAttribute("aria-label", "Cancel reply");
    cancel.addEventListener("click", () => this.clearReply());

    const row = composer.createDiv({ cls: "messenger-composer-row" });
    const textarea = row.createEl("textarea", {
      cls: "messenger-composer-input",
      attr: {
        rows: "1",
        // soft keyboards have no Enter-to-send hint to offer
        placeholder: Platform.isMobile
          ? `Message ${name}…`
          : `Message ${name}… (Enter to send)`,
        enterkeyhint: "send",
        autocapitalize: "sentences",
      },
    });
    this.textarea = textarea;
    textarea.value = this.plugin.settings.drafts[peer] ?? "";

    // Images pasted or dropped onto the composer land in the attachments
    // folder as real vault files and enter the draft as embeds.
    this.registerDomEvent(textarea, "paste", (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(
        (i) => i.kind === "file" && i.type.startsWith("image/")
      );
      const file = item?.getAsFile();
      if (!file) return;
      e.preventDefault();
      void this.saveAttachment(file, textarea);
    });
    this.registerDomEvent(composer, "dragover", (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    });
    this.registerDomEvent(composer, "drop", (e: DragEvent) => {
      const file = Array.from(e.dataTransfer?.files ?? []).find((f) =>
        f.type.startsWith("image/")
      );
      if (!file) return;
      e.preventDefault();
      void this.saveAttachment(file, textarea);
    });

    // The emoji composer must claim the textarea's keydown before the send
    // handler below registers — Enter with its autocomplete open inserts an
    // emoji instead of sending, and we honor that by skipping keys it consumed.
    attachEmojiComposer(row, textarea, {
      getRecents: () => this.plugin.settings.recentEmoji,
      setRecents: (code) => this.saveRecentEmoji(code),
    });

    // Disappearing messages (SPEC §16): pick a burn window for the next send.
    // Transient per conversation, like Signal — the clock shows when armed.
    const burnBtn = row.createEl("button", {
      cls: "messenger-burn-btn clickable-icon",
      attr: { "aria-label": "Disappearing messages" },
    });
    setIcon(burnBtn, "timer");
    const paintBurnBtn = (): void => {
      burnBtn.toggleClass("is-active", this.burnChoice !== null);
      burnBtn.title = this.burnChoice
        ? `Disappearing: ${this.burnChoice.label}`
        : "Disappearing messages";
    };
    paintBurnBtn();
    burnBtn.addEventListener("click", (evt) => {
      const menu = new Menu();
      menu.addItem((item) =>
        item.setTitle("Keep messages").setChecked(this.burnChoice === null).onClick(() => {
          this.burnChoice = null;
          paintBurnBtn();
        })
      );
      menu.addSeparator();
      for (const choice of BURN_CHOICES) {
        menu.addItem((item) =>
          item
            .setTitle(choice.label)
            .setChecked(
              this.burnChoice?.label === choice.label &&
                this.burnChoice?.afterMs === choice.afterMs &&
                this.burnChoice?.onReadSec === choice.onReadSec
            )
            .onClick(() => {
              this.burnChoice = choice;
              paintBurnBtn();
            })
        );
      }
      menu.showAtMouseEvent(evt);
    });

    const send = row.createEl("button", { cls: "messenger-send clickable-icon" });
    // the Messages-style up arrow reads better under a thumb than a paper plane
    setIcon(send, isTouchPrimary() ? "arrow-up" : "send");
    send.setAttribute("aria-label", "Send");
    const refreshSendState = (): void =>
      send.toggleClass("is-disabled", !textarea.value.trim());
    refreshSendState();

    const doSend = (): void => void this.sendCurrent(peer, textarea, send);
    send.addEventListener("click", doSend);
    this.registerDomEvent(textarea, "keydown", (e: KeyboardEvent) => {
      // the emoji autocomplete preventDefaults the Enter it accepts
      if (e.defaultPrevented) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    });
    this.registerDomEvent(textarea, "input", () => {
      this.plugin.settings.drafts[peer] = textarea.value;
      this.scheduleDraftSave();
      refreshSendState();
      textarea.setCssStyles({ height: "auto" });
      textarea.setCssStyles({
        height: `${Math.min(textarea.scrollHeight, composerMaxPx(textarea))}px`,
      });
    });
  }

  /** Drafts persist like read state — debounced, flushed on close. */
  private scheduleDraftSave(): void {
    if (this.draftTimer !== null) window.clearTimeout(this.draftTimer);
    this.draftTimer = window.setTimeout(() => {
      this.draftTimer = null;
      void this.plugin.saveSettings();
    }, SAVE_READ_DEBOUNCE_MS);
  }

  /**
   * Store a dropped/pasted image in the attachments folder and splice an
   * embed into the draft at the caret, the same way the emoji picker
   * commits a character.
   */
  private async saveAttachment(
    file: File,
    textarea: HTMLTextAreaElement
  ): Promise<void> {
    try {
      const folder = this.plugin.settings.attachmentsFolder;
      await this.plugin.ensureFolder(folder);
      const ext =
        (file.name.includes(".") ? file.name.split(".").pop() : "png")
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "png";
      const path = `${folder}/messenger-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}.${ext}`;
      await this.plugin.app.vault.createBinary(path, await file.arrayBuffer());
      const embed = `![[${path}]]`;
      const from = textarea.selectionStart ?? textarea.value.length;
      const to = textarea.selectionEnd ?? from;
      textarea.value =
        textarea.value.slice(0, from) + embed + textarea.value.slice(to);
      const caret = from + embed.length;
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (err) {
      new Notice(
        `Couldn't attach image: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  private setReply(msg: MailEnvelope): void {
    this.replyTo = msg;
    if (!this.replyChipEl || !this.replyTextEl) return;
    const who =
      msg.from === this.plugin.settings.address ? "You" : msg.from;
    this.replyTextEl.setText(replyPreviewText(msg, who));
    this.replyChipEl.removeClass("is-hidden");
    if (!Platform.isMobile) this.textarea?.focus();
  }

  private clearReply(): void {
    this.replyTo = null;
    this.replyChipEl?.addClass("is-hidden");
  }

  private async sendCurrent(
    peer: string,
    textarea: HTMLTextAreaElement,
    send: HTMLElement
  ): Promise<void> {
    const body = textarea.value;
    if (this.sending || !body.trim()) return;
    // never disable the textarea while sending: on touch devices that blurs
    // it and dismisses the software keyboard mid-conversation; `sending`
    // already guards against double submits
    this.sending = true;
    try {
      const burn = this.burnChoice;
      await this.plugin.bus.send(this.plugin.settings.address, peer, body, {
        replyTo: this.replyTo?.id ?? null,
        burnAfterMs: burn?.afterMs,
        burnOnReadSec: burn?.onReadSec,
      });
      playSendSound();
      if (isTouchPrimary()) haptic(6);
      delete this.plugin.settings.drafts[peer];
      this.scheduleDraftSave();
      textarea.value = "";
      textarea.setCssStyles({ height: "" });
      send.toggleClass("is-disabled", true);
      this.clearReply();
      await this.refreshThreadOnly();
      await this.warnIfUnread(peer);
    } catch (err) {
      new Notice(`Send failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.sending = false;
      if (!Platform.isMobile) textarea.focus();
    }
  }

  /**
   * The append always "succeeds" — the trap is that on a device whose mail
   * folder isn't shared/synced, nothing anywhere will ever read it. Once per
   * peer per session, say so right after the first send, while the silence
   * is still explicable.
   */
  private async warnIfUnread(peer: string): Promise<void> {
    if (this.voidWarned.has(peer)) return;
    this.voidWarned.add(peer);
    try {
      if (await this.plugin.isConfirmedRecipient(peer)) return;
      new Notice(
        `Sent — but nobody on this bus reads “${peer}” yet. Replies arrive only ` +
          `if both sides share one synced mail folder (Settings → Messenger → ` +
          `storage) — or connect by invite code (Settings → Messenger → Cross-vault mail).`,
        10_000
      );
    } catch {
      // status check failed — never let a warning break a delivered send
    }
  }

  // -- appearance --------------------------------------------------------------

  /** Per-conversation wallpaper override, from the chat header. */
  private openWallpaperMenu(
    peer: string,
    evt: MouseEvent,
    threadWrap: HTMLElement
  ): void {
    const menu = new Menu();
    const override = this.plugin.settings.wallpaperByPeer[peer];
    const choose = (id: string | null): void => {
      const byPeer = this.plugin.settings.wallpaperByPeer;
      if (id === null) delete byPeer[peer];
      else byPeer[peer] = id;
      void this.plugin.saveSettings();
      applyWallpaper(threadWrap, peer, this.plugin);
    };
    menu.addItem((item) =>
      item.setTitle("Default").setChecked(override === undefined).onClick(() => choose(null))
    );
    menu.addItem((item) =>
      item.setTitle("None").setChecked(override === "none").onClick(() => choose("none"))
    );
    menu.addSeparator();
    for (const w of WALLPAPERS) {
      menu.addItem((item) =>
        item
          .setTitle(w.name)
          .setChecked(override === w.id)
          .onClick(() => choose(w.id))
      );
    }
    // per-conversation tint: color identity for this window even without art
    menu.addSeparator();
    const tintOverride = this.plugin.settings.wallpaperTintByPeer[peer];
    menu.addItem((item) =>
      item
        .setTitle("Tint color…")
        .setChecked(typeof tintOverride === "string" && tintOverride !== "")
        .onClick(() =>
          new ConversationTintModal(this.app, peer, this.plugin, threadWrap).open()
        )
    );
    if (tintOverride !== undefined) {
      menu.addItem((item) =>
        item.setTitle("Tint: use default").onClick(() => {
          delete this.plugin.settings.wallpaperTintByPeer[peer];
          void this.plugin.saveSettings();
          applyWallpaper(threadWrap, peer, this.plugin);
        })
      );
    }
    menu.showAtMouseEvent(evt);
  }

  /** Header avatar → set this peer's picture from a vault image. */
  private async pickPeerAvatar(peer: string, el: HTMLElement): Promise<void> {
    const path = await chooseVaultImage(this.app);
    if (path === null) return; // dismissed — keep the current picture
    this.plugin.settings.avatars[peer] = path;
    await this.plugin.saveSettings();
    paintAvatar(el, peer, this.plugin);
  }

  /**
   * The iMessage-style media sheet for this conversation: embeds from both
   * halves of the thread (bus.loadConversation merges them), resolved to
   * vault files, newest first. Sealed-and-locked bodies are skipped and
   * counted, never guessed at.
   */
  private async openAttachmentSheet(peer: string, name: string): Promise<void> {
    const me = this.plugin.settings.address;
    const files = this.plugin.app.vault.getFiles();
    const messages = await this.plugin.bus.loadConversation(me, peer);
    const { items, skippedSealed } = conversationAttachments(
      messages,
      files.map((f) => ({ path: f.path, name: f.name }))
    );
    const byPath = new Map(files.map((f) => [f.path, f]));
    new ConversationAttachmentsModal(this.app, {
      title: peer === me ? `${name} (you)` : name,
      items: items.flatMap((item) => {
        const file = byPath.get(item.path);
        return file ? [{ file, from: item.from, ts: item.ts }] : [];
      }),
      skippedSealed,
      senderLabel: (addr) => (addr === me ? "You" : peer === me ? "You" : name),
    }).open();
  }

  /** Most recent first, deduped, capped — feeds the picker's "Recent" row. */
  private saveRecentEmoji(code: string): void {
    this.plugin.settings.recentEmoji = [
      code,
      ...this.plugin.settings.recentEmoji.filter((c) => c !== code),
    ].slice(0, 24);
    void this.plugin.saveSettings();
  }
}

// -- small helpers -------------------------------------------------------------

/** The remembered detached-window rectangle (settings.chatWin*, all optional). */
export interface ChatWindowRect {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Popout geometry for a remembered chat window, made safe for the screens
 * that exist right now: sizes clamp to something usable, and a remembered
 * position that would strand the window off-screen (monitor unplugged,
 * resolution changed) is dropped while the size survives. `extended` is
 * window.screen.isExtended — with more than one screen, generous bounds let
 * a position on the other monitor through.
 */
export function rememberedWindowInit(
  rect: ChatWindowRect,
  screen: { width: number; height: number; extended?: boolean }
): { x?: number; y?: number; size?: { width: number; height: number } } {
  const span = screen.extended
    ? Math.max(screen.width, screen.height) * 4
    : screen.width;
  const spanY = screen.extended
    ? Math.max(screen.width, screen.height) * 4
    : screen.height;
  const clamp = (n: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, Math.round(n)));
  const width =
    typeof rect.width === "number" && Number.isFinite(rect.width)
      ? clamp(rect.width, 320, Math.max(320, screen.width))
      : undefined;
  const height =
    typeof rect.height === "number" && Number.isFinite(rect.height)
      ? clamp(rect.height, 400, Math.max(400, screen.height))
      : undefined;
  const out: { x?: number; y?: number; size?: { width: number; height: number } } =
    {};
  if (width !== undefined && height !== undefined) {
    out.size = { width, height };
  }
  // usable = the window's title bar stays on a screen (>=40px of overlap)
  const usableX = (x: number): boolean =>
    Number.isFinite(x) && x < span - 40 && x + (width ?? 440) > 40;
  const usableY = (y: number): boolean =>
    Number.isFinite(y) && y < spanY - 40 && y + (height ?? 720) > 40;
  if (typeof rect.x === "number" && usableX(rect.x)) out.x = Math.round(rect.x);
  if (typeof rect.y === "number" && usableY(rect.y)) out.y = Math.round(rect.y);
  return out;
}

/**
 * One-line preview for the composer's reply chip. A sealed body is ciphertext
 * until unlock — the chip must never show it.
 */
export function replyPreviewText(
  msg: Pick<MailEnvelope, "body" | "encLocked">,
  who: string,
  max = 70
): string {
  return msg.encLocked
    ? `↩ ${who}: 🔒 encrypted message`
    : `↩ ${who}: ${oneLine(msg.body, max)}`;
}

/** Badge label for a count of unseen messages; 99 and up read "99+". */
export function unreadBadgeLabel(count: number): string {
  if (count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}

/**
 * Per-conversation tint: a soft color wash that gives one window its own
 * identity. Three exits, because "" (no tint here) and "inherit the global
 * tint" are different choices once a global tint exists.
 */
class ConversationTintModal extends Modal {
  constructor(
    app: App,
    private readonly peer: string,
    private readonly plugin: ObsidianMessengerPlugin,
    private readonly threadWrap: HTMLElement
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("messenger-tint-modal");
    contentEl.createEl("h3", { text: "Conversation tint" });
    contentEl.createDiv({ cls: "messenger-tint-note" }, (el) =>
      el.setText(
        "A soft color wash for this conversation only — it shows even with no wallpaper. " +
          "Strength follows the Tint strength setting."
      )
    );
    const current =
      this.plugin.settings.wallpaperTintByPeer[this.peer] ??
      (isHexColor(this.plugin.settings.wallpaperTint)
        ? this.plugin.settings.wallpaperTint
        : "#8a9bb8");
    const input = contentEl.createEl("input", {
      cls: "messenger-tint-input",
      type: "color",
      attr: { "aria-label": "Tint color" },
    });
    input.value = current;

    const commit = async (value: string | null): Promise<void> => {
      if (value === null) delete this.plugin.settings.wallpaperTintByPeer[this.peer];
      else this.plugin.settings.wallpaperTintByPeer[this.peer] = value;
      await this.plugin.saveSettings();
      applyWallpaper(this.threadWrap, this.peer, this.plugin);
      this.close();
    };

    const row = contentEl.createDiv({ cls: "messenger-tint-row" });
    row.createEl("button", { text: "No tint here" }).addEventListener("click", () =>
      void commit("")
    );
    row.createEl("button", { text: "Use default tint" }).addEventListener("click", () =>
      void commit(null)
    );
    row
      .createEl("button", { text: "Apply", cls: "mod-cta" })
      .addEventListener("click", () => void commit(input.value));
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

const isHexColor = (s: string): boolean => /^#[0-9a-f]{6}$/i.test(s.trim());

/**
 * Shape of the optional verification API the Obsidian Social plugin publishes
 * on `window.obsidianSocial` (see that repo's src/plugin/api.ts). Absent when
 * the platform plugin isn't installed — badges simply don't render then.
 */
interface SocialBadgeApi {
  verify(msg: MailEnvelope): {
    state: "verified" | "signed-unknown" | "invalid";
    name?: string;
    fp?: string;
    reason?: string;
  } | null;
}

function socialBadgeFor(msg: MailEnvelope): ReturnType<SocialBadgeApi["verify"]> {
  try {
    const api = (window as unknown as { obsidianSocial?: SocialBadgeApi }).obsidianSocial;
    return api ? api.verify(msg) : null;
  } catch {
    return null;
  }
}

/** Paint a verification result into a meta-row badge slot. */
function paintBadge(
  icon: HTMLElement,
  badge: { state: string; name?: string; fp?: string; reason?: string }
): void {
  icon.className = `messenger-om2-badge is-${badge.state}`;
  setIcon(icon, badge.state === "invalid" ? "shield-alert" : "shield-check");
  if (badge.state === "verified") {
    icon.setAttribute("aria-label", `Signed & verified — ${badge.name}`);
  } else if (badge.state === "signed-unknown") {
    icon.setAttribute("aria-label", `Signed by an unpinned key (${badge.fp?.slice(0, 11)}…)`);
  } else {
    icon.setAttribute("aria-label", `Signature check failed: ${badge.reason}`);
  }
}

const oneLine = (body: string, max: number): string => {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

const startOfDay = (d: Date): number =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function sameDay(a: string, b: string): boolean {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

function dayLabel(ts: string): string {
  const d = new Date(ts);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(ts: string): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * List-row timestamps read like a native inbox: clock time for today,
 * "Yesterday", weekday inside the week, then a short date. (Freshness at a
 * glance is the is-fresh flash's job, not the timestamp's.)
 */
function fmtListTime(ts: string): string {
  const d = new Date(ts);
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (days <= 0) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Shortcodes resolved, so a body that is only ":tada:" counts as emoji-only. */
const expandShortcodes = (body: string): string =>
  body.replace(/:([a-zA-Z0-9_+-]+):/g, (whole, key: string) => SHORTCODES.get(key) ?? whole);

/**
 * Best-effort raw-HTML removal (settings.stripHtml, off by default).
 * Obsidian's renderer never executes scripts; this is belt-and-suspenders for
 * people who don't even want the markup to render. Inline code that happens
 * to contain tags suffers — that's the trade the toggle describes.
 */
const stripRawHtml = (body: string): string =>
  body
    .replace(
      /<\s*(script|iframe|object|embed|form|style)\b[\s\S]*?(?:<\/\s*\1\s*>|$)/gi,
      ""
    )
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, "");
