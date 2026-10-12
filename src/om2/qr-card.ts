import { inviteQr, type InviteQr } from "./qr";
import type { ContactInvite } from "./invite";

/**
 * The DOM half of the invite QR (the matrix itself is pure — see qr.ts):
 * draw into a canvas for display, export a PNG for posting. Always black on
 * white regardless of theme — a themed QR is a scanner gamble, and the white
 * card reads as a shareable card, not a UI widget.
 */

/** Quiet zone: the white margin scanners require around the symbol (spec default). */
const QUIET_MODULES = 4;

function renderQr(qr: InviteQr, scale: number): HTMLCanvasElement {
  const modules = qr.size + QUIET_MODULES * 2;
  const canvas = document.createElement("canvas");
  canvas.width = modules * scale;
  canvas.height = modules * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) {
        ctx.fillRect(
          (x + QUIET_MODULES) * scale,
          (y + QUIET_MODULES) * scale,
          scale,
          scale
        );
      }
    }
  }
  return canvas;
}

/** Draw the invite QR into an on-screen canvas, scaled to roughly 220 px. */
export function drawInviteQr(canvas: HTMLCanvasElement, invite: ContactInvite): void {
  const qr = inviteQr(invite);
  const drawn = renderQr(qr, Math.max(3, Math.floor(220 / (qr.size + QUIET_MODULES * 2))));
  canvas.width = drawn.width;
  canvas.height = drawn.height;
  canvas.getContext("2d")?.drawImage(drawn, 0, 0);
}

/** PNG bytes of the invite QR at post/print scale (12 px per module). */
export async function inviteQrPng(invite: ContactInvite): Promise<ArrayBuffer> {
  const canvas = renderQr(inviteQr(invite), 12);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not encode the QR as PNG");
  return blob.arrayBuffer();
}
