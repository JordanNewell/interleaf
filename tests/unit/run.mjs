/**
 * Portable unit tests for Interleaf.
 *
 * The plugin's own modules are clean TypeScript that only touches "obsidian"
 * at a few seams — so the suite bundles tests/unit/suite.ts with esbuild,
 * aliasing the obsidian package to a two-symbol stub, then imports the
 * bundle. node:test registers and runs everything; exit code reports pass/fail.
 *
 * Runs anywhere node ≥ 18 runs: no Obsidian install, no vault, no display.
 * The heavyweight CDP e2e checks (tests/*-check.mjs, tests/e2e-two-user.mjs)
 * stay separate because they need a real Obsidian.
 *
 * Run: npm run test:unit
 */
import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = path.join(ROOT, "test-artifacts", "unit-bundle.mjs");

fs.mkdirSync(path.dirname(OUT), { recursive: true });

// The plugin targets Obsidian, where `window` is the global; the node suite
// aliases it so modules that say `window.crypto` / `window.setTimeout` run
// unmodified under plain node.
if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}

await esbuild.build({
  entryPoints: [path.join(ROOT, "tests", "unit", "suite.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  // ESM output has no require(); CJS deps that probe for node:crypto
  // (tweetnacl's randombytes) get one via createRequire.
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  outfile: OUT,
  alias: { obsidian: path.join(ROOT, "tests", "unit", "obsidian-stub.ts") },
  logLevel: "warning",
});

await import(pathToFileURL(OUT).href);
