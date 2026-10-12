/**
 * Contact import: the web Contact Picker API where the host webview has it
 * (Android system WebView, iOS when WKWebView allows), and a plain vCard
 * (.vcf) parser everywhere else — including desktop, where the picker API
 * does not exist at all. Both paths produce the same review list in
 * AddContactModal; neither ever throws on a missing API.
 */

/** What the picker and the vCard parser both reduce a contact to. */
export interface PickedContact {
  name: string;
  email: string;
  tel: string;
}

/**
 * navigator.contacts is not in TypeScript's DOM lib — reach it through a
 * narrow local shape, the same cast pattern as navigator.bluetooth in
 * src/dev/proximity.ts. `select` needs a user gesture at the call site.
 */
interface ContactsNavigator {
  select(
    props: readonly string[],
    options?: { multiple?: boolean }
  ): Promise<Array<Record<string, string | string[]>>>;
}

function contactsNavigator(): ContactsNavigator | null {
  try {
    return (
      (navigator as unknown as { contacts?: ContactsNavigator } | undefined)?.contacts ??
      null
    );
  } catch {
    return null;
  }
}

/** Whether this host can show the system contacts picker at all. */
export function deviceContactsAvailable(): boolean {
  return contactsNavigator() !== null;
}

/**
 * Open the system picker and return the user's selection. Null when the API
 * is missing or the call fails (user cancel resolves to an empty array).
 * Must run from a user gesture — button click, not a poll.
 */
export async function pickDeviceContacts(): Promise<PickedContact[] | null> {
  const nav = contactsNavigator();
  if (!nav) return null;
  try {
    const picks = await nav.select(["name", "email", "tel"], { multiple: true });
    return picks.map((p) => ({
      name: firstString(p.name),
      email: firstString(p.email),
      tel: firstString(p.tel),
    }));
  } catch {
    return null; // dismissed or denied — indistinguishable from unavailable
  }
}

function firstString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : "";
  return typeof v === "string" ? v : "";
}

// -- vCard (.vcf) -----------------------------------------------------------------

/** Unfold per RFC 6350 §3.2: a line starting with space/tab continues the previous one. */
function unfold(text: string): string[] {
  const lines: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    if ((raw.startsWith(" ") || raw.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += raw.slice(1);
      continue;
    }
    lines.push(raw);
  }
  return lines;
}

/**
 * Property name of one vCard line, case-insensitive: strips parameters
 * (`EMAIL;TYPE=INTERNET:` → `email`) and group prefixes (`item1.TEL:` →
 * `tel`), both of which real exports sprinkle liberally.
 */
function propName(line: string): string {
  const head = line.split(/[;:]/, 1)[0] ?? "";
  return (head.includes(".") ? head.slice(head.lastIndexOf(".") + 1) : head).toLowerCase();
}

function propValue(line: string): string {
  const idx = line.indexOf(":");
  return idx === -1 ? "" : line.slice(idx + 1).trim();
}

/** vCard value unescaping — the four escapes RFC 6350 defines. */
function unescapeValue(v: string): string {
  return v.replace(/\\([nN\\,;])/g, (_m, c: string) =>
    c === "n" || c === "N" ? "\n" : c
  );
}

/** "Last;First;Middle" → "First Middle Last"; stray semicolons drop out. */
function nameFromN(value: string): string {
  const parts = value.split(";").map((p) => p.trim()).filter(Boolean);
  const [family = "", given = "", ...rest] = parts;
  return [given, ...rest, family].filter(Boolean).join(" ");
}

/** Normalize a phone value: strip tel: and separator punctuation. */
function cleanTel(v: string): string {
  return v.replace(/^tel:/i, "").replace(/[\s()\-.]/g, "");
}

/**
 * Tolerant vCard parser: every BEGIN:VCARD…END:VCARD block with any of
 * FN/N, EMAIL, TEL becomes one PickedContact (first email/tel wins).
 * Broken cards are skipped, never thrown — an import is allowed to be
 * partial the way real exports are messy.
 */
export function parseVcf(text: string): PickedContact[] {
  const out: PickedContact[] = [];
  let current: PickedContact | null = null;
  for (const line of unfold(text)) {
    const trimmed = line.trim();
    if (/^begin:vcard$/i.test(trimmed)) {
      current = { name: "", email: "", tel: "" };
      continue;
    }
    if (/^end:vcard$/i.test(trimmed)) {
      if (current && (current.name || current.email || current.tel)) out.push(current);
      current = null;
      continue;
    }
    if (!current || !trimmed.includes(":")) continue;
    const value = unescapeValue(propValue(trimmed));
    if (!value) continue;
    switch (propName(trimmed)) {
      case "fn":
        if (!current.name) current.name = value.replace(/\s+/g, " ").trim();
        break;
      case "n":
        if (!current.name) current.name = nameFromN(value).replace(/\s+/g, " ").trim();
        break;
      case "email":
        // folded lines can reintroduce inner spaces — an email has none
        if (!current.email) {
          current.email = value.replace(/^mailto:/i, "").replace(/\s+/g, "");
        }
        break;
      case "tel":
        if (!current.tel) current.tel = cleanTel(value);
        break;
    }
  }
  return out;
}

/** Read a picked .vcf file as text; rejects on a read failure. */
export function readVcfFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file"));
    reader.readAsText(file);
  });
}
