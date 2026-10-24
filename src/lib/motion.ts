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
  const lenis = new Lenis({ lerp: 0.32, wheelMultiplier: 1.1 });   // higher lerp = snappier; 0.1 is Lenis' default
  setLenis(lenis);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Re-measure whenever the page's height changes after load (late fonts, the footer wordmark fitting
  // itself, FAQ answers opening...). Otherwise Lenis keeps a stale scroll limit and snaps back short of the bottom.
  let pending = 0;
  new ResizeObserver(() => {
    lenis.resize();
    clearTimeout(pending);
    pending = window.setTimeout(() => ScrollTrigger.refresh(), 200);
  }).observe(document.body);

  // Header tucks away while scrolling down, returns on the way up.
  const hdr = document.getElementById('hdr');
  lenis.on('scroll', (l: Lenis) => {
    hdr?.classList.toggle('scrolled', l.scroll > 20);
    hdr?.classList.toggle('hide', l.direction === 1 && l.scroll > 400);
  });
  return lenis;
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

function footerMark() {
  // Animated as one piece: transforming individual letters breaks background-clip: text in Chromium.
  const el = document.getElementById('markText');
  if (!el) return;
  gsap.from(el, {
    yPercent: 45, opacity: 0, duration: 1.6, ease: 'expo.out',
    scrollTrigger: { trigger: '#mark', start: 'top 100%', once: true },
  });
}

function scramble() {
  qsa('[data-scramble]').forEach((el) => {
    const text = el.textContent ?? '';
    el.addEventListener('pointerenter', () => gsap.to(el, { duration: 0.7, scrambleText: { text, chars: '!<>-_\\/[]{}=+*^?#', speed: 0.6 }, overwrite: true }));
  });
}

export async function initMotion(reduce: boolean) {
  if (reduce) { setStep(stepCount() - 1, true); return; }

  const lenis = smoothScroll();
  await document.fonts?.ready;
  intro();
  headings();
  reveals();
  process();
  countUp();
  marquee(lenis);
  footerMark();
  scramble();
  if (finePointer) tilt();
  ScrollTrigger.refresh();
}
