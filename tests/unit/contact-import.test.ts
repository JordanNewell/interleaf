/**
 * Contact import (src/contact-import.ts): the tolerant vCard parser and the
 * Contact Picker probe — the picker half runs only where globalThis.navigator
 * can be swapped (plain node: it can).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deviceContactsAvailable,
  parseVcf,
  pickDeviceContacts,
} from "../../src/contact-import";
import { draftFromPicked } from "../../src/dialogs";

// -- vCard ----------------------------------------------------------------------

test("vcf: one plain card — FN, first EMAIL, first TEL", () => {
  const cards = parseVcf(
    [
      "BEGIN:VCARD",
      "VERSION:4.0",
      "FN:Ada Lovelace",
      "EMAIL:ada@calc.org",
      "EMAIL:countess@calc.org",
      "TEL:+44 20 7946 0958",
      "END:VCARD",
      "",
    ].join("\r\n")
  );
  assert.deepEqual(cards, [
    {
      name: "Ada Lovelace",
      email: "ada@calc.org",
      tel: "+442079460958",
    },
  ]);
});

test("vcf: parameters, group prefixes, mailto:/tel: schemes, and case", () => {
  const cards = parseVcf(
    [
      "begin:vcard",
      "VERSION:3.0",
      "FN;LANGUAGE=en:Grace Hopper",
      "item1.EMAIL;TYPE=INTERNET,PREF:mailto:grace@navy.mil",
      "item2.TEL;type=CELL:tel:+1-202-555-0100",
      "END:VCARD",
    ].join("\n")
  );
  assert.deepEqual(cards, [
    { name: "Grace Hopper", email: "grace@navy.mil", tel: "+12025550100" },
  ]);
});

test("vcf: N falls back when FN is missing; folded long values unfold", () => {
  const cards = parseVcf(
    [
      "BEGIN:VCARD",
      "N:Lovelace;Ada;Augusta;Byron;",
      "EMAIL:ada",
      "  @example.com",
      "END:VCARD",
    ].join("\n")
  );
  assert.deepEqual(cards, [
    { name: "Ada Augusta Byron Lovelace", email: "ada@example.com", tel: "" },
  ]);
});

test("vcf: multiple cards, junk between them, and a truncated tail", () => {
  const text = [
    "# exported from somewhere",
    "BEGIN:VCARD",
    "FN:A",
    "TEL:111",
    "END:VCARD",
    "junk line without a colon is skipped",
    "BEGIN:VCARD",
    "FN:B",
    "EMAIL:b@x.io",
    "END:VCARD",
    "BEGIN:VCARD",
    "FN:never closed",
    "EMAIL:lost@x.io",
  ].join("\n");
  assert.deepEqual(
    parseVcf(text).map((c) => c.name),
    ["A", "B"]
  );
});

test("vcf: an empty export or card-less text yields [], never a throw", () => {
  assert.deepEqual(parseVcf(""), []);
  assert.deepEqual(parseVcf("hello\nworld"), []);
  // a card with no usable field at all is dropped
  assert.deepEqual(
    parseVcf(["BEGIN:VCARD", "VERSION:4.0", "END:VCARD"].join("\n")),
    []
  );
});

// -- the picker probe (navigator.contacts is absent from the DOM lib) -----------

/**
 * Swap globalThis.navigator for the duration of `run`, restoring whatever was
 * there before. False when the property refuses redefinition — the caller
 * then skips the test (the crypto tests' missing-WebCrypto bail, same idea).
 */
async function withNavigator(value: unknown, run: () => Promise<void> | void): Promise<boolean> {
  const prev = (globalThis as { navigator?: unknown }).navigator;
  try {
    Object.defineProperty(globalThis, "navigator", { value, configurable: true });
  } catch {
    return false;
  }
  try {
    await run();
  } finally {
    Object.defineProperty(globalThis, "navigator", { value: prev, configurable: true });
  }
  return true;
}

test("picker: unavailable navigator reads as unavailable, never throws", async () => {
  const ok = await withNavigator({}, async () => {
    assert.equal(deviceContactsAvailable(), false);
    assert.equal(await pickDeviceContacts(), null);
  });
  if (!ok) return; // this node refuses navigator swaps — nothing to assert
});

test("picker: a working select() maps string and array fields to picks", async () => {
  const saw: unknown[] = [];
  const ok = await withNavigator(
    {
      contacts: {
        select: async (props: unknown, options: unknown) => {
          saw.push({ props, options });
          return [
            { name: ["Ada", "Countess"], email: "ada@calc.org", tel: [] },
            { name: "Grace", email: ["g@navy.mil", "x@y.z"], tel: "+1202" },
          ];
        },
      },
    },
    async () => {
      assert.equal(deviceContactsAvailable(), true);
      const picks = await pickDeviceContacts();
      assert.deepEqual(picks, [
        { name: "Ada", email: "ada@calc.org", tel: "" },
        { name: "Grace", email: "g@navy.mil", tel: "+1202" },
      ]);
      // the picker is asked for exactly these properties, multi-select on
      assert.deepEqual(saw, [
        { props: ["name", "email", "tel"], options: { multiple: true } },
      ]);
    }
  );
  if (!ok) return;
});

test("picker: a failing select (dismissed/denied) reads as unavailable", async () => {
  const ok = await withNavigator(
    {
      contacts: {
        select: async () => {
          throw new Error("user dismissed");
        },
      },
    },
    async () => {
      assert.equal(deviceContactsAvailable(), true);
      assert.equal(await pickDeviceContacts(), null);
    }
  );
  if (!ok) return;
});

// -- review drafts ---------------------------------------------------------------

test("draftFromPicked suggests addresses and keeps skipped contacts includable", () => {
  assert.deepEqual(draftFromPicked({ name: "Ada Lovelace", email: "ada@calc.org", tel: "" }, []), {
    name: "Ada Lovelace",
    address: "ada",
    include: true,
  });
  // collision with an existing address: -2, not a silent duplicate
  assert.equal(
    draftFromPicked({ name: "Ada", email: "ada@calc.org", tel: "" }, ["ada"]).address,
    "ada-2"
  );
  // name falls back to email, then phone
  assert.equal(draftFromPicked({ name: "", email: "g@navy.mil", tel: "" }, []).name, "g@navy.mil");
  assert.equal(draftFromPicked({ name: "", email: "", tel: "+1202" }, []).name, "+1202");
  // nothing usable: empty draft the user must fill by hand
  assert.deepEqual(draftFromPicked({ name: "", email: "", tel: "" }, []), {
    name: "",
    address: "",
    include: true,
  });
});
