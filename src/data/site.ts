export const site = {
  name: 'Gradient Works',
  url: 'https://gradient-works-ai.github.io',
  description: 'Gradient Works is an applied AI studio that designs, trains and tests custom machine learning models for startups, labs and small teams.',
  email: 'dasarimanas049@gmail.com',
  github: 'https://github.com/gradient-works-ai',
  author: { name: 'Manas Dasari', url: 'https://www.algorithmicbit.tech/' },
};

// Founder page. Everything here is drawn from the public portfolio and GitHub; keep it verifiable.
export const founder = {
  name: 'Manas Dasari',
  role: 'Founder, Gradient Works',
  study: 'Computer Science undergraduate, Amrita School of Engineering',
  city: 'Bangalore, India',
  links: [
    { label: 'Portfolio', href: 'https://www.algorithmicbit.tech/' },
    { label: 'GitHub', href: 'https://github.com/ManasDasri' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/manas-dasari-2a52163a5' },
    { label: 'X', href: 'https://x.com/ManasDmg9' },
  ],
  work: [
    { name: 'NeuroDial', kind: 'ML · biosignals', href: 'https://github.com/ManasDasri/Med-EEG',
      text: 'Can EEG read meditation? A multi-channel EEG pipeline with a live results dashboard.' },
    { name: 'Analogue Risk', kind: 'ML · quant research', href: 'https://github.com/ManasDasri/analogue-risk',
      text: 'Regime-conditioned analogue forecasting of market risk, with self-exciting tail-risk gating.' },
    { name: 'Velora', kind: 'ML · forecasting', href: 'https://www.algorithmicbit.tech/',
      text: 'Stock price forecasting that combines Monte Carlo simulation with sentiment analysis of headlines.' },
    { name: 'Atmos', kind: 'Optimisation · civic', href: 'https://www.algorithmicbit.tech/',
      text: 'Proposes where to place air-quality sensors across Bengaluru. Python and FastAPI.' },
    { name: 'Sprout', kind: 'Developer tools · Go', href: 'https://github.com/Sprout-DevLabs/sprout',
      text: 'Maps codebases for developers and AI agents, with an MCP server. Shipped with Homebrew, Scoop and Linux packages.' },
    { name: 'FieldLensAI', kind: 'Hackathon · 2026', href: 'https://github.com/FieldLensAI',
      text: 'Smart India Hackathon 2026 entry.' },
  ],
  toolkit: {
    'Machine learning': ['Python', 'TensorFlow', 'NumPy', 'Pandas', 'Optimisation'],
    'Engineering': ['Go', 'FastAPI', 'Express.js', 'PostgreSQL', 'Redis', 'Supabase'],
    'Infrastructure': ['Docker', 'Linux', 'Git'],
  } as Record<string, string[]>,
};

// Web3Forms access key for the project brief form (https://web3forms.com, free).
// It's safe to publish: it can only send to the inbox it was created for. Empty = email fallback.
export const formKey = 'a96f29f5-3287-4f7c-84bd-aae3c640b376';

export const mailto = `mailto:${site.email}?subject=Project%20enquiry`;

export const nav = [
  { href: '/services/', label: 'Services', teaser: 'Four disciplines, one standard of rigour.', glyph: '┌─┐\n│▓│──▶\n└─┘' },
  { href: '/process/', label: 'Process', teaser: 'From scoping call to handover in four weeks.', glyph: ' ∂L\n──  → 0\n ∂θ' },
  { href: '/lab/', label: 'Lab', teaser: 'Open models we build between client projects.', glyph: '(o) (@)\n( ) (o)' },
  { href: '/founder/', label: 'Founder', teaser: 'Meet the person who builds your models.', glyph: ' ╭─╮\n ╰┬╯\n╭─┴─╮' },
  { href: '/pricing/', label: 'Pricing', teaser: 'Fixed-price audits, sprints and retainers.', glyph: '$ ███▌\n$ ██▌\n$ █▌' },
  { href: '/contact/', label: 'Contact', teaser: 'Tell us about the problem. Reply within 48h.', glyph: '[✉] →' },
];

export const stack = ['PyTorch', 'Hugging Face', 'scikit-learn', 'FastAPI', 'Docker', 'Weights & Biases', 'ONNX', 'LangChain'];

export const services = [
  { title: 'Custom Model Builds', glyph: '┌─┐\n│▓│──▶\n└─┘', items: ['Tabular prediction', 'Computer vision', 'Time series & biosignals', 'Small LLM fine-tuning'] },
  { title: 'Testing & Evaluation', glyph: '[✓] [✓]\n[✓] [✗]', items: ['Benchmark design', 'Bias & robustness checks', 'LLM evals & red-teaming', 'Audit reports'] },
  { title: 'Research & Prototyping', glyph: ' ∂L\n──  → 0\n ∂θ', items: ['Literature reviews', 'Paper reproduction', 'Baselines', 'Feasibility studies'] },
  { title: 'AI-Native Features', glyph: '◇──◇\n │  │\n◇──◇', items: ['RAG over your documents', 'Agents & automation', 'Model APIs', 'Data pipelines'] },
];

export const steps = [
  {
    title: 'Scope', when: 'Day 1', gives: ['Problem statement', 'Success metric', 'Data audit'], cmd: 'gw scope --problem "package defects" --data ./images',
    body: 'A free 30-minute call. We agree on the problem, the metric and what "good enough" means before any code is written.',
    out: ['✓ 4,812 labelled images · 4 classes', '✓ metric: macro-F1 ≥ 0.85 on a held-out set'],
  },
  {
    title: 'Baseline', when: 'Week 1', gives: ['Baseline model', 'Reference score'], cmd: 'gw baseline',
    body: 'The simplest model that could work, so every later gain is measured against something real.',
    out: ['logistic_regression     macro-F1  0.61', 'resnet18 (frozen)       macro-F1  0.74'],
  },
  {
    title: 'Iterate', when: 'Weeks 1–3', gives: ['Experiment log', 'Weekly updates'], cmd: 'gw train --sweep 24',
    body: 'Tracked experiments, shared weekly. You see the dead ends as well as the wins.',
    out: ['[████████████████████████] 24/24 runs', 'best  efficientnet_b0   macro-F1  0.88'],
  },
  {
    title: 'Evaluate', when: 'Week 3', gives: ['Held-out results', 'Failure analysis', 'Robustness checks'], cmd: 'gw eval --held-out --slices lighting,camera',
    body: 'Held-out testing, failure analysis and robustness checks, written up in plain language.',
    out: ['✓ held-out              macro-F1  0.87', '! low-light slice       macro-F1  0.71  → flagged'],
  },
  {
    title: 'Ship', when: 'Week 4', gives: ['Code & weights', 'Evaluation report', 'Handover call'], cmd: 'gw ship',
    body: 'Code, weights, documentation and a handover call. You own everything.',
    out: ['✓ code · weights · report.pdf · handover call booked'],
  },
];

// What the client receives at the end of a project; `note` shows on hover/focus.
export const handover: { path: string; note: string; meta?: string }[] = [
  { path: 'client-handover/', note: 'One folder, yours to keep. Nothing hosted on our side.' },
  { path: '├── README.md', meta: 'start here', note: 'How to install, run and retrain, written for your engineers.' },
  { path: '├── model/', note: 'Training and inference code, typed and tested.' },
  { path: '│   ├── train.py', note: 'Reproduces the final model from scratch with one command.' },
  { path: '│   ├── predict.py', note: 'Batch or single-item inference.' },
  { path: '│   └── weights.pt', meta: 'final checkpoint', note: 'The trained weights from the run reported in the evaluation.' },
  { path: '├── notebooks/', note: 'Every number in the report traces back to a notebook.' },
  { path: '│   ├── 01_baseline.ipynb', note: 'The simple model everything else is measured against.' },
  { path: '│   ├── 02_experiments.ipynb', note: 'Every run, including the ones that did not work.' },
  { path: '│   └── 03_evaluation.ipynb', note: 'Held-out results, slices and robustness checks.' },
  { path: '├── api/', note: 'Optional: a FastAPI service so your product can call the model.' },
  { path: '│   ├── app.py', meta: 'FastAPI', note: 'Typed endpoints with request validation.' },
  { path: '│   └── Dockerfile', note: 'Runs the same way on your laptop and your servers.' },
  { path: '├── report/', note: 'Written for decision-makers, not just engineers.' },
  { path: '│   └── evaluation.pdf', meta: 'plain language', note: 'What works, what fails, and what we would do next.' },
  { path: '└── data/', note: 'Exactly how the data was split, so results can be checked.' },
  { path: '    └── splits.json', meta: 'train · val · held-out', note: 'Fixed splits: the held-out set is never touched during training.' },
];

export const promises = [
  { value: '48h', label: 'Reply to every enquiry' },
  { value: '100%', label: 'Of code and weights handed over' },
  { value: '0', label: 'Lock-in or hosted dependencies' },
];

// One entry per model. Each gets a page at /lab/<slug>; `art` picks the ASCII figure on its card.
// Set `repo` once the model is public and the page will link to it.
export const lab = [
  { slug: 'neurodial', name: 'NeuroDial', meta: 'EEG · meditation states · In progress', status: 'Training', art: 'aHead', repo: '',
    blurb: 'Can EEG read meditation? A multi-channel EEG pipeline (preprocessing, channel-aware models and held-out evaluation) with a live results dashboard.' },
  { slug: 'eval-harness', name: 'Eval Harness', meta: 'Model testing toolkit · Planned', status: 'Designing', art: 'aBars', repo: '',
    blurb: 'A reusable test suite for classification and LLM models. Metrics, data slices, robustness checks and a written report from one command.' },
];

export const reasons = [
  { title: 'Research first, then engineering.', body: 'We read the papers and set a baseline before building anything, so every improvement is measured against something real rather than a demo.' },
  { title: 'We tell you what we really think.', body: "If your data can't support the model you want, or a simpler approach would work better, we'll say so during scoping while changing course is still cheap." },
  { title: 'Testing is part of the build.', body: "Held-out evaluation, failure analysis and robustness checks come with every model. You get the numbers, including the ones you won't like." },
  { title: 'You own everything.', body: 'Code, weights, notebooks and documentation are handed over at the end. No lock-in, no black boxes.' },
];

export const plans = [
  { name: 'Project', tagline: 'For teams with a clear scope.', price: '$900', unit: 'from', cta: 'Scope a project', featured: true,
    items: ['Fixed scope, timeline and price', 'Baseline and final model comparison', 'Evaluation report and handover call', 'One-week model audits from $300'] },
  { name: 'Retainer', tagline: 'For teams with ongoing needs.', price: '$500', unit: '/ month', cta: 'Start a retainer', featured: false,
    items: ['Continuous experiments and retraining', 'Regular evaluation runs', 'Async-first communication', 'Pause or stop any month'] },
];

export const faqs = [
  { q: 'Do I need a lot of data?', a: "Not always. Scoping includes checking whether your data can support the model you want. If it can't, we'll suggest pretrained models, augmentation or a smaller first problem." },
  { q: 'Who owns the code and the model?', a: 'You do. The full repository, weights and documentation are yours at handover.' },
  { q: 'Can you work with sensitive data?', a: "Within limits. We can sign an NDA and work on anonymised or synthetic data. For regulated data such as patient records, we scope what's appropriate with you first." },
  { q: "What if the model doesn't hit the target?", a: "You still get the experiments, the baselines and an honest write-up of why. That is often worth more than a model that only looks good on paper." },
  { q: 'Do you build large production systems?', a: "We focus on prototypes, evaluation and well-scoped models. For large production systems we'll be upfront about fit and can work alongside your engineers." },
];

