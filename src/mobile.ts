import { Platform, setIcon } from "obsidian";

/**
 * The touch-first interaction layer: iMessage-style swipe-to-reply, iOS
 * Mail-style swipe actions on list rows, on-screen-keyboard tracking, and
 * haptics. Every helper no-ops unless the primary input is a finger, so
 * desktop pointers never enter any of these code paths.
 */

/** True when the primary input is touch (phones, tablets, touch laptops). */
export function isTouchPrimary(): boolean {
  try {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  } catch {
    return Platform.isMobile;
  }
}

/**
 * The user asked the OS for less motion — smooth scrolls (and only those;
 * CSS already gates the animations via prefers-reduced-motion in §16 of
 * styles.css) jump instead.
 */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Short vibration for Android; iOS webviews expose no API — silent no-op. */
export function haptic(ms = 8): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // no vibration API — fine
  }
}

// -- swipe engine --------------------------------------------------------------

const SWIPE_SLOP_PX = 10;

export interface SwipeGesture {
  /** Horizontal distance that counts as a full reveal, in px. */
  max: number;
  /** "left" reveals content behind a row's right edge; "right" drags rightward. */
  direction: "left" | "right";
  /** Live reveal distance, 0 → max (rubber-banded past max). */
  onProgress?(px: number): void;
  /**
   * Finger lifted: how far the drag got and whether it was a fast flick.
   * The gesture layer owns nothing visual — the caller settles the element.
   */
  onRelease(offset: number, flick: boolean): void;
}

/**
 * Horizontal drag with vertical-scroll arbitration: a touch is claimed only
 * once it moves clearly sideways; until then (or once claimed vertical) the
 * browser scrolls normally. Standard slop + direction-lock, tuned for chat UIs.
 */
function attachSwipe(el: HTMLElement, gesture: SwipeGesture): void {
  const dir = gesture.direction === "left" ? -1 : 1;
  let touchId: number | null = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0; // px per ms, signed in screen space
  let locked: boolean | null = null;
  let offset = 0;

  const touchOf = (e: TouchEvent): Touch | null => {
    if (touchId === null) return e.touches[0] ?? null;
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === touchId) return t;
    }
    return null;
  };

  const finish = (e: TouchEvent): void => {
    if (touchId === null) return;
    const mine = Array.from(e.changedTouches).some(
      (t) => t.identifier === touchId
    );
    if (!mine) return;
    touchId = null;
    el.removeClass("is-swiping");
    if (locked !== true) {
      locked = null;
      return;
    }
    const flick =
      Math.abs(velocity) > 0.5 &&
      Math.sign(velocity) === dir &&
      offset > gesture.max * 0.2;
    const settled = offset;
    offset = 0;
    locked = null;
    gesture.onRelease(settled, flick);
  };

  el.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || touchId !== null) return;
      touchId = t.identifier;
      startX = lastX = t.clientX;
      startY = t.clientY;
      lastT = e.timeStamp;
      velocity = 0;
      locked = null;
      el.addClass("is-swiping");
    },
    { passive: true }
  );

  el.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      const t = touchOf(e);
      if (!t || locked === false) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (locked === null) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_SLOP_PX) return;
        locked = Math.abs(dx) > Math.abs(dy) * 1.2;
        if (!locked) {
          el.removeClass("is-swiping");
          return;
        }
      }
      e.preventDefault();
      const dt = Math.max(1, e.timeStamp - lastT);
      velocity = (t.clientX - lastX) / dt;
      lastX = t.clientX;
      lastT = e.timeStamp;
      let next = dx * dir; // positive = revealing
      if (next < 0) next = 0; // never reveal against the gesture direction
      if (next > gesture.max) next = gesture.max + (next - gesture.max) * 0.25;
      offset = next;
      gesture.onProgress?.(offset);
    },
    { passive: false }
  );

  el.addEventListener("touchend", finish, { passive: true });
  el.addEventListener("touchcancel", finish, { passive: true });
}

// -- list rows: iOS Mail-style swipe actions -----------------------------------

export interface RowAction {
  /** Which action a full-width flick commits (match on this id). */
  id: string;
  label: string;
  icon: string;
  /** Color class on the revealed button (e.g. is-read, is-delete). */
  cls: string;
  run: () => void;
}

const SWIPE_BUTTON_W = 74;

/**
 * Drag a conversation row left to reveal actions behind it; a fast full-width
 * flick commits the designated quick action outright. Tap a revealed button to
 * run it, tap the row body again to close. A click fired while the row is open
 * is swallowed, so opening a conversation never races the close.
 */
export function attachRowSwipeActions(
  row: HTMLElement,
  actions: RowAction[],
  opts: { fullAction?: string } = {}
): void {
  if (!isTouchPrimary() || actions.length === 0) return;
  const total = actions.length * SWIPE_BUTTON_W;

  const underlay = row.createDiv({ cls: "messenger-swipe-underlay" });
  underlay.setCssStyles({ width: `${total}px` });
  for (const action of [...actions].reverse()) {
    const btn = underlay.createDiv({ cls: `messenger-swipe-btn ${action.cls}` });
    setIcon(btn.createDiv({ cls: "messenger-swipe-btn-icon" }), action.icon);
    btn.createDiv({ cls: "messenger-swipe-btn-label" }, (el) =>
      el.setText(action.label)
    );
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
      action.run();
    });
  }

  // the row's original children slide; the underlay stays fixed behind them
  const content = row.createDiv({ cls: "messenger-swipe-content" });
  for (const child of Array.from(row.children)) {
    if (child === underlay || child === content) continue;
    content.appendChild(child);
  }

  let open = false;
  const close = (): void => {
    open = false;
    content.setCssStyles({ transform: "" });
    row.removeClass("is-swipe-open");
  };
  const openFull = (): void => {
    open = true;
    content.setCssStyles({ transform: `translateX(-${total}px)` });
    row.addClass("is-swipe-open");
  };

  // registered before the row's own click handler, so stopImmediatePropagation
  // reliably suppresses "open conversation" when the tap only means "dismiss"
  row.addEventListener("click", (e) => {
    if (!open) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    close();
  });

  // a drag that starts on an open row begins a fresh gesture from shut —
  // otherwise the content would jump the width of the reveal under the finger
  row.addEventListener(
    "touchstart",
    () => {
      if (open) close();
    },
    { passive: true }
  );

  attachSwipe(row, {
    direction: "left",
    max: total,
    onProgress: (px) => {
      content.setCssStyles({
        transform: px > 0 ? `translateX(${-px}px)` : "",
      });
    },
    onRelease: (px, flick) => {
      if (flick) {
        // only flick-to-act when a quick action was designated — never let a
        // stray flick commit a destructive default
        const quick = actions.find((a) => a.id === opts.fullAction);
        if (quick) {
          close();
          haptic(10);
          quick.run();
          return;
        }
      }
      if (px >= total * 0.55) openFull();
      else close();
    },
  });
}

// -- bubbles: iMessage-style swipe-to-reply ------------------------------------

/**
 * Drag a message bubble rightward to answer it, like iMessage: the bubble
 * follows the finger, a reply arrow fades in, and a committed release hands
 * off to the composer's reply chip.
 */
export function attachSwipeReply(row: HTMLElement, onReply: () => void): void {
  if (!isTouchPrimary()) return;
  const MAX = 72;
  const arrow = row.createDiv({ cls: "messenger-swipe-reply" });
  setIcon(arrow.createDiv({ cls: "messenger-swipe-reply-icon" }), "reply");
  const bubble = row.querySelector<HTMLElement>(".messenger-bubble") ?? row;

  const settle = (): void => {
    bubble.setCssStyles({ transform: "" });
    arrow.setCssStyles({ opacity: "0", transform: "scale(0.6)" });
  };

  attachSwipe(row, {
    direction: "right",
    max: MAX,
    onProgress: (px) => {
      bubble.setCssStyles({
        transform: px > 0 ? `translateX(${px}px)` : "",
      });
      const t = Math.min(1, px / (MAX * 0.5));
      arrow.setCssStyles({
        opacity: String(t),
        transform: `scale(${0.6 + Math.min(1, px / MAX) * 0.4})`,
      });
    },
    onRelease: (px, flick) => {
      settle();
      if (px >= MAX * 0.85 || (flick && px > 24)) {
        haptic(8);
        onReply();
      }
    },
  });
}

// -- on-screen keyboard ----------------------------------------------------------

/**
 * Track the visual viewport so the composer stays above the software keyboard
 * even when the host app doesn't resize the window (iOS overlay mode), and so
 * the thread can re-pin to the bottom when the keyboard opens or closes. The
 * inset lands in `--messenger-kb-inset` on `root`; returns an unwatch function.
 */
export function watchKeyboard(
  root: HTMLElement,
  onShift: (opening: boolean) => void
): () => void {
  const vv = window.visualViewport;
  if (!vv) return () => {};
  let lastInset = 0;
  const update = (): void => {
    const inset = Math.max(0, Math.round(window.innerHeight - vv.height));
    root.style.setProperty("--messenger-kb-inset", `${inset}px`);
    if (Math.abs(inset - lastInset) > 60) onShift(inset > lastInset);
    lastInset = inset;
  };
  vv.addEventListener("resize", update);
  update();
  return () => {
    vv.removeEventListener("resize", update);
    root.style.removeProperty("--messenger-kb-inset");
  };
}
