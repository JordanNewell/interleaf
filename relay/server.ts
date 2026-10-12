import * as http from "node:http";
import { fingerprint, verifyDetached } from "../src/om2/crypto/keys";
import { canonicalAuth } from "../src/om2/crypto/canon";
import { RelayStore } from "./store";
import { parseAuthHeader, type AuthParts } from "../src/om2/auth";

export { parseAuthHeader } from "../src/om2/auth";
export type { AuthParts } from "../src/om2/auth";

/**
 * The OM-2 relay: a dumb, per-fingerprint mailbox for sealed boxes (spec §3.2).
 * It cannot read mail; it authenticates operators by signature over
 * canonicalAuth, rate-limits per fingerprint, caps entry size, and drops after
 * retention. No accounts — the fingerprint is the account.
 *
 * Node-only by design (node:http, Buffer): never imported by the plugin
 * bundle. Self-host with `npm run relay`.
 */

export interface RelayOptions {
  port?: number;
  host?: string;
  dbPath?: string | null;
  /** ms before unfetched entries are dropped (default 7 days) */
  retentionMs?: number;
  /** max requests per fingerprint per minute (default 120) */
  readRatePerMin?: number;
  /** max POSTs per sender fingerprint per 10 min (default 30) */
  postRatePer10Min?: number;
  log?: (msg: string) => void;
}

export interface RunningRelay {
  port: number;
  url: string;
  store: RelayStore;
  close: () => Promise<void>;
}

const AUTH_HEADER = "x-om2-auth";
const TS_WINDOW_MS = 5 * 60 * 1000;
const NONCE_TTL_MS = 10 * 60 * 1000;

export class RelayError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export class RelayAuthorizer {
  private nonces = new Map<string, number>();

  /** Verifies signature, freshness and resource binding. Throws RelayError. */
  verify(headerValue: string, method: string, resource: string): AuthParts {
    const parts = parseAuthHeader(headerValue);
    if (!parts) throw new RelayError(401, "bad_auth", "malformed auth header");
    if (fingerprint(parts.publicKey) !== parts.fp) {
      throw new RelayError(401, "bad_auth", "fp does not match key");
    }
    if (Math.abs(Date.now() - parts.ts) > TS_WINDOW_MS) {
      throw new RelayError(401, "bad_auth", "stale or future ts");
    }
    const canonical = canonicalAuth({
      method,
      resource,
      ts: parts.ts,
      nonce: parts.nonce,
    });
    if (!verifyDetached(parts.publicKey, parts.sig, canonical)) {
      throw new RelayError(401, "bad_auth", "signature verification failed");
    }
    const seen = this.nonces.get(parts.nonce);
    if (seen !== undefined && Date.now() - seen < NONCE_TTL_MS) {
      throw new RelayError(401, "replay", "nonce reused");
    }
    this.nonces.set(parts.nonce, Date.now());
    if (this.nonces.size > 10_000) {
      const cutoff = Date.now() - NONCE_TTL_MS;
      for (const [n, t] of this.nonces) if (t < cutoff) this.nonces.delete(n);
    }
    return parts;
  }
}

class RateLimiter {
  private buckets = new Map<string, { n: number; start: number }>();
  constructor(
    private max: number,
    private windowMs: number
  ) {}
  take(key: string): boolean {
    const now = Date.now();
    let b = this.buckets.get(key);
    if (!b || now - b.start >= this.windowMs) {
      b = { n: 0, start: now };
      this.buckets.set(key, b);
      if (this.buckets.size > 10_000) {
        for (const [k, v] of this.buckets) if (now - v.start >= this.windowMs) this.buckets.delete(k);
      }
    }
    b.n += 1;
    return b.n <= this.max;
  }
}

export async function startRelay(opts: RelayOptions = {}): Promise<RunningRelay> {
  const store = new RelayStore(opts.dbPath ?? null);
  await store.load();
  const retentionMs = opts.retentionMs ?? 7 * 24 * 60 * 60 * 1000;
  const readLimiter = new RateLimiter(opts.readRatePerMin ?? 120, 60 * 1000);
  const postLimiter = new RateLimiter(opts.postRatePer10Min ?? 30, 10 * 60 * 1000);
  const authorizer = new RelayAuthorizer();
  const log = opts.log ?? (() => {});

  const sweeper = setInterval(
    () => {
      const dropped = store.sweep(retentionMs);
      if (dropped > 0) log(`retention: dropped ${dropped} entries`);
    },
    Math.min(retentionMs, 60 * 1000)
  );

  const server = http.createServer((req, res) => {
    void handle(req, res).catch((err: unknown) => {
      if (err instanceof RelayError) {
        json(res, err.status, { error: err.code, message: err.message });
      } else {
        log(`internal error: ${String(err)}`);
        json(res, 500, { error: "internal" });
      }
    });
  });

  async function handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", "http://relay");
    const segs = url.pathname.split("/").filter(Boolean);
    const method = (req.method ?? "GET").toUpperCase();

    if (method === "POST" && segs[0] === "outbox" && segs.length === 1) {
      const body = await readJsonBody(req);
      const to = typeof body.to === "string" ? body.to : "";
      const box = typeof body.box === "string" ? body.box : "";
      if (!/^fp_[a-zA-Z0-9]+$/.test(to) || !box) {
        throw new RelayError(400, "bad_request", "expected {to: fp, box: base64}");
      }
      const auth = authorizer.verify(
        String(req.headers[AUTH_HEADER] ?? ""),
        "POST",
        "outbox"
      );
      if (!postLimiter.take(auth.fp)) {
        throw new RelayError(429, "rate_limited", "too many sends; slow down");
      }
      const entry = store.add(to, box);
      if (!entry) throw new RelayError(413, "too_large", "entry exceeds size cap");
      json(res, 201, { id: entry.id });
      return;
    }

    if (segs[0] === "inbox" && typeof segs[1] === "string" && /^fp_/.test(segs[1])) {
      const fp = segs[1];
      // resource string binds method+path so a captured header can't be replayed elsewhere
      const resource =
        segs.length === 2 ? `inbox/${fp}` : `inbox/${fp}/${segs[2] as string}`;
      if (segs.length > 3) throw new RelayError(404, "not_found", "no such route");
      const auth = authorizer.verify(String(req.headers[AUTH_HEADER] ?? ""), method, resource);
      if (auth.fp !== fp) throw new RelayError(403, "forbidden", "auth fp ≠ mailbox fp");
      if (!readLimiter.take(auth.fp)) {
        throw new RelayError(429, "rate_limited", "too many requests; slow down");
      }

      if (method === "GET" && segs.length === 2) {
        json(res, 200, { entries: store.list(fp) });
        return;
      }
      if (method === "GET" && segs.length === 3) {
        const entry = store.get(fp, segs[2] as string);
        if (!entry) throw new RelayError(404, "not_found", "no such entry");
        json(res, 200, { id: entry.id, ts: entry.ts, box: entry.box });
        return;
      }
      if (method === "DELETE" && segs.length === 3) {
        const ok = store.del(fp, segs[2] as string);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { error: "not_found" });
        return;
      }
      throw new RelayError(405, "method_not_allowed", `${method} not supported here`);
    }

    if (method === "GET" && url.pathname === "/health") {
      json(res, 200, { ok: true });
      return;
    }
    throw new RelayError(404, "not_found", "no such route");
  }

  function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
    const BODY_CAP = 128 * 1024;
    const contentLength = Number(req.headers["content-length"] ?? 0);
    if (contentLength > BODY_CAP) {
      req.resume(); // drain so the 413 response can go out cleanly
      return Promise.reject(new RelayError(413, "too_large", "body exceeds cap"));
    }
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;
      req.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > BODY_CAP) {
          req.resume(); // discard the rest; the 413 goes out via the handler
          reject(new RelayError(413, "too_large", "body exceeds cap"));
          return;
        }
        chunks.push(chunk);
      });
      req.on("end", () => {
        try {
          const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
          resolve(parsed as Record<string, unknown>);
        } catch {
          reject(new RelayError(400, "bad_json", "body is not JSON"));
        }
      });
      req.on("error", () => {});
    });
  }

  function json(res: http.ServerResponse, status: number, body: unknown): void {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(payload),
    });
    res.end(payload);
  }

  await new Promise<void>((resolve) => server.listen(opts.port ?? 0, opts.host ?? "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : (opts.port ?? 0);

  const close = async (): Promise<void> => {
    clearInterval(sweeper);
    await store.flush();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };

  log(`relay listening on ${port}`);
  return { port, url: `http://127.0.0.1:${port}`, store, close };
}
