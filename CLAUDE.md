# CLAUDE.md — BGrowth Engineering Foundation

This is the permanent development guide for `app.bgrowth`. Read this before
making any change. It exists so that every future contribution — human or
AI — reinforces the same architecture instead of drifting from it.

For the business story, see **VISION.md**. For the full catalog of what
BGrowth offers, see **PRODUCT_CATALOG.md**. For system design detail, see
**ARCHITECTURE.md**. This file is the operating contract for *how we
build*.

---

## 1. BGrowth Vision (summary)

BGrowth is the operating system for personal and professional growth — not
an entrepreneur platform, and not limited to business. It organizes
everything it offers into **Growth Categories** (Business &
Entrepreneurship, Careers & Professions, Languages, Personal Finance,
Productivity, Education, Health & Wellness, Family & Lifestyle — see
PRODUCT_CATALOG.md), and delivers them through a single ecosystem of ten
connected products (Academy, Workspace, Club, Find, Marketplace, App, AI,
Partners, Rewards, Benefits) built around one universal unit: the **Growth
System™**.

**Business & Entrepreneurship is one Growth Category, not the platform
itself.** The **Business System™** is that category's established name for
its Growth Systems — this repository's current catalog is entirely
Business Systems, because Business & Entrepreneurship is the only category
built out so far. Do not treat "Business System" and "the platform" as
synonyms; every other category will have Growth Systems of its own.

This repository (`app.bgrowth`) is the current, foundational implementation
of **BGrowth Workspace™** — the primary experience after login, where
Growth Systems of any category are browsed, bought, and *worked through* —
plus the public marketing site that leads into it. Full detail lives in
VISION.md and PRODUCT_CATALOG.md — read both once before doing
product-shaped work, not just code-shaped work.

**BGrowth Workspace™ is not the same product as BGrowth App™.** Workspace
is where a member works through a Growth System, in any category, day to
day. App is a distinct, future business-management platform (CRM, finance,
ops) scoped specifically to Business & Entrepreneurship, that a member
graduates into once their *business* outgrows a single system. Don't
conflate the two when naming things — see §2 for the current, imperfect
state of that naming in code.

## 2. Ecosystem-to-Code Mapping (current state)

VISION.md describes ten ecosystem products, spanning eight Growth
Categories (PRODUCT_CATALOG.md). Here is what each ecosystem product
actually is in this repository today — read this before assuming a
feature belongs somewhere it doesn't:

| Ecosystem product | Verb | Current state in this repo |
|---|---|---|
| 🎓 Academy | Learn | Placeholder page (`pages/platform/AcademyPage.tsx`) |
| 💼 **Workspace** | Work | **This repo's real focus** — the `PlatformLayout` shell (Sidebar/TopBar/Dashboard/My Business Systems) plus the Business System Runtime (`/system/*`, `/product/*`) |
| 👥 Club | Connect | Placeholder page, **still labeled "Community" in code** (`pages/platform/CommunityPage.tsx`, nav item) — known naming gap, see below |
| 📍 Find | Discover | Placeholder page (`pages/platform/FindPage.tsx`) |
| 🛒 Marketplace | Create & Sell | Placeholder page + today's `AffiliatePartner` data on each Business System |
| 📊 App | Manage | **Not built.** Scoped specifically to Business & Entrepreneurship. The sidebar's "BGrowth App" label currently just links to `/systems` (the catalog) as a stand-in — see the naming gap below |
| 🤖 AI | Accelerate | Not built. `ModuleType` reserves an unused `'AIModule'` value for it |
| 🤝 Partners | Partner | Not built as its own product. Exists only as `AffiliatePartner` data |
| 🎁 Rewards | Earn | Not built |
| 💎 Benefits | Save | Not built. Closest today is the free-resources/discount messaging on the marketing site |

And here is what each **Growth Category** (PRODUCT_CATALOG.md) actually is
in this repository today:

| Growth Category | Status in this repo |
|---|---|
| 💼 Business & Entrepreneurship | **Live** — the only category with real catalog data (`src/data/systems.ts`) |
| 💼 Careers & Professions | Planned — no data, no code |
| 🌍 Languages | Planned — no data, no code |
| 💰 Personal Finance | Planned — no data, no code |
| 🎯 Productivity | Planned — no data, no code |
| 🎓 Education | Planned — no data, no code |
| ❤️ Health & Wellness | Planned — no data, no code |
| 🏡 Family & Lifestyle | Planned — no data, no code |

**Adding a system to any "Planned" category is a data change, not a code
change.** See ARCHITECTURE.md §2 and §4 for why the Runtime already
generalizes to any category — never build a second Runtime, a
category-specific page, or a parallel data model to launch a new category.

**Known naming gaps — do not silently fix, flag and ask first:**

- Sidebar/nav label **"BGrowth App"** → routes to `/systems`. This is a
  placeholder destination chosen before BGrowth App™ was defined as a
  distinct CRM/ops product scoped to Business & Entrepreneurship. Do not
  reinterpret "BGrowth App" as "the whole Workspace" going forward — it
  isn't, per VISION.md.
- Sidebar/nav label and page title **"Community"** → is the placeholder
  destination for what VISION.md now calls **BGrowth Club™**. The code
  still says "Community." Renaming it is a real (if small) code/copy
  change — do it deliberately, as its own task, not as a side effect of
  something else.
- **"My Business Systems"** (nav label, page title, `MyBusinessSystemsPage`,
  `MyBusinessSystemsSection`) is accurate today only because Business &
  Entrepreneurship is the sole populated category. The moment a second
  category launches, this needs a category-neutral rename (e.g. "My Growth
  Systems") — see ARCHITECTURE.md §5, §14. Don't rename it preemptively
  while only one category exists.

See ARCHITECTURE.md §10 for the fuller integration plan for each ecosystem
product, and PRODUCT_CATALOG.md for the fuller catalog of each Growth
Category.

## 3. Current Implementation Phase

This repo is a **static, client-only MVP**:

- React + Vite SPA. No backend, no database, no *real* authentication —
  but **BGrowth Identity™'s mock authentication is real, working
  behavior** (see ARCHITECTURE.md §8): Login, Register, Sign Out, and
  route protection actually function today, simulated entirely
  client-side via React state and localStorage — there is no server, no
  credential check, and no real session token behind any of it.
- Business System catalog data is hardcoded TypeScript (`src/data/`),
  standing in for a future export from **BGrowth Studio**. It covers only
  the Business & Entrepreneurship Growth Category today (see §2).
- Two layouts exist side by side: `AppLayout` (public marketing site,
  "member" vs "public" nav is a route-prefix visual switch only, plus the
  new auth pages under `pages/auth/`) and `PlatformLayout` (the Workspace
  shell). **`/platform/*` is now gated behind BGrowth Identity™'s mock
  session** via `ProtectedRoute` — a guest is redirected to `/login`; this
  is a real (if mock) behavior change from earlier milestones, not a
  placeholder.
- Module field values (checklists/planners a user fills in) live in
  transient React state only. Nothing persists. "Save PDF" is the browser's
  native print dialog.
- Ownership of Business Systems ("My Business Systems," "Continue
  Building," recommendations) is simulated with a mock member file,
  `src/data/memberMock.ts`, now wrapped into BGrowth Identity™'s `User`
  shape (`modules/identity/mock/mockUser.ts`) and read by Workspace
  through `useIdentity()` — not a real account or purchase record.

**Do not silently upgrade this phase.** If a task implies adding a *real*
auth provider, a database, or a payments backend, stop and confirm scope
with the user first — that is a phase change, not a bug fix. Building on
top of the existing mock Identity/Commerce architecture (new mock data,
new UI reading through `useIdentity()`/Commerce's services) is in scope;
replacing the mock with a real provider is not, without explicit
direction. See ARCHITECTURE.md §8 for the Identity architecture and how a
real provider would eventually replace the mock, and §9 for Commerce.

## 4. Architecture Principles

1. **`src/` is the only real source tree.** The build (`tsconfig.json`
   `include: ["src"]`) only compiles `src/`. Nothing outside `src/` is ever
   part of the running app, regardless of what exists at the repo root.
2. **The Runtime reads data; it never authors it.** Growth Systems are
   *displayed* by this app (inside Workspace). They are *built* by BGrowth
   Studio, a separate product. No component in `src/components/runtime` or
   `src/pages` should ever mutate a `BusinessSystem`/`BusinessModule`
   definition.
3. **One data shape, one source of truth.** `src/types/system.ts` is the
   contract — and it is already category-agnostic in shape, even though
   its name and today's data are Business-specific (see ARCHITECTURE.md
   §2). Every page and component consumes it through the accessor
   functions in `src/data/systems.ts` (`getSystemBySlug`, `getModuleBySlug`,
   `getRelatedSystems`, `getOwnedSystems`, `searchSystems`,
   `getRecommendedSystems`, `getRecentlyAddedSystems`), never by reaching
   into the array directly. This is what lets the data source change
   (static file → fetched Studio export) *and* what lets a new Growth
   Category launch, without touching component code.
4. **Design tokens are the single source of truth for visual style.**
   `src/styles/tokens.css` defines every color/spacing/radius/shadow value;
   `tailwind.config.js` only references `var(--token)`. A hardcoded hex or
   px value that duplicates an existing token is a bug.
5. **Composition over duplication.** Shared layout (`Grid`,
   `SectionContainer`, `PageContainer`), shared motion (`src/lib/motion.ts`),
   and shared UI primitives (`src/components/ui`) exist specifically to stop
   repeated className strings and repeated animation variants. Use them.
6. **Know which ecosystem product — and which Growth Category — you're
   building for.** Before adding a feature, check §2's mapping and
   ARCHITECTURE.md §10. A feature isn't automatically "part of Workspace"
   just because `/platform` is convenient to add to — confirm which of
   the ten products actually owns it. And a new Growth Category is new
   *data*, never a new Runtime, page pipeline, or component tree (see §8).

## 5. Folder Organization

```
src/
  assets/           static files (logo, images)
  components/
    layout/         marketing-site chrome: AppLayout, Navbar, Footer, Grid, containers
    sections/       homepage-only marketing sections (Hero, Testimonials, ...)
    seo/            SEO.tsx — the only place <head> tags are managed
    systems/        presentational components aware of BusinessSystem/Industry
                     shapes (cards, badges, category icons) — used pre-purchase
                     AND inside Workspace (e.g. OwnedSystemCard). Despite the
                     folder name, this is the general Growth System engine —
                     see ARCHITECTURE.md §2.
    runtime/        the Business System Runtime — renders a system a member
                     is actively working through (part of Workspace, and
                     already category-agnostic — see ARCHITECTURE.md §2, §4)
    platform/       the BGrowth Workspace shell itself: PlatformLayout,
                     Sidebar, TopBar, GlobalSearch, Popover, and the
                     Dashboard's section components
    ui/             generic design-system primitives with no business meaning
                     (Button, Card, Badge, EmptyState, SearchBar, Avatar,
                     Carousel, ...)
  data/             catalog data (systems.ts, industries.ts, resources.ts) —
                     stands in for a future Studio/CMS export, currently
                     covering only the Business & Entrepreneurship Growth
                     Category — plus memberMock.ts, mock member/ownership
                     state for Workspace
  lib/              shared non-component logic (motion.ts, greeting.ts)
  modules/
    commerce/       BGrowth Commerce™ — the provider-agnostic domain layer
                     (types + service interfaces + mock data, no
                     implementation) every future payment provider,
                     membership, reward, benefit, and partner relationship
                     is built on. See ARCHITECTURE.md §9. Not imported by
                     any page or component yet.
    identity/       BGrowth Identity™ — the provider-agnostic identity
                     layer every future auth provider is built on (types +
                     service interfaces, no implementation), PLUS a real,
                     working mock/ implementation (MockIdentityProvider,
                     the useIdentity() hook) and routing/ (ProtectedRoute,
                     GuestRoute) — actually wired into App.tsx and
                     main.tsx. See ARCHITECTURE.md §8.
  pages/            one file per marketing route; composes the above, adds
                     <SEO>, does param/slug lookup — pages should stay thin
    auth/           one file per auth route (Login, Register, Forgot
                     Password, Reset Password, Verify Email) — composes
                     ui/AuthCard, reads/writes state via useIdentity()
    platform/       one file per Workspace route (Dashboard, My Business
                     Systems, Academy, Community, Marketplace, Find,
                     Resources, Profile, Membership, Settings, Support)
  styles/           tokens.css (design tokens)
  types/            system.ts — the BusinessSystem data model (see
                     ARCHITECTURE.md §2 on its planned generalization) —
                     plus growth.ts, the shared Growth Category vocabulary
                     used by both the catalog and Commerce
  App.tsx           route table — two sibling layouts, AppLayout and
                     PlatformLayout (the latter wrapped in ProtectedRoute
                     — see ARCHITECTURE.md §1, §8)
  main.tsx          app entry / providers (BrowserRouter, MockIdentityProvider)
```

**Known issue, do not treat as reference:** the repo root also contains a
stray, byte-identical duplicate set of files (`App.tsx`, `AboutPage.tsx`,
`components/`, `pages/`, `data/`, `types/`, etc.) left over from a past
extraction mistake. They are tracked in git but excluded from the TypeScript
build. Never read, edit, or copy-paste from these root-level files — always
work from `src/`.

## 6. Component Rules

- **`ui/`** components must stay business-agnostic (and Growth-Category-
  agnostic). If a `ui/` component starts importing from `types/system.ts`,
  it belongs in `systems/` instead.
- **`systems/`** components may know about `BusinessSystem`, `Industry`,
  `ModuleType`, etc., but must remain presentational — no routing decisions
  beyond an optional `to`/`ctaTo` prop, no data mutation. This includes
  components used both pre-purchase (`BusinessSystemCard`) and inside
  Workspace (`OwnedSystemCard`) — keep them as siblings, not one component
  with a growing pile of context-specific branches. These components are
  already reusable by every future Growth Category (see ARCHITECTURE.md
  §2) — don't fork them per category.
- **`runtime/`** components compose `systems/` + `ui/` to render a live,
  in-progress Growth System. This is one of the few places interactive
  field state is allowed to live (scoped to the page, e.g.
  `SystemModulePage`).
- **`platform/`** components are specific to the Workspace shell itself
  (layout chrome, TopBar controls, Dashboard sections) — they may know
  about `BusinessSystem` data (via `systems/`/`data/` accessors) but should
  not duplicate what `systems/`/`ui/` already provide.
- **`sections/`** components are homepage-only. Don't reuse a `sections/`
  component on an inner page — extract the shared part into `systems/` or
  `ui/` first.
- **`pages/`** and **`pages/platform/`** components orchestrate: read route
  params, look up data via the `data/*.ts` accessors, render `<SEO>`, then
  delegate markup to components. A page file that contains large inline
  JSX blocks duplicated from another page is a signal to extract a
  component, not a page-specific pattern to keep.
- Before writing a new component, search `src/components/` for one that
  already does the job (see §12 Reuse Policy).

## 7. Routing Rules

- All routes are declared in one place: `src/App.tsx`. Never define routes
  inline elsewhere or introduce a third router or a third top-level layout.
- There are exactly two layouts: `AppLayout` (marketing site — `Navbar` +
  `Outlet` + `Footer`) and `PlatformLayout` (Workspace — `Sidebar` +
  `TopBar` + content). Every route renders inside one of the two. Don't
  bypass either for a new page, and don't nest one layout inside the other.
- `AppLayout` decides public vs. member nav purely from the URL prefix
  (`MEMBER_ROUTE_PREFIXES`). This is a separate, pre-existing mechanism
  from `PlatformLayout` — don't merge them or invent a third.
- The Workspace sidebar is entirely data-driven from `platformNav.ts`. A
  new Workspace nav destination is a new row there, never a hardcoded
  `<SidebarItem>` in a component (see ARCHITECTURE.md §5).
- A new Growth Category is **not** a new route. `/systems`, `/product/:slug`,
  `/system/:slug`, and `/platform/my-systems` already work for any
  category's data — see ARCHITECTURE.md §14.
- Before adding a link (`<Link>`/`<a>`/`to=`), verify the target route
  actually exists in `App.tsx`. Known pre-existing gaps (`/account`,
  `/privacy`, `/terms`, `/contact`) are linked but unrouted — do not copy
  this pattern for new links; either build the page or don't link it.
- Route param lookups (`useParams` + `getSystemBySlug`/`getModuleBySlug`)
  must always guard the "not found" case with `<Navigate to="/systems" />`,
  matching the existing pattern in `ProductPage`, `SystemOverviewPage`,
  `SystemModulePage`.

## 8. Data Rules

- `src/types/system.ts` is the canonical data model — for every Growth
  Category, not only Business & Entrepreneurship (see ARCHITECTURE.md §2).
  Do not create a parallel or competing type for the same concept (e.g. a
  second "Product" or "Bundle" type, or a per-category clone of
  `BusinessSystem`) — extend `BusinessSystem`/`BusinessModule` or compose a
  new type around them. A genuinely different kind of content (an Academy
  course, a Find listing, a Rewards achievement) gets its own type — don't
  bend `BusinessSystem` to fit it either.
- Mock/catalog data lives only in `src/data/`. Never duplicate a system,
  industry, resource, or member/ownership list inline in a page or
  component.
- Always read data through the exported accessor functions
  (`getSystemBySlug`, `getModuleBySlug`, `getRelatedSystems`,
  `getIndustrySystemCount`, `getOwnedSystems`, `searchSystems`,
  `getRecommendedSystems`, `getRecentlyAddedSystems`), not by importing
  `SYSTEMS`/`INDUSTRIES` and indexing directly, except inside
  `data/systems.ts` and `data/industries.ts` themselves.
- Mock member/ownership state (`PURCHASED_SLUGS`, `LAST_OPENED_SLUG`,
  `MOCK_MEMBER_NAME`) lives in exactly one place, `src/data/memberMock.ts`
  — every surface that needs "what does this member own" imports from
  there, never redefines its own list.
- The commerce fields on `BusinessSystem` (`price`, `memberPrice`,
  `checkoutUrl`, `whatsIncluded`) are explicitly *not* part of a Studio
  export (see the comment block at the top of `types/system.ts`). Don't
  assume every future data source will populate them — code that reads
  them should tolerate a Studio-only system that lacks commerce fields once
  that split happens (see ARCHITECTURE.md §9).
- Never hardcode a Growth System's content (modules, sections, fields)
  inside a component. If a component needs system-shaped content to
  render, it takes that content as a prop from `data/systems.ts`.
- Adding a system from a new Growth Category is adding a row to
  `SYSTEMS` with appropriate `industry`/`category`/tags — not a new array,
  not a new file per category, not a new type (see ARCHITECTURE.md §2,
  §14, and the recommendation there about an eventual `growthCategory`
  field).

## 9. The Growth System Philosophy

- A **Growth System™** is BGrowth's universal, purchasable unit — a bundle
  of marketing metadata (benefits, reviews, FAQ) plus one or more
  **Modules** (`Planner™`, `Workflow™`, `Toolkit™`, etc.), each made of
  **Sections** of **Fields** the member fills in — worked through inside
  **BGrowth Workspace™**. **Business System™** is the Business &
  Entrepreneurship category's established name for its Growth Systems (see
  VISION.md, PRODUCT_CATALOG.md) — the two are the same technical shape.
- Every Growth System, in every category, is authored against the same
  seven-stage framework: **Discover → Learn → Plan → Take Action → Track
  Progress → Grow → Resources** (see PRODUCT_CATALOG.md for the framework,
  ARCHITECTURE.md §3 for how it maps onto today's schema). This framework
  is permanent — a new category never earns a new framework.
- This app is the **Runtime**: it displays and runs a Growth System. It
  never builds one. Building happens in **BGrowth Studio** — a separate
  product outside this repo (Checklist Builder, Planner Builder, Workflow
  Builder, Template Builder).
- Never hardcode a Growth System as a one-off page or component. Every
  system, regardless of industry *or Growth Category*, must render through
  the same `BusinessSystemRuntime` → `SystemModulePage` pipeline, driven
  entirely by data. If a new industry or category "needs its own page,"
  that's a sign the data model is missing a field — extend the type, don't
  fork the Runtime.
- The internal value `'Checklist'` (a `ModuleType`) must **never** appear as
  rendered copy — it always displays as `"Planner™"`. This mapping lives in
  exactly one place: `MODULE_TYPE_CONFIG` in
  `src/components/systems/ModuleBadge.tsx`. Never re-derive or duplicate
  this mapping elsewhere.

## 10. Naming Conventions

- Every ecosystem product carries a trademark symbol: *BGrowth Academy™*,
  *BGrowth Workspace™*, *BGrowth Club™*, *BGrowth Find™*, *BGrowth
  Marketplace™*, *BGrowth App™*, *BGrowth AI™*, *BGrowth Partners™*,
  *BGrowth Rewards™*, *BGrowth Benefits™*. Use the current names — "BGrowth
  Library" and "BGrowth Services" are retired; the former is now Workspace,
  the latter's done-for-you concept folds into Workspace/App over time (see
  VISION.md). Don't reintroduce either name in new copy.
- **Growth System™** is the universal term for BGrowth's core product unit,
  across every Growth Category. **Business System™** is Business &
  Entrepreneurship's established, category-specific name for the same
  concept — keep using "Business System™" in Business-category copy and
  code; use "Growth System™" when writing or speaking about the concept
  generically or across categories. Don't invent a category-specific
  umbrella term for any other category unless explicitly asked.
- Customer-facing product nouns within a Growth/Business System also carry
  a trademark symbol in copy: *Business Systems™*, *Growth Systems™*,
  *Resources™*, *Planner™*, *Workflow™*, *Toolkit™*, *Templates™*,
  *Guide™*, *Calculator™*, *Document™*, *Video™*, *Link™*, *AI Module™*.
  This is a deliberate brand convention — preserve it in any new
  customer-facing copy, including for any new Growth Category's product
  names (e.g. *Resume Builder™*, *Budget Planner™* — see
  PRODUCT_CATALOG.md); don't add it to internal-only code identifiers.
- Components: PascalCase, one component per file, file name matches the
  default export (`BusinessSystemCard.tsx` exports `BusinessSystemCard`).
- Types/interfaces: PascalCase nouns matching the domain
  (`BusinessSystem`, `SystemField`, `ModuleType`). Data constants:
  SCREAMING_SNAKE_CASE (`SYSTEMS`, `CATEGORIES`, `MODULE_TYPE_CONFIG`,
  `PLATFORM_NAV_GROUPS`).
- Routes/slugs: kebab-case, matching `BusinessSystem.slug` /
  `BusinessModule.id` values used as URL segments.

## 11. UI Standards

- All color, spacing, radius, and shadow values come from
  `src/styles/tokens.css`. Add a token before adding a one-off value.
- Reuse the existing component classes in `src/index.css`
  (`.btn-primary`, `.btn-secondary`, `.badge`, `.eyebrow`, `.glass-card`,
  `.container-px`, `.section-py`) instead of re-implementing their styles
  with raw utility strings.
- Reuse `Grid` for any responsive card grid, `Carousel` for any horizontal
  scroll row, instead of writing the underlying flex/grid className
  strings inline again.
- Reuse the shared motion variants in `src/lib/motion.ts`
  (`fadeUp`, `fadeIn`, `viewportOnce`, `floatY`) instead of redefining
  Framer Motion variants per component. Keep animation subtle — this
  codebase deliberately uses short durations and small offsets; don't
  introduce flashy motion.
- Respect `prefers-reduced-motion` (already handled globally in
  `index.css`) and print styles (`.no-print`, `@media print`) — any new
  interactive chrome on a system/module page needs a `.no-print` treatment
  if it shouldn't appear when printed/saved as PDF.
- Don't redesign or restyle any existing page as a side effect of an
  unrelated task. UI changes are only acceptable when a task cannot be
  completed without one, and should reuse existing tokens/classes rather
  than introducing new visual language.

## 12. Reuse Policy

Before creating anything new, check for an existing one:

- New card/grid layout → check `src/components/ui/` and
  `src/components/systems/` first.
- New icon-by-category mapping → extend `categoryIcons.ts`, don't create
  a second mapping.
- New badge/label → extend `ModuleBadge`/`Badge`, don't create a parallel
  badge component.
- New animation → check `src/lib/motion.ts` first.
- New Workspace nav destination → add a row to `platformNav.ts`, don't
  hardcode a new sidebar item.
- New popover/dropdown in the Workspace shell → reuse
  `components/platform/Popover.tsx`, don't hand-roll another
  open-state-plus-backdrop pattern.
- New page section → check `src/components/sections/` (homepage) or
  `src/components/systems/` (system-related) before writing new JSX.
- New data field → check whether `types/system.ts` already models it
  before adding a new type.
- **New Growth Category** → check ARCHITECTURE.md §2, §4, §14 first. It is
  new data in `SYSTEMS` (or a sibling array reusing the same type and
  accessors), never a new Runtime, page pipeline, or folder structure.

If something truly doesn't exist, build the smallest addition that fits the
existing pattern, and prefer extending an existing file over creating a new
one when the addition is small and closely related.

## 13. Build Requirements

- `npm run build` (`tsc && vite build`) must pass with zero errors before
  any change is considered done. `tsconfig.json` uses `strict: true` —
  do not weaken strictness to make an error disappear.
- There is currently no test suite and no linter configured in this repo.
  Do not silently add one as part of an unrelated task — if you believe one
  is needed, say so and let the user decide.
- Manually verify routing and rendering for any touched page — there is no
  automated test coverage to catch a broken route or a bad import.

## 14. Git Workflow

- Commit messages in this repo follow a "Sprint N — theme" convention for
  batches of work (e.g. "Sprint 5 - Member Experience Foundation"); smaller
  fixes use a plain descriptive message. Match whichever granularity fits
  the change.
- Never commit `node_modules/` or `dist/` (this rule is currently violated
  by repo history and should be fixed deliberately, not incidentally, as
  part of an unrelated commit).
- Never force-push, rewrite history, or delete branches without explicit
  user instruction.

## 15. Definition of Done

A change is done only when:

1. It lives entirely under `src/` (or is a root-level project config file
   that legitimately belongs at the root, e.g. `vite.config.ts`,
   `tailwind.config.js`).
2. It reuses existing components/tokens/data accessors wherever one already
   fits, per §12.
3. `npm run build` succeeds with zero TypeScript or Vite errors.
4. Every new/changed route is reachable from `App.tsx` (under the correct
   layout) and every link to it resolves.
5. No hardcoded Growth/Business System content, no duplicated mock data
   (catalog *or* member/ownership state), no new parallel data model, and
   no per-category duplication of the Runtime or data model.
6. No unrelated UI/design changes were introduced.
7. It's placed under the correct ecosystem product **and Growth Category**
   per §2/ARCHITECTURE.md §10, not just wherever was convenient.
8. The change is described accurately (no undocumented scope creep) so the
   next person — human or AI — can trust this file's description of the
   system.

## 16. BGrowth Commerce™ Rules

**BGrowth Commerce™** (`src/modules/commerce/`) is the permanent,
provider-agnostic domain layer for every payment, membership, reward,
benefit, and partner concern (see ARCHITECTURE.md §9). It exists precisely
so this application never depends on a specific payment provider. These
rules are permanent, not specific to whichever milestone introduced them:

- **Always reuse Commerce's models — never redefine them.** A `Product`,
  `MembershipPlan`, `Purchase`, `Order`, `Reward`, `Benefit`, or
  `AffiliatePartner` already has a canonical shape in
  `src/modules/commerce/types/`. Extend it there if it's missing a field;
  never define a second, similar interface elsewhere (in a page, a
  component, or a new file) for the same concept.
- **Never hardcode Stripe** (or any other provider) anywhere outside a
  future `ProviderAdapter` implementation. Application code — pages,
  components, other services — calls `CheckoutProvider`/the service
  interfaces, never a provider SDK. If a task seems to require importing a
  payment provider's SDK directly into a page or component, stop — that
  bypasses the whole point of this architecture.
- **Never bypass Commerce.** A feature that reads "does this member own
  this," "what does this membership tier include," or "what does this
  cost" reads it through a Commerce type/service (`ProductAccess`,
  `MembershipPlan`, `PricingService`, etc.), never by inventing a parallel
  ownership/pricing check inline.
- **Never duplicate the `Product` model.** A sellable thing — a Growth
  System, a Course, a Marketplace item, a Subscription — gets a `Product`
  entry (linked via `source` to its real content, e.g. a `BusinessSystem`
  slug), not a second product-shaped type, and not commerce fields bolted
  onto a new content type the way `BusinessSystem.price` was before
  Commerce existed (see ARCHITECTURE.md §9 on that field's planned
  migration).
- **Never duplicate the `MembershipPlan` model.** All six tiers (Free,
  Club, Workspace, Creator, Business, Enterprise) live in one place,
  `types/membership.ts` — a new tier is a new entry there, never a
  separate ad hoc "plan" shape.
- **Never implement a `ProviderAdapter`, checkout flow, webhook, or
  backend persistence without explicit user direction.** Milestone 5.1
  built the architecture only — see CLAUDE.md §3 on this repo's current
  static-MVP phase, which Commerce does not change by itself.
- **The Commerce module's `mock/` data is for proving the types compile
  and compose correctly** — it is not a second source of truth for the
  real catalog (`data/systems.ts` stays authoritative for actual Business
  Systems) and should not be imported into pages/components as a
  stand-in for a real service implementation.

## 17. BGrowth Identity™ Rules

**BGrowth Identity™** (`src/modules/identity/`) is the permanent,
provider-agnostic identity layer for every authentication and member-data
concern (see ARCHITECTURE.md §8). It exists precisely so this application
never depends on a specific auth provider. Unlike Commerce's `mock/`
(static example data), Identity's `mock/` is a real, working
implementation (`MockIdentityProvider`, `useIdentity()`) — these rules
apply to it exactly as they would to a real provider integration:

- **Always reuse Identity's models — never redefine them.** A `User`,
  `Session`, `UserSettings`, or any other type already has a canonical
  shape in `src/modules/identity/types/`. Extend it there if it's missing
  a field; never define a second, similar interface elsewhere for the
  same concept.
- **Never couple a page or component directly to an authentication
  provider.** There is no Firebase/Supabase/Clerk/Auth0/Cognito SDK
  anywhere in this repo, and none should ever be imported outside a
  future `IdentityProviderAdapter` implementation. Application code calls
  `useIdentity()` and the route guards (`ProtectedRoute`/`GuestRoute`),
  never a provider SDK directly.
- **Never duplicate the `User` model.** A member's identity — name,
  email, membership, owned products, rewards, settings — lives on `User`
  in `types/user.ts`. Don't grow a second, parallel "profile" shape in a
  page or component; extend `User`/`UserProfile` instead.
- **Never duplicate the `Session` model.** Session/auth-result shapes live
  in `types/session.ts` — a new auth flow reuses `Session`/`AuthResult`,
  it doesn't invent a new one.
- **Always use BGrowth Identity™ for "is this member signed in" and "who
  is this member."** Never check `window.localStorage` for the mock
  session key directly outside `MockIdentityProvider`, and never
  reintroduce a direct `data/memberMock.ts` import in a Workspace
  component now that `useIdentity()` is the established path (see
  ARCHITECTURE.md §8's Workspace Integration note) — the legacy
  `/my-systems` page is the one deliberate exception, left as-is.
- **`GuestRoute` is the single authority for where an authenticated
  visitor of a guest-only route goes** — never add a second redirect
  decision inside a page wrapped in it (see ARCHITECTURE.md §8 on the bug
  this caused during Milestone 5.2: a page's own effect racing against
  `GuestRoute`'s redirect).
- **Never implement a real `IdentityProviderAdapter`, real credential
  validation, or backend session storage without explicit user
  direction.** Milestone 5.2 built working *mock* auth only — see §3 on
  this repo's current static-MVP phase, which Identity's mock
  implementation does not change the *reality* of, only the *simulated
  behavior* of.

## 18. Things Claude Should NEVER Do

- Never create a duplicate Business/Growth System data model or a second
  catalog array — extend `src/types/system.ts` and `src/data/systems.ts`.
- Never create a category-specific Runtime, page pipeline, or component
  tree for a new Growth Category — it reuses the existing one with new
  data (see ARCHITECTURE.md §2, §4, §14).
- Never create files outside `src/` (excluding legitimate root config).
- Never hardcode a Growth System, industry, or module as bespoke
  JSX/markup — it must flow through the data-driven Runtime.
- Never duplicate mock data across files — one array, one source, imported
  everywhere it's needed (this includes member/ownership mock data in
  `memberMock.ts`, not only the catalog).
- Never introduce a second router, a second design-token source, a second
  animation-variants file, or a third top-level layout.
- Never let the word "Checklist" reach rendered UI copy — only
  `MODULE_TYPE_CONFIG` may perform that mapping.
- Never use "BGrowth Library" or "BGrowth Services" in new copy — they're
  retired; use Workspace and Find/App as appropriate (see VISION.md).
- Never silently rename the "BGrowth App," "Community," or "My Business
  Systems" labels flagged in §2 as part of an unrelated change — that's a
  deliberate, standalone task, timed with the relevant milestone (see
  ARCHITECTURE.md §5, §14).
- Never rename `BusinessSystem`/`BusinessModule` (or the `systems/`/
  `runtime/` folders) to a category-neutral name opportunistically — that
  rename is planned (see ARCHITECTURE.md §14) but deliberate and
  standalone, not a side effect of adding a feature.
- Never add a *real* authentication provider, backend persistence, or
  payment integration without explicit user direction — this repo's
  current phase is intentionally static/client-only. BGrowth Identity™'s
  mock auth and BGrowth Commerce™'s mock data are the sanctioned
  exception (see §16, §17) — extending *those* is expected; replacing
  them with something real is a phase change.
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
