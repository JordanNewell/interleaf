# First contact — the missing workflow (mapping doc)

Status: implemented (see §8 "as built") · Originally spanned OM-1 (this repo)
and OM-2 (the Obsidian Social plugin) · 2026-10-12

**Update, later on 2026-10-12:** the OM-2 core (bridge, relay client, invite,
quarantine) was ported from Obsidian Social into this repo — cross-vault mail
is now built into Message Bus (`src/om2/`), with the first-contact handshake,
the requests UI, and §9's return-address fix all shipped here. Message Bus
verifies natively; Obsidian Social is now a separate project — pasted
`social-invite` codes still decode here, and mail signed by its bridge still
verifies via the badge fallback.

## 0. The problem

Today nobody can message anybody they haven't already pinned. Every path a
first message can take ends in silence, with "sent" on the sender's side:

| Path | What happens today |
| --- | --- |
| OM-1, same vault | Works — social gate (§17) files the stranger under Contact requests. |
| OM-1, two vaults, shared folder | Works iff both vaults sync the mail folder; otherwise files into the void (`isConfirmedRecipient` warns). |
| OM-2, recipient not pinned by sender | Never leaves: the bridge scans only pinned contacts' alias folders (`bridge.ts` `scanOutbound`). No send, no bounce. |
| OM-2, sender not pinned by recipient | Relay accepts the POST (sender sees "sent"); recipient's bridge **rejects + deletes** (`bridge.ts` `deliver()`), no bounce. Message evaporates. |

The spec chose this on purpose (OM-2 §3.3: "first contact happens
out-of-band — never over the wire") but shipped only half of §4: pinning
needs an artifact from *each* side, and nothing in-band can ever start an
exchange. That is the app-functionality hole this doc closes.

## 1. Hard facts any design must respect

- The relay is a dumb per-fingerprint mailbox (§3.2). It stores opaque
  base64 boxes. It must stay unchanged.
- Sealed boxes are encrypted to the **recipient's public key**
  (`sealJson(contact.publicKey, wire)`). A bare `fp_…` is a hash *of* the
  key — you cannot seal to it. **The minimum reach-me artifact is
  pubkey + relay** — exactly what the invite code (`osinv1-…`) already
  carries. Fingerprint + relay is *not* sufficient for v1.
- Unknown mail must never auto-enter the inbox (§3.3's reason: an impostor
  must not be able to *deliver*, only to *knock*).
- Identity verification stays out-of-band (§6): a signature proves *key
  possession*, never *personhood*.
- OM-1-only readers parse OM-2 extension headers fine (§2.4) — the OM-1
  envelope format needs no change.
- `BridgeState` (sent/seen/attempts) is the natural home for handshake
  state; `safetyNumber()` already exists in the plugin runtime.

## 2. The workflow (state machine)

```
            you have their card (pk + relay)
                        │
     ┌──────────────────▼──────────────────┐
     │ REQUESTED (outbound, per fp)        │  you send a sealed, signed intro
     │ BridgeState.outgoing[fp] = {ts}     │  mail; pin happens ON FIRST REPLY
     └──────────────────┬──────────────────┘
                        │ sealed mail arrives at their bridge
     ┌──────────────────▼──────────────────┐
     │ QUARANTINE (inbound, per fp)        │  verified self-signed unknown
     │ BridgeState.quarantine[fp] =        │  sender → Contact requests UI,
     │   {pk, handle?, firstId, ts}        │  later boxes from fp HELD on relay
     └───────┬─────────────────┬───────────┘
        accept            decline/block
     ┌───────▼────────┐  ┌────────────▼────────────┐
     │ PINNED, mutual │  │ blocked: drop + delete   │
     │ held mail now  │  │ held relay entries;      │
     │ flows; auto-   │  │ silent forever (§3.3)    │
     │ reply completes│  └──────────────────────────┘
     │ the handshake  │   un-decided quarantine: swept by
     └────────────────┘   cap (20) and relay retention (7d)
```

Both sides end pinned after one exchange each — this is §4's "first
successful exchange pins the key", finally implemented:

- **Accepter** pins the requester's key at Accept (it arrived verified in
  the sealed intro).
- **Requester** pins on the first valid reply that matches a pending
  outgoing request (reply is sealed *to them* — only the true accepter can
  produce it — and self-signed).

## 3. Wire change (one field)

`WireMessage.from` gains an optional `pk` (base64url Ed25519 public key):

```ts
from: { fp: string; handle?: string; pk?: string }
```

Senders always include it; it costs 44 bytes. Inbound verification ladder
in `deliver()`:

1. Box won't open with our key → poison, delete (unchanged).
2. Sender **pinned** → verify against the *pinned* key (unchanged). If the
   carried `pk` differs from the pinned key → key-change warning,
   quarantine, never silently re-pin (§5.3 loud).
3. Sender **unpinned**, `fingerprint(from.pk) === from.fp` and
   `verifyDetached(pk, sig, canonical)` → **quarantine as a request**.
4. Anything else → reject + delete (impostor or unsigned; unchanged).

The relay still cannot read any of it — the box stays sealed end to end.
No new message type is required for v1; an intro note is ordinary sealed
mail from a new key.

## 4. Bridge changes (Obsidian Social)

- **Outbound request path**: `sendRequest(pk, relay, note?)` — seal +
  POST to `/outbox` without requiring a pinned contact. Record
  `outgoing[fp]` in `BridgeState`. Do **not** create the alias folder yet;
  the local record is the outgoing-request entry (plus an optional OM-1
  "request sent" note in the sender's own inbox).
- **Quarantine store**: `quarantine[fp] → {pk, handle?, firstId, ts,
  held: number}` in `BridgeState`, capped at 20 (oldest swept; relay's 7-day
  retention is the outer bound).
- **Hold rule**: a sealed box from an fp with pending quarantine is *left
  on the relay* (skip, don't delete) so the conversation is complete when
  the user decides. This replaces reject+delete only for verified keys.
- **Accept**: `contacts.pin({fp, publicKey: pk, alias, relays})`
  (`aliasCandidate`/`collisionSuffix` already do naming), then let held
  relay entries flow through the normal `deliver()` path, then send the
  auto-reply that completes the requester's half (see open questions).
- **Decline/block**: delete all held relay entries for that fp, record it
  on a block list — silent forever, §3.3 behavior restored.
- **Replies that pin**: inbound from unpinned fp where
  `outgoing[fp]` exists and the self-signature verifies → auto-pin, then
  normal delivery. This is the only auto-pin in the system, and it is
  symmetric to the accepter's explicit Accept — **except when the other
  side's knock already quarantined us** (simultaneous mutual requests):
  the hold rule runs first, so both sides must accept. Auto-pin also has a
  14-day TTL — a forgotten request never waves a stranger in years later.
- **Request send retry**: `sendRequest` retries its relay POST inline
  (default 3 attempts, 500 ms apart) before throwing — a briefly-down
  relay must not eat the knock. No local bounce: the request exists
  nowhere but here.

## 5. Surface (as built)

- **Requests UI lives in Social's People view** (a "Requests" section above
  the roster), not Messenger's Contact requests — cross-plugin UI coupling
  is deferred. Cards show display name, short `fp_…`, the 30-digit safety
  number (`runtime.safetyNumber`, click to copy), the honest label —
  *"Accepting proves key continuity, not identity — compare the safety
  number out-of-band"* (§6) — and Accept / Decline actions. Outgoing
  requests render dimmed ("request sent — you'll connect automatically
  when they accept").
- **Invite sharing (the reach-me artifact)**: Social's identity modal shows
  the invite as a QR — the full `obsidian://social-invite?code=…` deep link,
  rendered locally by a vendored encoder (ECC M; no network, nothing leaves
  the vault) — with **Copy QR image**, **Save QR to vault**
  (`message-bus-invite-qr.png`), **Copy invite code / link**, and a
  **Copy reach-me text** button ("DM me on Message Bus — …" + the link).
  Scanning the QR with a phone camera opens Add contact in the recipient's
  Obsidian via the `social-invite` protocol handler, so a QR posted on a
  social network is a complete first-contact route with no directory and no
  server: the invite itself is the address (§6, tier 2).
- **OM-1 gate bypass**: `classifyInbound` gained a `verified` flag; mail
  carrying `om2` fields passed verification + explicit acceptance at the
  OM-2 edge, so it arrives pre-accepted (`mutual`), and `blocked` still
  wins (block beats the bridge). Existing gate behavior is byte-for-byte
  unchanged for ordinary OM-1 mail.
- OM-1-only shared-folder strangers: unchanged — they already land in
  Contact requests.

## 6. Discovery tiers (what you must know to reach someone)

| Tier | Need to know | Status |
| --- | --- | --- |
| Same folder | their address | works today |
| Remote v1 | their card (pk + relay — invite code, deep link, or QR) | works today |
| Remote, fp-only cards | fp + relay, via an *unsealed* signed hello | deferred — the relay would see intro metadata; a §7 trade to state, not solve |
| Handles `@a@host` | directory (OM-2C) | spec-only, out of scope |

## 7. Threat model, honestly labeled

- **Spam**: quarantine is the flood surface; bounded by relay per-fp rate
  limits, the 20-slot cap, and 7-day retention. Blocked = silent forever.
- **Impostor**: can introduce any key they own; cannot claim a pinned fp
  (signature fails against the pin); cannot complete a handshake addressed
  to you (can't seal to your key). "Accept" must never read as "verified".
- **Replay**: existing relay nonce window + receiver id-dedupe, unchanged.
- **Metadata**: relay sees ciphertext sizes and timings, as today (§7 of
  OM-2-SPEC — stated, not solved).

## 8. Implementation order (as built — all shipped)

1. ✅ OM-2 `bridge/`: `from.pk` + verification ladder + quarantine/hold
   rules in `deliver()`/`processEntry`; `sendRequest`/`accept`/`decline`,
   outgoing/quarantine/blocked state in `state.ts` (v2 state file, v1
   files still load), auto-pin-on-reply, quarantine cap 20.
2. ✅ OM-2 `plugin/`: People-view Requests section (safety number,
   accept/decline), "Send a request instead" path in the add-contact modal,
   log-driven view refresh.
3. ✅ OM-1: `classifyInbound(…, verified)` — om2-tagged mail arrives
   pre-accepted; blocked wins; unit-tested in `tests/unit/om2-gate.test.ts`.
4. ✅ Tests: verification-ladder matrix (unit) and the full two-bridge +
   relay handshake (e2e): request → hold → accept → held-mail flush →
   auto-reply → auto-pin → ordinary two-way mail.

Untouched by design: the relay, the OM-1 envelope, the invite format.

## 9. Known v1 limitation & open questions

**Return address (v1.1) — shipped.** A sealed box cannot carry the
*sender's* relay, so `accept()` originally pinned the requester with
`relays: []` and the auto-reply fell back to the accepter's own relay —
correct in the one-relay world, but cross-relay first contact stranded the
reply. The wire intro now carries the sender's relay as a public "return
address" field (`from.relay`, inside the seal, not part of the frozen
canonical), and `accept()`/auto-pin pin with it. Implemented in
`src/om2/bridge.ts`; pinned by the cross-relay E2E in
`tests/unit/om2-bridge.test.ts` (two relays, the reply must land on the
requester's).

1. **Auto-reply on Accept** completes the requester's handshake in one
   step but tells a spammer the address is live. Shipped as: yes (one
   system line; without it first contact needs a second decision).
2. **Hold-on-relay vs. cache-quarantined-copies locally**: holding on the
   relay keeps the bridge stateless but depends on relay liveness for the
   held window. Shipped: hold-on-relay, with held relay entry ids recorded
   per quarantined fp so Decline can delete them; §3.2's "mailbox, not
   ledger" still holds.
3. Whether the intro note should be size-capped at the bridge (relay
   already caps at 128 KiB) — unresolved, low priority.
