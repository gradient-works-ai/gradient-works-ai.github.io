// Shared performance policy for the animated canvases.

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
const n = navigator as Nav;

/** Phones, data-saver, and low-end hardware get lighter animation. */
export const lowPower =
  matchMedia('(max-width: 760px), (pointer: coarse)').matches ||
  !!n.connection?.saveData ||
  (n.hardwareConcurrency ?? 8) <= 4 ||
  (n.deviceMemory ?? 8) <= 4;

/** Run `fn` once the page has loaded and the main thread is idle, so animation never delays first paint. */
export function whenIdle(fn: () => void) {
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  if (document.readyState === 'complete') go();
  else addEventListener('load', go, { once: true });
}
