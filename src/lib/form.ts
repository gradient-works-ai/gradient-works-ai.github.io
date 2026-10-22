// Three-step project brief. Sends JSON to Web3Forms; if there's no key, the request fails or it takes
// longer than TIMEOUT, it offers a pre-filled email instead, so a brief is never lost.
// Without JS the <form> posts normally.
const EMAIL = 'dasarimanas049@gmail.com';
const ENDPOINT = 'https://api.web3forms.com/submit';
const TIMEOUT = 12_000;

type Brief = Record<string, string>;

export function initForm() {
  const form = document.getElementById('brief') as HTMLFormElement | null;
  if (!form) return;
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('fieldset[data-step]')];
  const bar = document.getElementById('briefBar');
  const info = document.getElementById('briefStep');
  const back = document.getElementById('briefBack') as HTMLButtonElement;
  const next = document.getElementById('briefNext') as HTMLButtonElement;
  const send = document.getElementById('briefSend') as HTMLButtonElement;
  const status = document.getElementById('briefStatus');
  const preview = document.getElementById('briefPreview');
  const state = document.getElementById('briefState');
  let i = 0;

  form.classList.add('stepped');

  const collect = (): Brief => {
    const fd = new FormData(form);
    const get = (k: string) => fd.getAll(k).map(String).filter(Boolean).join(', ');
    return {
      Name: get('Name'), Email: get('email'), Company: get('Company'), Links: get('Links'),
      Work: get('Work'), Description: get('Description'), Data: get('Data'),
      Engagement: get('Engagement'), Budget: get('Budget'),
      'Budget negotiable': fd.get('Budget negotiable') ? 'Yes' : 'No',
      Timeline: get('Timeline'),
    };
  };

  // Live brief.json preview
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const render = () => {
    if (!preview) return;
    const b = collect();
    const rows = Object.entries(b).map(([k, v]) => {
      const key = k.toLowerCase().replace(/\s+/g, '_');
      const val = v ? `<span class="s">"${esc(v.length > 60 ? v.slice(0, 57) + '…' : v)}"</span>` : '<span class="n">null</span>';
      return `  <span class="k">"${key}"</span>: ${val}`;
    });
    preview.innerHTML = `{\n${rows.join(',\n')}\n}`;
  };

  const show = (n: number, focus = true) => {
    i = n;
    steps.forEach((s, j) => s.classList.toggle('on', j === i));
    if (bar) bar.style.width = `${((i + 1) / steps.length) * 100}%`;
    if (info) info.textContent = `Step ${i + 1} of ${steps.length} · ${steps[i].dataset.step}`;
    back.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    send.hidden = i !== steps.length - 1;
    if (focus) steps[i].querySelector<HTMLElement>('input:not([type=hidden]), textarea')?.focus({ preventScroll: true });
  };

  const valid = (fs: HTMLFieldSetElement) => {
    const group = fs.querySelector<HTMLElement>('[data-group="work"]');
    if (group) {
      const none = !group.querySelector('input:checked');
      const err = document.getElementById('workErr');
      if (err) err.hidden = !none;
      if (none) { group.querySelector<HTMLInputElement>('input')?.focus(); return false; }
    }
    for (const el of fs.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[required], textarea[required]')) {
      const ok = el.checkValidity();
      el.setAttribute('aria-invalid', String(!ok));
      if (!ok) { el.reportValidity(); el.focus(); return false; }
    }
    return true;
  };

  next.addEventListener('click', () => { if (valid(steps[i])) show(i + 1); });
  back.addEventListener('click', () => show(i - 1));
  form.addEventListener('keydown', (e) => {
    // Enter in a single-line field advances instead of submitting early
    if (e.key === 'Enter' && (e.target as HTMLElement).matches('input:not([type=checkbox]):not([type=radio])') && i < steps.length - 1) {
      e.preventDefault(); next.click();
    }
  });
  form.addEventListener('input', (e) => {
    (e.target as HTMLElement).removeAttribute('aria-invalid');
    if (state) state.textContent = 'draft · unsaved';
    render();
  });
  form.addEventListener('change', (e) => {
    if ((e.target as HTMLElement).closest('[data-group="work"]')) { const err = document.getElementById('workErr'); if (err) err.hidden = true; }
    render();
  });

  const mailtoFor = (b: Brief) =>
    `mailto:${EMAIL}?subject=${encodeURIComponent(`Project brief — ${b.Name || 'new enquiry'}`)}&body=${encodeURIComponent(
      Object.entries(b).map(([k, v]) => `${k}: ${v || '—'}`).join('\n'))}`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!valid(steps[i])) return;   // earlier steps were checked on Next
    const b = collect();
    if ((form.elements.namedItem('botcheck') as HTMLInputElement | null)?.checked) return;   // bot
    const key = (form.elements.namedItem('access_key') as HTMLInputElement | null)?.value;

    send.disabled = true;
    send.textContent = 'Sending…';
    if (status) status.textContent = '';
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), TIMEOUT);
    try {
      if (!key) throw new Error('No form key configured');
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        signal: abort.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: key, subject: `New project brief · ${b.Name}`, from_name: 'Gradient Works website',
          name: b.Name, email: b.Email, replyto: b.Email, ...b,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success !== true) throw new Error(json.message || 'Send failed');
      clearTimeout(timer);

      form.hidden = true;
      const done = document.getElementById('briefDone');
      const echo = document.getElementById('briefEcho');
      if (echo) echo.textContent = Object.entries(b).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
      if (done) done.hidden = false;
      if (state) state.textContent = 'sent ✓';
      document.querySelector('.brief-page')?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      clearTimeout(timer);
      send.disabled = false;
      send.innerHTML = 'Send brief <span class="arrow">→</span>';
      if (!key) {
        // No delivery service configured: hand the brief to the visitor's mail app instead.
        location.href = mailtoFor(b);
        if (status) status.innerHTML = `Your email app should open with the brief filled in. <a href="${mailtoFor(b)}">Open it again</a> if it didn't.`;
      } else if (status) {
        status.innerHTML = `Couldn't send right now. <a href="${mailtoFor(b)}">Send it by email instead</a>, it's pre-filled.`;
      }
    }
  });

  show(0, false);
  render();
}
