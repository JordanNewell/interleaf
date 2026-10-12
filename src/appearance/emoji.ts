/**
 * Emoji for the composer and rendered bubbles: a picker popover anchored to
 * the composer row, `:shortcode:` autocomplete, post-render shortcode
 * substitution, and the "nothing but emoji" test that unlocks jumbo bubbles.
 * Deliberately free of Obsidian app state — hand it a positioned row plus a
 * textarea and it works; recents persistence belongs to the caller (hooks).
 */
import { setIcon } from "obsidian";
import { EMOJI_CATEGORIES, EMOJI_DATA } from "./emoji-data";

export interface EmojiComposerHooks {
  getRecents(): string[];
  setRecents(code: string): void;
}

/** Matches the `:name` fragment users type right before the caret. */
export const SHORTCODE_QUERY = /:([a-zA-Z0-9_+-]{2,})$/;

const AC_MAX = 8;
const RECENTS_MAX = 16;
const SEARCH_MAX = 80;

interface EmojiEntry {
  emoji: string;
  name: string;
  keywords: string[];
  category: string;
}

function parseEmojiData(): EmojiEntry[] {
  const ids = new Map(EMOJI_CATEGORIES.map((c) => [c.name, c.id]));
  const out: EmojiEntry[] = [];
  let category = EMOJI_CATEGORIES[0]?.id ?? "";
  for (const raw of EMOJI_DATA.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      category = ids.get(line.slice(1).trim()) ?? category;
      continue;
    }
    const parts = line.split(/\s+/);
    if (parts.length < 2 || !parts[0] || !parts[1]) continue;
    out.push({
      emoji: parts[0],
      name: parts[1],
      keywords: parts.slice(2),
      category,
    });
  }
  return out;
}

const EMOJIS = parseEmojiData();

/** The `:shortcode:` vocabulary — name (no colons) → emoji char. */
export const SHORTCODES: Map<string, string> = new Map(
  EMOJIS.map((e) => [e.name, e.emoji])
);

const BY_CHAR = new Map(EMOJIS.map((e) => [e.emoji, e]));

const BY_CATEGORY = new Map<string, EmojiEntry[]>();
for (const e of EMOJIS) {
  const list = BY_CATEGORY.get(e.category);
  if (list) list.push(e);
  else BY_CATEGORY.set(e.category, [e]);
}

/** Exact > name-prefix > substring/keyword, so typing "smile" ranks :smile:
 * above :smiley:. */
function searchEmoji(query: string): EmojiEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exact: EmojiEntry[] = [];
  const prefix: EmojiEntry[] = [];
  const rest: EmojiEntry[] = [];
  for (const e of EMOJIS) {
    if (e.name === q) exact.push(e);
    else if (e.name.startsWith(q)) prefix.push(e);
    else if (
      e.name.includes(q) ||
      e.keywords.some((k) => k.startsWith(q) || k.includes(q))
    ) {
      rest.push(e);
    }
  }
  return [...exact, ...prefix, ...rest];
}

/**
 * Wire a composer row for emoji: toggle button, picker popover, and
 * `:shortcode:` autocomplete. One call per composer; idempotent so a racing
 * re-render can't double the button.
 */
export function attachEmojiComposer(
  row: HTMLElement,
  textarea: HTMLTextAreaElement,
  hooks: EmojiComposerHooks
): void {
  if (row.querySelector(":scope > .messenger-emoji-toggle")) return;

  const commit = (from: number, to: number, emoji: string): void => {
    textarea.value =
      textarea.value.slice(0, from) + emoji + textarea.value.slice(to);
    const caret = from + emoji.length;
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
    // the host's draft/autosize/send-state handlers all listen for "input"
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    hooks.setRecents(emoji);
  };

  const toggle = row.createEl("button", {
    cls: "messenger-emoji-toggle clickable-icon",
    attr: {
      type: "button",
      "aria-label": "Emoji picker",
      "aria-expanded": "false",
    },
  });
  setIcon(toggle, "smile");
  row.insertBefore(toggle, row.firstChild);

  // -- :shortcode: autocomplete -----------------------------------------------

  let acEl: HTMLElement | null = null;
  let acItems: EmojiEntry[] = [];
  let acIndex = 0;

  const closeAc = (): void => {
    acEl?.remove();
    acEl = null;
    acItems = [];
    acIndex = 0;
  };

  const acceptAc = (): void => {
    const item = acItems[acIndex];
    const caret = textarea.selectionStart ?? textarea.value.length;
    const typed = item
      ? textarea.value.slice(0, caret).match(SHORTCODE_QUERY)
      : null;
    closeAc();
    if (!item || !typed) return;
    commit(caret - typed[0].length, caret, item.emoji);
  };

  const paintAcSelection = (): void => {
    acEl?.querySelectorAll(".messenger-emoji-ac-item").forEach((el, i) => {
      el.classList.toggle("is-active", i === acIndex);
    });
  };

  const renderAc = (items: EmojiEntry[]): void => {
    if (items.length === 0) {
      closeAc();
      return;
    }
    if (!acEl) {
      acEl = row.createDiv({
        cls: "messenger-emoji-ac",
        attr: { role: "listbox" },
      });
      // mousing over suggestions must not blur the textarea — the accept
      // path replaces text at the caret it remembers
      acEl.addEventListener("mousedown", (e) => e.preventDefault());
      acEl.addEventListener("click", (e) => {
        const hit = (e.target as HTMLElement).closest<HTMLElement>(
          ".messenger-emoji-ac-item"
        );
        const i = Number(hit?.dataset.i ?? "-1");
        if (!(i >= 0)) return;
        acIndex = i;
        acceptAc();
      });
    }
    const host = acEl;
    host.replaceChildren();
    items.forEach((item, i) => {
      const el = host.createDiv({
        cls: "messenger-emoji-ac-item",
        attr: { role: "option" },
      });
      el.dataset.i = String(i);
      el.createSpan({ cls: "messenger-emoji-ac-emoji", text: item.emoji });
      el.createSpan({
        cls: "messenger-emoji-ac-name",
        text: `:${item.name}:`,
      });
    });
    acItems = items;
    acIndex = 0;
    paintAcSelection();
  };

  // Capture-phase so we can swallow Enter/Tab *only* while a suggestion is
  // on screen; otherwise send-on-Enter flows through untouched.
  const onKeydownCapture = (e: KeyboardEvent): void => {
    if (!acEl?.isConnected || acItems.length === 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      acIndex = (acIndex + delta + acItems.length) % acItems.length;
      paintAcSelection();
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      acceptAc();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeAc();
    }
  };
  textarea.addEventListener("keydown", onKeydownCapture, true);

  textarea.addEventListener("input", () => {
    const caret = textarea.selectionStart ?? textarea.value.length;
    const typed = textarea.value.slice(0, caret).match(SHORTCODE_QUERY);
    if (typed) renderAc(searchEmoji(typed[1]).slice(0, AC_MAX));
    else closeAc();
  });

  // focus moving out of the composer (send, thread click) retires the list
  textarea.addEventListener("blur", closeAc);

  // -- picker popover -----------------------------------------------------------

  let pop: HTMLElement | null = null;
  let activeCat = EMOJI_CATEGORIES[0]?.id ?? "";
  let searchInput: HTMLInputElement | null = null;
  let recentsEl: HTMLElement | null = null;
  let bodyEl: HTMLElement | null = null;

  const pick = (emoji: string): void => {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    commit(start, end, emoji);
    closePopover();
  };

  const renderGrid = (entries: EmojiEntry[]): void => {
    if (!bodyEl) return;
    bodyEl.replaceChildren();
    if (entries.length === 0) {
      bodyEl.createDiv({
        cls: "messenger-emoji-empty",
        text: "No emoji match",
      });
      return;
    }
    const grid = bodyEl.createDiv({ cls: "messenger-emoji-grid" });
    for (const entry of entries) {
      const cell = grid.createEl("button", {
        cls: "messenger-emoji-cell",
        text: entry.emoji,
        attr: {
          type: "button",
          title: `:${entry.name}:`,
          "aria-label": entry.name,
        },
      });
      cell.addEventListener("click", () => pick(entry.emoji));
    }
  };

  const renderRecents = (): void => {
    if (!recentsEl) return;
    recentsEl.replaceChildren();
    const seen = new Set<string>();
    const recents = hooks
      .getRecents()
      .filter((code) => typeof code === "string")
      .filter((code) => {
        if (seen.has(code) || !BY_CHAR.has(code)) return false;
        seen.add(code);
        return true;
      })
      .slice(0, RECENTS_MAX);
    recentsEl.classList.toggle("is-empty", recents.length === 0);
    recentsEl.createSpan({
      cls: "messenger-emoji-recents-label",
      text: "Recent",
    });
    for (const code of recents) {
      const cell = recentsEl.createEl("button", {
        cls: "messenger-emoji-cell",
        text: code,
        attr: {
          type: "button",
          "aria-label": BY_CHAR.get(code)?.name ?? "emoji",
        },
      });
      cell.addEventListener("click", () => pick(code));
    }
  };

  const paintTabs = (): void => {
    pop?.querySelectorAll(".messenger-emoji-tab").forEach((el) => {
      el.classList.toggle("is-active", el.getAttribute("data-cat") === activeCat);
    });
  };

  const showCategory = (id: string): void => {
    activeCat = id;
    if (searchInput) searchInput.value = "";
    paintTabs();
    renderGrid(BY_CATEGORY.get(id) ?? []);
  };

  const buildPopover = (): HTMLElement => {
    const el = createDiv({
      cls: "messenger-emoji-popover",
      attr: { role: "dialog", "aria-label": "Emoji picker" },
    });

    const search = el.createEl("input", {
      cls: "messenger-emoji-search messenger-search-input",
      type: "search",
      placeholder: "Search emoji…",
      attr: { "aria-label": "Search emoji" },
    });
    search.addEventListener("input", () => {
      const q = search.value.trim();
      renderGrid(
        q ? searchEmoji(q).slice(0, SEARCH_MAX) : BY_CATEGORY.get(activeCat) ?? []
      );
    });
    searchInput = search;

    const tabs = el.createDiv({ cls: "messenger-emoji-tabs" });
    for (const cat of EMOJI_CATEGORIES) {
      const tab = tabs.createEl("button", {
        cls: "messenger-emoji-tab",
        // the tab glyph is the section's first emoji, so it can never drift
        text: BY_CATEGORY.get(cat.id)?.[0]?.emoji ?? "•",
        attr: {
          type: "button",
          title: cat.name,
          "aria-label": cat.name,
        },
      });
      tab.dataset.cat = cat.id;
      tab.addEventListener("click", () => showCategory(cat.id));
    }

    recentsEl = el.createDiv({ cls: "messenger-emoji-recents is-empty" });
    bodyEl = el.createDiv({ cls: "messenger-emoji-body" });

    // taps in the picker must not steal focus from the composer — inserts
    // read the textarea's selection
    el.addEventListener("mousedown", (e) => {
      if (e.target !== searchInput) e.preventDefault();
    });

    renderGrid(BY_CATEGORY.get(activeCat) ?? []);
    return el;
  };

  const onDocMouseDown = (e: MouseEvent): void => {
    const t = e.target as Node | null;
    if (pop?.isConnected && t && !pop.contains(t) && !toggle.contains(t)) {
      closePopover();
    }
  };

  const onDocKeydown = (e: KeyboardEvent): void => {
    if (e.key !== "Escape" || !pop?.isConnected) return;
    e.preventDefault();
    e.stopPropagation();
    closePopover();
  };

  const clampPopover = (): void => {
    if (!pop?.isConnected) return;
    const rect = pop.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    let shift = 0;
    if (rect.left < 8) shift = 8 - rect.left;
    else if (rect.right > vw - 8) shift = vw - 8 - rect.right;
    pop.setCssStyles({
      transform: shift ? `translateX(${shift}px)` : "",
    });
  };

  const openPopover = (): void => {
    if (!pop) pop = buildPopover();
    row.appendChild(pop);
    renderRecents();
    showCategory(activeCat);
    clampPopover();
    document.addEventListener("mousedown", onDocMouseDown, true);
    document.addEventListener("keydown", onDocKeydown, true);
    window.addEventListener("resize", clampPopover);
    toggle.setAttribute("aria-expanded", "true");
    closeAc();
  };

  const closePopover = (): void => {
    if (!pop?.isConnected) return;
    pop.remove();
    document.removeEventListener("mousedown", onDocMouseDown, true);
    document.removeEventListener("keydown", onDocKeydown, true);
    window.removeEventListener("resize", clampPopover);
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    if (pop?.isConnected) closePopover();
    else openPopover();
  });
}

/**
 * Post-render pass over a bubble: replace `:shortcode:` text with the emoji
 * character, leaving code blocks, inline code, links and images literal
 * (TreeWalker over text nodes, skipping those subtrees).
 */
const EMOJIFY_SKIP = "pre, code, a, img";

export function emojify(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      return parent && parent.closest(EMOJIFY_SKIP)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  const targets: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) targets.push(n as Text);
  for (const node of targets) {
    const text = node.nodeValue ?? "";
    if (!text.includes(":")) continue;
    const out = text.replace(
      /:([a-zA-Z0-9_+-]{2,}):/g,
      (whole, name: string) => SHORTCODES.get(name) ?? whole
    );
    if (out !== text) node.nodeValue = out;
  }
}

// One "token" of an emoji-only message: pictographics joined by variation
// selectors, ZWJ, skin tones or keycap markers. (Alternation, not one big
// character class — some linters flag emoji ranges joined inside a class.)
const EMOJI_CLUSTER =
  /^(?:\p{Extended_Pictographic}|[\u{FE00}-\u{FE0F}]|\u200D|\u20E3|[\u{1F3FB}-\u{1F3FF}]|[\u{1F1E6}-\u{1F1FF}])+$/u;

function isEmojiCluster(token: string): boolean {
  if (!EMOJI_CLUSTER.test(token)) return false;
  if (/\p{Extended_Pictographic}/u.test(token)) return true;
  // a bare country flag is the one non-pictographic cluster we honor
  return /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(token);
}

/**
 * Distinct emoji inside one token: pictographics only count again when not
 * glued by ZWJ (👍🏽 = 1, 🧑‍🚒 = 1, 😄🎉 = 2), and a run of regional
 * indicators is flag pairs.
 */
function clusterBases(token: string): number {
  let bases = 0;
  let riRun = 0;
  let prev = "";
  const flushRi = (): void => {
    bases += Math.ceil(riRun / 2);
    riRun = 0;
  };
  for (const cp of token) {
    if (/^[\u{1F1E6}-\u{1F1FF}]$/u.test(cp)) {
      riRun += 1;
      prev = cp;
      continue;
    }
    flushRi();
    if (/\p{Extended_Pictographic}/u.test(cp) && prev !== "\u200D") {
      bases += 1;
    }
    prev = cp;
  }
  flushRi();
  return bases;
}

/** True when the trimmed text is 1–3 emoji (spaces/ZWJ/VS allowed between)
 * and nothing else — the integrator's cue to stamp jumbo sizing. */
export function isEmojiOnly(text: string): boolean {
  const tokens = text.trim().split(/\s+/);
  if (tokens.length === 0 || tokens.length > 3) return false;
  let total = 0;
  for (const token of tokens) {
    if (!isEmojiCluster(token)) return false;
    total += clusterBases(token);
  }
  return total >= 1 && total <= 3;
}
