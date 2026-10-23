// Founder portrait as a halftone dot field. Uses /founder.jpg if it exists, otherwise the initials.
// Dot size follows the image's brightness, colour follows the site palette, and a ripple follows the pointer.
const PALETTE: [number, number, number][] = [[142, 230, 209], [159, 182, 255], [232, 163, 201], [244, 197, 143]];
const tint = (t: number) => {
  const x = Math.max(0, Math.min(0.999, t)) * (PALETTE.length - 1), i = Math.floor(x), f = x - i, a = PALETTE[i], b = PALETTE[i + 1];
  return `${(a[0] + (b[0] - a[0]) * f) | 0},${(a[1] + (b[1] - a[1]) * f) | 0},${(a[2] + (b[2] - a[2]) * f) | 0}`;
};

function initialsSource(text: string, size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d')!;
  x.fillStyle = '#000'; x.fillRect(0, 0, size, size);
  const g = x.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.55);
  g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  x.fillStyle = '#fff';
  x.font = `600 ${size * 0.5}px "Geist Variable", system-ui, sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, size / 2, size / 2 + size * 0.02);
  return c;
}

export function initPortrait(reduce: boolean) {
  const cv = document.getElementById('portrait') as HTMLCanvasElement | null;
  const ctx = cv?.getContext('2d');
  if (!cv || !ctx) return;
  const COLS = 46;
  let lum: Float32Array | null = null, W = 0, H = 0, gap = 0, on = true;
  let mx = -1e4, my = -1e4;

  const sample = (src: CanvasImageSource, sw: number, sh: number) => {
    const s = document.createElement('canvas');
    s.width = COLS; s.height = COLS;
    const x = s.getContext('2d', { willReadFrequently: true })!;
    const side = Math.min(sw, sh);   // centre-crop to a square
    x.drawImage(src, (sw - side) / 2, (sh - side) / 2, side, side, 0, 0, COLS, COLS);
    const d = x.getImageData(0, 0, COLS, COLS).data;
    lum = new Float32Array(COLS * COLS);
    for (let i = 0; i < lum.length; i++) lum[i] = ((0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255) * (d[i * 4 + 3] / 255);   // transparent = dark
  };

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = H = cv.clientWidth;
    cv.width = cv.height = W * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gap = W / COLS;
  };

  const draw = (t: number) => {
    if (!lum) return;
    ctx.clearRect(0, 0, W, H);
    for (let y = 0; y < COLS; y++) for (let x = 0; x < COLS; x++) {
      const cx = (x + 0.5) * gap, cy = (y + 0.5) * gap;
      const d = Math.hypot(cx - mx, cy - my) / (W * 0.22);
      const ripple = Math.exp(-d * d) * (0.5 + 0.5 * Math.sin(d * 8 - t * 4)) * 0.35;
      const v = Math.min(1, lum[y * COLS + x] ** 1.5 * (0.92 + 0.08 * Math.sin(t * 1.2 + x * 0.3 + y * 0.2)) + ripple);
      if (v < 0.05) continue;
      const r = gap * 0.48 * (0.18 + 0.82 * v);
      ctx.fillStyle = `rgba(${tint((x + y) / (COLS * 2) + Math.sin(t * 0.15) * 0.08)},${(0.25 + v * 0.75).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
    }
  };

  resize();
  new ResizeObserver(resize).observe(cv);
  cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  cv.addEventListener('pointerleave', () => { mx = my = -1e4; });
  new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(cv);

  const fallback = () => document.fonts.ready.then(() => { const c = initialsSource(cv.dataset.initials ?? '', 400); sample(c, 400, 400); if (reduce) draw(0); });
  const img = new Image();
  img.onload = () => { sample(img, img.naturalWidth, img.naturalHeight); if (reduce) draw(0); };
  img.onerror = fallback;
  img.src = cv.dataset.src ?? '';

  if (reduce) return;
  let last = 0;
  const loop = (now: number) => {
    if (on && now - last > 33) { last = now; draw(now / 1000); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
