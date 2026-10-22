import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { setLenis } from './scroll';
import { setStep, stepCount } from './process';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const finePointer = matchMedia('(pointer: fine)').matches;
const qsa = <T extends Element = HTMLElement>(s: string) => [...document.querySelectorAll<T>(s)];

function smoothScroll() {
  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  setLenis(lenis);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Header tucks away while scrolling down, returns on the way up.
  const hdr = document.getElementById('hdr');
  lenis.on('scroll', (l: Lenis) => {
    hdr?.classList.toggle('scrolled', l.scroll > 20);
    hdr?.classList.toggle('hide', l.direction === 1 && l.scroll > 400);
  });
  return lenis;
}

function preloader(): Promise<void> {
  const pre = document.getElementById('pre');
  const bar = document.getElementById('preBar');
  const pct = document.getElementById('prePct');
  let seen = false;
  try { seen = !!sessionStorage.getItem('gw-seen'); sessionStorage.setItem('gw-seen', '1'); } catch { /* storage blocked */ }
  if (!pre || !bar || !pct || seen) { pre?.remove(); return Promise.resolve(); }

  const state = { p: 0 };
  return new Promise((resolve) => {
    gsap.timeline({ onComplete: () => pre.remove() })
      .to(state, {
        p: 100, duration: 1.5, ease: 'power2.inOut',
        onUpdate: () => {
          const n = Math.round(state.p), f = Math.round(n / 5);
          pct.textContent = `${n}%`;
          bar.textContent = `[${'█'.repeat(f)}${'░'.repeat(20 - f)}]`;
        },
      })
      .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '+=0.15')
      .add(() => resolve(), '<+0.45');
  });
}

function intro() {
  const h1 = document.querySelector<HTMLElement>('[data-split="intro"]');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (h1) {
    const split = SplitText.create(h1, { type: 'lines', mask: 'lines', linesClass: 'line' });
    gsap.set(h1, { visibility: 'visible' });
    tl.from(split.lines, { yPercent: 115, duration: 1.4, stagger: 0.09 });
  }
  tl.to('[data-intro]', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, stagger: 0.09 }, h1 ? '-=1.1' : 0);
}

function headings() {
  qsa('[data-split]:not([data-split="intro"])').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }),
    });
    gsap.set(el, { visibility: 'visible' });
  });
}

function reveals() {
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', stagger: 0.1 }),
  });
}


function tilt() {
  qsa('[data-tilt]').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotateX', { duration: 0.8, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotateY', { duration: 0.8, ease: 'power3.out' });
    gsap.set(el, { transformPerspective: 1100 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      ry((x / r.width - 0.5) * 7);
      rx(-(y / r.height - 0.5) * 7);
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}


function marquee(lenis: Lenis) {
  const track = document.getElementById('ticker');
  if (!track) return;
  const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
  // Scroll velocity briefly speeds the ticker up.
  lenis.on('scroll', (l: Lenis) => {
    gsap.to(loop, { timeScale: 1 + Math.min(5, Math.abs(l.velocity) * 0.25), duration: 0.25, overwrite: true });
    gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.25 });
  });
}

function process() {
  const rail = document.getElementById('rail');
  setStep(0, true);
  // No pinning: the page scrolls normally and whichever step crosses the middle of the screen is active.
  qsa('#steps > li').forEach((li, i) => ScrollTrigger.create({
    trigger: li, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => { if (self.isActive) setStep(i); },
  }));
  if (rail) gsap.to(rail, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#steps', start: 'top 55%', end: 'bottom 55%', scrub: 0.3 } });
}

function countUp() {
  qsa('[data-count]').forEach((el) => {
    const m = /^(\d+)(.*)$/.exec(el.dataset.count ?? '');
    if (!m) return;
    const target = Number(m[1]), suffix = m[2], state = { v: 0 };
    el.textContent = `0${suffix}`;
    gsap.to(state, {
      v: target, duration: 1.6, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = `${Math.round(state.v)}${suffix}`; },
    });
  });
}

function wordmarkDecode() {
  const el = document.getElementById('wordmark');
  if (!el) return;
  const original = el.textContent ?? '';
  const noise = '░▒▓';
  ScrollTrigger.create({
    trigger: el, start: 'top 92%', once: true,
    onEnter: () => {
      const state = { p: 0 };
      gsap.to(state, {
        p: 1, duration: 1.8, ease: 'power2.out',
        onUpdate: () => {
          // columns left of the sweep are resolved; just right of it they flicker
          el.textContent = original.split('\n').map((row) => [...row].map((ch, x) => {
            const edge = state.p * (row.length + 12) - x;
            if (edge > 12 || ch === ' ') return edge > 0 ? ch : ' ';
            return edge > 0 ? noise[(Math.random() * 3) | 0] : ' ';
          }).join('')).join('\n');
        },
        onComplete: () => { el.textContent = original; },
      });
    },
  });
}

function scramble() {
  qsa('[data-scramble]').forEach((el) => {
    const text = el.textContent ?? '';
    el.addEventListener('pointerenter', () => gsap.to(el, { duration: 0.7, scrambleText: { text, chars: '!<>-_\\/[]{}=+*^?#', speed: 0.6 }, overwrite: true }));
  });
}

export async function initMotion(reduce: boolean) {
  if (reduce) { document.getElementById('pre')?.remove(); setStep(stepCount() - 1, true); return; }

  const lenis = smoothScroll();
  await document.fonts?.ready;
  await preloader();
  intro();
  headings();
  reveals();
  process();
  countUp();
  marquee(lenis);
  wordmarkDecode();
  scramble();
  if (finePointer) tilt();
  ScrollTrigger.refresh();
}
