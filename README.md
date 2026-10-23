# gradient-works-ai.github.io

The Gradient Works studio site, live at https://gradientworksai.in (served by GitHub Pages from this repo).

## Stack

- [Astro](https://astro.build) for static output, components and type-checked builds
- [GSAP](https://gsap.com) with ScrollTrigger, SplitText and ScrambleText for motion
- [Lenis](https://lenis.darkroom.engineering) for smooth scrolling
- Geist and Geist Mono, self-hosted through Fontsource
- GitHub Actions deploys every push to `main` to GitHub Pages

## Develop

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check, then build to dist/
npm run preview
```

## Layout

```
src/
  data/site.ts        all copy and settings: nav, services, steps, handover, lab, pricing, FAQ, form key
  pages/              / services/ process/ lab/ lab/[slug]/ pricing/ contact/ contact/thanks/
  layouts/Page.astro  shared shell: header, ⌘K palette, footer
  components/         one Astro component per section
  lib/backdrop.ts     WebGL background shader
  lib/ascii.ts        ASCII renderer and every animated figure
  lib/field.ts        cursor-reactive ASCII field behind the hero
  lib/motion.ts       Lenis smooth scroll, reveals, process steps, counters, footer wordmark
  lib/process.ts      the process-page terminal
  lib/form.ts         three-step project brief (Web3Forms, email fallback)
  lib/ui.ts           command palette, slideshow, file tree, copy email, footer clock
  lib/click.ts        button click sound
```

## Project brief form

`/contact/` sends briefs through [Web3Forms](https://web3forms.com) using `formKey` in `src/data/site.ts`. If the key is empty or the request fails or takes longer than 12 seconds, the form offers a pre-filled email instead.

## Social preview

`public/og.png` (1200×630) is the link-preview image for every page.

## Add a model to the Lab

Add an entry to `lab` in `src/data/site.ts`; it gets a page at `/lab/<slug>/`. Set `repo` once the model is public. `art` picks the ASCII figure. To give a model its own figure, add a renderer in `src/lib/ascii.ts` keyed by a new id.

Built by [Manas Dasari](https://www.algorithmicbit.tech/).
