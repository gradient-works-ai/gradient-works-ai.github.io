// Small ASCII "canvas": a char grid plus a style mask (0 dim, 1 bright, 2 faint),
// serialised into a <pre> with <b>/<i> runs. Renderers only draw while on screen.

type Grid = { c: number; r: number; ch: string[][]; s: number[][] };
type Renderer = { el: HTMLElement; draw: (t: number) => void; active: () => boolean };

const grid = (c: number, r: number): Grid => ({
  c, r,
  ch: Array.from({ length: r }, () => Array<string>(c).fill(' ')),
  s: Array.from({ length: r }, () => Array<number>(c).fill(0)),
});

function put(g: Grid, x: number, y: number, str: string, style = 0) {
  x = Math.round(x); y = Math.round(y);
  if (y < 0 || y >= g.r) return;
  [...str].forEach((ch, i) => {
    if (x + i >= 0 && x + i < g.c) { g.ch[y][x + i] = ch; g.s[y][x + i] = style; }
  });
}

const tag = ['', 'b', 'i'];
const esc = (ch: string) => (ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch);

function out(el: HTMLElement, g: Grid) {
  el.innerHTML = g.ch.map((row, y) => {
    let html = '', open = 0;
    row.forEach((ch, x) => {
      const want = g.s[y][x];
      if (want !== open) {
        if (open) html += `</${tag[open]}>`;
        if (want) html += `<${tag[want]}>`;
        open = want;
      }
      html += esc(ch);
    });
    return html + (open ? `</${tag[open]}>` : '');
  }).join('\n');
}

export function fitAscii() {
  document.querySelectorAll<HTMLElement>('pre[data-cols]').forEach((p) => {
    const w = (p.parentElement?.clientWidth ?? 0) * Number(p.dataset.fit ?? 1);
    p.style.fontSize = Math.min(Number(p.dataset.max ?? 14), w / (Number(p.dataset.cols) * 0.6)) + 'px';
  });
}

const onSlide = (el: HTMLElement) => () => !!el.closest('.slide')?.classList.contains('on');

// Shared non-convex loss surface used by the landscape figure.
export const loss = (x: number, y: number) =>
  0.08 * (x * x + y * y)
  - 1.3 * Math.exp(-((x - 1.4) ** 2 + (y - 0.4) ** 2) / 0.9)
  - 0.9 * Math.exp(-((x + 1.3) ** 2 + (y + 1.1) ** 2) / 0.7)
  + 0.25 * Math.sin(1.6 * x) * Math.cos(1.4 * y);
export const lossGrad = (x: number, y: number, h = 1e-3): [number, number] =>
  [(loss(x + h, y) - loss(x - h, y)) / (2 * h), (loss(x, y + h) - loss(x, y - h)) / (2 * h)];

export function initAscii(reduce: boolean) {
  const renderers: Renderer[] = [];
  const visible = new Set<Element>();
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))));
  const add = (id: string, make: (el: HTMLElement) => Omit<Renderer, 'el'>) => {
    const el = document.getElementById(id);
    if (!el) return;
    renderers.push({ el, ...make(el) });
    io.observe(el);
  };

  // EEG traces
  add('aEeg', (el) => {
    const C = 92, R = 28, names = ['Fp1', 'Fp2', 'C3', 'C4', 'P3', 'O1'], lv = ['_', '-', '¯'];
    const seeds = names.map(() => [Math.random() * 6, 0.7 + Math.random() * 0.8, Math.random() * 6]);
    return {
      active: onSlide(el),
      draw(t) {
        const g = grid(C, R);
        put(g, 2, 1, 'EEG · 6 CH · 256 HZ', 1);
        put(g, C - 22, 1, 'CLASS: ' + (Math.floor(t / 4) % 2 ? 'NORMAL' : 'SPIKE '), 1);
        names.forEach((n, c) => {
          const y0 = 3 + c * 3, [p, f, q] = seeds[c], hi = c === 2 ? 1 : 0;
          put(g, 2, y0 + 1, n, hi);
          for (let x = 7; x < C - 1; x++) {
            const u = (x / C) * 9 + t * 0.9;
            let v = Math.sin(u * 2.1 * f + p) * 0.55 + Math.sin(u * 5.3 + q) * 0.25;
            v += Math.exp(-((((u + c * 1.7) % 9) - 4.5) ** 2) * 6) * Math.sin(u * 30) * 1.1;
            const k = Math.max(0, Math.min(8, Math.round(((1.4 - v) / 2.8) * 8)));
            put(g, x, y0 + Math.floor(k / 3), lv[2 - (k % 3)], hi);
          }
        });
        out(el, g);
      },
    };
  });

  // Confusion matrix + ROC curve
  add('aEval', (el) => {
    const C = 92, R = 28, labels = ['ok', 'dent', 'tear', 'wet'];
    const M = [[0.92, 0.05, 0.02, 0.01], [0.06, 0.86, 0.06, 0.02], [0.03, 0.08, 0.84, 0.05], [0.01, 0.02, 0.07, 0.9]];
    const roc = (x: number) => 1 - Math.pow(1 - x, 6.5);
    let t0: number | null = null;
    const isOn = onSlide(el);
    return {
      active: () => { const on = isOn(); if (!on) t0 = null; return on; },
      draw(t) {
        t0 ??= t;
        const k = (t - t0) * 6, g = grid(C, R);
        put(g, 3, 0, 'CONFUSION MATRIX', 1); put(g, 54, 0, 'ROC CURVE · AUC 0.94', 1);
        labels.forEach((n, i) => { put(g, 3, 4 + i * 3, n.padStart(4)); put(g, 11 + i * 9, 2, n); });
        M.forEach((row, r) => row.forEach((v, c) => {
          const x = 9 + c * 9, y = 3 + r * 3, shown = r * 4 + c < k, hi = v > 0.8 ? 1 : 0;
          const shade = !shown ? ' ' : v > 0.8 ? '▓' : v > 0.04 ? '░' : '·';
          for (let yy = 1; yy <= 2; yy++) { put(g, x, y + yy, '|'); put(g, x + 1, y + yy, shade.repeat(8), hi); }
          if (shown) put(g, x + 2, y + 1, ` ${v.toFixed(2)} `, hi);
        }));
        for (let r = 0; r <= 4; r++) put(g, 9, 3 + r * 3, '+--------+--------+--------+--------+');
        for (let r = 0; r < 4; r++) for (let yy = 1; yy <= 2; yy++) put(g, 45, 3 + r * 3 + yy, '|');
        const ox = 54, oy = 15, W = 34, H = 12;
        for (let y = 0; y <= H; y++) put(g, ox, oy - y, '|');
        put(g, ox, oy, '+' + '-'.repeat(W));
        put(g, ox - 3, oy - H, '1.0'); put(g, ox, oy + 1, '0'); put(g, ox + W - 2, oy + 1, '1.0'); put(g, ox + 14, oy + 1, 'FPR');
        for (let x = 1; x < W; x += 2) put(g, ox + x, oy - Math.round((x / W) * H), '.', 2);
        const drawn = Math.min(W, (k - 10) * 3);
        for (let x = 1; x < drawn; x++) put(g, ox + x, oy - Math.round(roc(x / W) * H), '*', 1);
        out(el, g);
      },
    };
  });

  // Conveyor detection
  add('aVision', (el) => {
    const C = 92, R = 28, belt = 15;
    const boxes = [{ w: 16, h: 5, tag: 'OK' }, { w: 12, h: 4, tag: 'DENT' }, { w: 18, h: 6, tag: 'OK' }, { w: 14, h: 4, tag: 'TEAR' }];
    return {
      active: onSlide(el),
      draw(t) {
        const g = grid(C, R), shift = (t * 9) % 130, center = C / 2;
        put(g, 3, 0, 'CAM 02 · 30 FPS · YOLOV8N', 1); put(g, C - 17, 0, 'LATENCY 11 MS', 1);
        put(g, 0, belt, '═'.repeat(C));
        for (let x = 0; x < 90; x += 6) put(g, (((x - Math.floor(shift)) % 90) + 90) % 90, belt + 1, '(o)', 2);
        for (let y = 2; y < belt; y += 2) put(g, center, y, '¦', 2);
        let pos = 100 - shift;
        boxes.forEach((b) => {
          const x = Math.round(pos), y = belt - b.h;
          put(g, x, y, '+' + '-'.repeat(b.w - 2) + '+');
          for (let yy = 1; yy < b.h - 1; yy++) put(g, x, y + yy, '|' + ' '.repeat(b.w - 2) + '|');
          put(g, x, belt - 1, '+' + '-'.repeat(b.w - 2) + '+');
          put(g, x + 2, y + 1, '|||| |');
          if (b.tag !== 'OK') put(g, x + b.w - 5, y + 1, '\\/');
          const off = Math.abs(x + b.w / 2 - center);
          if (off < 18) {
            const conf = (b.tag === 'OK' ? 0.97 : 0.88) - off * 0.004;
            put(g, x - 2, y - 2, '┌─', 1); put(g, x + b.w, y - 2, '─┐', 1); put(g, x - 2, belt, '└─', 1); put(g, x + b.w, belt, '─┘', 1);
            put(g, x - 2, y - 3, ` ${b.tag === 'OK' ? 'PACKAGE' : b.tag} ${conf.toFixed(2)} `, 1);
          }
          pos += b.w + 16;
        });
        out(el, g);
      },
    };
  });

  // Rotating 3D loss landscape with a momentum-SGD optimiser rolling downhill
  add('aLand', (el) => {
    const C = 84, R = 34, ramp = '.,-~:;=!*#$@', stat = document.getElementById('landStat');
    const L = [-0.45, -0.55, 0.7], Ln = Math.hypot(...L);
    let ball = { x: 0, y: 0, vx: 0, vy: 0, n: 0, trail: [] as [number, number][] }, steps = 0;
    const spawn = () => { ball = { x: (Math.random() - 0.5) * 4.6, y: (Math.random() - 0.5) * 4.6, vx: 0, vy: 0, n: 0, trail: [] }; };
    spawn();
    return {
      active: () => true,
      draw(t) {
        const g = grid(C, R), zb = Array.from({ length: R }, () => Array<number>(C).fill(-1e9));
        const A = t * 0.22, B = 0.95, cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B), k = C / 9.5;
        const proj = (x: number, y: number, h: number): [number, number, number] => {
          const xr = x * cA - y * sA, yr = x * sA + y * cA;
          return [C / 2 + xr * k, R / 2 + 1 + (-yr * sB - h * cB) * k * 0.5, -yr * cB + h * sB];
        };
        for (let x = -3; x <= 3; x += 0.07) for (let y = -3; y <= 3; y += 0.07) {
          if (x * x + y * y > 9) continue;
          const h = loss(x, y) * 1.5, [sx, sy, d] = proj(x, y, h), cx = Math.round(sx), cy = Math.round(sy);
          if (cx < 0 || cx >= C || cy < 0 || cy >= R || d <= zb[cy][cx]) continue;
          const [fx, fy] = lossGrad(x, y), n = [-fx * 1.5, -fy * 1.5, 1], nn = Math.hypot(...n);
          const lum = Math.max(0, (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / (nn * Ln));
          const band = Math.abs((((h / 1.5) * 4) % 1 + 1) % 1 - 0.5) > 0.42;   // contour every 0.25 loss
          zb[cy][cx] = d;
          g.ch[cy][cx] = band ? '─' : ramp[Math.min(ramp.length - 1, Math.floor(lum ** 2 * 0.75 * ramp.length))];
          g.s[cy][cx] = band ? 2 : 0;
        }
        if (!reduce) {
          const [gx, gy] = lossGrad(ball.x, ball.y);
          ball.vx = 0.9 * ball.vx - 0.02 * gx; ball.vy = 0.9 * ball.vy - 0.02 * gy;
          ball.x += ball.vx; ball.y += ball.vy;
          ball.trail.push([ball.x, ball.y]); if (ball.trail.length > 40) ball.trail.shift();
          steps++; if (++ball.n > 260) spawn();
        }
        ball.trail.forEach(([x, y], i) => {
          const [sx, sy] = proj(x, y, loss(x, y) * 1.5 + 0.1);
          put(g, sx, sy, i === ball.trail.length - 1 ? '@' : '·', 1);
        });
        out(el, g);
        if (stat) stat.textContent = `step ${String(steps).padStart(4, '0')} · loss ${loss(ball.x, ball.y).toFixed(3)}`;
      },
    };
  });

  // Electrode head map (NeuroDial)
  add('aHead', (el) => {
    const C = 64, R = 24;
    const sites: [string, number, number][] = [['Fp1', -0.3, -0.85], ['Fp2', 0.3, -0.85], ['F7', -0.75, -0.45], ['F3', -0.35, -0.4], ['Fz', 0, -0.4], ['F4', 0.35, -0.4],
      ['F8', 0.75, -0.45], ['C3', -0.45, 0], ['Cz', 0, 0], ['C4', 0.45, 0], ['P3', -0.35, 0.45], ['Pz', 0, 0.42], ['P4', 0.35, 0.45], ['O1', -0.25, 0.85], ['O2', 0.25, 0.85]];
    return {
      active: () => true,
      draw(t) {
        const g = grid(C, R), cx = C / 2, cy = R / 2, rx = 22, ry = 10.5;
        for (let a = 0; a < Math.PI * 2; a += 0.03) put(g, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, '·', 2);
        put(g, cx - 1, cy - ry - 1, '/\\', 2); put(g, cx - rx - 2, cy, '(', 2); put(g, cx + rx + 1, cy, ')', 2);
        sites.forEach(([n, x, y], i) => {
          const act = Math.sin(t * 2 + i * 0.9) * Math.sin(t * 0.7 + x * 3);
          put(g, cx + x * rx - 1, cy + y * ry, act > 0.5 ? '(@)' : act > 0 ? '(o)' : '( )', 1);
          put(g, cx + x * rx - 1, cy + y * ry + 1, n, 2);
        });
        put(g, 1, R - 1, 'NEURODIAL · 10-20 MONTAGE', 1);
        out(el, g);
      },
    };
  });

  // Evaluation report bars (Eval Harness)
  add('aBars', (el) => {
    const C = 64, R = 22;
    const rows: [string, number][] = [['accuracy', 0.91], ['macro-F1', 0.87], ['precision', 0.89], ['recall', 0.85], ['ECE (↓)', 0.04], ['robust@σ=.1', 0.79], ['low-light slice', 0.71]];
    let t0: number | null = null;
    return {
      active: () => true,
      draw(t) {
        t0 ??= t;
        const g = grid(C, R), p = Math.min(1, (t - t0) / 2.2);
        put(g, 2, 1, '$ gw eval --report', 1);
        put(g, 2, 3, '─'.repeat(C - 4), 2);
        rows.forEach(([n, v], i) => {
          const y = 5 + i * 2, w = 30, fill = Math.round(v * w * p);
          put(g, 2, y, n.padEnd(16), 1);
          put(g, 19, y, '█'.repeat(fill), 1); put(g, 19 + fill, y, '░'.repeat(w - fill), 2);
          put(g, 51, y, (v * p).toFixed(2), 1);
          if (n === 'low-light slice' && p === 1) put(g, 57, y, '! flag', 1);
        });
        put(g, 2, R - 2, '7 metrics · 3 slices · report.pdf written', 2);
        out(el, g);
      },
    };
  });

  // Training log for the "under the works" pages: loss curves plotted epoch by epoch, then restart.
  add('aBuild', (el) => {
    const C = 72, R = 26, EPOCHS = 120, model = el.dataset.model ?? 'model';
    const ox = 7, oy = 16, W = 58, H = 11;
    const noise = Array.from({ length: EPOCHS }, () => Math.random() - 0.5);
    const train = (e: number) => 0.18 + 1.05 * Math.exp(-e / 26) + noise[e] * 0.03;
    const val = (e: number) => 0.27 + 0.95 * Math.exp(-e / 30) + Math.max(0, e - 85) * 0.0018 + noise[(e * 7) % EPOCHS] * 0.05;
    const yOf = (v: number) => oy - Math.round(Math.min(1, v / 1.3) * H);
    return {
      active: () => true,
      draw(t) {
        const g = grid(C, R), e = Math.floor((t * 7) % (EPOCHS + 20));   // short hold at the end of each run
        const done = Math.min(e, EPOCHS - 1);
        put(g, 1, 0, `$ gw train --model ${model} --epochs ${EPOCHS}`, 1);
        put(g, 1, 2, 'LOSS', 2); put(g, ox - 4, yOf(1.3), '1.3', 2); put(g, ox - 4, yOf(0.65), '.65', 2); put(g, ox - 2, oy, '0', 2);
        for (let y = yOf(1.3); y <= oy; y++) put(g, ox, y, '│', 2);
        put(g, ox, oy, '└' + '─'.repeat(W), 2);
        put(g, ox + W - 6, oy + 1, 'EPOCH', 2);
        for (let x = 0; x < W; x++) {
          const ep = Math.round((x / (W - 1)) * (EPOCHS - 1));
          if (ep > done) break;
          put(g, ox + 1 + x, yOf(val(ep)), '·', 2);
          put(g, ox + 1 + x, yOf(train(ep)), '*', 1);
        }
        put(g, ox + 2, yOf(1.3), '* train   · val', 2);
        const pct = Math.round(((done + 1) / EPOCHS) * 100), bar = Math.round(pct / 4);
        put(g, 1, oy + 3, `epoch ${String(done + 1).padStart(3, '0')}/${EPOCHS}  [${'█'.repeat(bar)}${'░'.repeat(25 - bar)}] ${String(pct).padStart(3)}%`, 1);
        put(g, 1, oy + 5, `train_loss ${train(done).toFixed(3)}   val_loss ${val(done).toFixed(3)}   lr 3e-4`, 0);
        if (done > 85) put(g, 1, oy + 7, '! val_loss rising: early stopping candidate', 1);
        else put(g, 1, oy + 7, '· checkpoint saved every 10 epochs', 2);
        out(el, g);
      },
    };
  });

  fitAscii();
  addEventListener('resize', fitAscii);
  document.fonts?.ready.then(fitAscii);

  if (reduce) { renderers.forEach((r) => r.draw(30)); return; }
  let last = 0;
  const loop = (now: number) => {
    if (now - last > 40) {   // ~24 fps is plenty for ASCII
      last = now;
      renderers.forEach((r) => { if (visible.has(r.el) && r.active()) r.draw(now / 1000); });
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
