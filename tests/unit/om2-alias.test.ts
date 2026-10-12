import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateIdentity, fingerprint } from "../../src/om2/crypto/keys";
import { ADDRESS_RE } from "../../src/mailbox/envelope";
import { sanitizeHandleForm, sanitizeFpForm, aliasCandidate } from "../../src/om2/alias";

describe("om2 alias mapping", () => {
  test("handle form → name.dir-example-com", () => {
    assert.equal(sanitizeHandleForm("@alice@dir.example.com"), "alice.dir-example-com");
  });

  test("fp form swaps underscore for dash, stays within OM-1 address rules", () => {
    const id = generateIdentity();
    const fp = fingerprint(id.publicKey);
    const alias = sanitizeFpForm(fp);
    assert.ok(alias.startsWith("fp-"));
    assert.ok(ADDRESS_RE.test(alias), `${alias} must be a valid OM-1 address`);
  });

  test("handle with hostile characters is sanitized to a valid address", () => {
    assert.ok(ADDRESS_RE.test(sanitizeHandleForm("@a b/c@evil.host")));
    assert.ok(
      ADDRESS_RE.test(aliasCandidate({ fp: "fp_x", handle: "@!!@!!" }, new Uint8Array(32)) || "")
    );
  });

  test("aliasCandidate prefers handle, falls back to fp", () => {
    const id = generateIdentity();
    const fp = fingerprint(id.publicKey);
    const withHandle = aliasCandidate({ fp, handle: "@bob@x.io" }, id.publicKey);
    assert.equal(withHandle, "bob.x-io");
    const without = aliasCandidate({ fp }, id.publicKey);
    assert.equal(without, fp.replace("fp_", "fp-"));
  });
});
