# Repair Report — app.bgrowth

## Root cause

Sprint 3 and Sprint 4 never actually made it into `src/`. `src/` was still
frozen at the *Platform v1* state. Two separate mistakes stacked on top of
each other:

1. **Sprint 3's zip** (`components/runtime/`, `pages/`, `data/`, `types/`)
   got extracted **one directory level too shallow** — its contents landed
   directly at the repo root instead of inside `src/`.
2. **Sprint 4's individually-delivered files** (`AboutPage.tsx`,
   `IndustriesPage.tsx`, `Footer.tsx`, `SEO.tsx`, etc.) were dropped flat at
   the repo root as well, instead of their proper `src/pages/`,
   `src/components/ui/`, `src/components/layout/`, `src/data/` locations.

On top of that, **`node_modules` (127MB, 7,351 files) and `dist` were
committed to git** with no `.gitignore` at all.

None of this actually broke `npm run build` by itself — `tsconfig.json`'s
`include: ["src"]` meant TypeScript quietly ignored all the stray files, so
the build "succeeded" while silently building the *old* Platform v1 site.
Sprint 3's Runtime and Sprint 4's public pages effectively never shipped.

I also found two things I told you last sprint were "already done" that
weren't — I was checking my own local working copy, not your actual repo:
`Navbar.tsx` and `HowItWorks.tsx` were never updated, and `src/data/
industries.ts` didn't exist at all, which meant `IndustriesPage.tsx` had a
broken import waiting to surface the moment it was actually wired in.
Apologies for that — fixed as part of this repair.

## What this delivery is

This is the **entire corrected project** — not a diff. Replace your repo's
contents with this (keep your `.git` folder; everything else can be
overwritten) and it's ready to commit.

## Files changed

**New**
- `.gitignore` — excludes `node_modules`, `dist`, `.DS_Store`
- `src/data/industries.ts` — recreated; this file never existed in the repo

**Merged from the stray root `components/`/`pages/`/`data`/`types/`
folders into their correct `src/` locations** (Sprint 3, previously
disconnected from the build):
- `src/components/runtime/*.tsx` (11 files)
- `src/components/sections/FeaturedSystems.tsx`
- `src/components/systems/BusinessSystemCard.tsx`, `FeatureCard.tsx`,
  `ModuleBadge.tsx`
- `src/components/ui/FeatureGrid.tsx`
- `src/pages/BrowseSystems.tsx`, `MySystems.tsx`, `ProductPage.tsx`,
  `SystemOverviewPage.tsx`, `SystemModulePage.tsx`
- `src/data/systems.ts`
- `src/types/system.ts`
- **Removed**: `src/pages/InteractiveSystem.tsx` (superseded by
  `SystemOverviewPage` + `SystemModulePage`)

**Merged from the loose root `.tsx`/`.ts` files into their correct `src/`
locations** (Sprint 4, previously disconnected from the build):
- `src/pages/AboutPage.tsx`, `IndustriesPage.tsx`, `PricingPage.tsx`,
  `ResourcesPage.tsx`
- `src/components/ui/ArticleCard.tsx`, `PricingTierCard.tsx`
- `src/components/seo/SEO.tsx`
- `src/components/layout/Footer.tsx`, `ScrollToTop.tsx`
- `src/data/resources.ts`
- `src/App.tsx` (now has all 10 routes: `/`, `/systems`, `/product/:slug`,
  `/my-systems`, `/system/:slug`, `/system/:slug/module/:moduleSlug`,
  `/industries`, `/resources`, `/pricing`, `/about`)

**Actually fixed this round** (previously reported as "already done," but
weren't, in your real repo):
- `src/components/layout/Navbar.tsx` — added "Home" link; Industries/
  Resources/Pricing/About now point to real routes instead of homepage
  anchors (`/#industries` etc.); primary CTA changed to "Join BGrowth Club"
  → `/pricing`
- `src/components/sections/HowItWorks.tsx` — Step 3 replaced with the exact
  wording from the brief ("Download, Print or Reuse" — no cloud-storage or
  permanence implication)
- `src/components/systems/IndustryCard.tsx` — added the optional `count`/
  `ctaLabel` props `IndustriesPage.tsx` needs (homepage teaser usage is
  visually unchanged since those props are optional)

## Verified

- `rm -rf node_modules dist && npm install` — clean install, no errors
- `npm run build` (`tsc && vite build`) — **zero errors**, 1917 modules
  transformed
- Every internal `to=`/`href=` target in `src/` cross-checked against the
  routes defined in `App.tsx` — all resolve. (`/account`, `/privacy`,
  `/terms`, `/contact` are linked from the Member nav / footer but have no
  page yet — that's a pre-existing, disclosed gap from Sprint 4, not part
  of this repair's scope, and won't break the build; they render blank
  under the nav/footer until those pages are built.)
- Grep sweep: the word "Checklist" appears only in code comments and the
  one deliberate `ModuleBadge` label override — never in rendered copy.

## Dependencies

**None added.** `react-router-dom` was already correctly listed in
`package.json` — the missing pieces were entirely file placement, not
missing packages.
