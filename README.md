# gradient-works-ai.github.io

The Gradient Works studio site, live at https://gradient-works-ai.github.io.

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
  data/site.ts        all copy: services, steps, lab models, pricing, FAQ, links
  components/         one Astro component per section
  lib/ascii.ts        ASCII renderer and every animated figure
  lib/field.ts        cursor-reactive ASCII field behind the hero
  lib/motion.ts       Lenis, preloader, reveals, pinned process, cursor, magnetic buttons
  lib/process.ts      the Fig. 02 terminal
  lib/ui.ts           command palette (⌘K), slideshow, copy email, anchors
```

## Add a model to the Lab

Add an entry to `lab` in `src/data/site.ts` with its repo URL. `art` picks the ASCII figure. To give a model its own figure, add a renderer in `src/lib/ascii.ts` keyed by a new id.

Built by [Manas Dasari](https://www.algorithmicbit.tech/).
