import {
  FileSystemAdapter,
  Notice,
  Platform,
  Plugin,
  TFile,
  normalizePath,
} from "obsidian";
import type { WorkspaceLeaf } from "obsidian";
import { MailBus } from "./bus";
import { createApi, MessengerApiV1 } from "./api";
import type { MailEnvelope } from "./mailbox/envelope";
import { ADDRESS_RE } from "./mailbox/envelope";
import { encodeReceiptBlock, parseReceipts } from "./mailbox/receipts";
import type { ReceiptEntry } from "./mailbox/receipts";
import { MailboxStore, migrateRoot } from "./mailbox/store";
import { planRetransmit } from "./retransmit";
import {
  hashPasscode,
  isStrongPasscode,
  makeSalt,
  verifyPasscode as verifyHash,
} from "./passcode";
import {
  createWrappedVaultKey,
  DEFAULT_KDF,
  LEGACY_KDF,
  LEGACY_PBKDF2_ITERATIONS,
  normalizeVaultKey,
  openWrappedVaultKey,
  PBKDF2_ITERATIONS,
  rewrapRawVaultKey,
  unwrapRawVaultKey,
  webcryptoAvailable,
  zeroKeyMaterial,
} from "./crypto";
import type { VaultCipher } from "./crypto";
import { isExpired } from "./mailbox/envelope";
import { DEFAULT_SETTINGS, MessengerSettings, sanitizeSettings } from "./settings";
import { MessengerSettingTab } from "./settings-tab";
import { SendMessageModal } from "./send-modal";
import { MessageSearchModal } from "./search";
import { OnboardingModal } from "./onboarding-modal";
import { MessengerChatView, rememberedWindowInit, VIEW_TYPE_MESSENGER_CHAT } from "./chat-view";
import { playReceiveSound } from "./audio";
import { ContactsStore, classifyInbound } from "./contacts";
import type { ContactEntry } from "./contacts";
import { BUS_ADDRESS, isReservedAddress } from "./reserved";
import { AddContactModal, AllAttachmentsModal } from "./dialogs";
import { adapterKv, contactsBook, mailboxMailStore } from "./om2/adapters";
import { Bridge, type BridgeEvent, type Om2Contacts } from "./om2/bridge";
import type { Identity } from "./om2/crypto/keys";
import { fingerprint, fromB64u, toB64u } from "./om2/crypto/keys";
import {
  clearIdentityRecord,
  createIdentityRecord,
  loadIdentityRecord,
  openIdentityRecord,
  regenerateIdentityRecord,
  saveIdentityRecord,
  wipeIdentity,
  type IdentityRecord,
} from "./om2/identity-store";
import { decodeInvite, encodeInvite, inviteFingerprint, inviteLink } from "./om2/invite";
import { aliasCandidate } from "./om2/alias";
import { safetyNumber, verifyEnvelope, type Om2Badge } from "./om2/runtime";
import type { Om2KeyValueStore } from "./om2/types";

const GC_EVERY_MS = 60 * 60 * 1000;
/** While the post-send burst is live, the poll gate ticks this fast. */
const SEND_BURST_EVERY_MS = 1000;
/** How long after a send the burst runs — replies cluster right behind it. */
const SEND_BURST_FOR_MS = 30_000;
/** How often the maintenance pass runs: conflict adoption + retransmission. */
const MAINTAIN_EVERY_MS = 120_000;
/** Trailing debounce on view-requested burn sweeps — read bursts coalesce. */
const BURN_SWEEP_DEBOUNCE_MS = 2_000;
/** Cap on the seen-id set that suppresses retransmit duplicate dispatches. */
const SEEN_IDS_MAX = 1000;

export default class ObsidianMessengerPlugin extends Plugin {
  settings: MessengerSettings = DEFAULT_SETTINGS;
  store!: MailboxStore;
  bus!: MailBus;
  api!: MessengerApiV1;
  /** The social gate's persisted state (contacts.md, SPEC §17). */
  contacts!: ContactsStore;

  private lastPump = 0;
  private lastGc = 0;
  private lastAdopt = 0;
  /** Set by focus/resume/modify events — the next heartbeat passes the gate. */
  private pumpRequested = false;
  /** Deadline while polling runs fast because this bus just sent mail. */
  private burstUntil = 0;
  /** Recently dispatched ids — retransmitted mail must not re-announce. */
  private seenIds = new Set<string>();
  private ribbonIcon: HTMLElement | null = null;
  private pendingDelivered = new Set<string>();
  private receiptTimer: number | null = null;
  private burnSweepTimer: number | null = null;
  /** One burn sweep at a time — see burnSweep for why overlap is refused. */
  private burnSweepBusy = false;
  private burnSweepQueued = false;
  /**
   * Level-1 security: whether the Messenger UI is behind the passcode right
   * now. Session state only — lockOnStart re-engages it on every load.
   */
  private locked = false;
  /** Peers whose conversation lock was satisfied this session (in-memory). */
  private unlockedPeers = new Set<string>();
  /**
   * The vault key for at-rest sealing (SPEC §15), held only between unlock
   * and lock/unload. Null means sealed bodies read back locked.
   */
  private cipher: VaultCipher | null = null;
  // ── cross-vault mail (OM-2, src/om2/) ────────────────────────────────────
  /** kv dir for bridge state + the wrapped identity record (plugin dir/om2). */
  private om2Kv!: Om2KeyValueStore;
  /** The signing identity, in memory only between unlock and lock/unload. */
  private om2Identity: Identity | null = null;
  /** The relay bridge, while cross-vault mail is enabled and unlocked. */
  private om2Bridge: Bridge | null = null;
  /** Why the last openPopoutLeaf fell back to an in-app leaf, for diagnostics. */
  lastPopoutError: string | null = null;
  /** The detached chat window, while one is open — geometry capture target. */
  private chatWin: Window | null = null;
  private chatWinSaveTimer: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    // encryption with no WebCrypto (exotic webviews) can't be honored —
    // turn it off honestly rather than write plaintext under an "encrypted" flag
    if (this.settings.encryptMail && !webcryptoAvailable()) {
      this.settings.encryptMail = false;
      await this.saveSettings();
      new Notice("Messenger: message encryption needs WebCrypto — disabled here");
    }
    // legacy vaults carry a fast passcode hash beside the wrapped key — an
    // offline brute-force oracle for the same secret. The unwrap has been the
    // verifier since this version, so the hash has no reason to stay on disk.
    if (this.settings.encryptMail && this.settings.passcodeHash) {
      this.settings.passcodeHash = "";
      this.settings.passcodeSalt = "";
      await this.saveSettings();
    }
    // a restart is a fresh session: with lockOnStart the UI comes up behind
    // the passcode — and with encryption it must, because the vault key only
    // exists after the passcode is entered
    this.locked =
      this.hasPasscode() && (this.settings.lockOnStart || this.settings.encryptMail);
    const root = await this.settleStorageRoot();

    this.store = new MailboxStore(this.app.vault.adapter, root);
    this.contacts = new ContactsStore(this.app.vault.adapter, root);
    this.bus = new MailBus(this.store, {
      onError: (err, address) => {
        console.error(`[message-bus] handler error (${address})`, err);
        if (this.settings.debug) {
          new Notice(`Messenger: handler error in ${address} — see console`);
        }
      },
      onDispatch: (message) => {
        // retransmission (SPEC §14) re-appends with the same id — announce,
        // chime, and receipt-buffer only the first sighting
        if (this.seenIds.has(message.id)) return;
        this.rememberId(message.id);
        void this.applyContactGate(message);
        this.app.workspace.trigger("messenger:message", message);
        this.onDelivered(message);
        void this.maybeNotify(message);
      },
      onSend: (message) => {
        // this bus just wrote a recipient's inbox: deliver same-vault mail
        // within the heartbeat and poll fast for a cross-device reply
        this.burstUntil = Date.now() + SEND_BURST_FOR_MS;
        this.pumpRequested = true;
        // remember the send until its ✓ arrives, so a sync-lost append can
        // be retransmitted (SPEC §14); the cap keeps data.json bounded
        this.settings.unacked[message.id] = {
          message,
          sentAt: new Date().toISOString(),
          attempts: 0,
        };
        const ids = Object.keys(this.settings.unacked);
        if (ids.length > 50) {
          ids
            .sort((a, b) =>
              (this.settings.unacked[a]?.sentAt ?? "").localeCompare(
                this.settings.unacked[b]?.sentAt ?? ""
              )
            )
            .slice(0, ids.length - 50)
            .forEach((id) => delete this.settings.unacked[id]);
        }
        void this.saveSettings();
        // the social gate's outbound half: first mail to an address opens a
        // pending contact, and answering a request accepts it (SPEC §17) —
        // a stranger I reply to can see me from that moment on
        if (
          message.to !== this.settings.address &&
          message.to !== BUS_ADDRESS
        ) {
          void this.applyContactSendGate(message.to);
        }
      },
    });
    this.bus.setCursors(this.settings.cursors);
    this.bus.keepOutbox = this.settings.keepOutbox;
    // burn-after-read (SPEC §16) resolves against the vault's display state
    this.bus.readAtSource = () => this.settings.readAt;
    // per-address retention: a peer with an override uses it for its inbox,
    // outbox, and receipts; everyone else keeps the global policy
    this.bus.gcPolicySource = (address) => {
      const days = this.settings.retentionDaysByPeer[address];
      const cap = this.settings.maxInboxMessagesByPeer[address];
      if (days === undefined && cap === undefined) return null;
      return {
        maxAgeMs: (days ?? this.settings.retentionDays) * 86400000,
        maxMessages: cap ?? this.settings.maxInboxMessages,
      };
    };
    this.api = createApi(this.bus, this.store, {
      address: () => this.settings.address,
      readAt: () => this.settings.readAt,
      mutedPeers: () => this.settings.mutedPeers,
      markPeerRead: (peer) => this.markPeerRead(peer),
      contacts: () => this.contacts.list(),
      addContact: (address, name) => this.addContact(address, name),
    });
    window.obsidianMessenger = this.api;

    await this.store.ensureRoot();
    // one-time contacts seed (SPEC §17): conversations that predate the
    // social gate all start mutual, so nothing an upgrade user already sees
    // drops into Contact requests
    await this.contacts.seed(
      (await this.store.listAddresses()).filter(
        (a) => a !== this.settings.address && a !== BUS_ADDRESS
      )
    );
    await this.store.upsertRegistry({
      address: BUS_ADDRESS,
      name: "Interleaf (bus)",
      updated: new Date().toISOString(),
    });
    await this.store.upsertRegistry({
      address: this.settings.address,
      name: this.selfRegistryName(),
      updated: new Date().toISOString(),
    });

    this.registerView(VIEW_TYPE_MESSENGER_CHAT, (leaf) => new MessengerChatView(leaf, this));

    // ── cross-vault mail (OM-2) ────────────────────────────────────────────
    // Bridge state + the wrapped identity live under the plugin's own dir —
    // never the mailbox root, where GC and migration treat files as mail.
    this.om2Kv = adapterKv(this.app.vault.adapter, `${this.manifest.dir}/om2`);
    this.registerObsidianProtocolHandler("message-bus-invite", (params) => {
      void this.handleInviteCode(String(params.code ?? ""));
    });

    // when the detached chat window closes, snapshot its geometry while the
    // window object still answers — that's the position users expect back
    this.registerEvent(
      this.app.workspace.on("window-close", (_win, popout) => {
        if (popout !== this.chatWin) return;
        const closing = this.chatWin;
        this.chatWin = null;
        this.saveChatWindowRect(closing);
      })
    );

    // First run: the welcome modal, once the workspace can host it. Any path
    // out of the modal (save or dismiss) marks onboarding done — it shows once.
    this.app.workspace.onLayoutReady(() => {
      if (!this.settings.onboarded) {
        new OnboardingModal(this.app, this).open();
      }
      if (this.settings.om2.enabled && (window as unknown as { obsidianSocial?: unknown }).obsidianSocial) {
        // two bridges would poll one relay and both write the mailbox —
        // duplicates are mostly deduped downstream, but the waste (and the
        // confusion) is real; say so once.
        new Notice(
          "Messenger: both Cross-vault mail and the Obsidian Social bridge are on. " +
            "Disable one (Settings → Messenger → Cross-vault mail, or Social's settings) " +
            "to avoid double-delivery.",
          10_000
        );
      }
      // unlock happens before this in the lockOnStart flow; either way this
      // is a no-op until both the identity (unlocked) and a relay exist
      void this.tryStartOm2();
    });

    // Desktop: the ribbon opens the messenger as its own window. Mobile: a tab.
    this.ribbonIcon = this.addRibbonIcon("mail", "Open Messenger chat", () =>
      void (Platform.isMobile ? this.openChat() : this.openChatWindow())
    );
    void this.updateBadge();

    this.addCommand({
      id: "chat",
      name: "Open chat",
      callback: () => void this.openChat(),
    });

    this.addCommand({
      id: "chat-window",
      name: "Open chat in new window",
      callback: () => void this.openChatWindow(),
      checkCallback: (checking: boolean) => {
        if (checking) return !Platform.isMobile;
        return true;
      },
    });

    this.addCommand({
      id: "send",
      name: "Send message",
      callback: () =>
        new SendMessageModal(
          this.app,
          async (to, body) => {
            await this.bus.send(this.settings.address, to, body);
            new Notice(`Delivered to inbox of ${to}`);
          },
          () => this.knownAddresses(),
          async (to) => ({
            self: to === this.settings.address,
            confirmed: await this.isConfirmedRecipient(to),
          })
        ).open(),
    });

    this.addCommand({
      id: "add-contacts",
      name: "Add contacts",
      callback: () => new AddContactModal(this.app, this).open(),
    });

    this.addCommand({
      id: "search-messages",
      name: "Search messages",
      checkCallback: (checking: boolean) => {
        if (checking) return !this.isMessengerLocked();
        if (this.isMessengerLocked()) {
          new Notice("Messenger is locked — unlock it to search messages");
          void this.openChat();
          return true;
        }
        new MessageSearchModal(this.app, this).open();
        return true;
      },
    });

    this.addCommand({
      id: "browse-attachments",
      name: "Browse attachments",
      checkCallback: (checking: boolean) => {
        if (checking) return !this.isMessengerLocked();
        if (this.isMessengerLocked()) {
          new Notice("Messenger is locked — unlock it to browse attachments");
          void this.openChat();
          return true;
        }
        new AllAttachmentsModal(this.app, this).open();
        return true;
      },
    });

    this.addCommand({
      id: "lock",
      name: "Lock Messenger",
      checkCallback: (checking: boolean) => {
        if (checking) return this.hasPasscode() && !this.locked;
        this.lockMessenger();
        return true;
      },
    });

    this.addCommand({
      id: "check",
      name: "Check inboxes now",
      callback: () => void this.checkNow(),
    });

    this.addCommand({
      id: "demo",
      name: "Run loopback demo",
      callback: () => void this.runDemo(),
    });

    this.addCommand({
      id: "open-registry",
      name: "Open registry",
      callback: () => void this.openRegistry(),
    });

    this.addCommand({
      id: "gc",
      name: "Delete old messages now",
      callback: () => void this.gcNow(),
    });

    // The poll loop: a 1s heartbeat gated by the poll-interval setting, plus
    // event triggers (below). Setting changes apply live — no re-arming.
    this.registerInterval(window.setInterval(() => this.pumpGate(), 1000));

    // Event-triggered passes (SPEC §5: the interval is the idle fallback).
    // Focus/resume means someone is looking; a landed sync write — visible
    // storage only, dot-folders never fire vault events — is likely new mail.
    this.registerDomEvent(window, "focus", () => {
      this.pumpRequested = true;
    });
    this.registerDomEvent(document, "visibilitychange", () => {
      if (document.visibilityState === "visible") this.pumpRequested = true;
    });
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile && file.path.startsWith(`${this.store.rootPath}/`)) {
          this.pumpRequested = true;
        }
      })
    );

    this.addSettingTab(new MessengerSettingTab(this.app, this));
  }

  onunload(): void {
    delete window.obsidianMessenger;
    // the vault key never outlives the session
    this.applyCipher(null);
    // nor does the cross-vault signing key — flush bridge state first
    void this.stopOm2();
    if (this.chatWinSaveTimer !== null) window.clearTimeout(this.chatWinSaveTimer);
    // unlike the receipt debt (flushed just above, retry-armed on failure), a
    // pending burn sweep owes nothing: the next session's first maintenance
    // pass sweeps, so firing post-unload would only race the next instance
    if (this.burnSweepTimer !== null) window.clearTimeout(this.burnSweepTimer);
    void this.flushDeliveredReceipts();
  }

  private pumpGate(): void {
    const intervalMs =
      Date.now() < this.burstUntil
        ? SEND_BURST_EVERY_MS
        : Math.max(1, this.settings.pollSeconds) * 1000;
    if (Date.now() - this.lastPump < intervalMs && !this.pumpRequested) return;
    this.pumpRequested = false;
    this.lastPump = Date.now();
    void this.pump();
  }

  private async pump(): Promise<void> {
    try {
      // rescued conflict mail lands in the canonical inbox just before the
      // tick below, so the same pass delivers it
      if (Date.now() - this.lastAdopt > MAINTAIN_EVERY_MS) {
        this.lastAdopt = Date.now();
        await this.adoptConflicts();
        await this.retransmitUnacked();
        await this.burnSweep();
      }
      const processed = await this.bus.tick();
      // announce every pass — hidden storage never fires vault "modify", so
      // views ride these events to pick up new mail and ✓✓ receipts
      this.app.workspace.trigger("messenger:tick");
      if (processed > 0) {
        await this.persistCursors();
        if (this.settings.debug) {
          new Notice(
            `Messenger: processed ${processed} message${processed === 1 ? "" : "s"}`
          );
        }
      }
      if (
        this.gcConfigured() &&
        Date.now() - this.lastGc > GC_EVERY_MS
      ) {
        this.lastGc = Date.now();
        await this.bus.gc(
          this.settings.retentionDays * 86400000,
          this.settings.maxInboxMessages
        );
      }
    } catch (err) {
      console.error("[message-bus] pump failed", err);
    }
  }

  private async persistCursors(): Promise<void> {
    this.settings.cursors = this.bus.getCursors();
    await this.saveData(this.settings);
  }

  /** Whether any retention policy exists at all — global or per-address. */
  private gcConfigured(): boolean {
    return (
      this.settings.retentionDays > 0 ||
      this.settings.maxInboxMessages > 0 ||
      Object.keys(this.settings.retentionDaysByPeer).length > 0 ||
      Object.keys(this.settings.maxInboxMessagesByPeer).length > 0
    );
  }

  /**
   * Merge sync-conflict siblings back into the canonical inboxes (SPEC §7).
   * Best-effort: a failure here never blocks the poll pass that follows.
   */
  private async adoptConflicts(): Promise<void> {
    try {
      for (const address of await this.store.listAddresses()) {
        await this.store.adoptConflicts(address);
      }
    } catch (err) {
      console.error("[message-bus] conflict adoption failed", err);
    }
  }

  private rememberId(id: string): void {
    this.seenIds.add(id);
    if (this.seenIds.size > SEEN_IDS_MAX) {
      // insertion-ordered: drop the oldest sighting
      const oldest = this.seenIds.values().next().value;
      if (oldest !== undefined) this.seenIds.delete(oldest);
    }
  }

  /**
   * SPEC §16: delete burned mail (past `exp`, or past its burn-after-read
   * window) from disk. Reads already hide burned messages; this keeps the
   * files honest. Runs with the maintenance pass and after a conversation is
   * marked read — burning on read shouldn't wait two minutes on disk. Needs
   * no vault key (§16 rule 2): sealed burned blocks die with their envelope,
   * kept ciphertext is re-encoded byte-for-byte — sweeps are safe while the
   * vault is locked.
   */
  private async burnSweep(): Promise<void> {
    // one pass at a time: each sweep is a read-modify-write per file, and an
    // overlapping pass could rewrite pre-append content over a block that
    // landed mid-sweep (the debounced view request can arrive while the
    // maintenance pass is mid-sweep). A request during a running sweep is
    // queued and runs once more after it settles.
    if (this.burnSweepBusy) {
      this.burnSweepQueued = true;
      return;
    }
    this.burnSweepBusy = true;
    try {
      do {
        this.burnSweepQueued = false;
        try {
          const dropped = await this.bus.burnSweep(
            this.settings.address,
            this.settings.readAt
          );
          if (dropped > 0) {
            this.app.workspace.trigger("messenger:tick");
            void this.updateBadge();
          }
        } catch (err) {
          console.error("[message-bus] burn sweep failed", err);
          break; // don't hammer a failing disk — the next pass decides again
        }
      } while (this.burnSweepQueued);
    } finally {
      this.burnSweepBusy = false;
    }
  }

  /**
   * Debounced public door to burnSweep for views that write read cursors
   * themselves (the chat view's in-thread markRead): burn-after-read mail
   * owes its disk copy to the read, not to the next maintenance pass. The
   * trailing edge coalesces read bursts; if a sweep is already running when
   * the timer fires, burnSweep queues it behind the one in flight.
   */
  requestBurnSweep(): void {
    if (this.burnSweepTimer !== null) window.clearTimeout(this.burnSweepTimer);
    this.burnSweepTimer = window.setTimeout(() => {
      this.burnSweepTimer = null;
      void this.burnSweep();
    }, BURN_SWEEP_DEBOUNCE_MS);
  }

  /**
   * SPEC §14: if a sent message's ✓ never arrives on a shared bus, its
   * append was probably lost to a sync merge — re-append it unchanged (same
   * id, so receivers dedupe and GC collapses the duplicate). Only peers that
   * publish a receipts file (§11) play: no receipts file means no ACK
   * channel (remote OM-2 peers, scripts), and re-sending to them would
   * duplicate everything they receive.
   */
  private async retransmitUnacked(): Promise<void> {
    const ids = Object.keys(this.settings.unacked);
    if (ids.length === 0) return;
    const now = Date.now();
    let changed = false;
    for (const id of ids) {
      const entry = this.settings.unacked[id];
      if (!entry) {
        delete this.settings.unacked[id];
        changed = true;
        continue;
      }
      // burned mail (SPEC §16) owes nothing — re-sending it would resurrect
      // a message the sender deliberately made disappear. exp is absolute;
      // bar burns relative to this vault's read state for that conversation.
      if (this.isSendBurned(entry.message, now)) {
        delete this.settings.unacked[id];
        changed = true;
        continue;
      }
      let hasReceiptsFile = false;
      let receipts: Map<string, ReceiptEntry> | null = null;
      try {
        hasReceiptsFile = await this.store.hasReceipts(entry.message.to);
        if (hasReceiptsFile) {
          receipts = parseReceipts(await this.store.readReceiptsRaw(entry.message.to));
        }
      } catch (err) {
        console.error("[message-bus] receipt check failed", err);
        continue; // unreadable this pass — decide again next sweep
      }
      switch (planRetransmit(entry, hasReceiptsFile, receipts, now)) {
        case "wait":
          break;
        case "clear":
        case "drop":
          delete this.settings.unacked[id];
          changed = true;
          break;
        case "retransmit":
          try {
            await this.store.append(entry.message.to, entry.message);
          } catch (err) {
            console.error("[message-bus] retransmit failed", err);
            continue;
          }
          entry.attempts += 1;
          entry.sentAt = new Date().toISOString();
          changed = true;
          break;
      }
    }
    if (changed) await this.saveSettings();
  }

  /** Whether a remembered send has burned (§16): past exp, or past its burn-after-read window on this vault. */
  private isSendBurned(message: MailEnvelope, now: number): boolean {
    if (isExpired(message, now)) return true;
    if (!message.bar) return false;
    const peer = message.from === this.settings.address ? message.to : message.from;
    const read = this.settings.readAt[peer];
    return !!read && now >= Date.parse(read) + message.bar * 1000;
  }

  private async openChat(peer?: string, messageId?: string): Promise<void> {
    const { workspace } = this.app;
    const mainWin = workspace.containerEl.win;
    // saved layouts can carry detached phantom popout leaves — only consider
    // leaves whose view is actually live in a window
    const leaves = workspace
      .getLeavesOfType(VIEW_TYPE_MESSENGER_CHAT)
      .filter((l) => l.view?.containerEl?.isConnected);
    // prefer a popped-out messenger window over a docked sidebar leaf
    let leaf =
      leaves.find((l) => l.view.containerEl.win !== mainWin) ?? leaves[0] ?? null;
    if (!leaf) {
      // phones have no usable right sidebar — open the chat as a main tab
      leaf = Platform.isMobile
        ? workspace.getLeaf(true)
        : (workspace.getRightLeaf(false) ?? workspace.getLeaf(true));
      await leaf.setViewState({ type: VIEW_TYPE_MESSENGER_CHAT, active: true });
    }
    await workspace.revealLeaf(leaf);
    if (peer) {
      const view = leaf.view;
      if (view instanceof MessengerChatView) {
        await view.openConversation(peer, messageId);
      }
    }
  }

  /** Open a conversation and land on one message — the search modal's exit. */
  async openChatToMessage(peer: string, messageId: string): Promise<void> {
    await this.openChat(peer, messageId);
  }

  /** Open the messenger in its own window — the standalone, app-like way. */
  private async openChatWindow(peer?: string): Promise<void> {
    const { workspace } = this.app;
    const mainWin = workspace.containerEl.win;
    // one messenger window, not one per ribbon click: reuse a live popout
    const existing = workspace
      .getLeavesOfType(VIEW_TYPE_MESSENGER_CHAT)
      .filter(
        (l) => l.view?.containerEl?.isConnected && l.view.containerEl.win !== mainWin
      );
    if (existing.length > 0) {
      const leaf = existing[0];
      try {
        leaf.view.containerEl.win.focus();
      } catch {
        // window already gone — revealLeaf sorts out the rest
      }
      await workspace.revealLeaf(leaf);
      if (peer) {
        const view = leaf.view;
        if (view instanceof MessengerChatView) await view.openConversation(peer);
      }
      return;
    }
    // reopen where the user left it: remembered size + position, dropped
    // safely when they no longer fit the screens that exist now
    const screen = window.screen as Screen & { isExtended?: boolean };
    const remembered = rememberedWindowInit(
      {
        x: this.settings.chatWinX,
        y: this.settings.chatWinY,
        width: this.settings.chatWinWidth,
        height: this.settings.chatWinHeight,
      },
      {
        width: screen.width,
        height: screen.height,
        extended: screen.isExtended === true,
      }
    );
    let leaf: WorkspaceLeaf;
    try {
      leaf = workspace.openPopoutLeaf({
        x: remembered.x,
        y: remembered.y,
        size: remembered.size ?? { width: 440, height: 720 },
      });
    } catch (err) {
      // popouts unsupported or workspace mid-init (mobile, old Electron) —
      // fall back to a normal leaf and remember why for diagnostics
      this.lastPopoutError = String((err as Error)?.message ?? err);
      console.warn(
        "[message-bus] popout failed, opening in-app:",
        this.lastPopoutError
      );
      return this.openChat(peer);
    }
    this.lastPopoutError = null;
    await leaf.setViewState({ type: VIEW_TYPE_MESSENGER_CHAT, active: true });
    this.watchChatWindow(leaf);
    if (peer) {
      const view = leaf.view;
      if (view instanceof MessengerChatView) await view.openConversation(peer);
    }
  }

  /** Track a freshly opened chat window so its geometry gets remembered. */
  private watchChatWindow(leaf: WorkspaceLeaf): void {
    const win = leaf.view?.containerEl?.win;
    if (!win || win === window) return;
    this.chatWin = win;
    this.registerDomEvent(win, "resize", () => this.scheduleChatWinSave());
  }

  /** Debounced capture — a drag across the screen fires resize constantly. */
  private scheduleChatWinSave(): void {
    if (this.chatWinSaveTimer !== null) window.clearTimeout(this.chatWinSaveTimer);
    this.chatWinSaveTimer = window.setTimeout(() => {
      this.chatWinSaveTimer = null;
      const win = this.chatWin;
      if (win && !win.closed) this.saveChatWindowRect(win);
    }, 600);
  }

  private saveChatWindowRect(win: Window): void {
    try {
      this.settings.chatWinX = Math.round(win.screenX);
      this.settings.chatWinY = Math.round(win.screenY);
      this.settings.chatWinWidth = Math.round(win.outerWidth);
      this.settings.chatWinHeight = Math.round(win.outerHeight);
      void this.saveSettings();
    } catch {
      // window torn down mid-read — keep whatever was last saved
    }
  }

  /**
   * Pop up + sound for mail addressed to me, unless some open chat view —
   * sidebar or popped-out window — is showing that conversation already.
   * Unaccepted senders (the social gate) never announce: their mail waits
   * under Contact requests, and the requests header carries the count.
   */
  private async maybeNotify(message: MailEnvelope): Promise<void> {
    if (message.to !== this.settings.address) return;
    if (message.from === this.settings.address) return;
    void this.updateBadge();
    const sender = await this.contacts.get(message.from);
    if (sender && (sender.state === "request" || sender.state === "blocked")) return;
    // the app lock gates everything: a notice would read the mail out loud
    // past the passcode, so while locked there is no sound and no popup
    if (this.isMessengerLocked()) return;
    // a view parked on this conversation's lock screen is watching nothing —
    // the notice below already hides a locked chat's body, but the chime
    // (the only signal a locked row ever gets) must still fire
    const peerLocked = this.isPeerLocked(message.from);
    const watching =
      !peerLocked &&
      this.app.workspace
        .getLeavesOfType(VIEW_TYPE_MESSENGER_CHAT)
        .some(
          (leaf) =>
            leaf.view?.containerEl?.isConnected &&
            leaf.view instanceof MessengerChatView &&
            leaf.view.activePeer === message.from
        );
    if (watching) return;
    // muted conversations stay in the list and badge — they just stay quiet
    if (this.settings.mutedPeers[message.from]) return;
    if (this.settings.notifySound) playReceiveSound();
    // nothing readable in the popup for locked chats or still-sealed bodies
    if (this.settings.notifyPopup)
      void this.showNotifyPopup(message, peerLocked || message.encLocked === true);
  }

  /** Mail delivered to my inbox: buffer a ✓ for the senders' benefit. */
  private onDelivered(message: MailEnvelope): void {
    if (message.to !== this.settings.address) return;
    if (message.from === this.settings.address) return;
    this.pendingDelivered.add(message.id);
    if (this.receiptTimer !== null) return;
    this.receiptTimer = window.setTimeout(() => {
      this.receiptTimer = null;
      void this.flushDeliveredReceipts();
    }, 2000);
  }

  private async flushDeliveredReceipts(): Promise<void> {
    if (this.pendingDelivered.size === 0) return;
    const ids = [...this.pendingDelivered];
    this.pendingDelivered.clear();
    try {
      await this.store.appendReceiptBlock(
        this.settings.address,
        encodeReceiptBlock(
          this.settings.address,
          "delivered",
          new Date().toISOString(),
          ids
        )
      );
    } catch (err) {
      console.error("[message-bus] delivery receipt failed", err);
      // keep the debt and retry later: a lost ✓ would make the sender
      // retransmit (§14) mail the recipient already holds
      for (const id of ids) this.pendingDelivered.add(id);
      if (this.receiptTimer === null) {
        this.receiptTimer = window.setTimeout(() => {
          this.receiptTimer = null;
          void this.flushDeliveredReceipts();
        }, 30_000);
      }
    }
  }

  private async showNotifyPopup(
    message: MailEnvelope,
    hideBody = false
  ): Promise<void> {
    const registry = await this.store.readRegistry();
    const name = registry.find((r) => r.address === message.from)?.name ?? message.from;
    const title = name === message.from ? name : `${name} (${message.from})`;
    const preview = hideBody
      ? "New message — open Messenger to read it"
      : message.body.replace(/\s+/g, " ").trim().slice(0, 90);
    const notice = new Notice("", 8000);
    notice.messageEl.addClass("messenger-notice");
    notice.messageEl.empty();
    notice.messageEl.createDiv({ cls: "messenger-notice-title" }, (el) =>
      el.setText(title)
    );
    notice.messageEl.createDiv({ cls: "messenger-notice-preview" }, (el) =>
      el.setText(preview || "(empty message)")
    );
    notice.messageEl.addEventListener("click", () => {
      notice.hide();
      void this.openChat(message.from);
    });
  }

  /** Rebuild every open chat view — appearance changes from the settings tab. */
  refreshChatViews(): void {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MessengerChatView) void leaf.view.refresh();
    });
  }

  /**
   * Blend-control updates (intensity/tint/bubble sliders): repaint the
   * wallpaper layers only, no thread rebuild — cheap enough to run on every
   * slider tick while dragging.
   */
  updateChatAppearance(): void {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MessengerChatView) leaf.view.refreshAppearance();
    });
  }

  /**
   * Unread dot on the ribbon icon: mail for me newer than my read state.
   * Mail waiting under Contact requests (or from blocked senders) doesn't
   * count — quiet means quiet.
   */
  async updateBadge(): Promise<void> {
    try {
      const [mine, contacts] = await Promise.all([
        this.store.readInbox(this.settings.address),
        this.contacts.list(),
      ]);
      const quiet = new Set(
        contacts
          .filter((c) => c.state === "request" || c.state === "blocked")
          .map((c) => c.address)
      );
      const readAt = this.settings.readAt;
      const unread = mine.filter(
        (m) =>
          m.from !== this.settings.address &&
          !quiet.has(m.from) &&
          m.ts > (readAt[m.from] ?? "")
      ).length;
      this.ribbonIcon?.toggleClass("messenger-ribbon-dot", unread > 0);
    } catch {
      // mailbox root not created yet — nothing to count
    }
  }

  private async checkNow(): Promise<void> {
    const processed = await this.bus.tick();
    this.app.workspace.trigger("messenger:tick");
    await this.persistCursors();
    new Notice(
      processed === 0
        ? "No new messages"
        : `Processed ${processed} message${processed === 1 ? "" : "s"}`
    );
  }

  private async runDemo(): Promise<void> {
    const message = await this.bus.send(
      BUS_ADDRESS,
      this.settings.address,
      `Loopback demo at ${new Date().toLocaleTimeString()}`
    );
    let delivered = false;
    const off = this.bus.subscribe((m) => {
      if (m.id === message.id) {
        delivered = true;
        new Notice(`Messenger loop works: “${m.body}”`);
      }
    }, this.settings.address);
    try {
      await this.bus.tick();
    } finally {
      off();
    }
    await this.persistCursors();
    if (!delivered) {
      new Notice(
        "Demo message appended but not delivered — check the inbox file and console"
      );
    }
  }

  // -- contacts: the social gate (SPEC §17) --------------------------------------

  /**
   * The gate's inbound half, on every first-sighting delivery: a stranger's
   * mail files them under Contact requests; a pending contact's reply makes
   * the link mutual. Self and bus mail never touch contacts. Mail delivered
   * by the OM-2 bridge (§12) is exempt — it arrives signed and already
   * accepted at that edge, so it lands mutual; a block still wins.
   */
  private async applyContactGate(message: MailEnvelope): Promise<void> {
    if (message.to !== this.settings.address) return;
    const kind = classifyInbound(
      message.from,
      await this.contacts.map(),
      this.settings.address,
      BUS_ADDRESS,
      // om2 present (§12): signed and accepted at the OM-2 bridge edge, so
      // the social gate must not re-ask what the user already answered
      // there — a blocked alias still wins (§17, §8)
      message.om2 !== undefined
    );
    if (kind === "request") {
      if (await this.contacts.get(message.from)) return; // already filed
      const registry = await this.store.readRegistry();
      const name =
        registry.find((r) => r.address === message.from)?.name ?? message.from;
      await this.contacts.upsert({
        address: message.from,
        name,
        state: "request",
        updated: new Date().toISOString(),
      });
    } else if (kind === "upgrade") {
      // a pending contact's reply makes the link mutual (§17); verified §12
      // mail rides the same branch — a requester is promoted, a stranger is
      // minted straight to mutual so the conversation is live immediately
      if (await this.contacts.get(message.from)) {
        await this.contacts.setState(message.from, "mutual");
      } else {
        const registry = await this.store.readRegistry();
        const name =
          registry.find((r) => r.address === message.from)?.name ?? message.from;
        await this.contacts.upsert({
          address: message.from,
          name,
          state: "mutual",
          updated: new Date().toISOString(),
        });
      }
    } else {
      return; // self/system/contact/blocked — no state to move
    }
    this.refreshChatViews();
  }

  /**
   * The gate's outbound half: first mail to an address opens a pending
   * contact; answering a request accepts it. Never downgrades an existing
   * mutual or blocked entry.
   */
  private async applyContactSendGate(to: string): Promise<void> {
    const entry = await this.contacts.get(to);
    if (!entry) {
      await this.contacts.upsert({
        address: to,
        name: to,
        state: "pending",
        updated: new Date().toISOString(),
      });
    } else if (entry.state === "request") {
      await this.contacts.setState(to, "mutual");
    } else {
      return;
    }
    this.refreshChatViews();
  }

  /** All contacts, address-sorted — settings tab and the API read this. */
  listContacts(): Promise<ContactEntry[]> {
    return this.contacts.list();
  }

  /**
   * Add (or re-register) a contact: imported, hand-entered, via the API, or
   * an API client's registration. An existing entry keeps its state — adding
   * never downgrades a mutual contact or quietly un-blocks someone. Your own
   * address only gets its registry row.
   */
  async addContact(address: string, name: string): Promise<void> {
    if (!ADDRESS_RE.test(address)) {
      throw new Error(`Invalid messenger address: ${address}`);
    }
    const self = address === this.settings.address;
    // your own address is grandfathered — an identity held before a name
    // joined the reserved list keeps it (SPEC §2); everything else with
    // reserved weight refuses here too
    if (!self && isReservedAddress(address)) {
      throw new Error(
        `Reserved messenger address: ${address} — no one can hold a name with that weight (SPEC §2)`
      );
    }
    const existing = await this.contacts.get(address);
    if (!self) {
      await this.contacts.upsert({
        address,
        name: name || address,
        state: existing?.state ?? "pending",
        updated: new Date().toISOString(),
      });
    }
    await this.store.upsertRegistry({
      address,
      name: name || address,
      updated: new Date().toISOString(),
    });
    if (!existing && !self) await this.store.ensureAddress(address);
    this.refreshChatViews();
  }

  /** Accept a contact request: mutual from here on, announcements resume. */
  async acceptContact(address: string): Promise<void> {
    const entry = await this.contacts.get(address);
    if (entry?.fp && this.om2Bridge) {
      // cross-vault: accepting consumes the quarantine, pins the key, and
      // sends the auto-reply that completes THEIR half of the handshake
      try {
        await this.om2Bridge.accept(entry.fp);
      } catch (err) {
        console.error("[message-bus] om2 accept failed", err);
        new Notice(`Messenger: accept failed — ${err instanceof Error ? err.message : "unknown error"}`);
        return;
      }
    }
    await this.contacts.setState(address, "mutual");
    this.refreshChatViews();
    void this.updateBadge();
  }

  /**
   * Decline a request, or block a live contact: quiet, and hidden from the
   * list.
   */
  async blockContact(address: string): Promise<void> {
    const entry = await this.contacts.get(address);
    if (entry?.fp && this.om2Bridge) {
      // cross-vault: delete every held relay entry, block the fp forever —
      // later boxes are silent (§3.3)
      try {
        await this.om2Bridge.decline(entry.fp);
      } catch (err) {
        console.error("[message-bus] om2 decline failed", err);
      }
    }
    if (entry) await this.contacts.setState(address, "blocked");
    else {
      await this.contacts.upsert({
        address,
        name: address,
        state: "blocked",
        updated: new Date().toISOString(),
      });
    }
    this.refreshChatViews();
    void this.updateBadge();
  }

  /** Unblock: the conversation returns as a request to review again. */
  async unblockContact(address: string): Promise<void> {
    await this.contacts.setState(address, "request");
    this.refreshChatViews();
  }

  /** Remove the contact record; the conversation's files stay untouched. */
  async removeContact(address: string): Promise<void> {
    await this.contacts.remove(address);
    this.refreshChatViews();
  }

  private async openRegistry(): Promise<void> {
    await this.store.ensureRoot();
    if (this.store.hidden) {
      // real on disk, but outside the vault index — hand it to the OS
      this.revealFile(this.store.registryPath);
      return;
    }
    if (!(this.app.vault.getAbstractFileByPath(this.store.registryPath) instanceof TFile)) {
      await this.store.upsertRegistry({
        address: this.settings.address,
        name: this.selfRegistryName(),
        updated: new Date().toISOString(),
      });
    }
    const file = this.app.vault.getAbstractFileByPath(this.store.registryPath);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(true).openFile(file);
    }
  }

  /** Point tech users at a mailbox file Obsidian refuses to index. */
  revealFile(path: string): void {
    new Notice(`${path} (hidden from Obsidian)`);
    if (Platform.isMobile) return;
    try {
      const req = (window as unknown as { require?: (id: string) => unknown }).require;
      if (typeof req !== "function") return;
      const electron = req("electron") as {
        remote?: { shell: { showItemInFolder(fullPath: string): void } };
      };
      const adapter = this.app.vault.adapter as FileSystemAdapter;
      electron.remote?.shell.showItemInFolder(adapter.getFullPath(path));
    } catch {
      // the notice above already names the path
    }
  }

  private async gcNow(): Promise<void> {
    if (!this.gcConfigured()) {
      new Notice("Nothing to clean up — retention and the inbox limit are both disabled");
      return;
    }
    const dropped = await this.bus.gc(
      this.settings.retentionDays * 86400000,
      this.settings.maxInboxMessages
    );
    this.app.workspace.trigger("messenger:tick");
    new Notice(dropped === 0 ? "Nothing to delete" : `Deleted ${dropped} old message(s)`);
  }

  async loadSettings(): Promise<void> {
    this.settings = sanitizeSettings(
      Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
    );
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /** Display name for the registry: the configured one, else the raw address. */
  selfRegistryName(): string {
    return this.settings.displayName || this.settings.address;
  }

  // -- passcode & locks (level-1 security) ------------------------------------

  /** Whether a wrapped vault-key bundle exists (SPEC §15 sealing material). */
  hasKeyBundle(): boolean {
    return (
      this.settings.encryptMail &&
      this.settings.keySalt !== "" &&
      this.settings.wrappedKey !== ""
    );
  }

  /**
   * Key mode: the unlock secret is a generated vault key kept in a password
   * manager, not a memorized passcode.
   */
  isKeyMode(): boolean {
    return this.hasKeyBundle() && this.settings.authMode === "key";
  }

  /**
   * Whether an unlock secret exists. With sealing on, the wrapped bundle
   * itself is the credential — no separate passcode is required.
   */
  hasPasscode(): boolean {
    return (
      this.hasKeyBundle() ||
      (this.settings.passcodeHash !== "" && this.settings.passcodeSalt !== "")
    );
  }

  /**
   * Fast-hash check — only meaningful while no key bundle exists. When
   * sealing is on there is deliberately no stored hash: a fast verifier next
   * to the wrapped key would hand an offline attacker a cheap oracle, so
   * verifyAuth derives the key instead.
   */
  private verifyPasscodeHash(candidate: string): boolean {
    if (!this.settings.passcodeHash || !this.settings.passcodeSalt) return false;
    return verifyHash(candidate, this.settings.passcodeSalt, this.settings.passcodeHash);
  }

  /** Key-mode input is normalized (case, separators, lookalikes) before use. */
  private unlockSecret(candidate: string): string {
    return this.isKeyMode() ? (normalizeVaultKey(candidate) ?? candidate) : candidate;
  }

  /** Unwrap the vault key with a candidate secret. Null when it didn't open. */
  private async openVaultWith(candidate: string): Promise<VaultCipher | null> {
    if (!this.hasKeyBundle()) return null;
    try {
      return await openWrappedVaultKey(
        this.unlockSecret(candidate),
        this.settings.keySalt,
        this.settings.wrappedKey,
        this.settings.kdfIterations,
        this.settings.kdf
      );
    } catch {
      return null;
    }
  }

  /**
   * Verify the unlock secret — the one gate for every sensitive action.
   * With sealing on, verification IS the unwrap (full KDF run per attempt);
   * without it, the UI-gate hash answers.
   */
  async verifyAuth(candidate: string): Promise<boolean> {
    if (this.hasKeyBundle()) return (await this.openVaultWith(candidate)) !== null;
    return this.verifyPasscodeHash(candidate);
  }

  /** Install or drop the session's vault key (SPEC §15). */
  private applyCipher(cipher: VaultCipher | null): void {
    this.cipher = cipher;
    this.store.setCipher(cipher);
  }

  /**
   * Store a new passcode (fresh salt — old hashes never survive a change).
   * With `withEncryption`, also mints the wrapped vault key and turns on
   * at-rest sealing; no hash is stored in that mode — the unwrap verifies.
   * Used at sign-up, where there is no mail to migrate.
   */
  async setPasscode(passcode: string, withEncryption = false): Promise<void> {
    if (withEncryption && webcryptoAvailable()) {
      if (!isStrongPasscode(passcode)) {
        throw new Error(
          `Encryption needs a stronger passcode — at least 8 characters, not digits-only`
        );
      }
      const bundle = await createWrappedVaultKey(passcode);
      this.settings.passcodeHash = "";
      this.settings.passcodeSalt = "";
      this.settings.keySalt = bundle.keySalt;
      this.settings.wrappedKey = bundle.wrappedKey;
      this.settings.kdfIterations = PBKDF2_ITERATIONS;
      this.settings.kdf = DEFAULT_KDF;
      this.settings.authMode = "passcode";
      this.settings.encryptMail = true;
      this.applyCipher(bundle.cipher);
    } else {
      const salt = makeSalt();
      this.settings.passcodeSalt = salt;
      this.settings.passcodeHash = hashPasscode(passcode, salt);
    }
    await this.saveSettings();
  }

  /**
   * Change the unlock secret. With encryption on, the vault key is unwrapped
   * with the current secret and re-wrapped under the new one — O(1), no mail
   * is re-encrypted — and any legacy fast hash is dropped. This is also the
   * key-mode → passcode switch. Returns false on a wrong current secret.
   */
  async changePasscode(current: string, next: string): Promise<boolean> {
    if (this.hasKeyBundle()) {
      if (!isStrongPasscode(next)) return false;
      try {
        const raw = await unwrapRawVaultKey(
          this.unlockSecret(current),
          this.settings.keySalt,
          this.settings.wrappedKey,
          this.settings.kdfIterations,
          this.settings.kdf
        );
        // re-wrap upgrades the KDF in step with the secret change
        const bundle = await rewrapRawVaultKey(raw, next);
        zeroKeyMaterial(raw); // the re-wrap copied it; the buffer is done
        this.settings.keySalt = bundle.keySalt;
        this.settings.wrappedKey = bundle.wrappedKey;
        this.settings.kdfIterations = PBKDF2_ITERATIONS;
        this.settings.kdf = DEFAULT_KDF;
        this.settings.authMode = "passcode";
        this.settings.passcodeHash = "";
        this.settings.passcodeSalt = "";
      } catch (err) {
        console.error("[message-bus] key re-wrap failed", err);
        return false;
      }
      await this.saveSettings();
      return true;
    }
    if (!this.verifyPasscodeHash(current)) return false;
    const salt = makeSalt();
    this.settings.passcodeSalt = salt;
    this.settings.passcodeHash = hashPasscode(next, salt);
    // the OM-2 identity seed shares the unlock secret — re-wrap it in step,
    // or the next unlock would fail its GCM tag
    const om2Record = await loadIdentityRecord(this.om2Kv);
    if (om2Record) {
      try {
        const identity = await openIdentityRecord(om2Record, this.unlockSecret(current));
        const rebundled = await rewrapRawVaultKey(identity.secretKey.slice(0, 32), next);
        await saveIdentityRecord(this.om2Kv, {
          ...om2Record,
          keySalt: rebundled.keySalt,
          wrappedKey: rebundled.wrappedKey,
          kdf: DEFAULT_KDF,
        });
      } catch (err) {
        console.error("[message-bus] om2 identity re-wrap failed", err);
      }
    }
    await this.saveSettings();
    return true;
  }

  /**
   * Turn on at-rest sealing from a passcode: mint a wrapped vault key from
   * the (verified) passcode and rewrite every existing body as ciphertext.
   * The fast hash is dropped — from here on the unwrap is the verifier, so a
   * stolen data.json offers no cheap offline oracle.
   */
  async enableEncryption(passcode: string): Promise<void> {
    if (!this.verifyPasscodeHash(passcode)) throw new Error("Wrong passcode");
    if (!isStrongPasscode(passcode)) {
      throw new Error(
        `Encryption needs a stronger passcode — at least 8 characters, not digits-only. Change it first.`
      );
    }
    if (!webcryptoAvailable()) throw new Error("WebCrypto unavailable here");
    const bundle = await createWrappedVaultKey(passcode);
    this.applyCipher(bundle.cipher);
    const { messages } = await this.store.rewriteAll(true);
    this.settings.keySalt = bundle.keySalt;
    this.settings.wrappedKey = bundle.wrappedKey;
    this.settings.kdfIterations = PBKDF2_ITERATIONS;
    this.settings.kdf = DEFAULT_KDF;
    this.settings.authMode = "passcode";
    this.settings.passcodeHash = "";
    this.settings.passcodeSalt = "";
    this.settings.encryptMail = true;
    await this.saveSettings();
    new Notice(`Messenger: ${messages} message(s) now encrypted at rest`);
    this.refreshChatViews();
  }

  /**
   * Turn on at-rest sealing with a generated vault key instead of a passcode:
   * the key (125 random bits, generated by the caller and revealed once in
   * VaultKeyModal before this is called) derives the KEK. Any existing UI
   * passcode is dropped — the key becomes the unlock secret.
   */
  async enableKeyEncryption(key: string): Promise<void> {
    if (!webcryptoAvailable()) throw new Error("WebCrypto unavailable here");
    if (this.hasKeyBundle()) throw new Error("Encryption is already on");
    if (!normalizeVaultKey(key)) throw new Error("Malformed vault key");
    const bundle = await createWrappedVaultKey(key);
    this.applyCipher(bundle.cipher);
    const { messages } = await this.store.rewriteAll(true);
    this.settings.keySalt = bundle.keySalt;
    this.settings.wrappedKey = bundle.wrappedKey;
    this.settings.kdfIterations = PBKDF2_ITERATIONS;
    this.settings.kdf = DEFAULT_KDF;
    this.settings.authMode = "key";
    this.settings.passcodeHash = "";
    this.settings.passcodeSalt = "";
    this.settings.encryptMail = true;
    await this.saveSettings();
    new Notice(`Messenger: ${messages} message(s) now encrypted at rest`);
    this.refreshChatViews();
  }

  /**
   * Re-wrap the existing vault key under a freshly generated key (switch from
   * passcode mode, or rotate a possibly-leaked key). No mail is re-encrypted.
   * The key comes from VaultKeyModal, already revealed and paste-confirmed.
   */
  async switchToKeyMode(currentSecret: string, key: string): Promise<void> {
    if (!normalizeVaultKey(key)) throw new Error("Malformed vault key");
    let raw: Uint8Array;
    try {
      raw = await unwrapRawVaultKey(
        this.unlockSecret(currentSecret),
        this.settings.keySalt,
        this.settings.wrappedKey,
        this.settings.kdfIterations,
        this.settings.kdf
      );
    } catch {
      throw new Error("Wrong passcode or key");
    }
    const bundle = await rewrapRawVaultKey(raw, key);
    zeroKeyMaterial(raw); // the re-wrap copied it; the buffer is done
    this.settings.keySalt = bundle.keySalt;
    this.settings.wrappedKey = bundle.wrappedKey;
    this.settings.kdfIterations = PBKDF2_ITERATIONS;
    this.settings.kdf = DEFAULT_KDF;
    this.settings.authMode = "key";
    this.settings.passcodeHash = "";
    this.settings.passcodeSalt = "";
    await this.saveSettings();
  }

  /**
   * Turn sealing off: unseal every stored body (needs the vault key, so the
   * unlock secret is verified and the key unwrapped first), then drop the
   * bundle. A passcode-mode vault regains its UI-gate hash from the secret
   * this call just proved; key mode ends with no lock — the notice says so.
   */
  async disableEncryption(secret: string): Promise<void> {
    const cipher = await this.openVaultWith(secret);
    if (!cipher) throw new Error("Wrong passcode or key");
    this.applyCipher(cipher);
    const { messages } = await this.store.rewriteAll(false);
    this.settings.encryptMail = false;
    this.settings.keySalt = "";
    this.settings.wrappedKey = "";
    this.settings.kdfIterations = LEGACY_PBKDF2_ITERATIONS;
    this.settings.kdf = LEGACY_KDF;
    const wasKeyMode = this.settings.authMode === "key";
    this.settings.authMode = "passcode";
    if (!wasKeyMode && !this.settings.passcodeHash) {
      const salt = makeSalt();
      this.settings.passcodeSalt = salt;
      this.settings.passcodeHash = hashPasscode(secret, salt);
    }
    this.applyCipher(null);
    await this.saveSettings();
    new Notice(
      wasKeyMode
        ? `Messenger: ${messages} message(s) decrypted — no passcode is set; add one in Settings if you want the app lock`
        : `Messenger: ${messages} message(s) decrypted`
    );
    this.refreshChatViews();
  }

  /** Whether stored bodies are sealed (SPEC §15) — independent of lock state. */
  isEncrypted(): boolean {
    return this.settings.encryptMail;
  }

  /**
   * Remove the passcode entirely (requires a correct entry first — the
   * settings tab gates this). Refused while encryption is on: sealed mail
   * would become unreadable forever.
   */
  async clearPasscode(): Promise<void> {
    if (this.settings.encryptMail) {
      throw new Error("Turn off message encryption before removing the passcode");
    }
    this.settings.passcodeHash = "";
    this.settings.passcodeSalt = "";
    this.settings.lockedPeers = {};
    this.unlockedPeers.clear();
    this.locked = false;
    this.applyCipher(null);
    await this.saveSettings();
    this.refreshChatViews();
  }

  /** Whether the whole Messenger UI is behind the passcode right now. */
  isMessengerLocked(): boolean {
    return this.hasPasscode() && this.locked;
  }

  /**
   * Try the unlock secret against the app lock. With encryption on, this is
   * also where the vault key comes back into existence: the wrapped bundle
   * IS the verifier — a wrong secret fails the GCM tag. True when it opened.
   */
  async tryUnlockMessenger(candidate: string): Promise<boolean> {
    if (this.hasKeyBundle()) {
      const cipher = await this.openVaultWith(candidate);
      if (!cipher) return false;
      this.applyCipher(cipher);
      if (this.settings.passcodeHash) {
        // shouldn't survive onload's migration, but never leave a fast
        // verifier next to the bundle
        this.settings.passcodeHash = "";
        this.settings.passcodeSalt = "";
        await this.saveSettings();
      }
    } else if (!this.verifyPasscodeHash(candidate)) {
      return false;
    }
    this.locked = false;
    // the OM-2 identity shares the unlock secret — bring it (and the bridge)
    // back with the same motion; failure only costs cross-vault mail, never
    // the unlock itself
    try {
      await this.unlockOm2(candidate);
    } catch (err) {
      console.error("[message-bus] om2 identity unlock failed", err);
    }
    // every view showing a lock screen follows — sidebar and popouts alike
    this.refreshChatViews();
    return true;
  }

  /** Re-engage the app lock now (manual, or the "Lock now" setting). */
  lockMessenger(): void {
    if (!this.hasPasscode()) return;
    this.locked = true;
    this.unlockedPeers.clear();
    // the vault key leaves memory with the session — sealed bodies read as
    // locked until the next unlock
    this.applyCipher(null);
    void this.stopOm2();
    this.refreshChatViews();
  }

  /**
   * Whether one conversation is behind its lock. Locks only bite when a
   * passcode exists; unlocking lasts for the session, then re-arms.
   */
  isPeerLocked(peer: string): boolean {
    return (
      this.hasPasscode() &&
      this.settings.lockedPeers[peer] === true &&
      !this.unlockedPeers.has(peer)
    );
  }

  /** Flag (or unflag) a conversation as locked. */
  async setPeerLocked(peer: string, locked: boolean): Promise<void> {
    if (!ADDRESS_RE.test(peer)) return;
    if (locked) {
      this.settings.lockedPeers[peer] = true;
      this.unlockedPeers.delete(peer);
    } else {
      delete this.settings.lockedPeers[peer];
      this.unlockedPeers.delete(peer);
    }
    await this.saveSettings();
    this.refreshChatViews();
  }

  /**
   * Try the unlock secret against one conversation's lock. True when it
   * opened. Async: with sealing on, each attempt is a full KDF unwrap.
   */
  async tryUnlockPeer(peer: string, candidate: string): Promise<boolean> {
    if (!(await this.verifyAuth(candidate))) return false;
    this.unlockedPeers.add(peer);
    // any other view sitting on this peer's lock screen follows along
    this.refreshChatViews();
    return true;
  }

  // ── cross-vault mail (OM-2) ──────────────────────────────────────────────

  /** The contact-book view the bridge and the badge verifier read. */
  private om2Book: Om2Contacts | null = null;

  /** True when the bridge is running (enabled, relay set, unlocked identity). */
  get om2Ready(): boolean {
    return this.om2Bridge !== null;
  }

  /** This vault's fingerprint, when the bridge is up. */
  get om2Fp(): string | null {
    return this.om2Bridge?.myFp ?? null;
  }

  /**
   * Start the bridge if it can run: enabled, a relay set, and the identity in
   * session memory (which only an unlock provides). Safe to call repeatedly.
   */
  async tryStartOm2(): Promise<void> {
    if (!this.settings.om2.enabled || this.settings.om2.relayUrl === "") return;
    if (this.om2Bridge || !this.om2Identity) return;
    this.om2Book = contactsBook(this.contacts, this.store);
    const bridge = new Bridge({
      mail: mailboxMailStore(this.store),
      kv: this.om2Kv,
      localAddress: this.settings.address,
      handle: this.settings.om2.handle || undefined,
      identity: this.om2Identity,
      contacts: this.om2Book,
      relayUrl: this.settings.om2.relayUrl,
      log: (msg) => {
        if (this.settings.debug) console.info(`[message-bus/om2] ${msg}`);
      },
      onEvent: (ev) => this.onOm2Event(ev),
    });
    await bridge.start();
    this.om2Bridge = bridge;
    this.app.workspace.trigger("messenger:tick");
  }

  /** Unwrap the identity with the unlock secret; starts the bridge when it lands. */
  private async unlockOm2(secret: string): Promise<void> {
    if (!this.settings.om2.enabled || this.om2Bridge || this.om2Identity) return;
    const record = await loadIdentityRecord(this.om2Kv);
    if (!record) return;
    try {
      this.om2Identity = await openIdentityRecord(record, secret);
    } catch (err) {
      // the secret just verified against the vault key, so this is corruption
      // — leave cross-vault mail off rather than loop the user into a modal
      console.error("[message-bus] om2 identity unwrapping failed", err);
      new Notice("Messenger: the cross-vault identity is unreadable — regenerate it in settings", 10_000);
      return;
    }
    await this.tryStartOm2();
  }

  /** Stop the bridge and scrub the signing key (lock / unload / disable). */
  async stopOm2(): Promise<void> {
    const bridge = this.om2Bridge;
    this.om2Bridge = null;
    if (bridge) await bridge.stop().catch((err) => console.error("[message-bus] om2 stop failed", err));
    wipeIdentity(this.om2Identity);
    this.om2Identity = null;
  }

  /**
   * Mint the identity (seed wrapped under the unlock secret) and start the
   * bridge. The secret is re-verified by the caller (a modal that already
   * checked it), so any GCM failure here is a bug, not a wrong password.
   */
  async createOm2Identity(secret: string): Promise<void> {
    const { record, identity } = await createIdentityRecord(secret);
    await saveIdentityRecord(this.om2Kv, record);
    this.om2Identity = identity;
    await this.tryStartOm2();
  }

  /** A fresh keypair; every contact must re-pin — §5.3 makes that loud. */
  async regenerateOm2Identity(secret: string): Promise<void> {
    await this.stopOm2();
    const { record, identity } = await regenerateIdentityRecord(secret);
    await saveIdentityRecord(this.om2Kv, record);
    this.om2Identity = identity;
    await this.tryStartOm2();
    new Notice(
      "Messenger: new keypair generated. Every cross-vault contact must re-add you — send them your new invite code.",
      12_000
    );
  }

  /** Turn cross-vault mail off and forget the identity record entirely. */
  async disableOm2(): Promise<void> {
    await this.stopOm2();
    await clearIdentityRecord(this.om2Kv);
  }

  /** The pasteable reach-me artifact, when the bridge can advertise one. */
  om2Invite(): { code: string; link: string } | null {
    if (!this.om2Identity || this.settings.om2.relayUrl === "") return null;
    const invite = {
      publicKey: toB64u(this.om2Identity.publicKey),
      relay: this.settings.om2.relayUrl,
      handle: this.settings.om2.handle || undefined,
    };
    return { code: encodeInvite(invite), link: inviteLink(invite) };
  }

  /** Send the sealed self-signed introduction to a bare invite's key. */
  async sendOm2Request(publicKeyB64u: string, relay: string, note?: string): Promise<{ fp: string; id: string }> {
    if (!this.om2Bridge) throw new Error("Cross-vault mail is not running");
    return this.om2Bridge.sendRequest(fromB64u(publicKeyB64u), relay, note);
  }

  /** The 30-digit safety number against a contact's carried key. */
  om2SafetyNumber(contactPublicKeyB64u: string): string | null {
    if (!this.om2Identity) return null;
    try {
      return safetyNumber(this.om2Identity.publicKey, fromB64u(contactPublicKeyB64u));
    } catch {
      return null;
    }
  }

  /** The chat view's shield badge: verified in-process, Social as legacy fallback. */
  async verifyMessage(msg: MailEnvelope): Promise<Om2Badge | null> {
    const native = await verifyEnvelope(msg, this.om2Book);
    if (native) return native;
    const legacy = (window as unknown as { obsidianSocial?: { verify?: (m: MailEnvelope) => Om2Badge | null } }).obsidianSocial;
    try {
      return legacy?.verify?.(msg) ?? null;
    } catch {
      return null;
    }
  }

  /** A pasted or scanned invite code: decode, then let the modal finish. */
  async handleInviteCode(raw: string): Promise<void> {
    const invite = decodeInvite(raw);
    if (!invite) {
      new Notice("Messenger: no invite code found in that text");
      return;
    }
    if (this.om2Fp && inviteFingerprint(invite) === this.om2Fp) {
      new Notice("Messenger: that's your own invite — you can't add yourself");
      return;
    }
    new AddContactModal(this.app, this, { inviteCode: raw }).open();
  }

  /** Bridge transitions → contact rows, notices, and a view refresh. */
  private onOm2Event(ev: BridgeEvent): void {
    if (ev.type === "quarantined" || ev.type === "keychange") {
      // file the knock as a request row so the existing Contact-requests UI
      // (and its accept/decline) picks it up — no separate surface
      const fp = ev.type === "keychange" ? fingerprint(fromB64u(ev.publicKey || "x")) : ev.fp;
      const alias = aliasCandidate({ fp, handle: ev.type === "quarantined" ? ev.handle : undefined }, new Uint8Array(32));
      void this.contacts
        .upsert({
          address: alias,
          name:
            ev.type === "keychange"
              ? "Key change — review"
              : ev.handle
                ? ev.handle.replace(/^@(.+)@.+$/, "$1")
                : `${ev.fp.slice(0, 11)}…`,
          state: "request",
          updated: new Date().toISOString(),
          fp,
          publicKey: ev.publicKey || undefined,
        })
        .then(() => {
          this.refreshChatViews();
          this.app.workspace.trigger("messenger:tick");
        });
      new Notice(
        ev.type === "keychange"
          ? `Messenger: KEY CHANGE from a pinned contact — review under Contact requests`
          : `Messenger: contact request — see Contact requests`,
        8_000
      );
      return;
    }
    if (ev.type === "autopinned") {
      this.refreshChatViews();
      this.app.workspace.trigger("messenger:tick");
      return;
    }
    if (ev.type === "bounce") {
      new Notice(`Messenger: delivery failed — the message bounced back to your inbox`, 8_000);
    }
  }

  /**
   * The welcome modal was closed without saving. Signup is only complete
   * once a passcode exists — without one, onboarding stays open and the
   * modal returns next launch (it can't be dismissed away).
   */
  async dismissOnboarding(): Promise<void> {
    if (this.settings.onboarded) return;
    if (!this.hasPasscode()) return;
    this.settings.onboarded = true;
    await this.saveSettings();
  }

  /**
   * Adopt the identity chosen in the welcome modal: set the mandatory
   * passcode (optionally minting the encryption key), move any mail from the
   * old address, register the new one, and deliver a first real message so
   * the bus proves itself. Runs after the modal has closed.
   */
  async completeOnboarding(
    address: string,
    displayName: string,
    passcode: string,
    encrypt = false,
    om2?: { relayUrl: string }
  ): Promise<void> {
    if (!ADDRESS_RE.test(address)) return;
    await this.setPasscode(passcode, encrypt);
    this.settings.displayName = displayName;
    // cross-vault mail opts in with the passcode already in hand: the keypair
    // mints under it, no second prompt
    if (om2 && /^https?:\/\//.test(om2.relayUrl)) {
      this.settings.om2.enabled = true;
      this.settings.om2.relayUrl = om2.relayUrl.replace(/\/+$/, "");
      try {
        await this.createOm2Identity(passcode);
        new Notice("Messenger: cross-vault mail is on — your invite lives in settings", 8_000);
      } catch (err) {
        console.error("[message-bus] om2 onboarding setup failed", err);
        new Notice("Messenger: cross-vault mail setup failed — enable it later in settings");
        this.settings.om2.enabled = false;
      }
    }
    await this.changeAddress(address);
    this.settings.onboarded = true;
    await this.saveSettings();
    // changeAddress skips the registry when the address is unchanged, but the
    // display name may have changed — refresh the row either way
    await this.store.upsertRegistry({
      address: this.settings.address,
      name: this.selfRegistryName(),
      updated: new Date().toISOString(),
    });
    try {
      // a brand-new bus has one reader: say so, or the first cross-device
      // message silently files into a folder nobody else will ever sync
      const otherReaders = (await this.store.listAddresses()).filter(
        (a) => a !== address && a !== BUS_ADDRESS
      );
      const paragraphs = [
        "Welcome aboard — this note is real mail, delivered the same way every message here travels: a markdown block appended to your inbox.",
        "",
        `Your address on this vault's bus is **${address}**. Anything in the vault can write to it — plugins, agents, scripts, you.`,
        "",
        "Your passcode now guards Messenger: it locks the app on startup, and any conversation you lock (right-click → *Lock conversation*) asks for it too. Change it anytime in Settings → Messenger.",
        "",
      ];
      if (otherReaders.length === 0) {
        paragraphs.push(
          "Right now this bus has one reader: you. To chat across devices, either point every vault at the same synced mail folder — Settings → Messenger → storage (Obsidian Sync skips hidden folders, so turn off “Hide mail storage”) — or turn on **Cross-vault mail** in settings and connect by invite code: relay-carried, end-to-end encrypted, nothing shared.",
          ""
        );
      }
      paragraphs.push("Try *Send message* from the command palette, or just type below.");
      await this.bus.send(BUS_ADDRESS, address, paragraphs.join("\n"));
    } catch (err) {
      console.warn("[message-bus] welcome message failed", err);
    }
    await this.openChat(BUS_ADDRESS);
  }

  /**
   * Switch this participant to a new address: move the mailbox files (only
   * when the destination is empty — never clobber live mail), carry the read
   * cursor so history doesn't re-dispatch as "new", and fix the registry.
   * Both identity paths — the welcome modal and the settings tab — go through
   * here so they can't diverge again. No-op on an unchanged/invalid address.
   */
  async changeAddress(address: string): Promise<void> {
    if (!ADDRESS_RE.test(address) || address === this.settings.address) return;
    if (isReservedAddress(address)) {
      throw new Error("that name is reserved (SPEC §2) — pick another");
    }
    const old = this.settings.address;
    this.settings.address = address;
    const moved = await this.migrateMailbox(old, address);
    if (moved) {
      if (this.settings.cursors[old] && !this.settings.cursors[address]) {
        this.settings.cursors[address] = this.settings.cursors[old];
      }
      delete this.settings.cursors[old];
      if (this.settings.readAt[old] && !this.settings.readAt[address]) {
        this.settings.readAt[address] = this.settings.readAt[old];
      }
      delete this.settings.readAt[old];
    }
    // profile pictures are identity, not conversation state — they follow
    // the person even when adopting an address that already has mail
    if (this.settings.avatars[old] && !this.settings.avatars[address]) {
      this.settings.avatars[address] = this.settings.avatars[old];
      delete this.settings.avatars[old];
    }
    this.bus.setCursors(this.settings.cursors);
    await this.saveSettings();
    await this.store.upsertRegistry({
      address,
      name: this.selfRegistryName(),
      updated: new Date().toISOString(),
    });
    if (old !== address) await this.store.removeRegistry(old);
    this.refreshChatViews();
  }

  /** Every address reachable on this bus, for send-to pickers: registry rows plus any folder with an inbox. */
  async knownAddresses(): Promise<Array<{ address: string; name: string }>> {
    const [registry, addresses] = await Promise.all([
      this.store.readRegistry(),
      this.store.listAddresses(),
    ]);
    const names = new Map(registry.map((r) => [r.address, r.name]));
    return [...new Set([...addresses, ...registry.map((r) => r.address)])]
      .sort()
      .map((address) => ({ address, name: names.get(address) ?? address }));
  }

  /**
   * Has this address proven it reads mail on this bus — by sending here, or
   * by publishing receipts (SPEC §11)? A contact you added or a folder your
   * own sends created proves nothing: the append succeeds whether or not a
   * human ever sees the message, so the UIs use this to warn before a silent
   * send-into-the-void (the isolated-device trap — a vault whose mail folder
   * isn't shared/synced with anyone is a bus of one).
   */
  async isConfirmedRecipient(address: string): Promise<boolean> {
    if (address === this.settings.address || address === BUS_ADDRESS) return true;
    const mine = await this.store.readInbox(this.settings.address);
    if (mine.some((m) => m.from === address)) return true;
    return this.store.hasReceipts(address);
  }

  /**
   * Mark a conversation read without opening it (context menu, API). Sets
   * the read cursor and, when enabled, emits read receipts for what was
   * actually unread.
   */
  async markPeerRead(peer: string): Promise<void> {
    if (!ADDRESS_RE.test(peer)) return;
    const me = this.settings.address;
    const since = this.settings.readAt[peer] ?? "";
    const unreadIds = (await this.store.readInbox(me))
      .filter((m) => m.from === peer && m.ts > since)
      .map((m) => m.id);
    const next = new Date().toISOString();
    if ((this.settings.readAt[peer] ?? "") >= next) return;
    this.settings.readAt[peer] = next;
    if (unreadIds.length > 0 && peer !== me && this.settings.sendReadReceipts) {
      try {
        await this.store.appendReceiptBlock(
          me,
          encodeReceiptBlock(me, "read", next, unreadIds)
        );
      } catch (err) {
        console.error("[message-bus] read receipt failed", err);
      }
    }
    await this.saveSettings();
    void this.updateBadge();
    this.refreshChatViews();
    // burn-after-read mail (SPEC §16) owes its disk copy to this very moment
    this.requestBurnSweep();
  }

  /** Drop a peer's folder and every local trace of the conversation. */
  async deleteConversation(peer: string): Promise<void> {
    if (!ADDRESS_RE.test(peer)) return;
    await this.store.deleteAddress(peer);
    delete this.settings.cursors[peer];
    delete this.settings.readAt[peer];
    delete this.settings.drafts[peer];
    delete this.settings.mutedPeers[peer];
    delete this.settings.lockedPeers[peer];
    this.unlockedPeers.delete(peer);
    delete this.settings.wallpaperByPeer[peer];
    delete this.settings.wallpaperTintByPeer[peer];
    // per-chat retention overrides die with the conversation (UI parity with
    // every other per-peer record above)
    delete this.settings.retentionDaysByPeer[peer];
    delete this.settings.maxInboxMessagesByPeer[peer];
    await this.store.removeRegistry(peer);
    await this.saveSettings();
    void this.updateBadge();
    this.refreshChatViews();
  }

  /**
   * Write the full thread with `peer` into the vault as a normal note —
   * the human-readable archive for users whose mail lives in the hidden
   * storage folder. Returns the created file, or null when there was
   * nothing to write.
   */
  async exportConversation(peer: string): Promise<TFile | null> {
    if (!ADDRESS_RE.test(peer)) return null;
    const me = this.settings.address;
    const messages = await this.bus.loadConversation(me, peer);
    if (messages.length === 0) {
      new Notice("Nothing to export — no messages in this conversation");
      return null;
    }
    const registry = await this.store.readRegistry();
    const nameOf = (addr: string): string =>
      addr === me ? "You" : (registry.find((r) => r.address === addr)?.name ?? addr);
    const lines: string[] = [
      `# Conversation — ${nameOf(peer)} (${peer})`,
      "",
      `Exported from Interleaf on ${new Date().toLocaleString()}.`,
      "",
    ];
    let prevDay = "";
    for (const m of messages) {
      const d = new Date(m.ts);
      const day = d.toLocaleDateString();
      if (day !== prevDay) {
        lines.push(`## ${day}`, "");
        prevDay = day;
      }
      lines.push(
        `**${nameOf(m.from)}** · ${d.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })}`,
        ""
      );
      for (const line of m.body.split("\n")) lines.push(`> ${line}`);
      lines.push("");
    }
    const folder = "Messenger Exports";
    try {
      await this.app.vault.createFolder(folder);
    } catch {
      // exists — fine
    }
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    let path = normalizePath(`${folder}/${peer} — ${stamp}.md`);
    let n = 2;
    while (this.app.vault.getAbstractFileByPath(path) instanceof TFile) {
      path = normalizePath(`${folder}/${peer} — ${stamp} (${n++}).md`);
    }
    const file = await this.app.vault.create(path, lines.join("\n"));
    new Notice(`Conversation exported to ${file.path}`);
    return file;
  }

  /**
   * Move a participant's inbox and receipts to a new address, when the
   * destination is empty (never clobber live mail). The old folder goes away
   * if the move empties it. Returns whether the inbox actually moved.
   */
  private async migrateMailbox(oldAddr: string, newAddr: string): Promise<boolean> {
    if (oldAddr === newAddr) return false;
    if (!ADDRESS_RE.test(oldAddr) || !ADDRESS_RE.test(newAddr)) return false;
    const adapter = this.app.vault.adapter;
    const folderOf = (addr: string) => normalizePath(`${this.store.rootPath}/${addr}`);
    await this.store.ensureAddress(newAddr);
    let movedInbox = false;
    const moves: Array<readonly [string, string, boolean]> = [
      [this.store.inboxPath(oldAddr), this.store.inboxPath(newAddr), true],
      [this.store.receiptsPath(oldAddr), this.store.receiptsPath(newAddr), false],
    ];
    for (const [from, to, isInbox] of moves) {
      if (!(await adapter.exists(from))) continue;
      if (await adapter.exists(to)) continue; // never clobber live mail
      await adapter.write(to, await adapter.read(from));
      await adapter.remove(from);
      if (isInbox) movedInbox = true;
    }
    try {
      const listing = await adapter.list(folderOf(oldAddr));
      if (listing.files.length === 0 && listing.folders.length === 0) {
        await adapter.rmdir(folderOf(oldAddr), false);
      }
    } catch {
      // non-fatal — an emptied folder just shows as an empty conversation
    }
    return movedInbox;
  }

  /** Create a vault folder (and parents) if missing — used for attachments. */
  async ensureFolder(path: string): Promise<void> {
    const adapter = this.app.vault.adapter;
    const parts = normalizePath(path).split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (await adapter.exists(current)) continue;
      try {
        await adapter.mkdir(current);
      } catch {
        // already exists (race) — the next segment's check handles it
      }
    }
  }

  /** Where mail lives for a given storage mode. */
  private storageTarget(hidden: boolean): string {
    return hidden
      ? `.obsidian/plugins/${this.manifest.id}/mailbox`
      : this.settings.root;
  }

  /**
   * Whether Obsidian Sync (a core plugin) is enabled in this vault. Sync
   * deliberately skips dot-folders, so hidden mail storage never roams —
   * the UIs nudge users to a visible root when this and hiddenStorage
   * are both true.
   */
  syncEnabled(): boolean {
    try {
      const internal = (
        this.app as unknown as {
          internalPlugins?: {
            getEnabledPluginById?: (id: string) => unknown;
            plugins?: Record<string, { enabled?: boolean } | undefined>;
          };
        }
      ).internalPlugins;
      if (!internal) return false;
      if (typeof internal.getEnabledPluginById === "function") {
        if (internal.getEnabledPluginById("sync")) return true;
      }
      return internal.plugins?.sync?.enabled === true;
    } catch {
      return false;
    }
  }

  /**
   * First order of business on load: make sure mail sits where the current
   * mode wants it. Upgrades from visible `Messenger/` land here with a fresh
   * default of hidden storage — their mail moves into the dot-folder once,
   * and the emptied folder goes to the system trash.
   */
  private async settleStorageRoot(): Promise<string> {
    const target = this.storageTarget(this.settings.hiddenStorage);
    const previous =
      this.settings.lastRoot ??
      (this.settings.hiddenStorage ? this.settings.root : undefined);
    await this.moveStorage(previous, target);
    return target;
  }

  /** Settings toggle: migrate live, then re-root the store. */
  async applyStorageMode(hidden: boolean): Promise<void> {
    const target = this.storageTarget(hidden);
    const previous = this.settings.lastRoot ?? this.store.rootPath;
    this.settings.hiddenStorage = hidden;
    await this.moveStorage(previous, target);
    this.store.setRoot(target);
    this.contacts.setRoot(target);
    await this.store.ensureRoot();
    await this.store.upsertRegistry({
      address: this.settings.address,
      name: this.selfRegistryName(),
      updated: new Date().toISOString(),
    });
  }

  private async moveStorage(previous: string | undefined, target: string): Promise<void> {
    if (previous && previous !== target) {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(normalizePath(previous))) {
        const result = await migrateRoot(adapter, previous, target);
        if (result.copied > 0 || result.skipped > 0) {
          new Notice(
            result.skipped > 0
              ? `Messenger: ${previous} holds other files, so it stayed put — mail now lives in ${target}`
              : `Messenger: moved ${result.copied} mail file(s) to ${target}`
          );
        }
      }
    }
    if (this.settings.lastRoot !== target) {
      this.settings.lastRoot = target;
      await this.saveSettings();
    }
  }
}
