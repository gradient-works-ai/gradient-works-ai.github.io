// Hero background: a drifting ASCII interference field with a ripple that follows the pointer.
export function initField(reduce: boolean) {
  const cv = document.getElementById('field') as HTMLCanvasElement | null;
  const ctx = cv?.getContext('2d');
  if (!cv || !ctx) return;

  const ramp = ' .·:-=+*#%@', CW = 13, CH = 22, BUCKETS = 8;
  let W = 0, H = 0, cols = 0, rows = 0, on = true;
  let mx = -1e4, my = -1e4, sx = -1e4, sy = -1e4;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '12px "Geist Mono Variable", monospace';
    ctx.textBaseline = 'top';
    cols = Math.ceil(W / CW); rows = Math.ceil(H / CH);
  };

  const draw = (t: number) => {
    sx += (mx - sx) * 0.08; sy += (my - sy) * 0.08;
    ctx.clearRect(0, 0, W, H);
    const buckets: [string, number, number][][] = Array.from({ length: BUCKETS }, () => []);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const px = x * CW, py = y * CH;
      let n = (Math.sin(x * 0.09 + t * 0.6) + Math.sin(y * 0.17 - t * 0.4) + Math.sin((x * 0.5 + y) * 0.07 + t * 0.3)) / 6 + 0.5;
      n *= 0.55;
      const d = Math.hypot(px - sx, py - sy) / 170;
      const ripple = Math.exp(-d * d) * (0.65 + 0.35 * Math.sin(d * 9 - t * 5));
      n += ripple * 0.65;
      if (n < 0.24) continue;
      const ch = ramp[Math.min(ramp.length - 1, Math.floor(n * ramp.length))];
      buckets[Math.min(BUCKETS - 1, Math.floor(n * BUCKETS))].push([ch, px, py]);
    }
    buckets.forEach((cells, b) => {
      if (!cells.length) return;
      ctx.fillStyle = `rgba(243,241,236,${(0.06 + (b / BUCKETS) ** 2 * 0.6).toFixed(3)})`;
      for (const [ch, px, py] of cells) ctx.fillText(ch, px, py);
    });
  };

  resize();
  addEventListener('resize', resize);
  document.fonts?.ready.then(resize);
  addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(cv);

  if (reduce) { draw(0); return; }
  let last = 0;
  const loop = (now: number) => {
    if (on && now - last > 42) { last = now; draw(now / 1000); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
