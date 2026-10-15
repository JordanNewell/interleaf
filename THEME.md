# Theming Interleaf

Messenger treats your Obsidian theme as the substrate, not a canvas to paint
over. Every color, corner, and size in its UI resolves through a
`--messenger-*` design token whose default is an Obsidian CSS variable, so a
default install already follows your theme's accent, backgrounds, borders,
and fonts. This guide is the contract for going further: restyling from a
CSS snippet, a full theme, or just poking at it in devtools.

Everything below refers to `styles.css` in the plugin folder, organized into
numbered sections (§1–§17) with a table of contents at the top of the file.

## Quick start

Settings → Appearance → CSS snippets → create `messenger.css`:

```css
/* Square-ish bubbles, compact rows, no shadows */
body {
  --messenger-radius-bubble: 10px;
  --messenger-radius-tail: 2px;
  --messenger-bubble-shadow: none;
  --messenger-avatar-size: 32px;
}
```

Reload the snippet and every surface that consumes those tokens follows —
list, thread, composer, popovers, modals. No `!important`, no selector
wrestling.

## Design tokens (§1 of styles.css)

Tokens are declared on `body`, so they reach the chat view, modals, and
notices alike. Mobile variants (`body.is-phone`) and touch media queries
override a few of them; your `body`-level values keep applying wherever the
built-ins don't re-declare (and a more specific selector on your side, e.g.
`body.theme-dark`, wins back control whenever you want it).

### Surfaces & ink

| Token | Default | Controls |
| --- | --- | --- |
| `--messenger-bubble-bg` | `var(--background-secondary)` | Received-message bubble fill |
| `--messenger-bubble-fg` | `var(--text-normal)` | Received-message text |
| `--messenger-bubble-border` | `var(--background-modifier-border)` | Bubble outline |
| `--messenger-bubble-shadow` | `0 1px 2px rgba(0,0,0,0.05)` | Bubble elevation (`none` flattens) |
| `--messenger-bubble-mine-bg` | `var(--interactive-accent)` | Sent-message bubble fill |
| `--messenger-bubble-mine-fg` | `var(--text-on-accent)` | Sent-message text |
| `--messenger-quote-bg` | `rgba(127,127,127,0.15)` | Quoted-reply chip wash inside a bubble |
| `--messenger-avatar-fg` | `#ffffff` | Initials over generated avatar gradients |
| `--messenger-avatar-text-shadow` | `0 1px 1px rgba(0,0,0,0.3)` | Legibility shade for those initials |
| `--messenger-focus-ring` | `0 0 0 1px var(--interactive-accent)` | Input focus ring |

### Corner language

The iMessage look is one uniform pill with a smaller "tail" corner crimped
where a message group starts or ends. Set the two radii equal for fully
round bubbles, or shrink both for squarish ones.

| Token | Default | Controls |
| --- | --- | --- |
| `--messenger-radius-bubble` | `18px` | Bubble body corners |
| `--messenger-radius-tail` | `6px` | Group-start / group-end corner |
| `--messenger-radius-pill` | `999px` | Day dividers, unread badge, "load earlier" |
| `--messenger-radius-input` | `10px` | Search & passcode inputs |
| `--messenger-radius-chip` | `8px` | Reply chip, emoji tabs/cells, small fields |
| `--messenger-radius-composer` | `14px` | Composer textarea |
| `--messenger-radius-popover` | `12px` | Emoji popover & autocomplete |

### Sizes

| Token | Default | Controls |
| --- | --- | --- |
| `--messenger-avatar-size` | `40px` | List & generated avatars (46px on phones) |
| `--messenger-avatar-size-sm` | `26px` | In-thread & header avatars |
| `--messenger-control-size` | `40px` | Round controls: send, back, emoji toggle, wallpaper, jump-to-latest |
| `--messenger-control-size-touch` | `44px` | Same controls under a finger (`hover: none`) |
| `--messenger-icon-hero` | `34px` | Lock & empty-state illustrations |
| `--messenger-bubble-max-width` | `82%` | Widest a bubble may grow in the thread |
| `--messenger-thread-measure` | `820px` | Max content width on tablets |
| `--messenger-composer-max` | `160px` | Composer growth ceiling — the JS auto-grow reads this same value (120px on phones) |
| `--messenger-emoji-jumbo` | `2.1em` | Emoji-only message bubbles |
| `--messenger-emoji-cell` | `36px` | Emoji picker grid cell |
| `--messenger-emoji-cell-touch` | `40px` | Grid cell under a finger |
| `--messenger-emoji-popover-width` | `320px` | Emoji popover width (360px on phones) |

## Obsidian variables honored

Beyond the token defaults, these Obsidian variables shape the UI directly
(swap them in your token overrides to taste):

- `--background-primary`, `--background-secondary`,
  `--background-modifier-border`, `--background-modifier-hover`,
  `--background-modifier-active-hover` — surfaces and hovers
- `--interactive-accent`, `--interactive-accent-hover`, `--text-on-accent` —
  sent bubbles, send button, unread badge
- `--text-normal`, `--text-muted`, `--text-faint`, `--text-error`,
  `--text-success`, `--text-accent`, `--text-highlight-bg` — ink
- `--font-monospace` — addresses, safety numbers, dev-layer readouts
- `--shadow-s` — floating popovers
- `body.theme-dark` / `body.theme-light`, `body.is-mobile` / `.is-phone` /
  `.is-tablet`, `body.is-popout-window` — the standard state hooks; the
  wallpaper art has light/dark variants keyed on them

## Wallpapers & blend controls

The thread wrap paints two decorative layers *above* your theme:
`::before` carries the art (or a vault image), `::after` a user tint wash.
Four per-conversation variables are set inline by the plugin from settings —
you can also set them yourself in a snippet:

| Var | Meaning |
| --- | --- |
| `--messenger-wallpaper-image` | `url(...)` for a custom vault image |
| `--messenger-wallpaper-opacity` | Art layer opacity (0–1) — the *Wallpaper intensity* slider |
| `--messenger-wallpaper-tint` | Tint color; `transparent` when off |
| `--messenger-tint-alpha` | Tint strength (0–1) |
| `--messenger-bubble-alpha` | Bubble translucency over art/tint (30–100%) — the *Bubble opacity* slider |

When a wallpaper or tint is active, bubbles switch to legibility rules that
mix `--background-primary` / `--interactive-accent` with
`--messenger-bubble-alpha` (with a solid pre-`color-mix` fallback). These
few rules intentionally bypass the bubble color tokens — over art the job is
contrast, not branding. If you restyle bubble colors, also override the
`§13 Readability` rules in the same snippet to keep the look consistent.

## DOM map

The view root carries a mode hook for targeting:

```css
.messenger-chat[data-view="list"]         /* conversation inbox */
.messenger-chat[data-view="conversation"] /* an open thread */
.messenger-chat[data-view="lock"]         /* passcode screen */
```

Sketch of one open conversation (class names are stable; see styles.css for
the full set):

```
.messenger-chat[data-view=…]
├─ .messenger-list                        (list mode)
│  ├─ .messenger-list-head  .messenger-list-title
│  │                       └ .messenger-list-head-actions  (compose, search)
│  ├─ .messenger-list-search  > .messenger-search-input
│  └─ .messenger-list-body
│     └─ .messenger-conv[data-addr=…]     (one per conversation)
│        ├─ .messenger-avatar (+ .is-generated | > .messenger-avatar-img)
│        └─ .messenger-conv-main
│           ├─ .messenger-conv-top    (name, .messenger-conv-locked,
│           │                          .messenger-conv-muted, time)
│           └─ .messenger-conv-bottom (preview, .messenger-unread)
└─ .messenger-conversation               (conversation mode)
   ├─ .messenger-chat-head   (back, avatar, name/addr, search, wallpaper)
   ├─ .messenger-thread-search           (when in-thread search is open)
   ├─ .messenger-thread-wrap[data-wallpaper=…]  (.is-tinted when tinted)
   │  ├─ .messenger-thread  [role=log]
   │  │  ├─ .messenger-day / .messenger-load-earlier
   │  │  ├─ .messenger-unread-divider     ("New messages" — clickable:
   │  │  │                                  jumps back after scrolling up)
   │  │  └─ .messenger-msg[data-mid=…].mine|.theirs .is-grouped .is-group-last
   │  │     ├─ .messenger-msg-actions > .messenger-msg-action (reply, copy)
   │  │  ├─ .messenger-avatar.messenger-avatar-sm   (theirs only)
   │  │     └─ .messenger-msg-col
   │  │        ├─ .messenger-msg-meta  (+ .messenger-om2-badge)
   │  │        ├─ .messenger-bubble    (+ .is-sealed, .messenger-emoji-only,
   │  │        │                        > .messenger-quote)
   │  │        └─ .messenger-status.is-read  (✓ / ✓✓)
   │  └─ .messenger-scroll-down           (.is-visible, .has-new;
   │     > .messenger-scroll-down-count.is-visible — "N new" pill)
   └─ .messenger-composer
      ├─ .messenger-reply-chip  (.is-hidden when idle)
      └─ .messenger-composer-row
         ├─ textarea.messenger-composer-input
         ├─ .messenger-emoji-toggle  … .messenger-emoji-popover / -ac
         ├─ .messenger-burn-btn      (.is-active when armed)
         └─ .messenger-send          (.is-disabled when empty)
```

Two chat surfaces live in modals rather than the view root:
`.messenger-lightbox` (click an embedded image in a thread to view it
full-size — the image reuses `--messenger-radius-popover`; click or Esc
closes) and `.messenger-passcode-modal` (passcode / vault-key dialogs).
The per-chat **Retention…** dialog (conversation context menu) builds on
core `Setting` rows plus `.messenger-retention-modal`, which dims its
picker rows (`[data-disabled="true"]`) while the custom-policy toggle is
off — no Messenger-specific tokens involved.

**Contacts (the social gate, SPEC §18).** The list grows a collapsed
`.messenger-requests-divider` (label + `.messenger-requests-count` +
chevron) under the conversations; expanded request rows are ordinary
`.messenger-conv.is-request` rows whose `.messenger-conv-top` ends in
`.messenger-request-actions` (`.messenger-request-accept` /
`.messenger-request-decline` — 26px circular buttons, hover picks up the
accent / error color). Rows waiting on a reply show
`.messenger-conv-pending` (clock icon) beside the name. An open
conversation's header carries `.messenger-contact-badge.is-mutual |.
is-pending | .is-request` under the address (mutual leans on
`--text-success`, the request state on `--text-accent`). The
**Add contacts** modal (`.messenger-add-contact-modal`) reviews imported
people as `.messenger-add-contact-row` flex rows — checkbox, name input,
`.messenger-add-contact-address` (monospace, `.is-invalid` red-border on
the row when malformed) and a remove button. The empty conversation list
carries the two first-run actions as buttons (`.messenger-empty-actions`
→ *Add contacts* `mod-cta`, *Send a message*).

Useful state classes: `.mine` / `.theirs`, `.is-grouped` /
`.is-group-last` (message stacking), `.is-locked` / `.is-sealed`,
`.is-swiping` / `.is-swipe-open` (mobile gestures), `.is-active`,
`.is-visible` / `.has-new` (jump button), `.is-error` (wrong passcode),
`.is-fresh` (list row that just received mail — brief background flash),
`.is-empty`. Data attributes: `data-addr` on list rows, `data-mid` on
messages and quote chips (jump targets), `data-wallpaper` on the thread
wrap (`none`, `custom`, or a built-in id).

## Recipes

**Flat & square** — terminal aesthetics:

```css
body {
  --messenger-radius-bubble: 4px;
  --messenger-radius-tail: 4px;
  --messenger-radius-pill: 4px;
  --messenger-radius-popover: 4px;
  --messenger-bubble-shadow: none;
}
```

**Recolor sent bubbles** (and keep them legible over wallpapers):

```css
body {
  --messenger-bubble-mine-bg: var(--color-purple, #7c3aed);
  --messenger-bubble-mine-fg: white;
}
.messenger-thread-wrap:is([data-wallpaper]:not([data-wallpaper="none"]), .is-tinted)
  .messenger-msg.mine .messenger-bubble {
  background: color-mix(in srgb, var(--color-purple, #7c3aed) var(--messenger-bubble-alpha, 88%), transparent);
}
```

**Compact list** — more rows per screen:

```css
body {
  --messenger-avatar-size: 30px;
  --messenger-avatar-size-sm: 20px;
}
.messenger-conv { padding: 6px 12px; }
```

**Wide conversation on desktop** — the tablet measure applies anywhere you
set the token:

```css
body { --messenger-bubble-max-width: 92%; --messenger-thread-measure: 1000px; }
.workspace-leaf-content[data-type="messenger-chat"] .messenger-thread,
.workspace-leaf-content[data-type="messenger-chat"] .messenger-composer-row {
  max-width: var(--messenger-thread-measure);
  margin: 0 auto;
}
```

**Generated avatars in your palette** — the per-address gradient is painted
into `--messenger-avatar-gradient` by the plugin; your background wins
because the inline style only sets the variable:

```css
.messenger-avatar.is-generated {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  text-shadow: none;
}
```

## Accessibility behavior

- `@media (prefers-reduced-motion: reduce)` (§16) disables entrance, shake,
  and flash animations and all decorative transitions; the app also skips
  smooth scrolling (jump-to-message, jump-to-latest) from JS.
- Custom controls show a visible `:focus-visible` outline for keyboard
  navigation (§16); pointer clicks don't trigger it.
- Inputs, buttons, and icons carry `aria-label`s; the thread is a
  `role="log"` region.

## Stability

The tokens, class names, and data attributes in this file are the public
theming surface: they change only in a release that says so, and never in a
patch. Anything not documented here (internal rule layout, section
numbering, keyframe names) may shuffle — target the documented hooks.
