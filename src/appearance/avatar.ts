import { App, FuzzySuggestModal, setIcon, TFile } from "obsidian";
import type { FuzzyMatch } from "obsidian";
import type ObsidianMessengerPlugin from "../main";

/** Vault image formats the picker offers and paintAvatar will resolve. */
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];

/**
 * Paint an avatar: the peer's chosen vault image when an override exists in
 * settings.avatars, else initials over a deterministic two-hue gradient.
 * Drop-in upgrade of the chat view's old flat-fill paintAvatar — the caller
 * keeps owning the el and any click handlers attached to it.
 */
export function paintAvatar(
  el: HTMLElement,
  address: string,
  plugin: ObsidianMessengerPlugin
): void {
  el.empty();
  el.setAttr("aria-hidden", "true");
  const file = avatarFileFor(plugin, address);
  if (file) {
    // transparent images would let a previous gradient bleed through
    el.removeClass("is-generated");
    el.style.removeProperty("--messenger-avatar-gradient");
    const img = el.createEl("img", {
      cls: "messenger-avatar-img",
      attr: { alt: "", "aria-hidden": "true" },
    });
    // resource URLs are plain app:// srcs, so painting stays sync
    img.src = plugin.app.vault.getResourcePath(file);
    return;
  }
  el.addClass("is-generated");
  el.setText(initials(address));
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) | 0;
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40 + (Math.abs(hash >> 8) % 80)) % 360;
  // the yellow-green band reads brightest; darken it there so the white
  // initials keep contrast across the whole hue space
  const lightnessOf = (hue: number): number => (hue >= 40 && hue <= 160 ? 34 : 42);
  const l1 = lightnessOf(h1);
  const l2 = lightnessOf(h2);
  // the gradient rides a CSS var, not an inline background, so a theme
  // snippet can restyle .is-generated without fighting inline styles
  el.style.setProperty(
    "--messenger-avatar-gradient",
    `linear-gradient(135deg, hsl(${h1} 46% ${l1}%), hsl(${h2} 52% ${l2}%))`
  );
}

/** Pick a vault image with a fuzzy-search modal; null on dismiss. */
export function chooseVaultImage(app: App): Promise<string | null> {
  return new Promise((resolve) => {
    new VaultImageSuggestModal(app, resolve).open();
  });
}

class VaultImageSuggestModal extends FuzzySuggestModal<TFile> {
  private settled = false;

  constructor(app: App, private readonly done: (path: string | null) => void) {
    super(app);
    this.setPlaceholder("Search vault images…");
  }

  getItems(): TFile[] {
    return this.app.vault
      .getFiles()
      .filter((f) => IMAGE_EXTENSIONS.includes(f.extension.toLowerCase()));
  }

  getItemText(file: TFile): string {
    return file.path;
  }

  renderSuggestion(match: FuzzyMatch<TFile>, el: HTMLElement): void {
    setIcon(el.createSpan({ cls: "messenger-avatar-picker-icon" }), "image");
    el.createSpan({ cls: "messenger-avatar-picker-path", text: match.item.path });
  }

  onChooseItem(file: TFile): void {
    this.settled = true;
    this.done(file.path);
  }

  onClose(): void {
    // dismissed without a choice — callers read null as "keep the current PFP"
    if (!this.settled) this.done(null);
  }
}

function avatarFileFor(
  plugin: ObsidianMessengerPlugin,
  address: string
): TFile | null {
  // settings.avatars ships later; treat it as optional until then
  const avatars = (plugin.settings as { avatars?: Record<string, string> })
    .avatars ?? {};
  const path = avatars[address];
  if (!path) return null;
  const file = plugin.app.vault.getAbstractFileByPath(path);
  return file instanceof TFile &&
    IMAGE_EXTENSIONS.includes(file.extension.toLowerCase())
    ? file
    : null;
}

/** Same initials heuristic the chat view always used: split, take two. */
function initials(address: string): string {
  const parts = address.split(/[-._]/).filter(Boolean);
  const ini = (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
  return ini.toUpperCase();
}
