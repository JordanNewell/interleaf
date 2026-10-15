# Obsidian Messenger Protocol (OM-1)

A minimal, vault-local message bus. Participants — Obsidian plugins, agents, scripts,
humans — get addresses and exchange messages by appending markdown blocks to each
other's inbox notes. No network, no server, works anywhere the vault goes.

The reference implementation is this repo's plugin (`interleaf`), but the
protocol is deliberately simple enough that **anything that can append to a file can
participate**: a shell one-liner, a Dataviewjs snippet, an editor on another device
via Obsidian Sync / iCloud.

## 1. Transport

Markdown files inside the vault.

- Mailbox **root** is a configurable folder. The reference plugin defaults to a
  hidden app folder, `<vault>/.obsidian/plugins/interleaf/mailbox/`,
  so the vault stays clean for chat-only users; turn off *Hide mail storage*
  to use a visible folder (default `Messenger/`) instead.
- Obsidian never indexes dot-folders, and Obsidian Sync does not carry them.
  Use a visible root when the bus must ride Obsidian Sync between devices;
  plain folder sync (iCloud, Dropbox, Syncthing, a shared directory) sees the
  hidden folder like any other.
- A participant with address `a` receives mail at `<root>/a/inbox.md`.
- `<root>/registry.md` lists known participants (see §6).

## 2. Addresses

```
[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}
```

Convention: use your plugin id (`curtis`, `interleaf`) or a short slug for
agents and humans (`owner`, `research-agent`). Addresses are **names, not
authentication** — see §8.

Addresses are unique only **within one mailbox root**. Two participants that
pick the same address share one inbox, one cursor, one identity — the bus has
no way to tell them apart. Across vaults an address carries no global meaning:
every vault's `owner` is a different participant, and mail never crosses vaults
in OM-1 anyway. The OM-2 layer routes by cryptographic fingerprint rather than
address, so cross-vault collisions are impossible at the transport; handle
uniqueness there is a directory concern (OM-2C, claim/lapse), not a protocol one.

**Reserved addresses.** The reference plugin refuses to let a participant
register a name that borrows weight it can't own (see `src/reserved.ts` —
a 400+ name list, plain data, trimmed or extended in one edit):
authority and system names (`admin`, `support`, the plugin's own bus
address, the bus's file names like `registry`), finance (`paypal`,
`wells-fargo`, `binance`), government/law/emergency including
international numbers (`police`, `irs`, `uscis`, `911`, `112`), big tech
and AI labs (`apple`, `cloudflare`, `anthropic`, `chatgpt`),
Fortune-500-scale consumer brands (`walmart`, `boeing`, `target`),
academia — institutions and the administrative offices scammers
impersonate (`harvard`, `registrar`, `financial-aid`, `fafsa`),
religious titles and institutions (`pope`, `bishop`, `vatican`), the
most-impersonated public figures and athletes (`elon-musk`,
`satoshi-nakamoto`, `cristiano-ronaldo`), and scam phrases (`lottery`,
`verify`, `seed-phrase`). People are reserved by full distinctive name
plus unmistakable bare surname (`musk`, `messi`) — never by common given
names, which belong to real people. Entries include ordinary words a
brand happens to own (`target`, `chase`, `ice`); anti-spoof errs closed. Matching is by §2 token, so a composed handle
rejects too — `admin-team`, `paypal-support`, `google-recruit` — at the
cost of innocent handles like `team-mates`. Every registration path
enforces it: onboarding, the settings identity field, contact adding,
contact-import suggestions (which never offer one), and the agent API
(typed error `reserved_address`). An address that already held a name
before it joined the list is grandfathered — enforcement refuses *changes
to* a reserved name, never strips an existing identity. Because `from` is
self-declared (§8), mail *arriving* under a reserved name is not refused —
nothing on the file bus can be — but the UI marks the conversation with a
spoof warning. This is anti-spoof hygiene in the reference client, not a
protocol rule and not authentication: a participant that deliberately
writes `from: "support"` into an inbox file by hand still delivers.
Reserving a name guarantees no one *legitimately* holds it, which is what
makes the warning meaningful.

## 3. Message format

Inbox files are append-only. Each message is one block:

```
<!-- messenger: {"id":"msg_lz3k9x2ab","from":"curtis","to":"owner","ts":"2026-10-10T12:00:00.000Z","replyTo":null} -->
Any markdown body. It may span multiple lines and contain anything except the
closing marker.
<!-- /messenger -->
```

Envelope fields (JSON on one line inside the opening HTML comment):

| field    | type             | meaning                                          |
| -------- | ---------------- | ------------------------------------------------ |
| `id`     | string           | unique, opaque. senders: `msg_` + base36 time + random |
| `from`   | string           | sender address                                   |
| `to`     | string           | recipient address (owner of the inbox file)      |
| `ts`     | string           | ISO 8601 UTC timestamp                           |
| `replyTo`| string \| null   | `id` of the message this replies to, or null     |
| `enc`    | object \| absent | `{v:1, iv}` — body is sealed ciphertext (§15)    |
| `exp`    | string \| absent | burn-after-send deadline (§16)                   |
| `bar`    | number \| absent | burn-after-read window in seconds (§16)          |

Hard rules:

1. **Append only.** Never reorder, edit, or delete a delivered block (except via GC, §7).
2. The body must not contain the literal text `<!-- /messenger -->`.
3. The envelope JSON must not contain `-->` (guaranteed if addresses and ids follow §2).

Inboxes begin with a header line (`# Inbox — <address>`) which parsers ignore.

## 4. Delivery semantics

**At-least-once, best-effort ordering.**

- The receiver keeps a per-inbox **cursor**: the id and ts of the last processed
  message. On each poll, process every block positioned after the cursor in file
  order.
- If the cursor's id is no longer present in the file (message was GC'd or the file
  was pruned), fall back to the timestamp: process messages with `ts` strictly
  greater than the cursor's `ts`.
- A participant with no cursor owns its whole inbox history — process it or skip it
  deliberately, but decide; don't accidentally reprocess a year of mail on reinstall.
- Ordering is file order locally, but sync merges can reorder blocks. Receivers
  should tolerate out-of-order delivery and **be idempotent** — a message may be
  delivered twice (crash between processing and cursor save, sync conflicts, two
  loops running).

## 5. Polling loop

One time-gated loop per window (the reference plugin uses a 1-second heartbeat
gated by a configurable interval, default 5s) scans every address folder under the
root, reads each `inbox.md`, and dispatches messages past the cursor. Nothing in
the protocol requires a specific interval; even manual "check now" commands are
spec-compliant polling. Event-triggered passes are encouraged: the reference
plugin also polls immediately on window focus or resume, after any send (replies
cluster right behind a send), and on vault file events touching the mailbox root
when storage is visible. The configured interval is the idle fallback, not the
only trigger.

## 6. Registry

`<root>/registry.md` maps addresses to display names:

```md
# Messenger registry

| address            | name                     | updated                   |
| ------------------ | ------------------------ | ------------------------- |
| curtis             | Curtis                   | 2026-10-10T12:00:00.000Z  |
| owner              | owner (you)              | 2026-10-10T12:00:00.000Z  |
```

The registry is **rewritten, not appended**. It is advisory — a directory with an
`inbox.md` is addressable whether or not it appears here. `|` in names is escaped
as `\|`.

## 7. Maintenance (GC)

Any participant may prune its own inbox by rewriting the file with the header plus
the kept blocks, oldest dropped first. The reference plugin drops messages older
than a configurable retention (default 30 days) hourly. GC must never touch the
portion of the file after a still-live cursor unless those messages are older than
the cursor's `ts` — otherwise receivers relying on the ts fallback would lose mail.

**Conflict adoption.** Sync engines that cannot merge two devices appending at
once leave conflict copies beside the inbox — `inbox (conflicted copy …).md`
(Dropbox), `inbox.sync-conflict-…md` (Syncthing), `inbox 2.md` / `inbox(1).md`
(iCloud, Drive). The poll loop reads only `inbox.md`, so mail trapped in a
sibling would sit unseen forever. A receiver may **adopt** a sibling: parse it,
append every block whose id is absent from the canonical inbox, and trash the
sibling once it holds nothing unadopted. Adoption appends at the end of the
file, so file-order delivery (§4) dispatches adopted mail even when its `ts`
predates the cursor; id-deduplication makes re-running the sweep harmless.
Receipts and outbox files may be adopted the same way by line.

**Duplicate collapse and size.** A retransmitted block (§14) repeats an id
already present earlier in the file; GC may drop the later copies, keeping
the first occurrence. The reference plugin also caps each inbox at a
configurable message count, dropping oldest first regardless of age, so a
busy inbox stays cheap to store, parse, and re-upload on every append.

## 8. Trust model

**There isn't one.** Everything in the vault is readable and writable by every
plugin and by the user. Addressing is naming, not authentication; `from` is
self-declared. Don't put secrets in bodies. If you need an authenticated boundary,
put it at an edge (e.g. a localhost MCP server with a bearer token) and bridge into
the bus from there.

The reference implementation ships one such edge built in: **cross-vault mail**
(OM-2, `src/om2/`) — keypair identity and end-to-end-encrypted delivery through
a relay. It changes nothing in this protocol: remote mail lands in the same
mailbox files as ordinary OM-1 blocks (§12's extension fields), and mail written
straight to the files is still gated by names, not cryptography. See the
README's *Cross-vault mail* section for the trust model of that edge.

## 9. Concurrency

- Writers must append atomically: one read-modify-write step per append (the
  reference implementation uses `Vault#process` where available).
- A single bus instance per window should own the polling loop. Multiple loops are
  safe (delivery is at-least-once anyway) but redundant.
- Cursors are receiver-local state. Two devices sharing a vault via sync each keep
  their own; last writer wins in the shared plugin data, which can cause
  reprocessing — idempotence (§4) covers it.

## 10. In-process fast path (optional)

The reference plugin emits `messenger:message` on the Obsidian workspace after
each delivery, and `messenger:tick` after every poll pass, so plugins (and its
own chat views — hidden storage produces no vault file events) can react
without waiting. The file transport remains the record of truth; the events
are a convenience.

## 11. Receipts (optional companion channel)

Senders may want ✓ delivered / ✓✓ read feedback. This is a **convention, not a
requirement** — the bus works fine without it.

- Participant `a` acknowledges mail delivered to it by appending to
  `<root>/a/receipts.md`. The file is append-only like an inbox and begins with
  a `# Receipts — <a>` header. **Only `a`'s own plugin instance writes `a`'s
  receipts file** — it is the one place on the bus a participant speaks about
  itself.
- One acknowledgment is a single line (invisible in reading mode):

  ```
  <!-- receipts: {"by":"a","state":"delivered","ts":"2026-10-10T12:00:05.000Z","ids":["msg_x","msg_y"]} -->
  ```

- `state` is `delivered` (the poll loop dispatched it) or `read` (a UI has
  actually shown it). `read` supersedes `delivered` for the same id; a later
  line never downgrades an earlier one.
- Senders read the **recipient's** receipts file to decorate their outgoing
  messages. Files may be pruned like inboxes (§7): rewrite with the kept
  lines, oldest dropped first, same retention as the mail they acknowledge.

Receipts are advisory exactly like the registry (§6): a missing receipts file
just means no feedback, never failed mail. Participants that value privacy can
disable read receipts while still emitting delivery receipts.

## 13. Outbox (optional sender-side copy)

A thread is merged from two files: mail the peer sent you (your inbox) and
mail you sent them (their inbox). That means your half of a conversation lives
in someone else's folder — if theirs is GC'd, pruned by hand, or never existed,
your sent history vanishes from your own view.

A participant that wants its sent mail to survive its peers can keep an
**outbox**: appending a copy of every message it sends to
`<root>/<sender>/outbox.md`. The format is exactly §3 — same envelope, same
block markers — so any inbox parser reads it unchanged.

- The outbox is written only by the sender, read only by the sender's UI. It
  is a local convenience, not a delivery channel; recipients never read it.
- Because blocks carry the same message `id`, a reader merging inbox and
  outbox dedupes by id — enabling the outbox mid-history is safe.
- Prune the outbox like an inbox (§7), with the same retention as the mail
  it mirrors.

Like receipts and the registry, this is **convention, not requirement**. The
default posture of the protocol remains "the sender keeps no copy" — the vault
is shared, and the recipient's inbox is the conversation.

## 12. OM-2 extension fields (optional, cross-vault)

Blocks delivered across vaults by an [OM-2 bridge](../Obsidian%20Social/OM-2-SPEC.md)
are ordinary §3 blocks with extra **optional** header fields. OM-1-only readers
ignore unknown keys and parse these blocks unchanged.

| field    | type   | meaning                                             |
| -------- | ------ | --------------------------------------------------- |
| `v`      | number | `2`                                                 |
| `from2`  | string | origin address (`fp_…` absolute or `@handle@host`)   |
| `to2`    | string | recipient fingerprint (cryptographic destination)   |
| `sender` | string | base64url Ed25519 public key of the signer          |
| `sig`    | string | base64 Ed25519 signature over the OM-2 canonical string |

Receipts do not cross vaults in OM-2 v1 (a remote peer cannot read your local
receipts file), so conversations with remote contacts show no ✓/✓✓.
Authentication between vaults is key-based, not name-based: see the OM-2 spec
for pinning, safety numbers, and the trust model.

Stated limits of the OM-2 v1 construction (deliberate, documented — see the
README's *Cross-vault mail* honest-limits): sealed boxes are static (no
ratchet — no forward secrecy against a later long-term-key theft), first
contact trusts the key the invite carried (a TOFU window that a safety-number
comparison closes), and the relay observes destination, size, and timing for
mail in flight.

## 14. Retransmission (optional, sender-side)

A sync merge can clobber a sender's append after it was written: the block
sits in the file on the sender's device but is gone from the recipient's
copy. A sender that wants delivery it can reason about remembers each send
and, past a grace period with no delivery receipt (§11) for its message id,
re-appends the message **unchanged** — same id, same ts. Receivers dedupe by
id (§4), so a late-arriving original plus its retransmission is one message.

Retransmission applies **only when the recipient publishes a receipts file**
(§11). No receipts file means no ACK channel — remote OM-2 peers (§12),
scripts, and agents without receipt support — and re-sending to them would
duplicate everything they receive.

Senders bound the behavior: retransmit a handful of times at most, and stop
entirely once the message is more than a day old. GC (§7) collapses
duplicate-id blocks either way.

## 15. Sealed bodies (optional, at-rest)

A participant may seal message **bodies** at rest: the body slot of a §3
block holds base64 AES-256-GCM ciphertext, and the envelope carries the seal:

```json
{"id":"msg_…","from":"owner","to":"curtis","ts":"…","replyTo":null,"enc":{"v":1,"iv":"…"}}
```

| field | type   | meaning                                              |
| ----- | ------ | ---------------------------------------------------- |
| `enc` | object | `{v:1, iv}` — base64 AES-GCM IV for this body        |

Rules:

1. **Metadata stays plaintext.** `id`, `from`, `to`, `ts`, `replyTo`, and the
   burn fields (§16) are readable without the key — cursors (§4), dedup,
   GC (§7), conflict adoption (§7), and retransmission bookkeeping (§14) all
   work on sealed inboxes unchanged.
2. **The key never touches disk.** The reference plugin derives a KEK from
   an unlock secret and wraps a random 256-bit vault key with it, storing
   only the wrapped form. The KDF is recorded beside the wrap (`kdf` field):
   current wraps use **Argon2id** (19 MiB, t=2, p=1 — memory-hard, so
   offline guessing pays for RAM per guess); wraps from the PBKDF2 era carry
   `kdf:"pbkdf2"` or no field at all (PBKDF2-SHA256; an absent iteration
   count means the legacy 200k). Opening uses the recorded KDF — old bundles
   stay openable, and any re-wrap (secret change, mode switch) upgrades to
   Argon2id. The raw key exists in memory between unlock and
   lock/unload; changing the secret re-wraps the key without touching any
   mail. The unlock secret is either a passcode (minimum 8 characters, not
   digits-only) or a generated 125-bit vault key in Crockford base32
   groups, kept in the user's password manager. No fast verifier of either
   is stored: while sealing is on, verification *is* the GCM unwrap, so
   every offline guess against a stolen `data.json` costs a full key
   derivation.
3. **Inboxes may mix plaintext and sealed blocks.** Anything appending a
   plaintext block participates as before; readers without the key see
   envelopes whose bodies they cannot open.
4. **Re-writes preserve ciphertext.** A reader without the key that must
   rewrite a file (GC, sweeps) re-encodes sealed blocks byte-for-byte from
   the parsed header + body — never from an opened plaintext it doesn't
   have. A reader with the key may re-seal with a fresh IV.
5. **This is vault-local.** OM-2 cross-vault mail relies on the OM-2 layer's
   own cryptography; a local seal does not travel as an end-to-end promise.
   Anything running inside the vault reads opened bodies through the bus
   API once the session is unlocked — the seal protects files at rest
   (copied vaults, file-level snoops), not the trust model of §8.

## 16. Burn fields (optional, disappearing mail)

A sender may mark a message to disappear. Two optional envelope fields:

| field | type   | meaning                                                    |
| ----- | ------ | ---------------------------------------------------------- |
| `exp` | string | ISO 8601 UTC deadline — burn this long after **send**      |
| `bar` | number | seconds — burn this long after the **displaying vault showed the conversation** |

Rules:

1. **Readers hide burned mail.** A message past its deadline is absent from
   every read: conversation views, previews, search, export, and agent APIs.
   `exp` is absolute, so all devices agree; `bar` is relative to the local
   read state, so each device burns its view when *it* displayed the
   conversation (a device that never opened it keeps the copy until the
   sender-side sweep or retention takes it).
2. **The owner sweeps the disk.** The participant that wrote the file prunes
   burned blocks with a §7-style rewrite, oldest-burned first. Sweeps run
   without the §15 key — burn fields live in the plaintext envelope.
3. **Burned mail owes nothing.** Retransmission (§14) drops a burned message
   instead of re-sending it; receipts for it may already exist and are
   pruned by ordinary retention.
4. **Best effort, like everything here.** A participant that never implements
   §16 keeps the blocks until its own retention removes them; a copy sitting
   in an unsynced conflict sibling (§7) survives until adoption runs. The
   fields are a promise from cooperating readers, not an erasure guarantee.

## 17. Contacts — the social gate

An advisory contact list beside the registry: `<root>/contacts.md`, a rewritten
markdown table (`address | name | state | updated`), same conventions as §6.
Four states:

| state     | meaning                                                        |
| --------- | -------------------------------------------------------------- |
| `request` | a stranger wrote to me; their mail waits, quiet, under Contact requests until accepted |
| `pending` | I added them (or wrote first); their first reply upgrades this to `mutual` |
| `mutual`  | two-way — I accepted their request, or they replied to my invitation |
| `blocked` | declined; hidden from the list, conversation stays quiet |

State transitions: inbound mail from an unknown sender files them as
`request`; inbound mail from a `pending` contact (and replying to a
`request`) makes the link `mutual`. That is the whole "this person can see
you because you're both contacts" mechanism — names, not keys.

On first run with existing conversations, every address folder is seeded
`mutual`, so nothing an upgrading user already sees drops into requests.

**Who can reach me.** Two modes:

- *Everyone* (default): strangers' mail still lands (§8 — anything in the
  vault can append), but it renders under the collapsed Contact requests
  section — no chime, no popup, no unread badge — until accepted.
- *Contacts only*: the conversation list keeps to people you've added —
  strangers' mail still lands in the files (§8) but never surfaces beyond
  the collapsed requests section.

**Honesty clause.** This gate is social, not cryptographic: `from` is
self-declared (§8), so a "blocked" address can be written under a new name,
and on the shared-vault file bus nothing can be refused at all — the gate
there is quiet invisibility in the reference UI, not protocol enforcement.
Authentication, pinning, and safety numbers remain OM-2's job (Obsidian
Social plugin).

**Import.** Contacts can be imported from the device's system contacts via
the web Contact Picker API (`navigator.contacts`) where the host webview
provides it (Android's system WebView; iOS where WKWebView allows), or from
a `.vcf` (vCard) file anywhere. A device contact has no OM address, so
imports always pass through review: name and address editable, address
suggested from the email local part, phone digits, or name — a starting
point, never a silent guess.
