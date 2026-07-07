# Changelog — Platform v1 (page redesign + component library expansion)

Scope: the actual visual redesign pass the last sprint deferred. All 5 pages
now use the new component library. The interactive form engine
(`SystemSectionBlock.tsx`) was **not touched** — only the shell around it.

## Design tokens
- `src/styles/tokens.css` — Dark Navy updated `#071A52` → `#0A1B4D` per the
  new brand spec. Everything else (`primary`, radii, shadows) is unchanged
  and derives from this one file as before.

## New reusable components
```
src/components/ui/
  SectionHeader.tsx   — renamed from SectionTitle; added an optional
                          `action` slot (e.g. a button beside the title)
  EmptyState.tsx       — no-results / no-purchases state
  FilterPill.tsx        — toggleable filter pill (category, module type)
  FeatureGrid.tsx       — Grid + FeatureCard, one call instead of a manual map
  PricingCard.tsx       — price + "Get {system}" button + member-discount box
  MemberBanner.tsx      — the glass CTA card, extracted so it's reusable
                          beyond just the homepage
  SearchToolbar.tsx     — search input + sort dropdown + a slot for filter
                          pill rows

src/components/systems/
  ModuleBadge.tsx        — small badge per module type (Planner™/Workflow™/
                          Toolkit™/Resource™/Template™/Guide™), each with
                          its own icon
  IndustryCard.tsx        — card for the homepage Industries section
  BusinessSystemCard.tsx  — replaces SystemCard.tsx. Two variants:
                          `grid` (Browse Systems, My Systems, Related
                          Systems) and `horizontal` (Featured Systems on
                          the homepage — "large horizontal cards" per brief)
  TestimonialCard.tsx     — renamed from ReviewCard.tsx (same component,
                          new name to match the requested library)
```

## Removed / renamed
- `components/systems/SystemCard.tsx` → `BusinessSystemCard.tsx`
- `components/systems/ReviewCard.tsx` → `TestimonialCard.tsx`
- `components/ui/SectionTitle.tsx` → `SectionHeader.tsx`
- `components/sections/BusinessCategories.tsx` → `Industries.tsx` (now
  uses `IndustryCard`, and the 8 industries from the brief: Legal,
  Cleaning, Home Services, Financial, Real Estate, Transportation,
  Personal Services, Construction — instead of the old category list)
- `components/sections/JoinClub.tsx` → `BecomeMember.tsx` (same waitlist
  form, now built on the reusable `MemberBanner`)

## Data model — new fields (additive, nothing removed)
`src/types/system.ts` and `src/data/systems.ts`:
- `BusinessSystem.difficulty: 'Beginner' | 'Intermediate' | 'Advanced'`
- `BusinessSystem.memberPrice: number` — feeds the new member-discount box
- `BusinessSystem.audience: string[]` — powers the new "Who Is This For" section
- `BusinessSystem.relatedSlugs: string[]` — powers the new "Related Systems" section
- `getRelatedSystems(system)` helper added alongside the existing
  `getSystemBySlug`.

## Naming-rule fix (important)
The brief tightened the rule: **Planner/Workflow/Guide/Checklist/Worksheet
can only be module names, never a Business System's own product name.** Two
existing top-level products broke this (inherited from the last sprint,
before the rule was this specific):
- `Notary Equipment Planner™` (product) → renamed to **`Notary Equipment
  System™`**. The module inside it is still called "Notary Equipment
  Planner™" — that's correct, modules are exactly where that word belongs.
- `Notary Signing Agent Workflow™` (product) → renamed to **`Notary
  Signing Agent System™`**, same reasoning.

Slugs were left unchanged (`notary-equipment-planner`,
`notary-signing-agent-workflow`) so no links break — only the display
`name` changed. Verified with a grep: all 6 top-level product names are now
clean; the words only appear on module-level names.

## Page-by-page changes
- **Home** (`HomePage.tsx`): Hero copy updated to "Business Systems Built
  for Service Professionals" / "Launch faster. Operate smarter. Grow with
  confidence." with CTAs "Browse Systems" + "How It Works" (anchors to the
  new `#how-it-works` section). New section order: Hero → Industries →
  Featured Systems (now large horizontal cards) → How It Works (new 3-step:
  Choose → Complete Interactive Modules → Print or Save PDF) → Testimonials
  → Become a Member.
- **Browse Systems** (`BrowseSystems.tsx`): full rebuild — `SearchToolbar`
  (search + sort: Featured/Price ↑/Price ↓/Name), industry filter pills,
  **new module-type filter** (Planner™/Workflow™/Toolkit™/etc., derived from
  `ComponentType`), `BusinessSystemCard` grid, `EmptyState` on no results.
- **Product Page** (`ProductPage.tsx`): expanded to match the brief —
  Hero + interactive preview, **Modules Included** (each module as a card
  with its `ModuleBadge`), What's Included, Resources™, **Benefits**
  (`FeatureGrid`), **Who Is This For** (`audience`), **Related Systems**
  (`BusinessSystemCard` grid via `getRelatedSystems`), Customer Reviews
  (`TestimonialCard`, with an `EmptyState` fallback), FAQ, and a
  **`PricingCard`** at the bottom with the member-discount box.
- **My Systems** (`MySystems.tsx`): now uses `BusinessSystemCard`-style
  cards via `Grid`, button renamed "Open System" → **"Continue"** per
  brief, `EmptyState` for the no-purchases case.
- **Interactive System** (`InteractiveSystem.tsx`): shell redesign only —
  `SystemSectionBlock.tsx` (the form engine) is byte-for-byte what it was
  last sprint.
  - **Module navigation**: when a system bundles more than one component
    (currently only Start Your Notary Business™), pills let you switch
    between them. Field values are scoped per-component
    (`Record<componentId, FieldValues>`) so switching modules can't leak
    one module's answers into another with the same field id.
  - **Progress indicator**: a simple "Module X of Y" label — position in
    the bundle, not a saved/tracked completion percentage. Nothing persists.
  - **Resources panel**: slide-out drawer (`PanelRight` button) showing
    `system.resources` for quick reference while filling out the form.
  - Button renamed "Reset" → **"Restart"**, now clears only the active
    module's values, not the whole system.

## Verified
- `npx tsc --noEmit` — clean.
- `npx vite build` — clean production build.
- Grep sweep confirms no product-level name uses Planner/Workflow/Guide/
  Checklist/Worksheet — only module names do.
