// A soft synthesized "tick" on press for buttons and other controls. No audio files;
// the AudioContext is created on the first press, so nothing plays before the user interacts.
let ctx: AudioContext | null = null;

function tick() {
  ctx ??= new AudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1900, t);
  osc.frequency.exponentialRampToValueAtTime(520, t + 0.035);
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.07);
}

export function initClick() {
  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const el = (e.target as Element).closest('.btn, .kbd, .tab, summary, [role="option"], #toTop');
    if (!el) return;
    try { tick(); } catch { /* audio unavailable */ }
  });
}
