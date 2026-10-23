// Hero background: a halftone dot field. Dot size follows a slow interference pattern,
// a ripple follows the pointer, and colour drifts across the palette from left to right.
const PALETTE: [number, number, number][] = [[142, 230, 209], [159, 182, 255], [232, 163, 201], [244, 197, 143]];

function tint(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(0.999, t)) * (PALETTE.length - 1), i = Math.floor(x), f = x - i;
  const a = PALETTE[i], b = PALETTE[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

export function initField(reduce: boolean) {
  const cv = document.getElementById('field') as HTMLCanvasElement | null;
  const ctx = cv?.getContext('2d');
  if (!cv || !ctx) return;

  const GAP = 14, BUCKETS = 10;
  let W = 0, H = 0, cols = 0, rows = 0, on = true;
  let mx = -1e4, my = -1e4, sx = -1e4, sy = -1e4;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / GAP) + 1; rows = Math.ceil(H / GAP) + 1;
  };

  const draw = (t: number) => {
    sx += (mx - sx) * 0.08; sy += (my - sy) * 0.08;
    ctx.clearRect(0, 0, W, H);
    // bucket by intensity so each fill colour is set once per frame
    const buckets: number[][] = Array.from({ length: BUCKETS }, () => []);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const px = x * GAP, py = y * GAP;
      let n = (Math.sin(x * 0.11 + t * 0.5) + Math.sin(y * 0.19 - t * 0.35) + Math.sin((x * 0.6 + y) * 0.08 + t * 0.25)) / 6 + 0.5;
      n = n ** 2.2 * 0.7;
      const d = Math.hypot(px - sx, py - sy) / 180;
      n += Math.exp(-d * d) * (0.6 + 0.4 * Math.sin(d * 10 - t * 4.5)) * 0.75;
      if (n < 0.08) continue;
      buckets[Math.min(BUCKETS - 1, Math.floor(n * BUCKETS))].push(px, py);
    }
    buckets.forEach((pts, b) => {
      if (!pts.length) return;
      const level = (b + 0.5) / BUCKETS, r = 0.5 + level * 2.6;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) { ctx.moveTo(pts[i] + r, pts[i + 1]); ctx.arc(pts[i], pts[i + 1], r, 0, 6.2832); }
      // colour by bucket position is cheap; a horizontal gradient carries the palette drift
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      [0, 0.33, 0.66, 1].forEach((s) => { const [cr, cg, cb] = tint(s + Math.sin(t * 0.1) * 0.1); grad.addColorStop(s, `rgba(${cr | 0},${cg | 0},${cb | 0},${(0.05 + level * 0.5).toFixed(3)})`); });
      ctx.fillStyle = grad;
      ctx.fill();
    });
  };

  resize();
  addEventListener('resize', resize);
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
