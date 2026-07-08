# ARCHITECTURE.md — BGrowth System Architecture

This document describes how `app.bgrowth` is built today and how it is
expected to evolve as the rest of the BGrowth ecosystem (see VISION.md —
Academy, Workspace, Club, Find, Marketplace, App, AI, Partners, Rewards,
Benefits) comes online. For day-to-day rules and conventions, see
CLAUDE.md.

---

## 1. Current Architecture

**Stack:** React 18 + TypeScript (strict) + Vite 5 + Tailwind 3 +
React Router 6 + Framer Motion + Lucide icons. Deployed as a static SPA
(Vercel, with a catch-all rewrite to `index.html` in `vercel.json`).

**Shape:** a single-page app with no backend. Everything the app needs —
the Business System catalog, industries, resources, and a small amount of
mock member state — is bundled at build time as TypeScript data. There is
no API layer yet; "data fetching" today is a synchronous import.

There are **two layouts**, mounted as sibling top-level routes in
`App.tsx` — they are not nested inside one another and share no chrome:

```
Browser
  └─ React Router (client-side routing, BrowserRouter)
       ├─ AppLayout (Navbar + Outlet + Footer)      — the public/marketing site
       │    └─ Pages (src/pages/*.tsx)
       │         ├─ read route params
       │         ├─ look up data (src/data/*, via accessor functions)
       │         ├─ render <SEO> (document head only, no SSR)
       │         └─ compose components (sections / systems / runtime / ui)
       │
       └─ PlatformLayout (Sidebar + TopBar + Content)  — the Workspace shell
            └─ Pages (src/pages/platform/*.tsx)
                 ├─ same data-lookup and <SEO> conventions as above
                 └─ compose components (platform / systems / ui)
```

There is no server, no database, no auth provider, and no payment
integration in this repository. Where those concerns show up in the UI
(Login, checkout, Account, Sign Out), they are visual placeholders or
external links — explicitly not implemented here yet (see §5, §6, §9).

## 2. Business System Runtime

The Runtime is the part of the app that takes a data-described **Business
System** and turns it into a working, interactive experience in the
browser. Conceptually, the Runtime is the engine *inside* **BGrowth
Workspace™** (see VISION.md) — it is not a separate ecosystem product of
its own.

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

## 3. The Workspace Shell (current implementation)

**BGrowth Workspace™** is the primary experience after login (see
VISION.md). This repository already contains its first implementation —
built before Workspace had that name (it was called "the Platform Shell"
during development), so it predates the current ecosystem naming but is
architecturally the same thing.

**Shape:**

```
PlatformLayout (src/components/platform/PlatformLayout.tsx)
 ├─ Sidebar — collapsible, data-driven from platformNav.ts, persistent from
 │            tablet width up (auto-collapsed on tablet, expanded on
 │            desktop), an overlay drawer on mobile
 ├─ TopBar  — GlobalSearch, QuickActionButton, NotificationButton,
 │            ThemeToggleButton, MembershipBadge, UserMenu
 └─ Outlet → pages/platform/*.tsx, wrapped in PageContainer
      ├─ DashboardPage      — the Workspace home:
      │    WorkspaceHero, ContinueBuildingSection, MyBusinessSystemsSection,
      │    RecommendedSection, RecentlyAddedSection, QuickActionsSection,
      │    MemberBenefitsSection
      ├─ MyBusinessSystemsPage — search/filter/sort/grid-list view over
      │    owned Business Systems
      ├─ ProfilePage, MembershipPage, SettingsPage, SupportPage — placeholder
      │    destinations for the UserMenu
      └─ AcademyPage, CommunityPage, MarketplacePage, FindPage,
         PlatformResourcesPage — placeholder destinations for the
         corresponding ecosystem products (see §7)
```

**What's real vs. mock today:**

- The catalog, filtering, sorting, and search are real, reading through
  `data/systems.ts` / `data/resources.ts` accessor functions — no
  duplicated data.
- "Ownership" (which Business Systems a member has), "last opened," and
  the member's display name are mock, centralized in one file,
  `src/data/memberMock.ts` — not a real account or purchase record.
- Global search (Business Systems + Resources) is real (it searches the
  actual catalog); Marketplace and Community results are static
  placeholder rows, since neither product has real data yet.
- There is **no route protection** on `/platform` — it is reachable by
  anyone today, the same way the rest of this static MVP has no real
  session. See §5.

**Known naming gaps, not yet reconciled in code** (documentation debt,
deliberately not silently fixed — see CLAUDE.md §15):

- The sidebar's **"BGrowth App"** entry currently links to `/systems` (the
  public catalog browse page) as a stand-in destination. Under the current
  ecosystem definition, **BGrowth App™** is a distinct business-management
  product (CRM/finance/ops) — not the same thing as browsing or running a
  Business System. This label will need a real destination once BGrowth
  App exists as its own product; it should **not** be reinterpreted as
  "the whole Workspace" going forward.
- The sidebar's **"Community"** entry (routing to `/platform/community`)
  is the placeholder destination for what VISION.md now calls **BGrowth
  Club™**. The nav label and page title still say "Community" in code —
  a future pass should rename this deliberately, not as a side effect of
  an unrelated change.

## 4. Studio Integration (Future)

**BGrowth Studio** is a separate, not-yet-integrated product responsible
for *authoring* Business Systems: a Checklist Builder, Planner Builder,
Workflow Builder, and Template Builder. Studio is where a system's modules,
sections, and fields are actually created and edited, for use inside
Workspace.

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
   `getModuleBySlug`, `getRelatedSystems`, `getOwnedSystems`,
   `searchSystems`, `getRecommendedSystems`, `getRecentlyAddedSystems`) so
   no calling component changes.
3. Commerce fields (`price`, `memberPrice`, `checkoutUrl`,
   `whatsIncluded`) get attached by the Runtime/commerce layer after
   fetching the Studio export, not embedded in Studio's own data — this is
   the natural point to split them into a separate type (see §6).
4. Marketplace becomes the natural second consumer of Studio exports, once
   independent creators can author Business Systems too (see §7) —
   Studio's export contract should not assume BGrowth is the only author.
5. The Runtime's rendering code (`BusinessSystemRuntime`,
   `SystemModulePage`, etc.) should require **no changes** — this is the
   architectural bet this repo has already made, and it should be honored.

## 5. Future API Layer

There is no API layer today. When one is introduced, it should sit exactly
where `src/data/*.ts` sits conceptually — behind the existing accessor
function boundary:

- `getSystemBySlug`, `getModuleBySlug`, `getRelatedSystems`,
  `getIndustrySystemCount`, `getOwnedSystems`, `searchSystems`,
  `getRecommendedSystems`, `getRecentlyAddedSystems` become async (or are
  wrapped in a data-fetching hook), but keep the same names and shapes as
  much as possible.
- Pages already call these functions rather than importing raw arrays
  (per CLAUDE.md §7), so the migration to async data is expected to touch
  the data layer and add loading/error states to pages — not rewrite
  component trees.
- The same API layer should also become the home for the mock member state
  in `data/memberMock.ts` (ownership, last-opened, display name) once real
  accounts exist — that file's shape is deliberately simple so it maps
  cleanly onto a future "member profile" endpoint.
- A real API layer should also be the natural home for search/filter
  (currently done client-side in `BrowseSystems.tsx` and
  `MyBusinessSystemsPage.tsx` over the full static array) once the catalog
  is too large for that to scale.

## 6. Authentication (Current & Future)

**Current:** none, anywhere in the app. Two separate visual stand-ins
exist, and neither is real route protection:

- `AppLayout.tsx` switches the marketing Navbar between `'public'` and
  `'member'` link sets purely based on the URL prefix
  (`MEMBER_ROUTE_PREFIXES = ['/my-systems', '/system/']`). The "Login"
  control in the public nav is a non-interactive visual placeholder.
- `PlatformLayout.tsx` (the Workspace shell, see §3) has no equivalent
  gate at all — every `/platform/*` route is open to anyone, and
  `UserMenu`'s "Sign Out" is inert.

**Future integration point:** authentication should wrap the router (or
sit above both `AppLayout` and `PlatformLayout`) as a real session/identity
provider. `/platform` becomes the natural boundary for "must be signed in"
— the whole Workspace shell gated at once, rather than per-page checks —
while `AppLayout`'s existing public/member nav-mode switch on the
marketing site should be preserved as-is, driven by the same session
instead of a URL-prefix heuristic. Do not build two different auth
mechanisms for the two layouts.

## 7. Commerce

**Current:** commerce fields (`price`, `memberPrice`, `checkoutUrl`,
`whatsIncluded`) live directly on `BusinessSystem`, populated as static
data. "Purchase" is a link to an external `checkoutUrl`
(`checkout.bgrowth.com/...`) — no checkout flow exists in this repo.
"Owned" systems (in both the legacy `MySystems.tsx` and the Workspace's
`MyBusinessSystemsPage`/Dashboard sections) come from one hardcoded slug
list in `data/memberMock.ts`, not a real purchase record.

**Future integration point:** as noted in `types/system.ts`'s own comments,
these fields are explicitly *not* part of a Studio export — they belong to
the Runtime/commerce concern. When real commerce arrives (BGrowth
Marketplace, real checkout, membership billing), the expected evolution is:

- Split commerce fields into a dedicated type (e.g. `SystemOffer` or
  `CommerceListing`) keyed by `BusinessSystem.slug`, rather than growing the
  core `BusinessSystem` type further.
- Replace `PURCHASED_SLUGS`/`LAST_OPENED_SLUG` in `data/memberMock.ts` with
  a real purchase/entitlement lookup against the member's account.
- Replace the external `checkoutUrl` link with an in-app or embedded
  checkout, without changing how `ProductPage`/`PricingCard` present price.
- Marketplace commissions (see VISION.md's Revenue Model) become a second
  commerce path alongside direct BGrowth sales — the commerce layer should
  be designed to know *who* is selling a given listing, not just what it
  costs.

## 8. How Every Ecosystem Product Connects

VISION.md describes ten ecosystem products. This section maps each to its
current state in this repository and its intended integration point —
none of them should ever be rebuilt as a separate app with its own login;
all of them plug into the same account and, where relevant, the same
Business System data.

- **🎓 Academy** (Learn) — placeholder page today
  (`pages/platform/AcademyPage.tsx`, nav item in `platformNav.ts`). Future
  courses/certifications/learning paths are a new content type, not a
  variant of `BusinessSystem` — model them as their own type when built,
  linked to a member's profile the same way owned Business Systems are.
- **💼 Workspace** (Work) — this repository's current focus; see §3. The
  Business System Runtime is Workspace's core engine.
- **👥 Club** (Connect) — placeholder page today, currently labeled
  "Community" in code (`pages/platform/CommunityPage.tsx`) — see the
  naming gap called out in §3. Future community features (groups,
  challenges, mentorship, discussions, events) should integrate as their
  own route group under `PlatformLayout`, following the same layout/nav
  conventions already established there, not as a separately-chromed
  experience.
- **📍 Find** (Discover) — placeholder page today
  (`pages/platform/FindPage.tsx`). Find is explicitly **not** a directory
  of Business Systems (that's the existing `/systems` catalog) — it's a
  broader discovery surface across people, professionals, products, and
  partners. It will need its own data model distinct from `BusinessSystem`
  once built; do not force professional/partner listings into the
  `BusinessSystem` type.
- **🛒 Marketplace** (Create & Sell) — today represented only as
  `AffiliatePartner` links (`AffiliatePanel`) inside a Business System, a
  flat "Recommended Tools"/"Affiliate Partners" list on the Resources page,
  and a placeholder page (`pages/platform/MarketplacePage.tsx`). A real
  Marketplace formalizes these as its own catalog/listing model — likely
  reusing the same card/grid UI primitives (`systems/`, `ui/Grid`) already
  established here — and, per VISION.md, eventually accepts listings
  authored by creators other than BGrowth itself (see §4 on Studio).
- **📊 App** (Manage) — **not represented in this repository at all.**
  Per VISION.md, BGrowth App is a distinct CRM/finance/ops product a
  member graduates into once their business outgrows a single Business
  System — it is not a rename of Workspace and not the same as the
  sidebar's current "BGrowth App" label (see the naming gap in §3). When
  built, it should integrate as its own connected product against the same
  account, not as a page inside this repo.
- **🤖 AI** (Accelerate) — `ModuleType` already reserves an `'AIModule'`
  value not yet exercised by any system in the catalog data. AI assistance
  should be added as a module type with its own `SystemSectionBlock`/
  `ModuleBadge` treatment inside Workspace, plus surfaced contextually in
  App, Find, and Marketplace once those exist — not built as a single
  standalone "AI page."
- **🤝 Partners** (Partner) — today only exists as `AffiliatePartner` data
  attached to a Business System (`affiliatePartners[]` in
  `types/system.ts`) and the flat lists in `data/resources.ts`. A real
  Partners network formalizes this into its own directory/profile model,
  which Find surfaces and Marketplace/Benefits transact against.
- **🎁 Rewards** (Earn) — not represented in this repository. Will need
  its own points/achievement data model tied to member actions across
  every other product (completing a system, referring a member, selling in
  Marketplace) — a cross-cutting concern, not owned by any single existing
  folder.
- **💎 Benefits** (Save) — today's closest equivalent is the free
  "Resources"/discount messaging already on the marketing site
  (`ResourcesPage`, `PricingPage`). A real Benefits product formalizes
  these into member-only offers, most naturally surfaced from the same
  `AffiliatePartner`/Partners data that powers Find and Marketplace.

## 9. Data Flow

```
src/data/systems.ts, resources.ts, memberMock.ts (static, in-memory)
        │  accessor functions only (getSystemBySlug, getOwnedSystems,
        │  searchSystems, getRecommendedSystems, searchResources, ...)
        ▼
src/pages/*.tsx and src/pages/platform/*.tsx
        (route params → data lookup → not-found guard where applicable)
        │  props
        ▼
components/runtime/*, components/systems/*, components/platform/*, components/ui/*
        │  local React state only (field values, UI toggles, search query)
        ▼
Rendered DOM  →  window.print() for Save/Print (no network, no persistence)
```

There is currently no write path back into the data layer anywhere in the
app — every product surface described in §8, once built, is expected to
follow the same read-through-accessor-functions pattern already
established by `data/systems.ts`, and field/session state stays local and
ephemeral by design until real persistence is explicitly authorized (see
CLAUDE.md §2, §8).

## 10. Folder Organization

See CLAUDE.md §4 for the authoritative folder map (including
`components/platform/` and `pages/platform/`, the Workspace shell's
folders) and the note about the stray, non-authoritative root-level
duplicate files. This document assumes `src/` as the only real tree.

## 11. Component Hierarchy

```
AppLayout                                    (marketing site)
 ├─ Navbar (mode: public | member)
 ├─ Outlet → HomePage, BrowseSystems, IndustriesPage, ProductPage,
 │           SystemOverviewPage → BusinessSystemRuntime → ...,
 │           SystemModulePage → ..., MySystems, PricingPage,
 │           ResourcesPage, AboutPage
 └─ Footer

PlatformLayout                               (BGrowth Workspace shell)
 ├─ Sidebar (platformNav.ts, data-driven)
 ├─ TopBar
 │   ├─ GlobalSearch → searchSystems / searchResources
 │   ├─ QuickActionButton, NotificationButton, ThemeToggleButton (Popover)
 │   ├─ MembershipBadge
 │   └─ UserMenu (Popover) → Profile/Membership/Settings/Help/Sign Out
 └─ Outlet →
     DashboardPage
      ├─ WorkspaceHero (Avatar, MembershipBadge, getTimeOfDayGreeting)
      ├─ ContinueBuildingSection → systems/OwnedSystemCard (featured)
      ├─ MyBusinessSystemsSection → systems/OwnedSystemCard × 3, "View All"
      ├─ RecommendedSection → ui/Carousel → systems/BusinessSystemCard
      ├─ RecentlyAddedSection → layout/Grid → systems/BusinessSystemCard
      ├─ QuickActionsSection (static config)
      └─ MemberBenefitsSection (static config)
     MyBusinessSystemsPage → SearchToolbar, FilterPill, systems/OwnedSystemCard
     ProfilePage, MembershipPage, SettingsPage, SupportPage,
     AcademyPage, CommunityPage, MarketplacePage, FindPage,
     PlatformResourcesPage → all compose PlaceholderPage
```

Every branch in both layouts bottoms out in `components/ui/*` primitives
(`Button`, `Card`, `Badge`, `SectionHeader`, `Grid`, `Avatar`, `Carousel`,
...) — no page or feature component should reimplement what a `ui/`
primitive already provides.

## 12. How Future Modules Should Integrate

Any new capability — a new module type, a new ecosystem product surface,
a new data source — should be evaluated against these questions before
writing code:

1. **Which ecosystem product does this belong to?** Check §8 first. A
   feature that belongs to Club, Find, Marketplace, App, AI, Partners,
   Rewards, or Benefits is not automatically "part of Workspace" just
   because it's convenient to add there — confirm which product owns it
   before placing the code.
2. **Does it fit the existing `BusinessSystem`/`BusinessModule` shape?** If
   yes, extend the type in `types/system.ts` and add data — don't build a
   parallel content model. If it's a genuinely different kind of content
   (an Academy course, a Find listing, a Rewards achievement), it likely
   needs its own type, not a bent version of `BusinessSystem`.
3. **Does it need its own route?** If it belongs inside Workspace, it's a
   new entry under `PlatformLayout` in `App.tsx`, following the
   `platformNav.ts` data-driven sidebar convention already in place. If it
   belongs to the marketing site, it's a new entry under `AppLayout`. Two
   different ecosystem products should not share one route's chrome.
4. **Does it need new interactive UI?** Build it from existing `ui/`
   primitives and `lib/motion.ts` variants first; only add a new primitive
   if nothing existing fits, and place it in `ui/` (generic), `systems/`
   (BusinessSystem-aware), or `platform/` (Workspace-shell-specific)
   according to what it depends on.
5. **Does it need a backend?** Design the integration point behind the
   existing accessor-function boundary (`data/systems.ts`,
   `data/resources.ts`, `data/memberMock.ts`) so the Runtime's and
   Workspace's rendering layers don't need to change — this repo's
   architecture is already built around that seam (see §4, §5).
6. **Does it change commerce, auth, or persistence?** These are explicitly
   out of scope for the current phase (see CLAUDE.md §2) — confirm with the
   user before building rather than bolting partial versions on ad hoc.
