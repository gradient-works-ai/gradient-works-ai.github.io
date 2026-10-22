import type Lenis from 'lenis';

let lenis: Lenis | null = null;

export const setLenis = (l: Lenis) => { lenis = l; };
export const getLenis = () => lenis;

export function scrollToTarget(target: string | number) {
  if (target === '#top') target = 0;
  // Section anchors used from a subpage go back to the home page.
  if (typeof target === 'string' && !document.querySelector(target)) { location.href = `/${target}`; return; }
  if (lenis) return lenis.scrollTo(target, { offset: -90, duration: 1.6 });
  if (typeof target === 'number') return window.scrollTo({ top: target });
  document.querySelector(target)?.scrollIntoView();
}
