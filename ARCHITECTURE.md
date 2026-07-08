# ARCHITECTURE.md — BGrowth System Architecture

This document describes how `app.bgrowth` is built today and how it is
expected to evolve as the rest of the BGrowth ecosystem (see VISION.md)
comes online. For day-to-day rules and conventions, see CLAUDE.md.

---

## 1. Current Architecture

**Stack:** React 18 + TypeScript (strict) + Vite 5 + Tailwind 3 +
React Router 6 + Framer Motion + Lucide icons. Deployed as a static SPA
(Vercel, with a catch-all rewrite to `index.html` in `vercel.json`).

**Shape:** a single-page app with no backend. Everything the app needs —
the Business System catalog, industries, resources — is bundled at build
time as TypeScript data. There is no API layer yet; "data fetching" today
is a synchronous import.

```
Browser
  └─ React Router (client-side routing, BrowserRouter)
       └─ AppLayout (Navbar + Outlet + Footer)
            └─ Pages (src/pages/*)
                 ├─ read route params
                 ├─ look up data (src/data/*, via accessor functions)
                 ├─ render <SEO> (document head only, no SSR)
                 └─ compose components (sections / systems / runtime / ui)
```

There is no server, no database, no auth provider, and no payment
integration in this repository. Where those concerns show up in the UI
(Login, checkout, Account), they are visual placeholders or external links
— explicitly not implemented here yet (see §5, §6, §8).

## 2. Business System Runtime

The Runtime is the core piece of architecture in this repo: the part of
the app that takes a data-described **Business System** and turns it into
a working, interactive experience in the browser.

**Data model** (`src/types/system.ts`):

```
BusinessSystem
 ├─ marketing/catalog fields (industry, category, type, difficulty, price…)
 ├─ benefits[], whoIsFor[], resources[], affiliatePartners[], reviews[], faq[]
 ├─ relatedSystems: string[]  (slugs — resolved via getRelatedSystems)
 └─ modules: BusinessModule[]
       ├─ type: ModuleType ('Planner' | 'Workflow' | 'Toolkit' | ... )
       └─ content: SystemSection[]
             └─ fields: SystemField[]  (checkbox | text | date | textarea)
```

**Rendering pipeline:**

- `SystemOverviewPage` (`/system/:slug`) → `BusinessSystemRuntime` — the
  system's home once "purchased": header, overview/benefits, a grid of its
  modules, resources, affiliate partners, reviews, FAQ, related systems.
- `SystemModulePage` (`/system/:slug/module/:moduleSlug`) — the actual
  working surface. Renders each `SystemSection` via `SystemSectionBlock`,
  holds field values in local component state, and offers Print/Save PDF
  (`window.print()`) and Restart (clears local state). Nothing is
  persisted; a fresh page load always starts clean.
- `ProductPage` (`/product/:slug`) is the **pre-purchase** counterpart —
  same data, non-interactive preview (`BusinessModuleGrid
  actionable={false}`), plus marketing sections and a `PricingCard`.

**Design invariant:** the Runtime is entirely data-driven. There is
exactly one rendering pipeline for every Business System regardless of
industry — a new notary system and a new cleaning system both flow through
the same `BusinessSystemRuntime`/`SystemModulePage` components, distinguished
only by their data. Adding an industry should never require a bespoke page.

**Brand mapping:** the Studio-authored `ModuleType` value `'Checklist'` is
deliberately remapped to the display label `"Planner™"` in exactly one
place — `MODULE_TYPE_CONFIG` in `ModuleBadge.tsx`. This is the only
place in the entire rendering pipeline allowed to change how a module type
is labeled.

## 3. Studio Integration (Future)

**BGrowth Studio** is a separate, not-yet-integrated product responsible
for *authoring* Business Systems: a Checklist Builder, Planner Builder,
Workflow Builder, and Template Builder. Studio is where a system's modules,
sections, and fields are actually created and edited.

Today, `src/data/systems.ts` plays Studio's role by hand — it is a static
TypeScript array shaped exactly like a Studio export would be. The type
comments in `types/system.ts` are explicit about this: *"the shape a
Business System is exported from BGrowth Studio in... swapping the source
for a fetched JSON export from Studio later is a data-loading change, not a
type or component change."*

**Integration path, when Studio exists:**

1. Studio exports a `BusinessSystem[]` (or paginated equivalent) matching
   `types/system.ts`, minus the Runtime/commerce-only fields (see §6).
2. Replace the static import in `data/systems.ts` with a fetch/query layer
   behind the *same* accessor function signatures (`getSystemBySlug`,
   `getModuleBySlug`, `getRelatedSystems`) so no calling component changes.
3. Commerce fields (`price`, `memberPrice`, `checkoutUrl`,
   `whatsIncluded`) get attached by the Runtime/commerce layer after
   fetching the Studio export, not embedded in Studio's own data — this is
   the natural point to split them into a separate type (see §6).
4. The Runtime's rendering code (`BusinessSystemRuntime`,
   `SystemModulePage`, etc.) should require **no changes** — this is the
   architectural bet this repo has already made, and it should be honored.

## 4. Future API Layer

There is no API layer today. When one is introduced, it should sit exactly
where `src/data/*.ts` sits conceptually — behind the existing accessor
function boundary:

- `getSystemBySlug`, `getModuleBySlug`, `getRelatedSystems`,
  `getIndustrySystemCount` become async (or are wrapped in a data-fetching
  hook), but keep the same names and shapes as much as possible.
- Pages already call these functions rather than importing raw arrays
  (per CLAUDE.md §7), so the migration to async data is expected to touch
  the data layer and add loading/error states to pages — not rewrite
  component trees.
- A real API layer should also be the natural home for search/filter
  (currently done client-side in `BrowseSystems.tsx` over the full static
  array) once the catalog is too large for that to scale.

## 5. Authentication (Current & Future)

**Current:** none. `AppLayout.tsx` switches the Navbar between `'public'`
and `'member'` link sets purely based on the URL prefix
(`MEMBER_ROUTE_PREFIXES = ['/my-systems', '/system/']`). The "Login"
control in the public nav is a non-interactive visual placeholder. There is
no session, no token, no protected route.

**Future integration point:** authentication should wrap `AppLayout` (or
sit above the router) as a real session/identity provider, and
`isMemberRoute`/`MEMBER_ROUTE_PREFIXES` should be replaced by genuine route
protection driven by session state — but the *visual* public/member nav
split already in place should be preserved as the UI contract, not
redesigned, when auth is added.

## 6. Commerce

**Current:** commerce fields (`price`, `memberPrice`, `checkoutUrl`,
`whatsIncluded`) live directly on `BusinessSystem`, populated as static
data. "Purchase" is a link to an external `checkoutUrl`
(`checkout.bgrowth.com/...`) — no checkout flow exists in this repo.
"Owned" systems in `MySystems.tsx` are a hardcoded slug list, not derived
from any real purchase record.

**Future integration point:** as noted in `types/system.ts`'s own comments,
these fields are explicitly *not* part of a Studio export — they belong to
the Runtime/commerce concern. When real commerce arrives (BGrowth
Marketplace, real checkout, membership billing), the expected evolution is:

- Split commerce fields into a dedicated type (e.g. `SystemOffer` or
  `CommerceListing`) keyed by `BusinessSystem.slug`, rather than growing the
  core `BusinessSystem` type further.
- Replace the hardcoded `PURCHASED_SLUGS` list in `MySystems.tsx` with a
  real purchase/entitlement lookup against the member's account.
- Replace the external `checkoutUrl` link with an in-app or embedded
  checkout, without changing how `ProductPage`/`PricingCard` present price.

## 7. Marketplace, App Modules, and Community

These are ecosystem products described in VISION.md that do not yet have
code in this repository:

- **Marketplace** — today represented only as `AffiliatePartner` links
  (`AffiliatePanel`) inside a Business System and as a flat "Recommended
  Tools"/"Affiliate Partners" list on the Resources page. A real
  Marketplace would formalize these as its own catalog/listing model,
  likely reusing the same card/grid UI primitives (`systems/`, `ui/Grid`)
  already established here.
- **App modules** — `ModuleType` already includes forward-looking values
  not yet exercised by any system in the data (`Document`, `Calculator`,
  `Video`, `ExternalLink`, `AIModule`). New module types should be added to
  this enum and given a `SystemSectionBlock`/`ModuleBadge` treatment rather
  than becoming a special-cased page.
- **Community** — no representation in this repo yet. If/when it arrives
  (per Club's roadmap), it should integrate as its own route group under
  `AppLayout`, following the same layout/nav conventions as `/my-systems`,
  rather than a standalone experience with different chrome.

## 8. Data Flow

```
src/data/systems.ts (static array)
        │  getSystemBySlug / getModuleBySlug / getRelatedSystems
        ▼
src/pages/*.tsx  (route params → data lookup → not-found guard)
        │  props
        ▼
components/runtime/* , components/systems/* , components/ui/*
        │  local React state only (field values, UI toggles)
        ▼
Rendered DOM  →  window.print() for Save/Print (no network, no persistence)
```

There is currently no write path back into the data layer anywhere in the
app — the Runtime is strictly read-only over the catalog data, and field
input state is local and ephemeral by design (see CLAUDE.md §2, §8).

## 9. Folder Organization

See CLAUDE.md §4 for the authoritative folder map and the note about the
stray, non-authoritative root-level duplicate files. This document assumes
`src/` as the only real tree.

## 10. Component Hierarchy

```
AppLayout
 ├─ Navbar (mode: public | member)
 ├─ Outlet → one of:
 │   HomePage        → sections/*
 │   BrowseSystems    → ui/SearchToolbar, ui/FilterPill, systems/BusinessSystemCard
 │   IndustriesPage   → systems/IndustryCard
 │   ProductPage      → systems/*, runtime/BusinessModuleGrid(actionable=false),
 │                       runtime/ReviewPanel, runtime/FAQPanel,
 │                       runtime/RelatedSystemsPanel, ui/PricingCard
 │   SystemOverviewPage → runtime/BusinessSystemRuntime
 │                          ├─ runtime/BusinessSystemHeader
 │                          ├─ runtime/BusinessSystemOverview
 │                          ├─ runtime/BusinessModuleGrid → runtime/BusinessModuleCard
 │                          ├─ runtime/ResourcePanel / AffiliatePanel /
 │                          │   ReviewPanel / FAQPanel / RelatedSystemsPanel
 │   SystemModulePage → runtime/RuntimeNavigation,
 │                       systems/SystemSectionBlock, systems/ModuleBadge,
 │                       systems/ResourceCard
 │   MySystems, PricingPage, ResourcesPage, AboutPage → mix of ui/* + systems/*
 └─ Footer
```

Every branch bottoms out in `components/ui/*` primitives (`Button`, `Card`,
`Badge`, `SectionHeader`, `Grid`, ...) — no page or feature component should
reimplement what a `ui/` primitive already provides.

## 11. How Future Modules Should Integrate

Any new capability — a new module type, a new ecosystem product surface,
a new data source — should be evaluated against these questions before
writing code:

1. **Does it fit the existing `BusinessSystem`/`BusinessModule` shape?** If
   yes, extend the type in `types/system.ts` and add data — don't build a
   parallel content model.
2. **Does it need its own route?** If yes, it's a new entry in `App.tsx`
   under `AppLayout`, following the public/member nav convention already in
   place — not a separately-chromed experience.
3. **Does it need new interactive UI?** Build it from existing `ui/`
   primitives and `lib/motion.ts` variants first; only add a new primitive
   if nothing existing fits, and place it in `ui/` (generic) or `systems/`
   (business-aware) according to whether it depends on `BusinessSystem`
   data.
4. **Does it need a backend?** Design the integration point behind the
   existing accessor-function boundary (`data/systems.ts`) so the Runtime's
   rendering layer doesn't need to change — this repo's architecture is
   already built around that seam (see §3, §4).
5. **Does it change commerce, auth, or persistence?** These are explicitly
   out of scope for the current phase (see CLAUDE.md §2) — confirm with the
   user before building rather than bolting partial versions on ad hoc.
