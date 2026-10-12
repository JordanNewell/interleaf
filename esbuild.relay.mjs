import * as esbuild from "esbuild";

/**
 * Builds the self-hosted OM-2 relay (relay/main.ts → tools/relay.cjs).
 * Platform node, separate from the plugin bundle — the relay never ships
 * inside main.js.
 */

await esbuild.build({
  entryPoints: ["relay/main.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  outfile: "tools/relay.cjs",
  sourcemap: "inline",
  logLevel: "info",
});
