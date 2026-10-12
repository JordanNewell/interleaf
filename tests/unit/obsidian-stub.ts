/**
 * The only runtime symbols the tested modules pull from "obsidian".
 * esbuild aliases the real package to this file (tests/unit/run.mjs) so the
 * suite runs under plain node with no Obsidian install.
 */
export function normalizePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .replace(/([^/])\/+/g, "$1/")
    .replace(/\/+$/, "")
    .replace(/^\//, "");
}

export function setIcon(): void {}

// ---------------------------------------------------------------------------
// Inert class/const shapes so UI modules (chat-view, dialogs, …) can be
// imported under node and their *pure* helpers unit-tested. Constructing or
// calling these would be a test bug — they exist only so `extends`/property
// references resolve at module-evaluation time.
// ---------------------------------------------------------------------------

export const Platform = { isMobile: false };

export class TFile {}

export class ItemView {
  constructor(..._args: unknown[]) {}
}

export class Modal {
  constructor(..._args: unknown[]) {}
}

export class Menu {
  addItem(_cb: (item: unknown) => unknown): this {
    return this;
  }
  addSeparator(): this {
    return this;
  }
  showAtMouseEvent(_evt: MouseEvent): this {
    return this;
  }
}

export class Notice {
  constructor(..._args: unknown[]) {}
}

export class Setting {
  constructor(..._args: unknown[]) {}
  setName(_name: string | DocumentFragment): this {
    return this;
  }
  setDesc(_desc: string | DocumentFragment): this {
    return this;
  }
}

export class FuzzySuggestModal {
  constructor(..._args: unknown[]) {}
}

export const MarkdownRenderer = {
  render(..._args: unknown[]): Promise<void> {
    return Promise.resolve();
  },
};
