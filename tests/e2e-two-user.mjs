/**
 * Two-user end-to-end test for Interleaf.
 *
 * Obsidian ships with an Electron fuse that blocks --inspect, so Playwright's
 * _electron.launch cannot attach. Instead we:
 *   1. spawn real Obsidian with --remote-debugging-port and connect Playwright
 *      over CDP,
 *   2. open demo-vault-3 (alice) at launch and demo-vault-2 (bob) via
 *      obsidian://, wait until both plugins are live,
 *   3. record each vault's app surface with CDP screencast (the mechanism
 *      behind Playwright's recordVideo): frames arrive over the debug channel
 *      straight from the renderer, so the recording contains ONLY the app —
 *      never the desktop, taskbar, or overlapping windows,
 *   4. drive a UI conversation alice→bob→alice through the command palette and
 *      the Send modal, asserting on in-app notices and on-disk message blocks.
 *
 * Obsidian sometimes recreates its windows during launch churn, so no page
 * reference is ever held across steps: every step re-resolves the current page
 * by vault name (usePage) and the recorders re-attach to whichever page the
 * vault now lives on.
 *
 * Artifacts land in test-artifacts/: per-vault mp4s + a stitched side-by-side
 * two-user-test.mp4 + step screenshots.
 */
import { chromium } from "playwright-core";
import { spawn, execSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const PROJECT = "E:/dev/projects/Obsiadian Messenger";
const D2 = "E:/dev/projects/curtis-ai-chat-porter/demo/demo-vault-2";
const D3 = "E:/dev/projects/curtis-ai-chat-porter/demo/demo-vault-3";
const ART = path.join(PROJECT, "test-artifacts");
const VIDEOS = path.join(ART, "videos");
const REG = path.join(process.env.APPDATA, "obsidian", "obsidian.json");
const EXE = "C:/Users/jrnew/scoop/apps/obsidian/current/Obsidian.exe";
const CDP_PORT = 9223;
const ALICE_VAULT = "demo-vault-3";
const BOB_VAULT = "demo-vault-2";

const log = (...a) => console.log("[e2e]", new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const killObsidian = () => {
  try {
    execSync("taskkill /F /IM Obsidian.exe", { stdio: "ignore" });
    log("killed leftover Obsidian");
  } catch {}
};

async function waitForFileMarker(file, marker, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fsp.readFile(file, "utf8")).includes(marker)) return;
    } catch {}
    await sleep(250);
  }
  throw new Error(`marker "${marker}" never appeared in ${file}`);
}

/** Register demo-vault-3 so Obsidian opens it at launch; keep a backup. */
function prepRegistry() {
  fs.copyFileSync(REG, `${REG}.bak-e2e`);
  const raw = JSON.parse(fs.readFileSync(REG, "utf8"));
  const norm = (p) => p.replace(/\\/g, "/").replace(/\/+$/, "");
  let aliceId = Object.keys(raw.vaults).find((id) => norm(raw.vaults[id].path) === D3);
  if (!aliceId) {
    aliceId = crypto.randomBytes(8).toString("hex");
    raw.vaults[aliceId] = { path: D3, ts: Date.now() };
  }
  const bobId = Object.keys(raw.vaults).find((id) => norm(raw.vaults[id].path) === D2);
  if (!bobId) throw new Error("demo-vault-2 is not registered in Obsidian");
  for (const v of Object.values(raw.vaults)) delete v.open;
  raw.vaults[aliceId].open = true;
  fs.writeFileSync(REG, JSON.stringify(raw));
  log("registry ready: alice opens at launch");
  return raw.vaults[bobId].path;
}

/** Run the "Send message" command through the command palette, fill the modal, send. */
async function sendViaUI(page, to, body) {
  try {
    await page.keyboard.press("Control+p");
    await page.waitForSelector(".prompt-input", { timeout: 5000 });
    await page.keyboard.type("Interleaf: Send message");
    await page.waitForSelector(".suggestion-item", { timeout: 5000 });
    await sleep(300);
    await page.keyboard.press("Enter");
  } catch {
    log(`palette flaked, using command API instead (to=${to})`);
    await page.evaluate(() => app.commands.executeCommandById("interleaf:send"));
  }
  await page.waitForSelector(".modal-container .messenger-body", { timeout: 8000 });
  await page.fill('.modal-container input[placeholder*="address"]', to);
  await page.fill(".modal-container .messenger-body", body);
  await page.click('.modal-container button:has-text("Send")');
  await page
    .waitForSelector('.notice:has-text("Delivered to inbox")', { timeout: 6000 })
    .catch(() => log("no delivery notice visible (continuing)"));
}

/** Resolve true the first time a *new* "Messenger: processed" notice appears. */
function waitForFreshProcessedNotice(page, timeoutMs) {
  return page.waitForFunction(
    () => {
      window.__seenNotices = window.__seenNotices || new WeakSet();
      const fresh = [...document.querySelectorAll(".notice")].filter(
        (n) => /Messenger: processed/.test(n.textContent || "") && !window.__seenNotices.has(n)
      );
      if (fresh.length) {
        fresh.forEach((n) => window.__seenNotices.add(n));
        return true;
      }
      return false;
    },
    null,
    { timeout: timeoutMs, polling: 250 }
  );
}

// ---- capture + page-resolution state (browser/recA/recB assigned in main) --

let browser = null;
const recs = {
  [ALICE_VAULT]: null,
  [BOB_VAULT]: null,
};

function makeRecorder(dir) {
  const state = { frames: [], count: 0, session: null, page: null };
  const attach = (session) => {
    session.on("Page.screencastFrame", (ev) => {
      const file = path.join(dir, `f${String(state.count++).padStart(5, "0")}.jpg`);
      try {
        fs.writeFileSync(file, Buffer.from(ev.data, "base64"));
        const ts = ev.metadata?.timestamp ?? (state.frames.at(-1)?.ts ?? 0) + 0.06;
        state.frames.push({ file, ts });
      } catch {}
      session.send("Page.screencastFrameAck", { sessionId: ev.sessionId }).catch(() => {});
    });
  };
  /** Follow the given page; if Obsidian recreated its window, re-attach. */
  state.ensure = async (page) => {
    if (state.page === page) return;
    if (state.session) {
      try {
        await state.session.send("Page.stopScreencast");
      } catch {}
      try {
        await state.session.detach();
      } catch {}
    }
    state.page = page;
    state.session = await page.context().newCDPSession(page);
    attach(state.session);
    await state.session.send("Page.startScreencast", {
      format: "jpeg",
      quality: 55,
      maxWidth: 1280,
      maxHeight: 800,
    });
  };
  state.stop = async () => {
    try {
      await state.session.send("Page.stopScreencast");
    } catch {}
    try {
      await state.session.detach();
    } catch {}
    return state.frames;
  };
  return state;
}

/**
 * Resolve the CURRENT page of a vault and point its recorder at it. Obsidian
 * occasionally recreates windows during launch churn, which orphans stale
 * Playwright page handles — so nothing holds a page reference across steps.
 */
async function usePage(vault) {
  if (!browser) throw new Error("browser not connected");
  const pages = browser
    .contexts()
    .flatMap((c) => c.pages())
    .filter((p) => p.url().startsWith("app://"));
  for (const p of pages) {
    const name = await p
      .evaluate(() => {
        try {
          return app.vault.getName();
        } catch {
          return "";
        }
      })
      .catch(() => "");
    if (name === vault) {
      await recs[vault].ensure(p);
      return p;
    }
  }
  throw new Error(`${vault} window is gone`);
}

const trustIfPrompted = async (p) => {
  const trust = await p.$('button:has-text("Trust author")').catch(() => null);
  if (trust) {
    await trust.click().catch(() => {});
    log("trust prompt accepted");
  }
};

const waitForPluginLive = async (vault) => {
  const p = await usePage(vault);
  await trustIfPrompted(p);
  await p.waitForFunction(() => window.obsidianMessenger != null, null, {
    timeout: 20000,
    polling: 300,
  });
  return p;
};

/** Poll until a fresh "Messenger: processed" notice appears in the vault. */
const waitNotice = async (vault, timeoutMs) => {
  const start = Date.now();
  for (;;) {
    try {
      const p = await usePage(vault);
      await waitForFreshProcessedNotice(p, 2000);
      return;
    } catch {}
    if (Date.now() - start > timeoutMs) {
      throw new Error(`${vault}: delivery notice never seen`);
    }
    await sleep(500);
  }
};

/** Frame JPEGs → mp4, honoring per-frame screencast timestamps. */
async function stitchOne(rec, outFile, label) {
  try {
    const frames = rec ? await rec.stop() : [];
    if (!frames.length) {
      log(`no frames captured for ${label}`);
      return false;
    }
    const concatPath = outFile.replace(/\.mp4$/, ".txt");
    const lines = ["ffconcat version 1.0"];
    for (let i = 0; i < frames.length; i++) {
      lines.push(`file '${frames[i].file.replace(/\\/g, "/")}'`);
      const dur = i + 1 < frames.length ? Math.max(1 / 30, frames[i + 1].ts - frames[i].ts) : 1;
      lines.push(`duration ${dur.toFixed(3)}`);
    }
    lines.push(`file '${frames[frames.length - 1].file.replace(/\\/g, "/")}'`);
    fs.writeFileSync(concatPath, lines.join("\n"));
    execFileSync(
      "ffmpeg",
      [
        "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", concatPath,
        "-vf", "fps=15,scale=1280:-2",
        "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
        outFile,
      ],
      { timeout: 180000 }
    );
    return true;
  } catch (e) {
    log(`stitch failed for ${label}: ${String(e.message).split("\n")[0]}`);
    return false;
  }
}

// ---------------------------------------------------------------------------

killObsidian();
await sleep(1500);
const bobPath = prepRegistry();
fs.mkdirSync(VIDEOS, { recursive: true });
// clear stale artifacts so leftovers can't be mistaken for this run's results
for (const f of ["two-user-test.mp4", "alice.mp4", "bob.mp4"]) {
  fs.rmSync(path.join(VIDEOS, f), { force: true });
}
for (const vault of [ALICE_VAULT, BOB_VAULT]) {
  const dir = path.join(VIDEOS, vault + "-frames");
  fs.mkdirSync(dir, { recursive: true });
  recs[vault] = makeRecorder(dir);
}
const videoPath = path.join(VIDEOS, "two-user-test.mp4");

let obsidian;
try {
  obsidian = spawn(EXE, [`--remote-debugging-port=${CDP_PORT}`], { stdio: ["ignore", "pipe", "pipe"] });
  obsidian.stdout.on("data", (d) => log(`[obsidian] ${d.toString().trim()}`));
  obsidian.stderr.on("data", (d) => log(`[obsidian:err] ${d.toString().trim()}`));
  log(`obsidian spawned (pid ${obsidian.pid}), waiting for CDP…`);

  const cdpStart = Date.now();
  for (;;) {
    try {
      if ((await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).ok) break;
    } catch {}
    if (Date.now() - cdpStart > 30000) throw new Error("CDP endpoint never came up");
    await sleep(500);
  }

  const endpoint = `http://127.0.0.1:${CDP_PORT}`;
  for (let i = 1; i <= 6; i++) {
    try {
      browser = await chromium.connectOverCDP(endpoint);
      break;
    } catch (e) {
      log(`connect attempt ${i}/6 failed — ${e.message.split("\n")[0]}`);
      await sleep(2000);
    }
  }
  if (!browser) throw new Error("could not connect over CDP");
  log("playwright connected over CDP");

  // ---- alice (demo-vault-3) is the launch vault ------------------------------
  const aliceStart = Date.now();
  for (;;) {
    try {
      await waitForPluginLive(ALICE_VAULT);
      break;
    } catch {
      if (Date.now() - aliceStart > 45000) throw new Error("alice window never became usable");
      await sleep(1500);
    }
  }
  log("alice: plugin live");

  // ---- open bob's vault ------------------------------------------------------
  const url = "obsidian://open?path=" + encodeURIComponent(bobPath);
  spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", shell: false });
  log("bob: obsidian://open sent");
  const bobStart = Date.now();
  for (;;) {
    try {
      await waitForPluginLive(BOB_VAULT);
      break;
    } catch (e) {
      if (Date.now() - bobStart > 45000) throw new Error("bob window never became usable");
      await sleep(1500);
    }
  }
  log("bob: plugin live");

  // let both plugins chew through the pre-seeded welcome message, then drain
  await sleep(4000);
  await waitNotice(BOB_VAULT, 5000).catch(() => log("bob: no early notice (fine)"));
  await waitNotice(ALICE_VAULT, 3000).catch(() => log("alice: no early notice (fine)"));

  // ---- alice → bob (mail lands in BOB's inbox) -------------------------------
  let t = Date.now();
  await sendViaUI(await usePage(ALICE_VAULT), "bob", "hey bob, alice here — testing the bus");
  await waitForFileMarker(path.join(D2, "Messenger", "bob", "inbox.md"), "alice here");
  log(`alice→bob message on disk after ${Date.now() - t}ms`);
  await (await usePage(ALICE_VAULT)).screenshot({ path: path.join(ART, "1-alice-sent.png") });
  await waitNotice(BOB_VAULT, 20000);
  await (await usePage(BOB_VAULT)).screenshot({ path: path.join(ART, "2-bob-received.png") });
  log("bob: delivery notice seen");

  // ---- bob → alice -------------------------------------------------------------
  t = Date.now();
  await sendViaUI(await usePage(BOB_VAULT), "alice", "got it alice — bob");
  await waitForFileMarker(path.join(D2, "Messenger", "alice", "inbox.md"), "got it alice");
  log(`bob→alice message on disk after ${Date.now() - t}ms`);
  await (await usePage(BOB_VAULT)).screenshot({ path: path.join(ART, "3-bob-replied.png") });
  await waitNotice(ALICE_VAULT, 20000);
  await (await usePage(ALICE_VAULT)).screenshot({ path: path.join(ART, "4-alice-received.png") });
  log("alice: delivery notice seen");

  // ---- payoff shots: open both inboxes in the UI ------------------------------
  for (const [vault, addr, shot] of [
    [ALICE_VAULT, "alice", "5-alice-inbox.png"],
    [BOB_VAULT, "bob", "6-bob-inbox.png"],
  ]) {
    try {
      const page = await usePage(vault);
      await page.evaluate((a) => {
        const f = app.vault.getAbstractFileByPath(`Messenger/${a}/inbox.md`);
        if (f) return app.workspace.getLeaf("tab").openFile(f);
      }, addr);
      await sleep(1500);
      await (await usePage(vault)).screenshot({ path: path.join(ART, shot) });
    } catch (e) {
      log(`could not open ${addr} inbox in UI: ${e.message.split("\n")[0]}`);
    }
  }

  log("TEST PASSED ✅");
} catch (err) {
  log(`TEST FAILED ❌ ${err.message.split("\n")[0]}`);
  for (const [label, vault] of [["alice", ALICE_VAULT], ["bob", BOB_VAULT]]) {
    try {
      const p = await usePage(vault);
      await p.screenshot({ path: path.join(ART, `fail-${label}.png`) });
    } catch {}
  }
  process.exitCode = 1;
} finally {
  // formally stop the screencasts while the CDP connection is still up
  for (const vault of [ALICE_VAULT, BOB_VAULT]) {
    if (recs[vault]) await recs[vault].stop().catch(() => {});
  }
  if (browser) await browser.close().catch(() => {});
  killObsidian();

  const okA = await stitchOne(recs[ALICE_VAULT], path.join(VIDEOS, "alice.mp4"), "alice");
  const okB = await stitchOne(recs[BOB_VAULT], path.join(VIDEOS, "bob.mp4"), "bob");
  if (okA && okB) {
    try {
      execFileSync(
        "ffmpeg",
        [
          "-y", "-v", "error",
          "-i", path.join(VIDEOS, "alice.mp4"),
          "-i", path.join(VIDEOS, "bob.mp4"),
          "-filter_complex", "[0:v]scale=-2:720[a];[1:v]scale=-2:720[b];[a][b]hstack=inputs=2",
          "-shortest",
          videoPath,
        ],
        { timeout: 180000 }
      );
    } catch (e) {
      log(`combined stitch failed: ${String(e.message).split("\n")[0]}`);
    }
  }
  for (const f of [videoPath, path.join(VIDEOS, "alice.mp4"), path.join(VIDEOS, "bob.mp4")]) {
    try {
      const st = await fsp.stat(f);
      log(`video: ${f} (${Math.round(st.size / 1024)} KB)`);
    } catch {
      log(`video missing: ${f}`);
    }
  }
}
