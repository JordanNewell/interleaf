# Two-user demo setup

Two Obsidian vaults, two identities, one shared mailbox folder (so messages
actually cross between them without Sync).

```
curtis-ai-chat-porter/demo/
├── demo-vault-2/            # bob  (existing Curtis test vault)
│   └── Messenger/           # the REAL mailbox root
└── demo-vault-3/            # alice (created for this test)
    └── Messenger  →  junction → demo-vault-2/Messenger
```

Identities live in each vault's
`.obsidian/plugins/interleaf/data.json` (`address`: `bob` / `alice`,
poll every 3s, debug notices on). Plugin enablement is pre-seeded in each
vault's `community-plugins.json`.

## Running the test

1. Open demo-vault-2 in Obsidian. It's already trusted; reload it
   (Ctrl+R) if it was open when the plugin was installed. Bob is live.
2. Open demo-vault-3 as a vault ("Open folder as vault"). On the trust
   prompt choose **Trust author and enable plugins** — that turns on the
   messenger. Alice is live.
3. In either vault: command palette → **Interleaf: Send message**,
   addressed to the other (`bob` or `alice`).
4. Watch the other window: within ~3s a debug notice fires and the block
   appears in `Messenger/<to>/inbox.md`. Every vault polls every inbox, so
   both windows will notice — each keeps its own cursor (at-least-once,
   SPEC.md §4).

A pre-seeded welcome message waits in `Messenger/bob/inbox.md` as a first
delivery test.

## Resetting

Delete `Messenger/` contents in demo-vault-2 (the junction means deleting
through demo-vault-3 deletes the same files) and clear `cursors` in both
`data.json` files.
