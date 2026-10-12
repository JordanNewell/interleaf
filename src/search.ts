import { FuzzySuggestModal, setIcon } from "obsidian";
import type { App, FuzzyMatch } from "obsidian";
import type { MailEnvelope } from "./mailbox/envelope";
import type ObsidianMessengerPlugin from "./main";

interface SearchHit {
  envelope: MailEnvelope;
  /** Conversation the message belongs to (the other side of {me, peer}). */
  peer: string;
  name: string;
}

/**
 * Search message bodies across every conversation — the cross-bus counterpart
 * of the vault's quick switcher, and the only search that can see the hidden
 * storage folder. Reads go through the store's stat-validated cache, so a
 * re-open is cheap; the first open after a burst of mail does the parsing.
 */
export class MessageSearchModal extends FuzzySuggestModal<SearchHit> {
  private hits: SearchHit[] = [];

  constructor(
    app: App,
    private plugin: ObsidianMessengerPlugin
  ) {
    super(app);
    this.setPlaceholder("Search messages…");
  }

  async onOpen(): Promise<void> {
    await this.collect();
    await super.onOpen();
  }

  private async collect(): Promise<void> {
    const me = this.plugin.settings.address;
    const [addresses, registry] = await Promise.all([
      this.plugin.store.listAddresses(),
      this.plugin.store.readRegistry(),
    ]);
    const names = new Map(registry.map((r) => [r.address, r.name]));
    // every conversation loads concurrently, like the chat view's list —
    // each address costs a stat round-trip, and serial reads add up
    const perAddress = await Promise.all(
      addresses.map(async (address) => {
        // a passcode-locked conversation is invisible to search — otherwise the
        // lock would leak its contents through this modal
        if (this.plugin.isPeerLocked(address)) return [];
        // sealed with no key in session (SPEC §15) — there is nothing to match
        return (await this.plugin.bus.loadConversation(me, address)).filter(
          (m) => !m.encLocked
        );
      })
    );
    this.hits = perAddress.flatMap((messages, i) => {
      const address = addresses[i];
      const name = names.get(address) ?? address;
      return messages.map((envelope) => ({ envelope, peer: address, name }));
    });
  }

  getItems(): SearchHit[] {
    return this.hits;
  }

  getItemText(hit: SearchHit): string {
    return `${hit.name} ${oneLine(hit.envelope.body, 120)}`;
  }

  renderSuggestion(match: FuzzyMatch<SearchHit>, el: HTMLElement): void {
    const hit = match.item;
    el.addClass("messenger-search-hit");
    const top = el.createDiv({ cls: "messenger-search-hit-top" });
    top.createDiv({ cls: "messenger-search-hit-name" }, (n) =>
      n.setText(`${hit.name} · ${new Date(hit.envelope.ts).toLocaleString()}`)
    );
    const snippet = el.createDiv({ cls: "messenger-search-hit-body" });
    setIcon(snippet.createSpan({ cls: "messenger-search-hit-icon" }), hit.envelope.from === this.plugin.settings.address ? "corner-up-right" : "corner-up-left");
    snippet.createSpan({ text: oneLine(hit.envelope.body, 140) });
  }

  onChooseItem(hit: SearchHit): void {
    void this.plugin.openChatToMessage(hit.peer, hit.envelope.id);
  }
}

const oneLine = (body: string, max: number): string => {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};
