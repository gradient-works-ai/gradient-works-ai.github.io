export const site = {
  name: 'Gradient Works',
  url: 'https://gradient-works-ai.github.io',
  description: 'Gradient Works is an applied AI studio that designs, trains and tests custom machine learning models for startups, labs and small teams.',
  email: 'dasarimanas049@gmail.com',
  github: 'https://github.com/gradient-works-ai',
  author: { name: 'Manas Dasari', url: 'https://www.algorithmicbit.tech/' },
};

export const mailto = `mailto:${site.email}?subject=Project%20enquiry`;

export const nav = [
  { id: 'services', label: 'Services' },
  { id: 'process', label: 'Process' },
  { id: 'lab', label: 'Lab' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
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
    title: 'Scope', cmd: 'gw scope --problem "package defects" --data ./images',
    body: 'A free 30-minute call. We agree on the problem, the metric and what "good enough" means before any code is written.',
    out: ['✓ 4,812 labelled images · 4 classes', '✓ metric: macro-F1 ≥ 0.85 on a held-out set'],
  },
  {
    title: 'Baseline', cmd: 'gw baseline',
    body: 'The simplest model that could work, so every later gain is measured against something real.',
    out: ['logistic_regression     macro-F1  0.61', 'resnet18 (frozen)       macro-F1  0.74'],
  },
  {
    title: 'Iterate', cmd: 'gw train --sweep 24',
    body: 'Tracked experiments, shared weekly. You see the dead ends as well as the wins.',
    out: ['[████████████████████████] 24/24 runs', 'best  efficientnet_b0   macro-F1  0.88'],
  },
  {
    title: 'Evaluate', cmd: 'gw eval --held-out --slices lighting,camera',
    body: 'Held-out testing, failure analysis and robustness checks, written up in plain language.',
    out: ['✓ held-out              macro-F1  0.87', '! low-light slice       macro-F1  0.71  → flagged'],
  },
  {
    title: 'Ship', cmd: 'gw ship',
    body: 'Code, weights, documentation and a handover call. You own everything.',
    out: ['✓ code · weights · report.pdf · handover call booked'],
  },
];

// One entry per model. Each gets a page at /lab/<slug>; `art` picks the ASCII figure on its card.
// Set `repo` once the model is public and the page will link to it.
export const lab = [
  { slug: 'neurodial', name: 'NeuroDial', meta: 'EEG classification · In progress', status: 'Training', art: 'aHead', repo: '',
    blurb: 'An EEG signal classification pipeline for medical research workflows: preprocessing, channel-aware models and a clinician-readable evaluation report.' },
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

export const wordmark = String.raw`
 ███  ████   ███  ████  █████ █████ █   █ █████     █   █  ███  ████  █  █   ████
█     █   █ █   █ █   █   █   █     ██  █   █       █   █ █   █ █   █ █ █   █
█ ███ ████  █████ █   █   █   ████  █ █ █   █       █ █ █ █   █ ████  ██     ███
█   █ █  █  █   █ █   █   █   █     █  ██   █       ██ ██ █   █ █  █  █ █       █
 ███  █   █ █   █ ████  █████ █████ █   █   █       █   █  ███  █   █ █  █  ████`.slice(1);
