# 3Jongi

A self-study companion for **King Sejong Institute Korean** — short, per-unit quizzes that reinforce each unit of the textbook as you work through it. (*종이 · jongi* = "paper".)

## What this is

3Jongi is a small web app (GitHub Pages) offering unit-by-unit quizzes that **complement, not replace,** *세종학당 한국어 1* (and later Book 2): vocabulary recall, grammar checks, and quick review to validate what you just studied.

**Status:** thin vertical slice scaffolded — one sample unit, a multiple-choice quiz, and localStorage progress, deployed to Pages.

## Structure

Built with **Nuxt 4 + @nuxt/ui**, shipped as a prerendered static site.

- `app/` — the Nuxt app: pages, components, composables, and theme.
- `core/` — framework-agnostic domain logic, storage/content **ports** (interfaces), and their adapters. Kept free of Nuxt so it stays unit-testable and lets a real backend slot in behind the same interfaces later.
- `.github/workflows/deploy.yml` — builds and deploys to Pages on push to `main`.

```
npm install     # install deps
npm run dev      # local dev server
npm test         # domain + storage unit tests
npm run generate # static build → .output/public
```

## Roadmap

- [ ] Per-unit quiz UI — multiple choice, matching, type-the-word recall
- [ ] Grammar-point checks per unit
- [ ] Progress tracking (localStorage)
- [ ] Generate quiz items from the private materials with AI → review → publish originals here
- [ ] Extend to Book 2
