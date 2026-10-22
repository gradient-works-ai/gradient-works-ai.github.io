import { scrollToTarget } from './scroll';

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

function anchors() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-scroll]');
    if (!a) return;
    e.preventDefault();
    scrollToTarget(a.getAttribute('href') ?? '#top');
  });
  document.getElementById('toTop')?.addEventListener('click', () => scrollToTarget(0));
}

function slideshow() {
  const slides = [...document.querySelectorAll<HTMLElement>('.slide')];
  const tabs = [...document.querySelectorAll<HTMLElement>('.tab')];
  let i = 0;
  const show = (n: number) => {
    slides[i].classList.remove('on'); tabs[i].classList.remove('on'); tabs[i].setAttribute('aria-selected', 'false');
    i = n;
    slides[i].classList.add('on'); tabs[i].setAttribute('aria-selected', 'true');
    void tabs[i].offsetWidth;   // restart the progress animation
    tabs[i].classList.add('on');
  };
  tabs.forEach((t, n) => {
    t.addEventListener('click', () => show(n));
    t.querySelector('i')?.addEventListener('animationend', () => show((n + 1) % slides.length));
  });
}

function copyEmail() {
  const btn = document.getElementById('copyEmail');
  const state = document.getElementById('copyState');
  btn?.addEventListener('click', async () => {
    if (!state || !(await copy(btn.dataset.email ?? ''))) return;
    state.textContent = 'Copied ✓';
    setTimeout(() => { state.textContent = 'Copy'; }, 1800);
  });
}

function palette() {
  const dlg = document.getElementById('palette') as HTMLDialogElement | null;
  const input = document.getElementById('palIn') as HTMLInputElement | null;
  if (!dlg || !input) return;
  const items = [...dlg.querySelectorAll<HTMLElement>('li')];
  let idx = 0;

  const shown = () => items.filter((li) => !li.hidden);
  const mark = () => shown().forEach((li, j) => li.classList.toggle('active', j === idx));
  const open = () => { input.value = ''; items.forEach((li) => (li.hidden = false)); idx = 0; mark(); dlg.showModal(); input.focus(); };
  const run = async (li?: HTMLElement) => {
    if (!li) return;
    const { action, arg = '' } = li.dataset;
    dlg.close();
    if (action === 'scroll') scrollToTarget(arg);
    else if (action === 'href') location.href = arg;
    else if (action === 'open') window.open(arg, '_blank', 'noopener');
    else if (action === 'copy') await copy(arg);
  };

  document.getElementById('paletteBtn')?.addEventListener('click', open);
  addEventListener('keydown', (e) => {
    const typing = (e.target as HTMLElement).matches('input, textarea');
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing && !dlg.open)) { e.preventDefault(); dlg.open ? dlg.close() : open(); }
  });
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    items.forEach((li) => (li.hidden = !li.textContent?.toLowerCase().includes(q)));
    idx = 0; mark();
  });
  input.addEventListener('keydown', (e) => {
    const list = shown();
    if (e.key === 'ArrowDown') { idx = (idx + 1) % list.length; mark(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { idx = (idx - 1 + list.length) % list.length; mark(); e.preventDefault(); }
    else if (e.key === 'Enter') run(list[idx]);
  });
  items.forEach((li) => {
    li.addEventListener('click', () => run(li));
    li.addEventListener('pointermove', () => { idx = shown().indexOf(li); mark(); });
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });   // backdrop click
}

function fileTree() {
  const note = document.getElementById('treeNote');
  const items = [...document.querySelectorAll<HTMLElement>('#tree li')];
  const pick = (li: HTMLElement) => {
    items.forEach((x) => x.classList.toggle('active', x === li));
    if (note) note.textContent = li.dataset.note ?? '';
  };
  items.forEach((li) => {
    li.addEventListener('pointerenter', () => pick(li));
    li.addEventListener('focus', () => pick(li));
  });
}

export function initUi() {
  fileTree();
  anchors();
  slideshow();
  copyEmail();
  palette();
}
