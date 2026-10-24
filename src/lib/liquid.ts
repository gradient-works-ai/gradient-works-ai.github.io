// Liquid glass: real refraction of whatever is behind an element, via an SVG displacement filter
// used as a backdrop-filter. The displacement map is generated per element size: a pill-shaped
// lens whose rim bends the backdrop inward (magnifying at the edges), like Apple's Liquid Glass.
// Only Chromium supports url() in backdrop-filter; other browsers keep the CSS frosted fallback.

const BEZEL = 22;   // px width of the refracting rim
const SCALE = 18;   // max displacement in px: enough to bend, not enough to mirror

// Signed distance to a rounded rectangle centred in a w×h box (negative inside).
function sdf(x: number, y: number, w: number, h: number, r: number) {
  const px = Math.abs(x - w / 2) - (w / 2 - r), py = Math.abs(y - h / 2) - (h / 2 - r);
  return Math.hypot(Math.max(px, 0), Math.max(py, 0)) + Math.min(Math.max(px, py), 0) - r;
}

function lensMap(w: number, h: number, r: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, dist = -sdf(x + 0.5, y + 0.5, w, h, r);   // distance in from the edge
    let dx = 0, dy = 0;
    if (dist > 0 && dist < BEZEL) {
      const gx = sdf(x + 1.5, y + 0.5, w, h, r) - sdf(x - 0.5, y + 0.5, w, h, r);
      const gy = sdf(x + 0.5, y + 1.5, w, h, r) - sdf(x + 0.5, y - 0.5, w, h, r);
      const len = Math.hypot(gx, gy) || 1, t = 1 - dist / BEZEL;
      const mag = t * t * (3 - 2 * t);   // smooth convex profile: strongest right at the rim
      dx = (-gx / len) * mag; dy = (-gy / len) * mag;   // sample from further inside → edge magnifies
    }
    d[i] = 128 + dx * 127; d[i + 1] = 128 + dy * 127; d[i + 2] = 128; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

const chromium = () => {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands ?? [];
  return brands.some((b) => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand));
};

export function initLiquid() {
  if (!chromium()) return;
  document.querySelectorAll<HTMLElement>('[data-liquid]').forEach((el, n) => {
    const id = `lg-${n}`;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.innerHTML = `<filter id="${id}" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="soft"/>
      <feImage result="map" x="0" y="0" preserveAspectRatio="none"/>
      <feDisplacementMap in="soft" in2="map" scale="${SCALE}" xChannelSelector="R" yChannelSelector="G" result="bent"/>
      <feColorMatrix in="bent" type="saturate" values="1.35"/>
    </filter>`;
    document.body.append(svg);
    const filter = svg.querySelector('filter')!, image = svg.querySelector('feImage')!;

    const build = () => {
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (!w || !h) return;
      const r = Math.min(h / 2, parseFloat(getComputedStyle(el).borderTopLeftRadius) || h / 2);
      for (const [k, v] of [['width', w], ['height', h]] as const) { filter.setAttribute(k, String(v)); image.setAttribute(k, String(v)); }
      image.setAttribute('href', lensMap(w, h, r));
      // Set directly: url(#id) inside a CSS custom property resolves against the stylesheet's URL, not the page.
      el.style.setProperty('backdrop-filter', `url(#${id})`);
      el.style.setProperty('-webkit-backdrop-filter', `url(#${id})`);
      el.classList.add('liquid');
    };
    build();
    let last = '';
    new ResizeObserver(() => { const k = `${el.offsetWidth}x${el.offsetHeight}`; if (k !== last) { last = k; build(); } }).observe(el);
  });
}
