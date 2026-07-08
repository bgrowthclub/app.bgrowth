# CLAUDE.md — BGrowth Engineering Foundation

This is the permanent development guide for `app.bgrowth`. Read this before
making any change. It exists so that every future contribution — human or
AI — reinforces the same architecture instead of drifting from it.

For the business story, see **VISION.md**. For system design detail, see
**ARCHITECTURE.md**. This file is the operating contract for *how we build*.

---

## 1. BGrowth Vision (summary)

BGrowth is the operating system for business growth — a single ecosystem
(Academy, Library, Club, Find, Marketplace, App, AI, Services) built around
one core product unit: the **Business System™**. This repository
(`app.bgrowth`) is the customer-facing surface for browsing, buying, and
*running* Business Systems in the browser. Full detail lives in VISION.md —
read it once before doing product-shaped work, not just code-shaped work.

## 2. Current Implementation Phase

This repo is a **static, client-only MVP**:

- React + Vite SPA. No backend, no database, no real authentication.
- Business System catalog data is hardcoded TypeScript (`src/data/`),
  standing in for a future export from **BGrowth Studio**.
- "Member" vs "public" state is a route-prefix visual switch only
  (`AppLayout.tsx`) — there is no session, no login.
- Module field values (checklists/planners a user fills in) live in
  transient React state only. Nothing persists. "Save PDF" is the browser's
  native print dialog.
- Purchases are simulated with a hardcoded slug list in `MySystems.tsx`.

**Do not silently upgrade this phase.** If a task implies adding real auth,
a database, or a payments backend, stop and confirm scope with the user
first — that is a phase change, not a bug fix. See ARCHITECTURE.md §"Future
Architecture" for how these should eventually be integrated.

## 3. Architecture Principles

1. **`src/` is the only real source tree.** The build (`tsconfig.json`
   `include: ["src"]`) only compiles `src/`. Nothing outside `src/` is ever
   part of the running app, regardless of what exists at the repo root.
2. **The Runtime reads data; it never authors it.** Business Systems are
   *displayed* by this app. They are *built* by BGrowth Studio, a separate
   product. No component in `src/components/runtime` or `src/pages` should
   ever mutate a `BusinessSystem`/`BusinessModule` definition.
3. **One data shape, one source of truth.** `src/types/system.ts` is the
   contract. Every page and component consumes it through the accessor
   functions in `src/data/systems.ts` (`getSystemBySlug`,
   `getModuleBySlug`, `getRelatedSystems`), never by reaching into the
   array directly. This is what lets the data source change (static file →
   fetched Studio export) without touching component code.
4. **Design tokens are the single source of truth for visual style.**
   `src/styles/tokens.css` defines every color/spacing/radius/shadow value;
   `tailwind.config.js` only references `var(--token)`. A hardcoded hex or
   px value that duplicates an existing token is a bug.
5. **Composition over duplication.** Shared layout (`Grid`,
   `SectionContainer`, `PageContainer`), shared motion (`src/lib/motion.ts`),
   and shared UI primitives (`src/components/ui`) exist specifically to stop
   repeated className strings and repeated animation variants. Use them.

## 4. Folder Organization

```
src/
  assets/           static files (logo, images)
  components/
    layout/         app chrome: AppLayout, Navbar, Footer, Grid, containers
    sections/       homepage-only marketing sections (Hero, Testimonials, ...)
    seo/            SEO.tsx — the only place <head> tags are managed
    systems/        presentational components aware of BusinessSystem/Industry
                     shapes (cards, badges, category icons) — used pre-purchase
    runtime/         the Business System Runtime — renders a system a member
                     is actively using (post-purchase experience)
    ui/             generic design-system primitives with no business meaning
                     (Button, Card, Badge, EmptyState, SearchBar, ...)
  data/             catalog data — stands in for a future Studio/CMS export
  lib/              shared non-component logic (motion.ts)
  pages/            one file per route; composes the above, adds <SEO>, does
                     param/slug lookup — pages should stay thin
  styles/           tokens.css (design tokens)
  types/            system.ts — the BusinessSystem data model
  App.tsx           route table
  main.tsx          app entry / providers (BrowserRouter)
```

**Known issue, do not treat as reference:** the repo root also contains a
stray, byte-identical duplicate set of files (`App.tsx`, `AboutPage.tsx`,
`components/`, `pages/`, `data/`, `types/`, etc.) left over from a past
extraction mistake. They are tracked in git but excluded from the TypeScript
build. Never read, edit, or copy-paste from these root-level files — always
work from `src/`. See the Recommendations section of the review below for
cleanup guidance (this file does not fix it automatically).

## 5. Component Rules

- **`ui/`** components must stay business-agnostic. If a `ui/` component
  starts importing from `types/system.ts`, it belongs in `systems/` instead.
- **`systems/`** components may know about `BusinessSystem`, `Industry`,
  `ModuleType`, etc., but must remain presentational — no routing decisions
  beyond an optional `to`/`ctaTo` prop, no data mutation.
- **`runtime/`** components compose `systems/` + `ui/` to render a live,
  in-progress Business System. This is the one place interactive field state
  is allowed to live (scoped to the page, e.g. `SystemModulePage`).
- **`sections/`** components are homepage-only. Don't reuse a `sections/`
  component on an inner page — extract the shared part into `systems/` or
  `ui/` first.
- **`pages/`** components orchestrate: read route params, look up data via
  the `data/systems.ts` / `data/industries.ts` accessors, render `<SEO>`,
  then delegate markup to components. A page file that contains large
  inline JSX blocks duplicated from another page is a signal to extract a
  component, not a page-specific pattern to keep.
- Before writing a new component, search `src/components/` for one that
  already does the job (see §11 Reuse Policy).

## 6. Routing Rules

- All routes are declared in one place: `src/App.tsx`. Never define routes
  inline elsewhere or introduce a second router.
- Every route renders inside `AppLayout` (`Navbar` + `Outlet` + `Footer`).
  Don't bypass `AppLayout` for a new page.
- `AppLayout` decides public vs. member nav purely from the URL prefix
  (`MEMBER_ROUTE_PREFIXES`). If you add a new member-area route, add its
  prefix there — don't invent a second, parallel mechanism.
- Before adding a link (`<Link>`/`<a>`/`to=`), verify the target route
  actually exists in `App.tsx`. Known pre-existing gaps (`/account`,
  `/privacy`, `/terms`, `/contact`) are linked but unrouted — do not copy
  this pattern for new links; either build the page or don't link it.
- Route param lookups (`useParams` + `getSystemBySlug`/`getModuleBySlug`)
  must always guard the "not found" case with `<Navigate to="/systems" />`,
  matching the existing pattern in `ProductPage`, `SystemOverviewPage`,
  `SystemModulePage`.

## 7. Data Rules

- `src/types/system.ts` is the canonical data model. Do not create a
  parallel or competing type for the same concept (e.g. a second
  "Product" or "Bundle" type) — extend `BusinessSystem`/`BusinessModule`
  or compose a new type around them.
- Mock/catalog data lives only in `src/data/`. Never duplicate a system,
  industry, or resource list inline in a page or component.
- Always read data through the exported accessor functions
  (`getSystemBySlug`, `getModuleBySlug`, `getRelatedSystems`,
  `getIndustrySystemCount`), not by importing `SYSTEMS`/`INDUSTRIES` and
  indexing directly, except inside `data/systems.ts` and
  `data/industries.ts` themselves.
- The commerce fields on `BusinessSystem` (`price`, `memberPrice`,
  `checkoutUrl`, `whatsIncluded`) are explicitly *not* part of a Studio
  export (see the comment block at the top of `types/system.ts`). Don't
  assume every future data source will populate them — code that reads
  them should tolerate a Studio-only system that lacks commerce fields once
  that split happens (see ARCHITECTURE.md).
- Never hardcode a Business System's content (modules, sections, fields)
  inside a component. If a component needs Business-System-shaped content
  to render, it takes that content as a prop from `data/systems.ts`.

## 8. Business System Philosophy

- A **Business System™** is a purchasable bundle: marketing metadata
  (industry, category, price, benefits, reviews, FAQ) plus one or more
  **Business Modules** (`Planner™`, `Workflow™`, `Toolkit™`, etc.), each made
  of **Sections** of **Fields** the member fills in.
- This app is the **Runtime**: it displays and runs a Business System. It
  never builds one. Building happens in **BGrowth Studio** — a separate
  product outside this repo (Checklist Builder, Planner Builder, Workflow
  Builder, Template Builder).
- Never hardcode a Business System as a one-off page or component. Every
  system, regardless of industry, must render through the same
  `BusinessSystemRuntime` → `SystemModulePage` pipeline, driven entirely by
  data. If a new industry "needs its own page," that's a sign the data
  model is missing a field — extend the type, don't fork the Runtime.
- The internal value `'Checklist'` (a `ModuleType`) must **never** appear as
  rendered copy — it always displays as `"Planner™"`. This mapping lives in
  exactly one place: `MODULE_TYPE_CONFIG` in
  `src/components/systems/ModuleBadge.tsx`. Never re-derive or duplicate
  this mapping elsewhere.

## 9. Naming Conventions

- Customer-facing product nouns carry a trademark symbol in copy:
  *Business Systems™*, *Resources™*, *Planner™*, *Workflow™*, *Toolkit™*,
  *Templates™*, *Guide™*, *Calculator™*, *Document™*, *Video™*, *Link™*,
  *AI Module™*. This is a deliberate brand convention — preserve it in any
  new customer-facing copy; don't add it to internal-only code identifiers.
- Components: PascalCase, one component per file, file name matches the
  default export (`BusinessSystemCard.tsx` exports `BusinessSystemCard`).
- Types/interfaces: PascalCase nouns matching the domain
  (`BusinessSystem`, `SystemField`, `ModuleType`). Data constants:
  SCREAMING_SNAKE_CASE (`SYSTEMS`, `CATEGORIES`, `MODULE_TYPE_CONFIG`).
- Routes/slugs: kebab-case, matching `BusinessSystem.slug` /
  `BusinessModule.id` values used as URL segments.

## 10. UI Standards

- All color, spacing, radius, and shadow values come from
  `src/styles/tokens.css`. Add a token before adding a one-off value.
- Reuse the existing component classes in `src/index.css`
  (`.btn-primary`, `.btn-secondary`, `.badge`, `.eyebrow`, `.glass-card`,
  `.container-px`, `.section-py`) instead of re-implementing their styles
  with raw utility strings.
- Reuse `Grid` for any responsive card grid instead of writing
  `grid gap-5 sm:grid-cols-2 lg:grid-cols-3` inline again.
- Reuse the shared motion variants in `src/lib/motion.ts`
  (`fadeUp`, `fadeIn`, `viewportOnce`, `floatY`) instead of redefining
  Framer Motion variants per component. Keep animation subtle — this
  codebase deliberately uses short durations and small offsets; don't
  introduce flashy motion.
- Respect `prefers-reduced-motion` (already handled globally in
  `index.css`) and print styles (`.no-print`, `@media print`) — any new
  interactive chrome on a system/module page needs a `.no-print` treatment
  if it shouldn't appear when printed/saved as PDF.
- Per Task instructions for this engineering-foundation pass specifically:
  **do not redesign or restyle any existing page.** UI changes are only
  acceptable when a task cannot be completed without one, and should reuse
  existing tokens/classes rather than introducing new visual language.

## 11. Reuse Policy

Before creating anything new, check for an existing one:

- New card/grid layout → check `src/components/ui/` and
  `src/components/systems/` first.
- New icon-by-category mapping → extend `categoryIcons.ts`, don't create
  a second mapping.
- New badge/label → extend `ModuleBadge`/`Badge`, don't create a parallel
  badge component.
- New animation → check `src/lib/motion.ts` first.
- New page section → check `src/components/sections/` (homepage) or
  `src/components/systems/` (system-related) before writing new JSX.
- New data field → check whether `types/system.ts` already models it
  before adding a new type.

If something truly doesn't exist, build the smallest addition that fits the
existing pattern, and prefer extending an existing file over creating a new
one when the addition is small and closely related.

## 12. Build Requirements

- `npm run build` (`tsc && vite build`) must pass with zero errors before
  any change is considered done. `tsconfig.json` uses `strict: true` —
  do not weaken strictness to make an error disappear.
- There is currently no test suite and no linter configured in this repo.
  Do not silently add one as part of an unrelated task — if you believe one
  is needed, say so and let the user decide (see Recommendations below).
- Manually verify routing and rendering for any touched page — there is no
  automated test coverage to catch a broken route or a bad import.

## 13. Git Workflow

- Commit messages in this repo follow a "Sprint N — theme" convention for
  batches of work (e.g. "Sprint 5 - Member Experience Foundation"); smaller
  fixes use a plain descriptive message. Match whichever granularity fits
  the change.
- Never commit `node_modules/` or `dist/` (see Recommendations — this rule
  is currently violated by repo history and should be fixed deliberately,
  not incidentally, as part of an unrelated commit).
- Never force-push, rewrite history, or delete branches without explicit
  user instruction.

## 14. Definition of Done

A change is done only when:

1. It lives entirely under `src/` (or is a root-level project config file
   that legitimately belongs at the root, e.g. `vite.config.ts`,
   `tailwind.config.js`).
2. It reuses existing components/tokens/data accessors wherever one already
   fits, per §11.
3. `npm run build` succeeds with zero TypeScript or Vite errors.
4. Every new/changed route is reachable from `App.tsx` and every link to it
   resolves.
5. No hardcoded Business System content, no duplicated mock data, no new
   parallel data model.
6. No unrelated UI/design changes were introduced.
7. The change is described accurately (no undocumented scope creep) so the
   next person — human or AI — can trust this file's description of the
   system.

## 15. Things Claude Should NEVER Do

- Never create a duplicate Business System data model or a second catalog
  array — extend `src/types/system.ts` and `src/data/systems.ts`.
- Never create files outside `src/` (excluding legitimate root config).
- Never hardcode a Business System, industry, or module as bespoke
  JSX/markup — it must flow through the data-driven Runtime.
- Never duplicate mock data across files — one array, one source, imported
  everywhere it's needed.
- Never introduce a second router, a second design-token source, or a
  second animation-variants file.
- Never let the word "Checklist" reach rendered UI copy — only
  `MODULE_TYPE_CONFIG` may perform that mapping.
- Never add real authentication, persistence, or payment integration
  without explicit user direction — this repo's current phase is
  intentionally static/client-only.
- Never edit or reference the stray root-level duplicate files
  (`/App.tsx`, `/components`, `/pages`, `/data`, `/types`, etc.) — treat
  `src/` as the only real tree.
- Never build new pages, redesign existing pages, or change the UI beyond
  what a task strictly requires.
- Never finish a task without running `npm run build` and confirming it
  passes.
- Never skip verifying that new routes/links actually resolve in
  `App.tsx`.
- Never bypass this file's rules "just this once" — if a task seems to
  require it, stop and ask the user first.
