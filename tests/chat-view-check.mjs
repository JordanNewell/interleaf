/**
 * Chat-view end-to-end check for Interleaf.
 *
 * Same harness approach as e2e-two-user.mjs (CDP against real Obsidian — the
 * Electron fuse blocks Playwright's _electron.launch), focused on the
 * messenger-chat view:
 *   1. install the fresh build into both demo vaults (alice = demo-vault-3,
 *      bob = demo-vault-2 — both junctioned to one hidden shared mailbox),
 *   2. conversation list → thread → composer send → canonical OM-1 envelope
 *      asserted on disk (the "locked structure" proof),
 *   3. popup notification while alice is on the list; clicking it opens the
 *      conversation,
 *   4. unread badge in bob's list,
 *   5. reply-with-quote: composer chip, replyTo in the envelope on disk,
 *      quoted chip rendering live in alice's thread.
 *
 * Screenshots land in test-artifacts/chat-view-*.png.
 */
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const PROJECT = "E:/dev/projects/Obsiadian Messenger";
const D2 = "E:/dev/projects/curtis-ai-chat-porter/demo/demo-vault-2";
const D3 = "E:/dev/projects/curtis-ai-chat-porter/demo/demo-vault-3";
const SHARED_MAILBOX = "E:/dev/projects/curtis-ai-chat-porter/demo/shared-mailbox";
const ART = path.join(PROJECT, "test-artifacts");
const REG = path.join(process.env.APPDATA, "obsidian", "obsidian.json");
const EXE = "C:/Users/jrnew/scoop/apps/obsidian/current/Obsidian.exe";
const CDP_PORT = 9224;
const ALICE = "demo-vault-3";
const BOB = "demo-vault-2";

/** Hidden storage root (the default): a dot-folder Obsidian never indexes. */
const mailboxOf = (vault) =>
  path.join(vault, ".obsidian", "plugins", "interleaf", "mailbox");

const log = (...a) => console.log("[chat-view]", new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const killObsidian = () => {
  try {
    execSync("taskkill /F /IM Obsidian.exe", { stdio: "ignore" });
    log("killed leftover Obsidian");
  } catch {}
};

function installBuild() {
  // The two vaults share one mailbox root (both dot-paths are junctions to the
  // same real folder), mirroring how a synced vault carries mail between
  // devices. data.json is pre-seeded so the plugin never tries to migrate the
  // demo vaults' old visible Messenger/ fixture.
  fs.mkdirSync(SHARED_MAILBOX, { recursive: true });
  for (const vault of [D2, D3]) {
    const pluginDir = path.join(vault, ".obsidian", "plugins", "interleaf");
    fs.mkdirSync(pluginDir, { recursive: true });
    if (!fs.existsSync(path.join(pluginDir, "mailbox"))) {
      fs.symlinkSync(SHARED_MAILBOX, path.join(pluginDir, "mailbox"), "junction");
    }
    for (const f of ["main.js", "manifest.json", "styles.css"]) {
      fs.copyFileSync(path.join(PROJECT, f), path.join(pluginDir, f));
    }
    const dataPath = path.join(pluginDir, "data.json");
    let data = {};
    try {
      data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    } catch {}
    data.hiddenStorage = true;
    data.lastRoot = ".obsidian/plugins/interleaf/mailbox";
    // the welcome modal would cover the window and swallow every click —
    // this harness tests the chat view, not onboarding
    data.onboarded = true;
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }
  // one seeded conversation so the fresh mailbox has something to list
  const bobInbox = path.join(SHARED_MAILBOX, "bob", "inbox.md");
  if (!fs.existsSync(bobInbox)) {
    fs.mkdirSync(path.dirname(bobInbox), { recursive: true });
    fs.writeFileSync(
      bobInbox,
      `# Inbox — bob\n\n<!-- messenger: {"id":"msg_seed${Date.now().toString(36)}","from":"alice","to":"bob","ts":"${new Date().toISOString()}","replyTo":null} -->\nseed hello from the harness\n<!-- /messenger -->\n\n`
    );
  }
  log("fresh build installed into both vaults (hidden shared mailbox)");
}

/** Make alice's vault the launch vault (backup kept next to the registry). */
function prepRegistry() {
  fs.copyFileSync(REG, `${REG}.bak-chatview`);
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
  return raw.vaults[bobId].path;
}

let browser = null;

async function usePage(vault) {
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
      if (!p.__wired) {
        p.__wired = true;
        p.on("pageerror", (e) => log(`[pageerror:${vault}]`, String(e).split("\n")[0]));
        p.on("console", (m) => {
          if (m.type() === "error") log(`[console:${vault}]`, m.text().slice(0, 200));
        });
      }
      return p;
    }
  }
  throw new Error(`${vault} window is gone`);
}

const trustIfPrompted = async (p) => {
  const trust = await p.$('button:has-text("Trust author")').catch(() => null);
  if (trust) await trust.click().catch(() => {});
};

/** Obsidian recreates windows during launch churn — retry until usable. */
async function waitForPluginLive(vault, timeoutMs = 45000) {
  const start = Date.now();
  for (;;) {
    try {
      const p = await usePage(vault);
      await trustIfPrompted(p);
      // API global is set early in onload; wait for the view/command
      // registration to land too, or executeCommandById silently no-ops.
      await p.waitForFunction(
        () =>
          window.obsidianMessenger != null &&
          app.commands.commands["interleaf:chat"] != null,
        null,
        { timeout: 5000, polling: 300 }
      );
      return p;
    } catch {
      if (Date.now() - start > timeoutMs) throw new Error(`${vault} never became usable`);
      await sleep(1500);
    }
  }
}

async function openChatView(page) {
  for (let i = 0; i < 10; i++) {
    const ok = await page.evaluate(() => {
      if (!app.commands.commands["interleaf:chat"]) return false;
      app.commands.executeCommandById("interleaf:chat");
      return true;
    });
    if (ok) {
      try {
        // `.messenger-chat` is added synchronously at render start — also wait
        // for the first real content (restored layouts may open a thread).
        await page.waitForSelector(".messenger-back, .messenger-conv", {
          timeout: 3000,
        });
        return;
      } catch {
        log(`chat view not up after command (attempt ${i + 1})`);
      }
    }
    await sleep(1000);
  }
  const diag = await page
    .evaluate(() => ({
      leaves: app.workspace.getLeavesOfType("messenger-chat").length,
      cmd: !!app.commands.commands["interleaf:chat"],
    }))
    .catch(() => ({}));
  throw new Error(`chat view never appeared ${JSON.stringify(diag)}`);
}

/** From a thread back to the list, if a thread is open (restored layouts). */
async function backToList(page) {
  const back = await page.$(".messenger-back");
  if (back) {
    await back.click();
    await page.waitForSelector(".messenger-conv", { timeout: 5000 });
  }
}

const shot = (page, name) =>
  page.screenshot({ path: path.join(ART, name) }).catch(() => {});

const lastEnvelopes = async (inboxPath) => {
  const content = await fsp.readFile(inboxPath, "utf8");
  return [...content.matchAll(/<!-- messenger: (\{[^\n]*\}) -->/g)].map((m) =>
    JSON.parse(m[1])
  );
};

/** Poll a file until it contains all markers (receipt writes are debounced). */
async function waitForReceipt(file, markers, timeoutMs = 20000) {
  const start = Date.now();
  for (;;) {
    try {
      const content = await fsp.readFile(file, "utf8");
      if (markers.every((m) => content.includes(m))) return;
    } catch {}
    if (Date.now() - start > timeoutMs) {
      throw new Error(`receipt never appeared in ${file} (wanted: ${markers.join(" + ")})`);
    }
    await sleep(300);
  }
}

/**
 * The page whose document actually hosts the live conversation with `peer` —
 * it may be a popped-out window, not the vault's main window.
 */
async function useHostPage(vault, peer) {
  // don't filter by URL: under CDP, popout windows report about:blank but
  // still run the full app and host real leaves
  const pages = browser.contexts().flatMap((c) => c.pages());
  for (const p of pages) {
    const hosts = await p
      .evaluate(
        ([addr, vaultName]) => {
          try {
            if (app.vault.getName() !== vaultName) return false;
          } catch {
            return false;
          }
          return app.workspace
            .getLeavesOfType("messenger-chat")
            .some(
              (l) =>
                l.view?.containerEl?.isConnected &&
                l.view.peer === addr &&
                l.view.containerEl.ownerDocument === document
            );
        },
        [peer, vault]
      )
      .catch(() => false);
    if (hosts) return p;
  }
  return usePage(vault);
}

const step = async (name, fn) => {
  const t = Date.now();
  await fn();
  log(`✓ ${name} (${Date.now() - t}ms)`);
};

/**
 * Run a step against a vault, re-resolving its page on window churn.
 * Obsidian sometimes tears windows down and recreates them seconds later, so
 * on churn we wait for the vault to come back instead of failing fast.
 */
const withVault = async (vault, fn, attempts = 5) => {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn(await usePage(vault));
    } catch (e) {
      lastErr = e;
      if (/closed|destroyed|window is gone|Target page/i.test(String(e))) {
        log(`${vault}: window churn, waiting for it to come back (${i + 1}/${attempts})`);
        await waitForPluginLive(vault).catch(() => {});
        await sleep(1000);
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
};

// ---------------------------------------------------------------------------

killObsidian();
await sleep(1500);
installBuild();
const bobPath = prepRegistry();

let obsidian;
try {
  obsidian = spawn(EXE, [`--remote-debugging-port=${CDP_PORT}`], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  obsidian.stderr.on("data", (d) => {
    const s = d.toString().trim();
    if (s) log(`[obsidian:err] ${s.split("\n")[0]}`);
  });
  for (;;) {
    try {
      if ((await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).ok) break;
    } catch {}
    await sleep(500);
  }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  log("connected over CDP");

  // surface page errors from every window, including popouts created later
  const wire = (p) => {
    if (p.__wired) return;
    p.__wired = true;
    p.on("pageerror", (e) => log("[pageerror]", String(e).split("\n")[0]));
    p.on("console", (m) => {
      if (m.type() === "error") log("[console]", m.text().slice(0, 200));
    });
  };
  for (const c of browser.contexts()) {
    for (const p of c.pages()) wire(p);
    c.on("page", wire);
  }

  await waitForPluginLive(ALICE);
  log("alice: plugin live");

  await step("chat view opens with conversation list", async () => {
    const p = await usePage(ALICE);
    await openChatView(p);
    await backToList(p);
    await p.waitForSelector(".messenger-conv", { timeout: 5000 });
    await shot(p, "chat-view-1-list.png");
  });

  const msgA = `chat-view check from alice at ${new Date().toLocaleTimeString()}`;
  await step("open bob conversation and send from the composer", async () => {
    const p = await usePage(ALICE);
    await p.click('.messenger-conv[data-addr="bob"]');
    await p.waitForSelector(".messenger-composer-input", { timeout: 5000 });
    await p.fill(".messenger-composer-input", msgA);
    await p.press(".messenger-composer-input", "Enter");
    await p.waitForFunction(
      (t) =>
        [...document.querySelectorAll(".messenger-bubble")].some((b) =>
          b.textContent.includes(t)
        ),
      msgA,
      { timeout: 6000, polling: 200 }
    );
    await shot(p, "chat-view-2-thread.png");
  });

  await step("canonical OM-1 envelope on disk (the structure lock)", async () => {
    const envelopes = await lastEnvelopes(path.join(mailboxOf(D2), "bob", "inbox.md"));
    const last = envelopes[envelopes.length - 1];
    if (last.from !== "alice" || last.to !== "bob" || !/^msg_[a-z0-9]+$/.test(last.id)) {
      throw new Error(`envelope not canonical: ${JSON.stringify(last)}`);
    }
    log(`envelope ok: id=${last.id} replyTo=${JSON.stringify(last.replyTo)}`);
  });

  const BOB_RECEIPTS = path.join(mailboxOf(D2), "bob", "receipts.md");
  await step("open bob's vault", async () => {
    spawn("cmd", ["/c", "start", "", "obsidian://open?path=" + encodeURIComponent(bobPath)], {
      stdio: "ignore",
      shell: false,
    });
    await waitForPluginLive(BOB);
  });

  await step("delivery receipt lands in bob's receipts.md", async () => {
    // receipts are written by bob's own plugin, so this can only pass now
    // that bob's vault (and its polling loop) is actually running
    const envelopes = await lastEnvelopes(path.join(mailboxOf(D2), "bob", "inbox.md"));
    const fromAlice = envelopes.filter((e) => e.from === "alice");
    const id = fromAlice[fromAlice.length - 1].id;
    await waitForReceipt(BOB_RECEIPTS, ['"state":"delivered"', id]);
    log(`delivery receipt ok for ${id}`);
  });

  await step("back to the list (popups allowed again)", async () => {
    const p = await usePage(ALICE);
    await backToList(p);
  });

  const ping = `heads-up alice, popup test ${Date.now()}`;
  await step("popup appears and click-opens the conversation", async () => {
    await withVault(BOB, async (p) => {
      await p.evaluate(async (body) => {
        const me = await window.obsidianMessenger.client("bob");
        await me.send("alice", body);
      }, ping);
    });
    await withVault(ALICE, async (p) => {
      await p.waitForSelector(".messenger-notice", { timeout: 15000, polling: 300 });
      await shot(p, "chat-view-3-popup.png");
      // a DOM click, not a pixel click: debug notices can stack on top and
      // swallow a physical click, which says nothing about our handler
      await p.evaluate(() =>
        document
          .querySelector(".messenger-notice")
          ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      );
      try {
        // openChat may reveal the conversation in ANY live chat leaf — sidebar
        // or a popped-out window — so check workspace leaf state, not this
        // window's DOM
        await p.waitForFunction(
          (peer) =>
            app.workspace
              .getLeavesOfType("messenger-chat")
              .some(
                (l) =>
                  l.view?.containerEl?.isConnected && l.view.peer === peer
              ),
          "bob",
          { timeout: 8000, polling: 300 }
        );
      } catch (e) {
        const diag = await p.evaluate(() => ({
          leaves: app.workspace
            .getLeavesOfType("messenger-chat")
            .map((l) => ({
              connected: !!l.view?.containerEl?.isConnected,
              peer: l.view?.peer ?? null,
              inMain: l.view ? l.view.containerEl.win === window : null,
            })),
          notices: [...document.querySelectorAll(".notice")].map((n) =>
            (n.textContent || "").slice(0, 40)
          ),
        })).catch(() => ({ err: "dump failed" }));
        log("popup-click diagnostics:", JSON.stringify(diag));
        throw e;
      }
    });
  });

  await step("bob opens the chat list", async () => {
    await withVault(BOB, async (p) => {
      await openChatView(p);
      await backToList(p);
      await p.waitForSelector('.messenger-conv[data-addr="alice"]', { timeout: 5000 });
    });
  });

  await step("alice seeds an unread message for bob", async () => {
    await withVault(ALICE, (p) =>
      p.evaluate(async () => {
        const me = await window.obsidianMessenger.client("alice");
        await me.send("bob", `unread seed ${Date.now()}`);
      })
    );
  });

  await step("unread badge appears and bob opens the thread", async () => {
    await withVault(BOB, async (p) => {
      await p.waitForSelector(
        '.messenger-conv[data-addr="alice"] .messenger-unread',
        { timeout: 10000, polling: 300 }
      );
      await shot(p, "chat-view-4-unread.png");
      await p.click('.messenger-conv[data-addr="alice"]');
      await p.waitForSelector(".messenger-composer-input", { timeout: 5000 });
    });
  });

  await step("read receipt lands once bob's UI shows the mail", async () => {
    const envelopes = await lastEnvelopes(path.join(mailboxOf(D2), "bob", "inbox.md"));
    const fromAlice = envelopes.filter((e) => e.from === "alice");
    const seedId = fromAlice[fromAlice.length - 1].id;
    await waitForReceipt(BOB_RECEIPTS, ['"state":"read"', seedId]);
    log(`read receipt ok for ${seedId}`);
  });

  const replyBody = `re: quoting you — bob ${Date.now()}`;
  await step("reply-with-quote writes replyTo to disk", async () => {
    await withVault(BOB, async (p) => {
      const actions = await p.$$(".messenger-msg.theirs .messenger-msg-action");
      const last = actions[actions.length - 1];
      if (!last) throw new Error("no reply action found on alice's messages");
      await last.click();
      await p.waitForSelector(".messenger-reply-chip:not(.is-hidden)", { timeout: 5000 });
      await p.fill(".messenger-composer-input", replyBody);
      await p.press(".messenger-composer-input", "Enter");
      await p.waitForFunction(
        (t) =>
          [...document.querySelectorAll(".messenger-bubble")].some((b) =>
            b.textContent.includes(t)
          ),
        replyBody,
        { timeout: 6000, polling: 200 }
      );
      await shot(p, "chat-view-5-reply.png");
    });

    // replyTo references a global message id — the quoted message may live in
    // either inbox (here: alice's original is in bob's), so check both files.
    const aliceEnvelopes = await lastEnvelopes(path.join(mailboxOf(D3), "alice", "inbox.md"));
    const bobEnvelopes = await lastEnvelopes(path.join(mailboxOf(D2), "bob", "inbox.md"));
    const envelopes = [...aliceEnvelopes, ...bobEnvelopes];
    const lastEnv = aliceEnvelopes[aliceEnvelopes.length - 1];
    const ids = new Set(envelopes.map((e) => e.id));
    if (lastEnv.from !== "bob" || lastEnv.to !== "alice") {
      throw new Error(`unexpected reply envelope: ${JSON.stringify(lastEnv)}`);
    }
    if (typeof lastEnv.replyTo !== "string" || !ids.has(lastEnv.replyTo)) {
      throw new Error(`replyTo missing or dangling: ${JSON.stringify(lastEnv.replyTo)}`);
    }
    log(`replyTo ok: ${lastEnv.replyTo}`);
  });

  await step("alice's thread live-updates: reply, quote, and ✓✓", async () => {
    // the live conversation may sit in a popped-out window — watch that page
    const p = await useHostPage(ALICE, "bob");
    try {
      await p.waitForFunction(
        (t) =>
          [...document.querySelectorAll(".messenger-bubble")].some((b) =>
            b.textContent.includes(t)
          ),
        replyBody,
        { timeout: 15000, polling: 300 }
      );
    } catch (e) {
      const diag = await Promise.all(
        browser
          .contexts()
          .flatMap((c) => c.pages())
          .filter((pg) => pg.url().startsWith("app://") || pg.url() === "about:blank")
          .map(async (pg, i) => ({
            page: i,
            url: pg.url().slice(0, 30),
            state: await pg
              .evaluate(() => ({
                vault: (() => {
                  try {
                    return app.vault.getName();
                  } catch {
                    return "?";
                  }
                })(),
                leaves: app.workspace
                  ? app.workspace
                      .getLeavesOfType("messenger-chat")
                      .map((l) => ({
                        connected: !!l.view?.containerEl?.isConnected,
                        peer: l.view?.peer ?? null,
                        mine: l.view?.containerEl?.ownerDocument === document,
                        bubbles: document.querySelectorAll(".messenger-bubble").length,
                      }))
                  : "no workspace",
              }))
              .catch((err) => ({ err: String(err).split("\n")[0] })),
          }))
      );
      log("live-update diagnostics:", JSON.stringify(diag));
      throw e;
    }
    const quotes = await p.$$(".messenger-quote");
    if (quotes.length === 0) throw new Error("no quote chip rendered in alice's thread");
    // bob opened the thread above, so alice's outgoing bubbles must show ✓✓
    await p.waitForSelector(".messenger-status.is-read", {
      timeout: 15000,
      polling: 300,
    });
    await shot(p, "chat-view-6-live-quote.png");
  });

  await step("messenger pops out into its own desktop window", async () => {
    await withVault(ALICE, async (p) => {
      let popout = null;
      for (let i = 0; i < 3 && !popout; i++) {
        // commands execute in the FOCUSED window's plugin instance — focus
        // alice first or the popout may be created by another vault's app
        await p.bringToFront();
        await p.evaluate(() =>
          app.commands.executeCommandById("interleaf:chat-window")
        );
        for (let j = 0; j < 8 && !popout; j++) {
          // don't filter by URL: under CDP, popout windows report about:blank
          for (const pg of browser.contexts().flatMap((c) => c.pages())) {
            const isPop = await pg
              .evaluate(
                () =>
                  document.body.classList.contains("is-popout-window") &&
                  !!document.querySelector(".messenger-chat")
              )
              .catch(() => false);
            if (isPop) {
              popout = pg;
              break;
            }
          }
          if (!popout) await sleep(500);
        }
        if (popout) {
          const addr = await popout
            .evaluate(
              () =>
                app.plugins.plugins["interleaf"].settings.address
            )
            .catch(() => "?");
          log(`popout is up (vault address: ${addr})`);
        }
        if (!popout) {
          const err = await p
            .evaluate(
              () => app.plugins.plugins["interleaf"].lastPopoutError
            )
            .catch(() => null);
          log(`popout attempt ${i + 1} failed${err ? ` — ${err}` : " (no error recorded)"}`);
          await sleep(1500);
        }
      }
      if (!popout) throw new Error("popout window never appeared");
      await popout.waitForSelector(".messenger-back, .messenger-conv", { timeout: 8000 });
      const back = await popout.$(".messenger-back");
      if (back) await back.click();
      await popout.click('.messenger-conv[data-addr="bob"]');
      await popout.waitForSelector(".messenger-thread", { timeout: 5000 });
      await popout.screenshot({ path: path.join(ART, "chat-view-7-popout.png") });
    });
  });

  log("CHAT VIEW CHECK PASSED ✅");
} catch (err) {
  log(`CHAT VIEW CHECK FAILED ❌ ${err.message.split("\n")[0]}`);
  for (const [label, vault] of [["alice", ALICE], ["bob", BOB]]) {
    await usePage(vault)
      .then((p) => p.screenshot({ path: path.join(ART, `chat-view-fail-${label}.png`) }))
      .catch(() => {});
  }
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  killObsidian();
}
