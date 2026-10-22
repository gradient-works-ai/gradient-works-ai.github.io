// Fig. 02 terminal: shows every step up to the active one, typing the active step's command.
type Step = { title: string; cmd: string; body: string; out: string[] };

const data: Step[] = JSON.parse(document.getElementById('stepsData')?.textContent ?? '[]');
const term = document.getElementById('term');
const label = document.getElementById('termStep');
const items = [...document.querySelectorAll<HTMLElement>('#steps > li')];
const caret = Object.assign(document.createElement('span'), { className: 'caret' });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let current = -1, token = 0;

export const stepCount = () => data.length;

function line(cls: string, text: string) {
  const s = Object.assign(document.createElement('span'), { className: cls, textContent: text });
  term?.append(s, '\n');
  if (term) term.scrollTop = term.scrollHeight;   // keep the latest line in view
  return s;
}
const outLine = (text: string) => line(text.startsWith('!') ? 'warn' : 'out', '  ' + text);

export async function setStep(i: number, instant = false) {
  if (!term || i === current) return;
  current = i;
  const mine = ++token;
  items.forEach((li, j) => li.classList.toggle('active', j === i));
  if (label) label.textContent = `${String(i + 1).padStart(2, '0')} / ${String(data.length).padStart(2, '0')}`;

  term.textContent = '';
  data.slice(0, i).forEach((s) => { line('cmd', s.cmd); s.out.forEach(outLine); });
  const s = data[i];
  if (instant) { line('cmd', s.cmd); s.out.forEach(outLine); term.append(caret); return; }

  const cmd = line('cmd', '');
  cmd.after(caret);
  for (const ch of s.cmd) {
    if (mine !== token) return;
    cmd.textContent += ch;
    await wait(16 + Math.random() * 26);
  }
  for (const o of s.out) {
    await wait(260);
    if (mine !== token) return;
    outLine(o);
    term.append(caret);
  }
}
