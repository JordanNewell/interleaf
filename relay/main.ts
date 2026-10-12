import { startRelay } from "./server";

/**
 * Self-hosted relay entry point: `npm run relay [-- --port 7788 --db relay-db.json]`.
 * A dumb per-fingerprint mailbox for sealed boxes — it cannot read anything.
 */

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? (process.argv[i + 1] as string) : fallback;
}

async function main(): Promise<void> {
  const port = Number(arg("port", "7788"));
  const dbPath = arg("db", "relay-db.json");
  const retentionDays = Number(arg("retention-days", "7"));

  const relay = await startRelay({
    port,
    dbPath,
    retentionMs: retentionDays * 24 * 60 * 60 * 1000,
    log: (msg) => console.log(`[relay] ${msg}`),
  });

  console.log(`[relay] OM-2 relay on ${relay.url} (db: ${dbPath}, retention: ${retentionDays}d)`);

  let stopping = false;
  const shutdown = (): void => {
    if (stopping) return;
    stopping = true;
    void relay.close().then(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

void main();
