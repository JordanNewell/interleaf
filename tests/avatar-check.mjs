/**
 * Source-level check for src/appearance/avatar.ts — plain regex assertions,
 * no framework:
 *   (a) the image-extension list covers all 7 supported formats,
 *   (b) paintAvatar handles both the no-override (generated) path and the
 *       PFP-override path,
 *   (c) the fallback gradient is built from two distinct interpolated hues.
 */
import fs from "node:fs";

const src = fs.readFileSync(
  new URL("../src/appearance/avatar.ts", import.meta.url),
  "utf8"
);

let failed = 0;
const check = (name, ok) => {
  if (ok) console.log(`ok   ${name}`);
  else {
    failed++;
    console.error(`FAIL ${name}`);
  }
};

// (a) extension coverage
const listMatch = src.match(/IMAGE_EXTENSIONS\s*=\s*\[([^\]]*)\]/);
check("IMAGE_EXTENSIONS array found", !!listMatch);
if (listMatch) {
  const listed = listMatch[1]
    .split(",")
    .map((s) => s.trim().replace(/^["'`]|["'`]$/g, ""))
    .filter(Boolean);
  for (const ext of ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"]) {
    check(`extension "${ext}" covered`, listed.includes(ext));
  }
  check("exactly the 7 expected extensions", listed.length === 7);
}

// (b) both paintAvatar branches
check("paintAvatar exported", /export function paintAvatar\(/.test(src));
check(
  "override read defensively from settings",
  src.includes(".avatars ?? {}")
);
check("override resolves a vault resource", src.includes("getResourcePath"));
check(
  "override renders an img.messenger-avatar-img",
  /createEl\("img"[\s\S]*?messenger-avatar-img/.test(src)
);
check(
  "img is a11y-invisible (alt + aria-hidden)",
  src.includes('alt: ""') && src.includes('"aria-hidden": "true"')
);
check(
  "no-override path falls back to generated initials",
  src.includes("is-generated") && src.includes("initials(address)")
);

// (c) two distinct hsl stops in the gradient template
check(
  "gradient template has two interpolated hue stops",
  /linear-gradient\([^)]*hsl\(\$\{h1\}[^)]*\)[^)]*hsl\(\$\{h2\}/.test(src)
);
check("second hue offset from the first", /const h2 = \(h1 \+ \d+/.test(src));

if (failed > 0) {
  console.error(`avatar-check: ${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("avatar-check: all assertions passed");
