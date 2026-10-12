/**
 * Synthesized notification sounds — no audio assets. WebAudio needs a prior
 * user gesture to unlock; if the context is still suspended we stay silent
 * rather than throw (messages keep arriving either way).
 */

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

function blip(
  c: AudioContext,
  freq: number,
  delaySec: number,
  durSec: number,
  peak: number
): void {
  const t0 = c.currentTime + delaySec;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durSec + 0.05);
}

function withContext(fn: (c: AudioContext) => void): void {
  const c = context();
  if (!c || c.state !== "running") {
    void c?.resume().then(() => {
      if (c.state === "running") fn(c);
    });
    return;
  }
  fn(c);
}

/** Two-tone ding for incoming mail. */
export function playReceiveSound(): void {
  withContext((c) => {
    blip(c, 880, 0, 0.14, 0.07);
    blip(c, 1244.5, 0.09, 0.18, 0.06);
  });
}

/** Soft tick for a message sent from the composer. */
export function playSendSound(): void {
  withContext((c) => {
    blip(c, 660, 0, 0.07, 0.04);
  });
}
