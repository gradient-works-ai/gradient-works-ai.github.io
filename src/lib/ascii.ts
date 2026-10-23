// ASCII figures, drawn to <canvas> on an exact character grid.
// Each figure has two layers: text glyphs (labels, frames, blocks) and a 2×4-per-cell dot matrix
// (braille resolution) for smooth curves and point clouds. Dots are painted as circles, not braille
// glyphs, so they look identical in every browser. Highlighted strokes get a soft glow pass.

// A style is `base + 10 * level`: base picks the colour, level dims it (0 = full strength).
const BASE: [number, number, number, number][] = [
  [243, 241, 236, 0.42], // 0 dim text
  [243, 241, 236, 1],    // 1 bright
  [243, 241, 236, 0.2],  // 2 faint
  [244, 197, 143, 1],    // 3 peach
  [232, 163, 201, 1],    // 4 rose
  [159, 182, 255, 1],    // 5 periwinkle
  [142, 230, 209, 1],    // 6 mint
];
const LEVEL = [1, 0.7, 0.45, 0.22];
const DIM = 0, BRIGHT = 1, FAINT = 2, PEACH = 3, ROSE = 4, PERI = 5, MINT = 6;
const lv = (base: number, level: number) => base + 10 * level;
const rgba = (s: number) => { const [r, g, b, a] = BASE[s % 10]; return `rgba(${r},${g},${b},${a * LEVEL[Math.floor(s / 10)]})`; };
const glows = (s: number) => s < 10 && s !== DIM && s !== FAINT;
const FONT = '"Geist Mono Variable", ui-monospace, monospace';
// Block and shade glyphs are painted as rectangles so they tile without the font's side bearings.
const BLOCK: Record<string, [number, number]> = {   // [width fraction, alpha]
  '█': [1, 1], '▉': [7 / 8, 1], '▊': [6 / 8, 1], '▋': [5 / 8, 1], '▌': [4 / 8, 1], '▍': [3 / 8, 1], '▎': [2 / 8, 1], '▏': [1 / 8, 1],
  '▓': [1, 0.7], '▒': [1, 0.42], '░': [1, 0.2],
};

class Grid {
  ch: string[][]; st: number[][]; dots: Int16Array;
  constructor(public c: number, public r: number) {
    this.ch = Array.from({ length: r }, () => Array<string>(c).fill(' '));
    this.st = Array.from({ length: r }, () => Array<number>(c).fill(DIM));
    this.dots = new Int16Array(c * 2 * r * 4).fill(-1);
  }
  get w() { return this.c * 2; }
  get h() { return this.r * 4; }
  put(x: number, y: number, s: string, style = DIM) {
    x = Math.round(x); y = Math.round(y);
    if (y < 0 || y >= this.r) return;
    [...s].forEach((ch, i) => { const cx = x + i; if (cx >= 0 && cx < this.c) { this.ch[y][cx] = ch; this.st[y][cx] = style; } });
  }
  dot(x: number, y: number, style = DIM) {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.dots[y * this.w + x] = style;
  }
  line(x0: number, y0: number, x1: number, y1: number, style = DIM) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let k = 0; k <= n; k++) this.dot(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, style);
  }
  box(x: number, y: number, w: number, h: number, style = FAINT) {
    this.put(x, y, '╭' + '─'.repeat(w - 2) + '╮', style);
    for (let j = 1; j < h - 1; j++) { this.put(x, y + j, '│', style); this.put(x + w - 1, y + j, '│', style); }
    this.put(x, y + h - 1, '╰' + '─'.repeat(w - 2) + '╯', style);
  }
}

// Smooth horizontal bar using eighth blocks, with a colour ramp along its length.
const EIGHTHS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'];
function bar(g: Grid, x: number, y: number, width: number, frac: number, ramp = [PEACH, ROSE, PERI]) {
  const cells = Math.max(0, Math.min(1, frac)) * width, full = Math.floor(cells), rest = Math.floor((cells - full) * 8);   // 0–7
  for (let i = 0; i < width; i++) {
    const col = ramp[Math.min(ramp.length - 1, Math.floor((i / width) * ramp.length))];
    if (i < full) g.put(x + i, y, '█', col);
    else if (i === full && rest) g.put(x + i, y, EIGHTHS[rest], col);
    else g.put(x + i, y, '·', FAINT);
  }
}

type Fig = {
  el: HTMLCanvasElement; C: number; R: number; draw: (t: number) => Grid; active: () => boolean;
  ctx: CanvasRenderingContext2D; glow: HTMLCanvasElement; cw: number; fs: number; dpr: number;
};

function paint(f: Fig, g: Grid) {
  const { ctx, cw, fs, dpr } = f, chh = cw * 2, W = f.el.width, H = f.el.height;
  const gctx = f.glow.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  gctx.setTransform(1, 0, 0, 1, 0, 0); gctx.clearRect(0, 0, W, H);
  for (const c of [ctx, gctx]) { c.setTransform(dpr, 0, 0, dpr, 0, 0); c.font = `${fs}px ${FONT}`; c.textBaseline = 'middle'; }

  // bucket everything by style so each colour is set once
  const text = new Map<number, [string, number, number][]>();
  for (let y = 0; y < g.r; y++) for (let x = 0; x < g.c; x++) {
    const ch = g.ch[y][x];
    if (ch === ' ') continue;
    const s = g.st[y][x];
    (text.get(s) ?? text.set(s, []).get(s)!).push([ch, x * cw, y * chh + chh / 2]);
  }
  const dots = new Map<number, number[]>();
  const dw = cw / 2, dh = chh / 4, rad = Math.min(dw, dh) * 0.34;
  for (let i = 0; i < g.dots.length; i++) {
    const s = g.dots[i];
    if (s < 0) continue;
    (dots.get(s) ?? dots.set(s, []).get(s)!).push(i);
  }

  const draw = (c: CanvasRenderingContext2D, onlyGlow: boolean) => {
    for (const [s, list] of text) {
      if (onlyGlow && !glows(s)) continue;
      c.fillStyle = rgba(s);
      for (const [ch, x, y] of list) {
        const blk = BLOCK[ch];
        if (!blk) { c.fillText(ch, x, y); continue; }
        // snap to device pixels so neighbouring translucent blocks neither overlap nor gap
        const snap = (v: number) => Math.round(v * dpr) / dpr;
        const x0 = snap(x), x1 = snap(x + cw * blk[0]), y0 = snap(y - chh / 2), y1 = snap(y + chh / 2);
        c.globalAlpha = blk[1];
        c.fillRect(x0, y0, x1 - x0, y1 - y0);
        c.globalAlpha = 1;
      }
    }
    for (const [s, list] of dots) {
      if (onlyGlow && !glows(s)) continue;
      c.fillStyle = rgba(s);
      c.beginPath();
      for (const i of list) {
        const x = (i % g.w) * dw + dw / 2, y = Math.floor(i / g.w) * dh + dh / 2;
        c.moveTo(x + rad, y); c.arc(x, y, rad, 0, 6.2832);
      }
      c.fill();
    }
  };

  draw(gctx, true);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.9;
  ctx.filter = `blur(${Math.max(2, fs * 0.5) * dpr}px)`;
  ctx.drawImage(f.glow, 0, 0);
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(ctx, false);
}

// Size a figure so its columns fill the container's width (data-fill="height" also caps by height).
function fit(f: Fig) {
  const box = f.el.parentElement;
  if (!box) return;
  const cs = getComputedStyle(box);
  const w = (box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) * Number(f.el.dataset.fit ?? 1);
  let cw = Math.min(Number(f.el.dataset.max ?? 14) * 0.6, w / f.C);
  if (f.el.dataset.fill === 'height') {
    const h = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (h > 0) cw = Math.min(cw, h / (f.R * 2));
  }
  f.cw = cw; f.fs = cw / 0.6; f.dpr = Math.min(devicePixelRatio || 1, 2);
  const W = f.C * cw, H = f.R * cw * 2;
  f.el.style.width = `${W}px`; f.el.style.height = `${H}px`;
  for (const c of [f.el, f.glow]) { c.width = Math.round(W * f.dpr); c.height = Math.round(H * f.dpr); }
}

const onSlide = (el: HTMLElement) => () => !!el.closest('.slide')?.classList.contains('on');

// Shared non-convex loss surface.
export const loss = (x: number, y: number) =>
  0.08 * (x * x + y * y)
  - 1.3 * Math.exp(-((x - 1.4) ** 2 + (y - 0.4) ** 2) / 0.9)
  - 0.9 * Math.exp(-((x + 1.3) ** 2 + (y + 1.1) ** 2) / 0.7)
  + 0.25 * Math.sin(1.6 * x) * Math.cos(1.4 * y);
export const lossGrad = (x: number, y: number, h = 1e-3): [number, number] =>
  [(loss(x + h, y) - loss(x - h, y)) / (2 * h), (loss(x, y + h) - loss(x, y - h)) / (2 * h)];

export function initAscii(reduce: boolean) {
  const figs: Fig[] = [];
  const visible = new Set<Element>();
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))));
  const ro = new ResizeObserver((es) => es.forEach((e) => { const f = figs.find((x) => x.el.parentElement === e.target); if (f) { fit(f); if (reduce) paint(f, f.draw(30)); } }));
  const add = (id: string, C: number, R: number, make: (el: HTMLCanvasElement) => { draw: (t: number) => Grid; active?: () => boolean }) => {
    const el = document.getElementById(id) as HTMLCanvasElement | null;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const m = make(el);
    const f: Fig = { el, C, R, draw: m.draw, active: m.active ?? (() => true), ctx, glow: document.createElement('canvas'), cw: 0, fs: 0, dpr: 1 };
    fit(f);
    figs.push(f);
    io.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
  };

  // ── EEG traces ─────────────────────────────────────────────────────────────
  add('aEeg', 92, 28, (el) => {
    const names = ['Fp1', 'Fp2', 'C3', 'C4', 'P3', 'O1'], HI = 2;
    const seeds = names.map(() => [Math.random() * 6, 0.7 + Math.random() * 0.8, Math.random() * 6]);
    const sig = (u: number, c: number) => {
      const [p, f, q] = seeds[c];
      const spike = Math.exp(-((((u + c * 1.7) % 9) - 4.5) ** 2) * 6);
      return Math.sin(u * 2.1 * f + p) * 0.5 + Math.sin(u * 5.3 + q) * 0.22 + spike * Math.sin(u * 30) * 1.05;
    };
    return {
      active: onSlide(el),
      draw(t) {
        const g = new Grid(92, 28);
        const spiking = Math.floor(t / 4) % 2 === 0;
        g.put(2, 1, 'EEG', BRIGHT); g.put(6, 1, '· 6 CH · 256 HZ · BANDPASS 1–40', DIM);
        g.put(70, 1, 'CLASS', DIM); g.put(76, 1, spiking ? '▲ SPIKE  0.94' : '● NORMAL 0.97', spiking ? ROSE : MINT);
        for (let x = 14; x < 92; x += 12) for (let y = 3; y < 23; y += 2) g.put(x, y, '┊', lv(FAINT, 1));
        names.forEach((n, c) => {
          const y0 = 4 * (3.6 + c * 3.2), hi = c === HI;
          g.put(2, Math.round(y0 / 4), n, hi ? PERI : DIM);
          let px = 0, py = 0;
          for (let x = 14; x < g.w - 2; x++) {
            const y = y0 + sig((x / g.w) * 9 + t * 0.9, c) * 4.2;
            if (x > 14) g.line(px, py, x, y, hi ? PERI : lv(DIM, 1));
            px = x; py = y;
          }
        });
        ['0s', '1s', '2s', '3s', '4s', '5s', '6s'].forEach((s, i) => g.put(14 + i * 12, 23, s, FAINT));
        return g;
      },
    };
  });

  // ── Confusion matrix + ROC curve ───────────────────────────────────────────
  add('aEval', 92, 28, (el) => {
    const labels = ['ok', 'dent', 'tear', 'wet'];
    const M = [[0.92, 0.05, 0.02, 0.01], [0.06, 0.86, 0.06, 0.02], [0.03, 0.08, 0.84, 0.05], [0.01, 0.02, 0.07, 0.9]];
    const roc = (x: number) => 1 - Math.pow(1 - x, 6.5);
    let t0: number | null = null;
    const isOn = onSlide(el);
    return {
      active: () => { const on = isOn(); if (!on) t0 = null; return on; },
      draw(t) {
        t0 ??= t;
        const k = (t - t0) * 6, g = new Grid(92, 28);
        g.put(3, 0, 'CONFUSION MATRIX', BRIGHT); g.put(20, 0, '· held-out · n=1,204', DIM);
        g.put(54, 0, 'ROC', BRIGHT); g.put(58, 0, '· AUC', DIM); g.put(64, 0, '0.94', ROSE);
        const X = 9, Y = 3, CW = 9, CH = 4;
        labels.forEach((n, i) => { g.put(3, Y + 2 + i * CH, n.padStart(4), DIM); g.put(X + 2 + i * CW, Y - 1, n, DIM); });
        // frame
        for (let r = 0; r <= 4; r++) {
          const y = Y + r * CH, L = r === 0 ? '╭' : r === 4 ? '╰' : '├', Rr = r === 0 ? '╮' : r === 4 ? '╯' : '┤', J = r === 0 ? '┬' : r === 4 ? '┴' : '┼';
          g.put(X, y, L + Array.from({ length: 4 }, () => '─'.repeat(CW - 1)).join(J) + Rr, FAINT);
          if (r < 4) for (let j = 1; j < CH; j++) for (let c = 0; c <= 4; c++) g.put(X + c * CW, y + j, '│', FAINT);
        }
        M.forEach((row, r) => row.forEach((v, c) => {
          if (r * 4 + c >= k) return;
          const x = X + 1 + c * CW, y = Y + 1 + r * CH, diag = r === c;
          const shade = v > 0.8 ? '█' : v > 0.05 ? '▒' : v > 0.015 ? '░' : ' ';
          const col = diag ? lv(PERI, v > 0.88 ? 0 : 1) : lv(ROSE, 3);
          for (let j = 0; j < CH - 1; j++) g.put(x, y + j, shade.repeat(CW - 1), col);
          g.put(x + 2, y + 1, v.toFixed(2), diag ? BRIGHT : DIM);
        }));
        // ROC axes + curve
        const ox = 54 * 2, oy = 17 * 4, W = 34 * 2, H = 14 * 4;
        g.put(50, 3, '1.0', FAINT); g.put(52, 17, '0', FAINT); g.put(87, 18, '1.0', FAINT); g.put(66, 18, 'FALSE POSITIVE RATE', FAINT);
        g.line(ox, oy, ox, oy - H, FAINT); g.line(ox, oy, ox + W, oy, FAINT);
        for (let x = 0; x <= W; x += 3) g.dot(ox + x, oy - (x / W) * H, lv(DIM, 2));
        const drawn = Math.min(W, Math.max(0, (k - 10) * 7));
        let px = ox, py = oy;
        for (let x = 1; x <= drawn; x++) {
          const y = oy - roc(x / W) * H;
          for (let yy = y + 3; yy < oy; yy += 3) if (x % 3 === 0) g.dot(ox + x, yy, lv(ROSE, 3));   // area under the curve
          g.line(px, py, ox + x, y, ROSE);
          px = ox + x; py = y;
        }
        return g;
      },
    };
  });

  // ── Conveyor detection ─────────────────────────────────────────────────────
  add('aVision', 92, 28, (el) => {
    const belt = 16;
    const boxes = [{ w: 16, h: 5, tag: 'OK' }, { w: 12, h: 4, tag: 'DENT' }, { w: 18, h: 6, tag: 'OK' }, { w: 14, h: 4, tag: 'TEAR' }];
    return {
      active: onSlide(el),
      draw(t) {
        const g = new Grid(92, 28), shift = (t * 9) % 130, cx = 46;
        g.put(3, 0, 'CAM 02', BRIGHT); g.put(10, 0, '· 30 FPS · YOLOv8n · 640×640', DIM);
        g.put(75, 0, 'LATENCY', DIM); g.put(83, 0, '11 MS', MINT);
        g.put(0, belt, '━'.repeat(92), lv(DIM, 1));
        for (let x = 0; x < 90; x += 6) g.put((((x - Math.floor(shift)) % 90) + 90) % 90, belt + 1, '◦', FAINT);
        // scan beam: a soft vertical column of dots
        for (let y = 8; y < belt * 4; y++) g.dot(cx * 2, y, lv(MINT, y % 4 === 0 ? 2 : 3));
        let pos = 100 - shift;
        boxes.forEach((b) => {
          const x = Math.round(pos), y = belt - b.h, bad = b.tag !== 'OK';
          g.box(x, y, b.w, b.h, DIM);
          g.put(x + 2, y + 1, '▌▍▎▌▏▍', lv(DIM, 1));
          if (bad) g.put(x + b.w - 4, y + 1, '✕', ROSE);
          const off = Math.abs(x + b.w / 2 - cx);
          if (off < 17) {
            const col = bad ? ROSE : MINT, conf = (bad ? 0.88 : 0.97) - off * 0.004;
            g.put(x - 2, y - 2, '┏━', col); g.put(x + b.w, y - 2, '━┓', col);
            g.put(x - 2, belt - 0, '┗━', col); g.put(x + b.w, belt, '━┛', col);
            g.put(x - 2, y - 3, `■ ${bad ? b.tag : 'PACKAGE'} ${conf.toFixed(2)}`, col);
          }
          pos += b.w + 16;
        });
        return g;
      },
    };
  });

  // ── Rotating loss landscape (point cloud) with momentum SGD ────────────────
  add('aLand', 84, 34, () => {
    const C = 84, R = 34, stat = document.getElementById('landStat');
    // the surface is static, so heights, shading and colour are computed once
    const pts: { x: number; y: number; h: number; s: number }[] = [];
    const L = [-0.45, -0.55, 0.7], Ln = Math.hypot(...L);
    let hmin = Infinity, hmax = -Infinity;
    for (let x = -3; x <= 3; x += 0.05) for (let y = -3; y <= 3; y += 0.05) {
      if (x * x + y * y > 9) continue;
      const h = loss(x, y); hmin = Math.min(hmin, h); hmax = Math.max(hmax, h);
      pts.push({ x, y, h, s: 0 });
    }
    for (const p of pts) {
      const [fx, fy] = lossGrad(p.x, p.y), n = [-fx * 1.5, -fy * 1.5, 1], nn = Math.hypot(...n);
      const lum = Math.max(0, (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / (nn * Ln));
      const hn = (p.h - hmin) / (hmax - hmin);
      const base = hn < 0.22 ? MINT : hn < 0.5 ? PERI : hn < 0.75 ? ROSE : PEACH;
      const band = Math.abs((((p.h * 4) % 1) + 1) % 1 - 0.5) > 0.44;     // contour every 0.25 loss
      p.s = lv(base, band ? 0 : lum > 0.8 ? 1 : lum > 0.55 ? 2 : 3);
    }
    let ball = { x: 0, y: 0, vx: 0, vy: 0, n: 0, trail: [] as [number, number][] }, steps = 0;
    const spawn = () => { ball = { x: (Math.random() - 0.5) * 4.6, y: (Math.random() - 0.5) * 4.6, vx: 0, vy: 0, n: 0, trail: [] }; };
    spawn();
    return {
      draw(t) {
        const g = new Grid(C, R), W = g.w, H = g.h, zb = new Float32Array(W * H).fill(-1e9);
        const A = t * 0.2, B = 0.95, cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B), k = W / 7.4;
        const proj = (x: number, y: number, h: number) => {
          const xr = x * cA - y * sA, yr = x * sA + y * cA;
          return [W / 2 + xr * k, H / 2 + 4 + (-yr * sB - h * 1.5 * cB) * k, -yr * cB + h * 1.5 * sB];
        };
        for (const p of pts) {
          const [sx, sy, d] = proj(p.x, p.y, p.h), px = Math.round(sx), py = Math.round(sy);
          if (px < 0 || px >= W || py < 0 || py >= H) continue;
          const i = py * W + px;
          if (d <= zb[i]) continue;
          zb[i] = d; g.dots[i] = p.s;
        }
        if (!reduce) {
          const [gx, gy] = lossGrad(ball.x, ball.y);
          ball.vx = 0.9 * ball.vx - 0.02 * gx; ball.vy = 0.9 * ball.vy - 0.02 * gy;
          ball.x += ball.vx; ball.y += ball.vy;
          ball.trail.push([ball.x, ball.y]); if (ball.trail.length > 46) ball.trail.shift();
          steps++; if (++ball.n > 280) spawn();
        }
        ball.trail.forEach(([x, y], i) => {
          const [sx, sy] = proj(x, y, loss(x, y) + 0.08), last = i === ball.trail.length - 1;
          const lvl = last ? 0 : i > ball.trail.length * 0.6 ? 1 : 2;
          g.dot(sx, sy, lv(BRIGHT, lvl));
          if (last) { g.dot(sx + 1, sy, BRIGHT); g.dot(sx, sy + 1, BRIGHT); g.dot(sx + 1, sy + 1, BRIGHT); }
        });
        g.put(1, 0, 'L(θ)', BRIGHT); g.put(6, 0, '· non-convex · 2 minima', DIM);
        g.put(1, R - 1, '●', MINT); g.put(3, R - 1, 'low', FAINT); g.put(8, R - 1, '●', PERI); g.put(10, R - 1, '●', ROSE); g.put(12, R - 1, '●', PEACH); g.put(14, R - 1, 'high', FAINT);
        if (stat) stat.textContent = `step ${String(steps).padStart(4, '0')} · loss ${loss(ball.x, ball.y).toFixed(3)}`;
        return g;
      },
    };
  });

  // ── Electrode head map (NeuroDial) ─────────────────────────────────────────
  add('aHead', 64, 24, () => {
    const sites: [string, number, number][] = [['Fp1', -0.3, -0.84], ['Fp2', 0.3, -0.84], ['F7', -0.74, -0.44], ['F3', -0.36, -0.4], ['Fz', 0, -0.4], ['F4', 0.36, -0.4],
      ['F8', 0.74, -0.44], ['C3', -0.46, 0], ['Cz', 0, 0], ['C4', 0.46, 0], ['P3', -0.36, 0.42], ['Pz', 0, 0.42], ['P4', 0.36, 0.42], ['O1', -0.26, 0.82], ['O2', 0.26, 0.82]];
    return {
      draw(t) {
        const g = new Grid(64, 24), cx = g.w / 2, cy = g.h / 2 + 2, rx = 44, ry = 40;
        for (let a = 0; a < 6.2832; a += 0.012) g.dot(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, lv(DIM, 1));
        g.line(cx - 6, cy - ry + 1, cx, cy - ry - 6, lv(DIM, 1)); g.line(cx, cy - ry - 6, cx + 6, cy - ry + 1, lv(DIM, 1));   // nose
        for (let a = -0.9; a < 0.9; a += 0.06) { g.dot(cx - rx - 3 + Math.cos(a) * -3, cy + Math.sin(a) * 8, FAINT); g.dot(cx + rx + 3 + Math.cos(a) * 3, cy + Math.sin(a) * 8, FAINT); }
        const act = sites.map(([, x], i) => Math.sin(t * 2 + i * 0.9) * Math.sin(t * 0.7 + x * 3));
        // coherence links between co-active electrodes
        sites.forEach(([, x1, y1], i) => sites.forEach(([, x2, y2], j) => {
          if (j <= i || act[i] < 0.35 || act[j] < 0.35 || Math.hypot(x1 - x2, y1 - y2) > 0.6) return;
          g.line(cx + x1 * rx, cy + y1 * ry, cx + x2 * rx, cy + y2 * ry, lv(PERI, 2));
        }));
        sites.forEach(([n, x, y], i) => {
          const a = act[i], col = a > 0.55 ? PEACH : a > 0.2 ? PERI : lv(DIM, 1);
          const gx = Math.round((cx + x * rx) / 2), gy = Math.round((cy + y * ry) / 4);
          g.put(gx, gy, a > 0.2 ? '●' : '○', col);
          g.put(gx - 1, gy + 1, n, FAINT);
        });
        g.put(1, 0, 'NEURODIAL', BRIGHT); g.put(11, 0, '· 10–20 montage · α-band power', DIM);
        return g;
      },
    };
  });

  // ── Evaluation report bars (Eval Harness) ──────────────────────────────────
  add('aBars', 64, 22, () => {
    const rows: [string, number][] = [['accuracy', 0.91], ['macro-F1', 0.87], ['precision', 0.89], ['recall', 0.85], ['ECE ↓', 0.04], ['robust @σ=.1', 0.79], ['low-light', 0.71]];
    let t0: number | null = null;
    return {
      draw(t) {
        t0 ??= t;
        const g = new Grid(64, 22), p = Math.min(1, (t - t0) / 2.4), ease = 1 - (1 - p) ** 3;
        g.put(2, 1, '$', FAINT); g.put(4, 1, 'gw eval --report', BRIGHT);
        g.put(2, 3, '─'.repeat(60), FAINT);
        rows.forEach(([n, v], i) => {
          const y = 5 + i * 2;
          g.put(2, y, n, DIM);
          const col = n === 'ECE ↓' ? MINT : v >= 0.85 ? MINT : v >= 0.75 ? PERI : PEACH;   // colour encodes the score
          bar(g, 17, y, 32, v * ease, [col]);
          g.put(51, y, (v * ease).toFixed(2), BRIGHT);
          if (n === 'low-light' && p === 1) g.put(56, y, '▲ flag', PEACH);
        });
        g.put(2, 19, '─'.repeat(60), FAINT);
        g.put(2, 20, '7 metrics · 3 slices ·', DIM); g.put(25, 20, 'report.pdf', MINT); g.put(36, 20, 'written', DIM);
        return g;
      },
    };
  });

  // ── Training log for the "under the works" pages ───────────────────────────
  add('aBuild', 72, 26, (el) => {
    const EPOCHS = 120, model = el.dataset.model ?? 'model';
    const noise = Array.from({ length: EPOCHS }, () => Math.random() - 0.5);
    const train = (e: number) => 0.18 + 1.05 * Math.exp(-e / 26) + noise[e] * 0.03;
    const val = (e: number) => 0.27 + 0.95 * Math.exp(-e / 30) + Math.max(0, e - 85) * 0.0018 + noise[(e * 7) % EPOCHS] * 0.05;
    return {
      draw(t) {
        const g = new Grid(72, 26), e = Math.floor((t * 7) % (EPOCHS + 20)), done = Math.min(e, EPOCHS - 1);
        const ox = 7 * 2, oy = 16 * 4, W = 62 * 2, H = 13 * 4, yOf = (v: number) => oy - Math.min(1, v / 1.3) * H;
        g.put(1, 0, '$', FAINT); g.put(3, 0, `gw train --model ${model} --epochs ${EPOCHS}`, BRIGHT);
        g.put(1, 3, '1.3', FAINT); g.put(1, 9, '.65', FAINT); g.put(3, 16, '0', FAINT); g.put(64, 17, 'EPOCH', FAINT);
        g.line(ox, oy, ox, oy - H, FAINT); g.line(ox, oy, ox + W, oy, FAINT);
        for (let x = 0; x <= W; x += 4) g.dot(ox + x, yOf(0.65), lv(DIM, 3));
        let p1: number[] | null = null, p2: number[] | null = null;
        for (let x = 0; x <= W; x++) {
          const ep = Math.round((x / W) * (EPOCHS - 1));
          if (ep > done) break;
          const a = [ox + x, yOf(train(ep))], b = [ox + x, yOf(val(ep))];
          if (p1 && p2) { g.line(p2[0], p2[1], b[0], b[1], ROSE); g.line(p1[0], p1[1], a[0], a[1], PERI); }
          p1 = a; p2 = b;
        }
        g.put(10, 3, '●', PERI); g.put(12, 3, 'train', DIM); g.put(19, 3, '●', ROSE); g.put(21, 3, 'val', DIM);
        const pct = (done + 1) / EPOCHS;
        g.put(1, 19, `epoch ${String(done + 1).padStart(3, '0')}/${EPOCHS}`, BRIGHT);
        bar(g, 17, 19, 40, pct, [PERI]);
        g.put(59, 19, `${String(Math.round(pct * 100)).padStart(3)}%`, BRIGHT);
        g.put(1, 21, `train ${train(done).toFixed(3)}`, PERI); g.put(16, 21, `val ${val(done).toFixed(3)}`, ROSE); g.put(29, 21, 'lr 3e-4 · bs 64', DIM);
        if (done > 85) { g.put(1, 23, '▲', PEACH); g.put(3, 23, 'val loss rising: early-stopping candidate', PEACH); }
        else { g.put(1, 23, '·', FAINT); g.put(3, 23, 'checkpoint saved every 10 epochs', FAINT); }
        return g;
      },
    };
  });

  document.fonts?.ready.then(() => figs.forEach((f) => { fit(f); if (reduce) paint(f, f.draw(30)); }));

  if (reduce) { figs.forEach((f) => paint(f, f.draw(30))); return; }
  let last = 0;
  const loop = (now: number) => {
    if (now - last > 40) {   // ~24 fps is plenty for these figures
      last = now;
      figs.forEach((f) => {
        if (!visible.has(f.el) || !f.active()) return;
        try { paint(f, f.draw(now / 1000)); } catch (err) { console.error(`ascii figure #${f.el.id}`, err); }   // one bad figure must not stop the rest
      });
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
