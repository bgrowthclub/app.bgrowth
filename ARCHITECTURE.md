# ARCHITECTURE.md — BGrowth System Architecture

This document describes how `app.bgrowth` is built today and how it is
expected to evolve as the rest of the BGrowth ecosystem (see VISION.md —
Academy, Workspace, Club, Find, Marketplace, App, AI, Partners, Rewards,
Benefits) and the remaining Growth Categories (see PRODUCT_CATALOG.md)
come online. For day-to-day rules and conventions, see CLAUDE.md.

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
`App.tsx` — they are not nested inside one another and share no chrome —
plus one context provider wrapping the whole router:

```
Browser
  └─ MockIdentityProvider (main.tsx — see §8's BGrowth Identity™ Architecture)
       └─ React Router (client-side routing, BrowserRouter)
            ├─ AppLayout (Navbar + Outlet + Footer)  — the public/marketing site
            │    └─ Pages (src/pages/*.tsx, src/pages/auth/*.tsx)
            │         ├─ read route params
            │         ├─ look up data (src/data/*, via accessor functions)
            │         ├─ render <SEO> (document head only, no SSR)
            │         └─ compose components (sections / systems / runtime / ui)
            │         (auth pages are wrapped in GuestRoute — see §8)
            │
            └─ ProtectedRoute (see §8) wraps —
                 PlatformLayout (Sidebar + TopBar + Content) — the Workspace shell
                      └─ Pages (src/pages/platform/*.tsx)
                           ├─ same data-lookup and <SEO> conventions as above
                           └─ compose components (platform / systems / ui)
```

There is no server, no database, and no payment integration in this
repository, and no *real* auth provider — but BGrowth Identity™'s mock
implementation means Login, Register, Sign Out, and route protection are
now functionally real (simulated client-side, no backend) rather than
inert placeholders. See §8 (Identity) and §9 (Commerce) for both
architectures, and §11 for data flow.

## 2. Business Systems Are One Specialization of a Universal Growth System

**This is the central architectural idea in this document.** BGrowth's
product strategy (see VISION.md, PRODUCT_CATALOG.md) now spans eight
Growth Categories — Business & Entrepreneurship is one of them, not the
platform itself. The good news for this codebase: **the Runtime and
Workspace already generalize.** Nothing in `BusinessSystemRuntime`,
`SystemModulePage`, or the Workspace shell actually assumes "business" —
every rendering decision is driven by data (titles, labels, module
content), not hardcoded business vocabulary. A catalog entry about
budgeting or resume-writing would flow through the exact same components
as a catalog entry about launching a cleaning business, with zero code
changes, today.

What the codebase has **not** generalized yet is the *naming*:

- `BusinessSystem`, `BusinessModule`, and the `components/systems/` /
  `components/runtime/` folders are named after the Business &
  Entrepreneurship category specifically, even though their shape is
  category-agnostic.
- There is no field anywhere that records *which Growth Category* a
  system belongs to — today's `industry`/`category` fields are a
  sub-taxonomy *within* Business & Entrepreneurship (e.g. "Legal" /
  "Notary"), not a top-level category selector across all eight.

**Do not rename `BusinessSystem` → `GrowthSystem` (or similar) as part of
an unrelated task.** This is flagged here as a deliberate, future,
standalone migration — see §14's recommendations — not something to do
opportunistically. Until that migration happens, "Business System" is
both (a) the literal name of the current TypeScript type and (b) the
Business & Entrepreneurship category's brand name for its Growth Systems
(see PRODUCT_CATALOG.md) — those two meanings currently overlap
completely, which is exactly why the type still works for every category
even before it's renamed.

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

Every field above is already content-neutral: `industry`/`category` are
plain strings (they could just as easily hold "Personal Finance" /
"Budgeting" as "Legal" / "Notary"), and `ModuleType`'s vocabulary
(`Planner`, `Workflow`, `Toolkit`, `Guide`, `Resource`, `Calculator`, ...)
already reads naturally for a budget planner or a study planner, not only
a business one.

## 3. The Growth System Framework, Mapped to Today's Schema

PRODUCT_CATALOG.md defines a universal, seven-stage framework every Growth
System is authored against: **Discover → Learn → Plan → Take Action →
Track Progress → Grow → Resources.** This is a *product authoring*
framework, not a new required field — today's schema already expresses
every stage:

| Stage | Where it lives today |
|---|---|
| Discover | `ProductPage` (pre-purchase preview) + a system's marketing fields (`shortDescription`, `benefits`, `whoIsFor`, `reviews`, `faq`) |
| Learn | `description`, `benefits`, and early modules of type `Guide`, `Video`, or `Resource` |
| Plan | Modules of type `Planner` |
| Take Action | Modules of type `Workflow` (or `Toolkit` for equip-and-go systems) |
| Track Progress | Checkbox/field state within a module (session-only today — see §8; no cross-session progress persistence exists yet) |
| Grow | `relatedSystems[]`, `getRecommendedSystems()`, and upsell into Club/Marketplace |
| Resources | `resources[]`, rendered by `ResourcePanel`/`ResourceCard` |

"Track Progress" is the least-supported stage today, because there is no
persistence anywhere in this app yet (see CLAUDE.md §3) — field values
live in local component state and reset on reload. That gap is expected at
this phase, not a bug to fix here; §14 recommends how to close it when
persistence is authorized.

Authors (and, once it exists, BGrowth Studio) should structure a new
Growth System's `modules[]` with this seven-stage arc in mind, but no
schema change is required to start — the existing `ModuleType` enum
already covers it.

## 4. Business System Runtime

The Runtime is the part of the app that takes a data-described **Growth
System** — today, exclusively a `BusinessSystem` in the Business &
Entrepreneurship category — and turns it into a working, interactive
experience in the browser. It is the engine *inside* **BGrowth
Workspace™** (see VISION.md), not a separate ecosystem product, and not
specific to business content by construction (see §2).

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
exactly one rendering pipeline for every Growth System regardless of
industry *or category* — a new notary system and a future budgeting
system would both flow through the same `BusinessSystemRuntime`/
`SystemModulePage` components, distinguished only by their data. Adding an
industry, or an entire new Growth Category, should never require a
bespoke page (see §14).

**Brand mapping:** the Studio-authored `ModuleType` value `'Checklist'` is
deliberately remapped to the display label `"Planner™"` in exactly one
place — `MODULE_TYPE_CONFIG` in `ModuleBadge.tsx`. This is the only
place in the entire rendering pipeline allowed to change how a module type
is labeled, and it already applies uniformly across every category.

## 5. The Workspace Shell (current implementation)

**BGrowth Workspace™** is the primary experience after login (see
VISION.md), and is meant to hold every Growth Category's systems side by
side — not a Business-only surface. This repository already contains its
first implementation (built before Workspace had that name — it was
called "the Platform Shell" during development).

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
      │    owned Growth Systems (currently Business Systems only, since
      │    that's the only populated category — see §2, §14)
      ├─ ProfilePage, MembershipPage, SettingsPage, SupportPage — placeholder
      │    destinations for the UserMenu
      └─ AcademyPage, CommunityPage, MarketplacePage, FindPage,
         PlatformResourcesPage — placeholder destinations for the
         corresponding ecosystem products (see §10)
```

**What's real vs. mock today:**

- The catalog, filtering, sorting, and search are real, reading through
  `data/systems.ts` / `data/resources.ts` accessor functions — no
  duplicated data.
- "Ownership" (which Growth Systems a member has), "last opened," and the
  member's display name are mock, centralized in one file,
  `src/data/memberMock.ts` — not a real account or purchase record.
- Global search (Growth Systems + Resources) is real (it searches the
  actual catalog); Marketplace and Community results are static
  placeholder rows, since neither product has real data yet.
- There is **no route protection** on `/platform` — it is reachable by
  anyone today, the same way the rest of this static MVP has no real
  session. See §8.

**Known naming gaps, not yet reconciled in code** (documentation debt,
deliberately not silently fixed — see CLAUDE.md §18):

- The sidebar's **"BGrowth App"** entry currently links to `/systems` (the
  public catalog browse page) as a stand-in destination. Under the current
  ecosystem definition, **BGrowth App™** is a distinct business-management
  product (CRM/finance/ops), scoped specifically to Business &
  Entrepreneurship — not the same thing as browsing or running a Growth
  System in any category. This label will need a real destination once
  BGrowth App exists as its own product; it should **not** be
  reinterpreted as "the whole Workspace" going forward.
- The sidebar's **"Community"** entry (routing to `/platform/community`)
  is the placeholder destination for what VISION.md now calls **BGrowth
  Club™**. The nav label and page title still say "Community" in code —
  a future pass should rename this deliberately, not as a side effect of
  an unrelated change.
- "My Business Systems" (nav label, page title, and component names like
  `MyBusinessSystemsPage`/`MyBusinessSystemsSection`) is accurate today
  because Business & Entrepreneurship is the only populated category. Once
  a second category launches, this will need a category-neutral name (e.g.
  "My Growth Systems") — see §14. Don't rename it preemptively while only
  one category exists; do rename it deliberately the moment a second one
  ships.

## 6. Studio Integration (Future)

**BGrowth Studio** is a separate, not-yet-integrated product responsible
for *authoring* Growth Systems: a Checklist Builder, Planner Builder,
Workflow Builder, and Template Builder. Studio is where a system's modules,
sections, and fields are actually created and edited, for use inside
Workspace — and should be built category-agnostic from day one, since its
authoring shape (Planners/Workflows/Toolkits/Sections/Fields) already is.

Today, `src/data/systems.ts` plays Studio's role by hand — it is a static
TypeScript array shaped exactly like a Studio export would be. The type
comments in `types/system.ts` are explicit about this: *"the shape a
Business System is exported from BGrowth Studio in... swapping the source
for a fetched JSON export from Studio later is a data-loading change, not a
type or component change."*

**Integration path, when Studio exists:**

1. Studio exports a `BusinessSystem[]` (or paginated equivalent, and
   eventually a category-agnostic `GrowthSystem[]` — see §14) matching
   `types/system.ts`, minus the Runtime/commerce-only fields (see §9).
2. Replace the static import in `data/systems.ts` with a fetch/query layer
   behind the *same* accessor function signatures (`getSystemBySlug`,
   `getModuleBySlug`, `getRelatedSystems`, `getOwnedSystems`,
   `searchSystems`, `getRecommendedSystems`, `getRecentlyAddedSystems`) so
   no calling component changes.
3. Commerce fields (`price`, `memberPrice`, `checkoutUrl`,
   `whatsIncluded`) get attached by the Runtime/commerce layer after
   fetching the Studio export, not embedded in Studio's own data — this is
   the natural point to split them into a separate type (see §9).
4. Marketplace becomes the natural second consumer of Studio exports, once
   independent creators can author Growth Systems too (see §10) — Studio's
   export contract should not assume BGrowth is the only author, or that
   every author is in the Business & Entrepreneurship category.
5. The Runtime's rendering code (`BusinessSystemRuntime`,
   `SystemModulePage`, etc.) should require **no changes** — this is the
   architectural bet this repo has already made, and it should be honored
   regardless of which Growth Category a Studio export belongs to.

## 7. Future API Layer

There is no API layer today. When one is introduced, it should sit exactly
where `src/data/*.ts` sits conceptually — behind the existing accessor
function boundary:

- `getSystemBySlug`, `getModuleBySlug`, `getRelatedSystems`,
  `getIndustrySystemCount`, `getOwnedSystems`, `searchSystems`,
  `getRecommendedSystems`, `getRecentlyAddedSystems` become async (or are
  wrapped in a data-fetching hook), but keep the same names and shapes as
  much as possible.
- Pages already call these functions rather than importing raw arrays
  (per CLAUDE.md §8), so the migration to async data is expected to touch
  the data layer and add loading/error states to pages — not rewrite
  component trees.
- The same API layer should also become the home for the mock member state
  in `data/memberMock.ts` (ownership, last-opened, display name) once real
  accounts exist — that file's shape is deliberately simple so it maps
  cleanly onto a future "member profile" endpoint spanning every category.
- A real API layer should also be the natural home for search/filter
  (currently done client-side in `BrowseSystems.tsx` and
  `MyBusinessSystemsPage.tsx` over the full static array) once the catalog
  — across one category or eight — is too large for that to scale.

## 8. BGrowth Identity™ Architecture

### What BGrowth Identity™ is

BGrowth Identity™ (`src/modules/identity/`) is the provider-agnostic
identity layer every current and future authentication provider is built
on — mirroring how BGrowth Commerce™ (§9) sits between the application and
any payment provider. **The application never imports Firebase, Supabase,
Clerk, Auth0, Cognito, or any other auth SDK directly** — it only ever
calls Identity's hook (`useIdentity()`) and route guards
(`ProtectedRoute`/`GuestRoute`).

```
src/modules/identity/
  types/       domain models — interfaces and types only, no logic
    user.ts        User, UserProfile, Avatar, UserProgress, UserAchievements, UserStats
    session.ts      Session, AuthResult, SessionStatus
    auth.ts          LoginCredentials, RegistrationData, PasswordResetRequest/
                     Confirmation, EmailVerification
    settings.ts      UserSettings, NotificationPreferences, WorkspacePreferences,
                     SecuritySettings, PrivacySettings, UserPreferences
    provider.ts      IdentityProviderId
    future.ts        FutureOrganization, FutureTeam, FutureRoles,
                     FuturePermissions, FutureInvitation
  services/    interfaces only — no implementations exist yet
    IdentityService.ts, AuthenticationService.ts, SessionService.ts,
    ProfileService.ts, SettingsService.ts, NotificationService.ts,
    PasswordService.ts, VerificationService.ts, ProviderAdapter.ts
  mock/        the ONE part of Identity that is a real, working
               implementation (not just types) — see below
    mockUser.ts               the mock member, wrapping data/memberMock.ts
    MockIdentityProvider.tsx  a real React Context: login/register/logout/
                              password reset/email verification, all
                              simulated client-side (localStorage for
                              "Remember Me" only — no backend)
  routing/     ProtectedRoute.tsx, GuestRoute.tsx — reusable route guards
               built on useIdentity(), used directly in App.tsx
```

Unlike Commerce's `mock/` (static example data only), Identity's `mock/`
is a **working implementation** of the Application↔Identity boundary,
because this milestone explicitly required functional mock login, logout,
registration, "Remember Me," and email verification — not just a typed
contract. `MockIdentityProvider` does not implement `IdentityProviderAdapter`
(the interface a real provider adapter will satisfy); it simulates the same
user-facing behavior directly in React state instead, as a stand-in for
the whole boundary until a real provider exists.

### The Provider Abstraction

```
Application (pages, components — via useIdentity() and the route guards)
        │  never imports an auth provider SDK
        ▼
BGrowth Identity™ (AuthenticationService, SessionService, ProfileService,
                   SettingsService, NotificationService, PasswordService,
                   VerificationService — interfaces only today; the mock
                   provider fills this role for now)
        │  delegates the actual login/register/session work to —
        ▼
IdentityProviderAdapter   (services/ProviderAdapter.ts)
        │  one implementation per identity provider, all satisfying the
        │  same interface — login / register / logout / getCurrentSession
        ▼
   Firebase Authentication │ Supabase Auth │ Clerk │ Auth0 │ Cognito │
   Custom Authentication   │ (any future provider)
```

**No `IdentityProviderAdapter` implementation exists yet.** Swapping or
adding a provider means writing one new adapter file — it never means
touching a page, a component, or `useIdentity()`'s call sites.
`IdentityProviderId` (in `types/provider.ts`) is a union of known
providers plus a `(string & {})` escape hatch, exactly like Commerce's
`ProviderId`, specifically so an unlisted future provider doesn't require
a type change.

### User model and its relationship to Commerce

`User` (`types/user.ts`) is BGrowth Identity™'s canonical member model —
built to support every current and future BGrowth product, not just
Workspace. It deliberately **reuses** Commerce's `MembershipTierId`
(`membership: MembershipTierId`) instead of defining a second membership
enum — Identity never redefines a concept Commerce already owns, and
Commerce never redefines a concept Identity already owns. `ownedProducts`/
`benefits`/`rewards` on `User` are the Identity-side mirror of Commerce's
`ProductAccess`/`Benefit`/`Reward` — see §9's Commerce Architecture for
those.

The mock user (`mock/mockUser.ts`) does not invent a new mock member — it
imports the existing `MOCK_MEMBER_NAME`/`PURCHASED_SLUGS` constants from
`data/memberMock.ts` (established in the Workspace milestones) and wraps
them into the full `User` shape. `data/memberMock.ts` remains the single
source for those raw values; it now has two consumers (the legacy
`/my-systems` page, unchanged, and `mock/mockUser.ts`) instead of five —
see the Workspace Integration note below.

### Protected Routes, Guest Routes, and the mock session

- **`ProtectedRoute`** (`routing/ProtectedRoute.tsx`) gates a route behind
  `useIdentity()`'s session — `/platform/*` is wrapped in it in `App.tsx`,
  so the whole Workspace shell requires a (mock) session, not each page
  individually. A guest visiting any `/platform/*` URL is redirected to
  `/login`.
- **`GuestRoute`** (`routing/GuestRoute.tsx`) is the inverse — `/login`,
  `/register`, `/forgot-password`, and `/reset-password` redirect an
  already-authenticated member away instead of showing the form again.
  Critically, **`GuestRoute` is the single authority** for where an
  authenticated visitor of a guest route goes: unverified (a fresh
  Register) → `/verify-email`; verified (an existing Login) →
  `/platform/dashboard`. Neither `LoginPage` nor `RegisterPage` navigates
  on its own — early versions did, and it raced against `GuestRoute`'s own
  redirect decision, sending a fresh registration straight to Workspace
  instead of the verification step. Any future guest-route page should
  follow the same rule: let `GuestRoute` decide, don't duplicate the
  decision in the page.
- **`/verify-email`** is deliberately **not** wrapped in either guard — it
  must stay reachable by an authenticated-but-unverified member (right
  after Register) without `GuestRoute` bouncing them away, and it's also a
  reasonable page for a signed-out visitor following a stale link.
- **Public routes** (everything else on the marketing site) need no
  wrapper at all.
- **Future Role-Based/Premium/Creator/Admin/Enterprise routes**: extend
  `ProtectedRoute` with a permission check once `FutureRoles`/
  `FuturePermissions` (see `types/future.ts`) are implemented — e.g. an
  optional `requiredRole` prop that checks the member's role before
  rendering children, composed the same way `ProtectedRoute` already
  composes with the session check. Not built now; nothing in the app
  needs it yet.

### Mock authentication

`MockIdentityProvider` (mounted once, in `main.tsx`, wrapping `<App />`)
simulates the complete flow with no backend:

- **Login** — any non-empty email/password "succeeds" (there is no real
  credential check — see CLAUDE.md's Identity rules on why that's
  intentional for this phase) and returns the mock user.
- **Register** — any complete form creates a variant of the mock user with
  the entered name/email, marked unverified, and redirects (via
  `GuestRoute`) to `/verify-email`.
- **Logout** — clears the session and returns to the Homepage (`/`), from
  `UserMenu`'s now-functional "Sign Out."
- **Remember Me** — the only place this milestone touches
  `window.localStorage` (`bgrowth.identity.mockSession`), purely so a
  reload doesn't lose the mock session. No token, no real security.
- **Forgot/Reset Password, Email Verification** — simulated with an
  artificial delay and local state only; no email is ever sent.

### Workspace Integration

Per this milestone's explicit ask, Workspace now displays the
**Identity-sourced** member instead of importing `data/memberMock.ts`
constants directly: `WorkspaceHero` (name, avatar, membership tier via
`getMockMembershipPlanByTier`, reward points, level), `UserMenu` (display
name, working Sign Out), and `ContinueBuildingSection`/
`MyBusinessSystemsSection`/`MyBusinessSystemsPage` (ownership, via
`user.ownedProducts` instead of the raw `PURCHASED_SLUGS` import). The
underlying mock data is unchanged (still sourced from
`data/memberMock.ts` transitively) — only *where components read it from*
changed, from a direct data import to `useIdentity()`.

### Account Area architecture

The Account Area's fields already have a home in `types/settings.ts`
(`UserSettings` → `notifications`/`security`/`privacy`; `preferences` →
theme/locale; `workspace` → Workspace-specific display prefs) and directly
on `User` (`language`, `country`, `timezone`). "Connected Accounts,"
"Devices," and "Sessions" are intentionally left unmodeled — future
Account Area tabs with no shape defined until they're built. The
`/platform/settings` **page itself remains the same placeholder** it was
before this milestone — this section is architecture, not a redesign of
that page (see CLAUDE.md §3 on not silently upgrading this phase).

### Future: real providers, Organizations, Teams, RBAC, Enterprise

1. **Firebase/Supabase/Clerk/Auth0/Cognito/custom** — write one new file
   implementing `IdentityProviderAdapter`, then replace
   `MockIdentityProvider` with a real provider wrapping that adapter.
   Nothing calling `useIdentity()` changes, because the hook's shape
   (`status`, `user`, `login`, `register`, `logout`, ...) is the contract,
   not the mock implementation.
2. **Organizations/Teams** (`types/future.ts`'s `FutureOrganization`/
   `FutureTeam`) — reserved for BGrowth App's future Business/Enterprise
   membership tiers (see `modules/commerce/types/membership.ts`). A
   `User` would gain an organization/team membership list; Workspace would
   filter owned products by the active organization the same way it
   already filters by `user.ownedProducts`.
3. **RBAC** (`FutureRoles`/`FuturePermissions`) — composes with
   `ProtectedRoute` as described above; a permission check is an addition
   to the existing guard, not a new routing mechanism.
4. **Enterprise** — `FutureInvitation` plus Commerce's `License` (seats)
   together cover invite-and-seat-based access once the `enterprise`
   membership tier is priced and sold as a `Product`.
5. **Marketplace** — a Creator's `User.createdProducts` already exists;
   once Marketplace is real, a creator's identity and a buyer's identity
   are the same `User` type, just with different fields populated —
   no separate "creator account" type is needed.

## 9. BGrowth Commerce™ Architecture

**Current, pre-Commerce-module state:** commerce fields (`price`,
`memberPrice`, `checkoutUrl`, `whatsIncluded`) still live directly on
`BusinessSystem`, populated as static data. "Purchase" is a link to an
external `checkoutUrl` (`checkout.bgrowth.com/...`) — no checkout flow
exists in this repo. "Owned" systems (in both the legacy `MySystems.tsx`
and the Workspace's `MyBusinessSystemsPage`/Dashboard sections) come from
one hardcoded slug list in `data/memberMock.ts`, not a real purchase
record. **None of that changed in Milestone 5.1** — this section describes
the architecture those pieces will eventually migrate onto, not a change
to how the app behaves today.

### What BGrowth Commerce™ is

BGrowth Commerce™ (`src/modules/commerce/`) is the provider-agnostic
domain layer every future payment integration, membership, reward,
benefit, and affiliate relationship is built on. It exists so that **no
part of this application ever depends on Stripe, PayPal, or any other
payment provider directly** — the application talks only to Commerce;
Commerce talks to a provider through one abstraction seam.

```
src/modules/commerce/
  CommerceEngine.ts   the formal facade — see "The Commerce Engine" below
  types/       domain models — interfaces and types only, no logic
    product.ts      Product, ProductType, ProductSourceRef, ProductBenefit
    membership.ts    MembershipPlan, MembershipTierId, MembershipPermissions
    purchase.ts      Cart, CartItem, Purchase, Order, Transaction, Invoice
    access.ts        ProductAccess, UserEntitlement, License
    rewards.ts       Reward, Badge, Achievement, MemberLevel, ReferralReward
    benefits.ts      Benefit, Coupon, Discount
    partners.ts      AffiliatePartner (extends types/system.ts's), AffiliateCommission
    pricing.ts       Currency, Money, TaxRule
    provider.ts      ProviderId, CheckoutSessionRequest/Result, ProviderTransactionRef
    webhook.ts       WebhookEvent, WebhookEventType
  services/    interfaces only — no implementations exist yet
    ProductService.ts, PurchaseService.ts, MembershipService.ts,
    RewardService.ts, BenefitService.ts, PartnerService.ts,
    PricingService.ts, DiscountService.ts,
    OrderService.ts, TaxService.ts, CouponService.ts, RefundService.ts,
    WebhookService.ts, PaymentProvider.ts
    CheckoutProvider.ts, ProviderAdapter.ts   (superseded, kept — see below)
  mock/        realistic BGrowth example data for testing against the
               types/services above — not a second product catalog
```

`src/modules/` is a new top-level pattern, reserved for large,
self-contained domain modules — Commerce is the first tenant. Unlike
`components/`, `data/`, and `lib/` (which index UI, catalog content, and
small shared helpers respectively), a `modules/*` folder owns an entire
domain's types and service contracts together.

### Product vs. BusinessSystem — not a competing model

`Product` is **not** a replacement for `BusinessSystem`, and Milestone 5.1
does not touch `types/system.ts`. `BusinessSystem` remains the Runtime's
content model — the modules, sections, and fields a member actually works
through (see §2, §4). `Product` is the commerce *listing* around whatever
is being sold — a Growth System, a Course, a Marketplace item, a
Membership plan, a Bundle — and it points back at the real content via an
optional `source: { type, id }` reference instead of duplicating it:

```
Product (commerce/types/product.ts)
  source: { type: 'GrowthSystem', id: 'start-your-notary-business' }
                                          │
                                          ▼
                        BusinessSystem (data/systems.ts, unchanged)
```

When a second Growth Category or a Course/Marketplace product exists, it
gets its own `Product` entry the same way — Commerce never needs its own
parallel content catalog.

### ProductAccess — access is Commerce's decision, not the provider's

`ProductAccess`/`UserEntitlement` (`types/access.ts`) are the single
source of truth for "can this member use this product" — deliberately
decoupled from *how* they got access. A member can have `hasAccess: true`
from a direct `purchase`, a `membership` tier, a `bundle`, a
`reward-unlock`, a `gift`, a `trial`, or a future `enterprise-seat` —
Workspace should eventually check `ProductAccess`, never a payment
provider's state directly, and never re-derive ownership by asking
"did Stripe charge this person." Today, Workspace's ownership check is
still `data/memberMock.ts`'s hardcoded `PURCHASED_SLUGS` — migrating that
read to a `ProductAccess` lookup (once a `PurchaseService` implementation
exists) is the intended future step, not done in this milestone.

### The Commerce Engine

`CommerceEngine` (`src/modules/commerce/CommerceEngine.ts`) is the formal
facade this architecture was always building toward, and is now named and
typed explicitly. It is the single commercial layer the rest of the
application is ever allowed to call for anything payment-shaped:

```
Website  ->  Commerce Engine  ->  Payment Provider  ->  Payment Gateway
```

`CommerceEngine` composes seven named services — each its own interface,
each with no implementation yet:

| Service | File | Owns |
|---|---|---|
| Order Service | `services/OrderService.ts` | the whole-cart checkout record (`Order`) |
| Pricing Service | `services/PricingService.ts` | price lookup + currency conversion |
| Coupon Service | `services/CouponService.ts` | redeemable coupon-code mechanics |
| Tax Service | `services/TaxService.ts` | tax-rate lookup + calculation |
| Payment Provider (interface) | `services/PaymentProvider.ts` | the seam each concrete payment provider implements |
| Refund Service | `services/RefundService.ts` | the refund workflow across Order/Purchase/Transaction |
| Webhook Service | `services/WebhookService.ts` | verifying + normalizing inbound provider webhooks |

`PurchaseService`, `MembershipService`, `RewardService`, `BenefitService`,
`PartnerService`, and `DiscountService` remain part of Commerce but sit
outside `CommerceEngine` itself — they aren't payment-provider-facing
concerns; see "Future Rewards, Benefits, Memberships, and Enterprise"
below for how they relate.

### The Provider Abstraction

This is the core of "the application must never depend directly on
Stripe":

```
Application (pages, components)
        │  never imports a provider SDK, never imports PaymentProvider directly
        ▼
CommerceEngine     (CommerceEngine.ts)
        │  composes Order/Pricing/Coupon/Tax/Refund/Webhook Services and
        │  is the only thing that selects the active provider via —
        ▼
getActivePaymentProvider()
        │  returns whichever PaymentProvider is active, based on
        │  configuration this milestone does not define
        ▼
PaymentProvider    (services/PaymentProvider.ts)
        │  one implementation per payment provider, all satisfying the
        │  same interface — createCheckout / verifyPayment / refund /
        │  webhook / cancel
        ▼
   Stripe  │  PayPal  │  Wix Payments  │  Square  │  Mercado Pago  │
   Apple Pay │ Google Pay │ Hotmart │ Paddle │ Lemon Squeezy │ (future)
```

Every box above `PaymentProvider` in this diagram is provider-agnostic
code and stays that way permanently. Adding a new provider means writing
one new `PaymentProvider` implementation — it never means touching
`CommerceEngine`, a page, or a component. `ProviderId` (in
`types/provider.ts`) is a union of known providers plus a `(string & {})`
escape hatch specifically so a not-yet-listed provider doesn't require a
type change either.

**No `PaymentProvider` implementation exists yet** — not for Stripe, not
for any other provider. This milestone built the contract it'll be built
against, not a Stripe integration (explicitly out of scope — see
CLAUDE.md's Commerce rules).

`CheckoutProvider.ts` and `ProviderAdapter.ts` (the pre-`CommerceEngine`
version of this same seam) are now superseded by `CommerceEngine.ts` and
`PaymentProvider.ts` respectively. Both old files are left in place,
unused, per CLAUDE.md §12/§18's no-silent-deletion policy — recommended
for removal once every future caller targets the new names, pending
explicit approval.

### Future Stripe integration (and any other provider)

1. Add a Stripe-specific file (e.g. `services/providers/StripeProvider.ts`)
   implementing `PaymentProvider` — this is the *only* file allowed to
   import a Stripe SDK.
2. Register it wherever `CommerceEngine`'s concrete implementation of
   `getActivePaymentProvider()` picks a provider (that selection mechanism
   doesn't exist yet either — it's part of the same future implementation
   work, not this milestone).
3. Nothing else changes. Pages and components already only ever call
   `CommerceEngine`, never a provider directly, because that boundary is
   what this milestone establishes.

### Future Marketplace integration

A Marketplace listing is a `Product` with `type: 'MarketplaceProduct'`
(or `'GrowthSystem'`/`'Course'`/etc., authored by someone other than
BGrowth) plus an owning creator. Selling it involves the same
`Cart`/`Order`/`Purchase`/`Transaction` flow as a direct BGrowth sale;
the difference is purely commercial: an `AffiliateCommission`-shaped
record (or a creator-specific sibling of it) tracks the creator's share of
each `Transaction`, exactly as `AffiliateCommission` already tracks a
partner's share today. No new checkout mechanism is needed — only a new
`Product.source` value and a commission calculation on top of the same
`PricingService`/`DiscountService` seam.

### Future Rewards, Benefits, Memberships, and Enterprise

- **Rewards:** `RewardService.awardReward(...)` is the seam every other
  product surface (Purchase completing, a module finishing, a referral
  confirming) would eventually call into — see `types/rewards.ts`'s
  `RewardType` union for every trigger this already anticipates. No caller
  exists yet anywhere in the app.
- **Benefits:** `BenefitService`/`Coupon`/`Discount` are ready to be
  surfaced inside Workspace (e.g. a future "Benefits" Dashboard section)
  the same way `MemberBenefitsSection` today shows static marketing
  copy — the real version would call `listBenefitsForMember` instead.
- **Memberships:** `MembershipService`/`MembershipPlan` intentionally
  carry no price yet (see `types/membership.ts`) — pricing a tier is a
  distinct, future decision layered on top of this shape, likely via a
  `Product` of `type: 'Membership'` linking back to the plan (see the
  `bgrowth-club-membership` mock product).
- **Enterprise:** `License` (`types/access.ts`) models seat-based access
  for team/business accounts — reserved for the `enterprise` membership
  tier, not exercised by any current product.

### Data flow addendum

The Commerce module follows the exact same rule as the rest of this repo
(see §11): types are consumed through service *interfaces*, never by
reaching into mock arrays directly from application code, once a real
implementation exists. Today, `mock/` exists purely to prove the types
compile and compose correctly — it is not wired into any page, and should
not be imported from `pages/` or `components/` as a substitute for a real
`ProductService` implementation.

## 10. How Every Ecosystem Product Connects

VISION.md describes ten ecosystem products, spanning eight Growth
Categories (PRODUCT_CATALOG.md). This section maps each product to its
current state in this repository and its intended integration point —
none of them should ever be rebuilt as a separate app with its own login,
and none should be rebuilt per category either; all of them plug into the
same account and, where relevant, the same Growth System data.

- **🎓 Academy** (Learn) — placeholder page today
  (`pages/platform/AcademyPage.tsx`, nav item in `platformNav.ts`). Future
  courses/certifications/learning paths are a new content type, not a
  variant of `BusinessSystem` — model them as their own type when built,
  linked to a member's profile the same way owned Growth Systems are, and
  taggable by Growth Category.
- **💼 Workspace** (Work) — this repository's current focus; see §5. The
  Runtime described in §4 is Workspace's core engine, and is meant to run
  every category's systems, not only Business & Entrepreneurship's.
- **👥 Club** (Connect) — placeholder page today, currently labeled
  "Community" in code (`pages/platform/CommunityPage.tsx`) — see the
  naming gap called out in §5. Future community features (groups,
  challenges, mentorship, discussions, events) should integrate as their
  own route group under `PlatformLayout`, following the same layout/nav
  conventions already established there, organized around Growth
  Categories rather than industries only.
- **📍 Find** (Discover) — placeholder page today
  (`pages/platform/FindPage.tsx`). Find is explicitly **not** a directory
  of Growth Systems (that's the existing `/systems` catalog) — it's a
  broader discovery surface across people, professionals, products, and
  partners, across every category. It will need its own data model
  distinct from `BusinessSystem` once built; do not force
  professional/partner listings into the system type.
- **🛒 Marketplace** (Create & Sell) — today represented only as
  `AffiliatePartner` links (`AffiliatePanel`) inside a Business System, a
  flat "Recommended Tools"/"Affiliate Partners" list on the Resources page,
  and a placeholder page (`pages/platform/MarketplacePage.tsx`). A real
  Marketplace formalizes these as its own catalog/listing model — likely
  reusing the same card/grid UI primitives (`systems/`, `ui/Grid`) already
  established here — and, per VISION.md, eventually accepts listings
  authored by creators other than BGrowth itself, in any Growth Category
  (see §6 on Studio).
- **📊 App** (Manage) — **not represented in this repository at all,
  intentionally.** Per VISION.md, BGrowth App is scoped specifically to
  Business & Entrepreneurship, a distinct CRM/finance/ops product a
  member graduates into once their business outgrows a single Growth
  System — it is not a rename of Workspace, not a generic tool for every
  category, and not the same as the sidebar's current "BGrowth App" label
  (see the naming gap in §5). When built, it should integrate as its own
  connected product against the same account, not as a page inside this
  repo.
- **🤖 AI** (Accelerate) — `ModuleType` already reserves an `'AIModule'`
  value not yet exercised by any system in the catalog data. AI assistance
  should be added as a module type with its own `SystemSectionBlock`/
  `ModuleBadge` treatment inside Workspace — usable by any category — plus
  surfaced contextually in App, Find, and Marketplace once those exist —
  not built as a single standalone "AI page."
- **🤝 Partners** (Partner) — today only exists as `AffiliatePartner` data
  attached to a Business System (`affiliatePartners[]` in
  `types/system.ts`) and the flat lists in `data/resources.ts`. A real
  Partners network formalizes this into its own directory/profile model,
  which Find surfaces and Marketplace/Benefits transact against, across
  every category (equipment suppliers for Business, tutoring software for
  Languages, gyms for Health & Wellness, and so on).
- **🎁 Rewards** (Earn) — not represented in this repository. Will need
  its own points/achievement data model tied to member actions across
  every other product and every category — a cross-cutting concern, not
  owned by any single existing folder.
- **💎 Benefits** (Save) — today's closest equivalent is the free
  "Resources"/discount messaging already on the marketing site
  (`ResourcesPage`, `PricingPage`). A real Benefits product formalizes
  these into member-only offers, most naturally surfaced from the same
  `AffiliatePartner`/Partners data that powers Find and Marketplace, again
  spanning every category rather than only business suppliers.

## 11. Data Flow

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
app — every product surface described in §10, once built, is expected to
follow the same read-through-accessor-functions pattern already
established by `data/systems.ts`, and field/session state stays local and
ephemeral by design until real persistence is explicitly authorized (see
CLAUDE.md §3, §9). This pattern is what makes the Runtime reusable across
Growth Categories: a new category is new *data* flowing through the same
pipeline, never new code at the rendering layer.

## 12. Folder Organization

See CLAUDE.md §5 for the authoritative folder map (including
`components/platform/` and `pages/platform/`, the Workspace shell's
folders; `modules/commerce/`, the BGrowth Commerce™ module — see §9; and
`modules/identity/`, the BGrowth Identity™ module — see §8) and the note
about the stray, non-authoritative root-level duplicate files. This
document assumes `src/` as the only real tree.

## 13. Component Hierarchy

```
AppLayout                                    (marketing site)
 ├─ Navbar (mode: public | member)
 ├─ Outlet → HomePage, BrowseSystems, IndustriesPage, ProductPage,
 │           SystemOverviewPage → BusinessSystemRuntime → ...,
 │           SystemModulePage → ..., MySystems, PricingPage,
 │           ResourcesPage, AboutPage
 │           LoginPage, RegisterPage, ForgotPasswordPage,
 │           ResetPasswordPage (each wrapped in GuestRoute),
 │           VerifyEmailPage (unwrapped — see §8)
 │           → all compose ui/AuthCard
 └─ Footer

ProtectedRoute (see §8) wraps —
PlatformLayout                               (BGrowth Workspace shell)
 ├─ Sidebar (platformNav.ts, data-driven)
 ├─ TopBar
 │   ├─ GlobalSearch → searchSystems / searchResources
 │   ├─ QuickActionButton, NotificationButton, ThemeToggleButton (Popover)
 │   ├─ MembershipBadge
 │   └─ UserMenu (Popover) → Profile/Membership/Settings/Help/
 │       Sign Out (now wired to useIdentity().logout())
 └─ Outlet →
     DashboardPage
      ├─ WorkspaceHero (Avatar, MembershipBadge, getTimeOfDayGreeting,
      │   useIdentity() — name/membership/rewards/level)
      ├─ ContinueBuildingSection → systems/OwnedSystemCard (featured,
      │   useIdentity().user.ownedProducts[0])
      ├─ MyBusinessSystemsSection → systems/OwnedSystemCard × 3, "View All"
      │   (useIdentity().user.ownedProducts)
      ├─ RecommendedSection → ui/Carousel → systems/BusinessSystemCard
      ├─ RecentlyAddedSection → layout/Grid → systems/BusinessSystemCard
      ├─ QuickActionsSection (static config)
      └─ MemberBenefitsSection (static config)
     MyBusinessSystemsPage → SearchToolbar, FilterPill, systems/OwnedSystemCard
       (useIdentity().user.ownedProducts)
     ProfilePage, MembershipPage, SettingsPage, SupportPage,
     AcademyPage, CommunityPage, MarketplacePage, FindPage,
     PlatformResourcesPage → all compose PlaceholderPage
```

Every branch in both layouts bottoms out in `components/ui/*` primitives
(`Button`, `Card`, `Badge`, `SectionHeader`, `Grid`, `Avatar`, `Carousel`,
...) — no page or feature component should reimplement what a `ui/`
primitive already provides, regardless of which Growth Category it serves.

## 14. How Future Modules and Growth Categories Should Integrate

Any new capability — a new module type, a new ecosystem product surface,
a new Growth Category, a new data source — should be evaluated against
these questions before writing code:

1. **Which Growth Category does this belong to, and which ecosystem
   product?** Check PRODUCT_CATALOG.md and §10 first. A feature isn't
   automatically "part of Workspace" just because `/platform` is
   convenient to add to, and a new category (Careers, Languages, Personal
   Finance, ...) is a **data change** — new rows in the catalog, using the
   existing type — not a new Runtime, new page, or new component tree
   (see §2, §4).
2. **Does it fit the existing system/module shape?** If yes — and per §2,
   it almost certainly does, regardless of category — extend the type in
   `types/system.ts` and add data. Don't build a parallel content model
   per category. If it's a genuinely different kind of content (an
   Academy course, a Find listing, a Rewards achievement), it likely needs
   its own type, not a bent version of the system type.
3. **Does it need its own route?** If it belongs inside Workspace, it's a
   new entry under `PlatformLayout` in `App.tsx`, following the
   `platformNav.ts` data-driven sidebar convention already in place. If it
   belongs to the marketing site, it's a new entry under `AppLayout`. Two
   different ecosystem products should not share one route's chrome, and a
   new Growth Category should not get a new route/layout of its own — it
   reuses `/systems`, `/product/:slug`, `/system/:slug`, and
   `/platform/my-systems` exactly as they exist today.
4. **Does it need new interactive UI?** Build it from existing `ui/`
   primitives and `lib/motion.ts` variants first; only add a new primitive
   if nothing existing fits, and place it in `ui/` (generic), `systems/`
   (system-shape-aware), or `platform/` (Workspace-shell-specific)
   according to what it depends on.
5. **Does it need a backend?** Design the integration point behind the
   existing accessor-function boundary (`data/systems.ts`,
   `data/resources.ts`, `data/memberMock.ts`) so the Runtime's and
   Workspace's rendering layers don't need to change — this repo's
   architecture is already built around that seam (see §6, §7).
6. **Does it change commerce, auth, or persistence?** Real backend
   persistence is explicitly out of scope for the current phase (see
   CLAUDE.md §3) — confirm with the user before building rather than
   bolting partial versions on ad hoc. Commerce *architecture* (types and
   service interfaces) already exists in `src/modules/commerce/` (§9); a
   working *mock* Identity architecture (`src/modules/identity/`, §8) now
   exists too — a commerce-shaped feature extends those
   models/interfaces, and an auth/identity-shaped feature reuses
   `useIdentity()`/`ProtectedRoute`/`GuestRoute`. Never hardcode a payment
   or identity provider, and never duplicate `Product`/`MembershipPlan`/
   `User`/`Session`.

**Recommendations for the eventual generalization** (documentation only —
none of this is implemented, and none of it should be done opportunistically):

- Add an explicit top-level category field (e.g. `growthCategory: string`)
  to the system type when the second Growth Category ships, rather than
  inferring category from `industry`/`category` values. Today's
  `industry`/`category` fields should remain as a sub-taxonomy *within* a
  Growth Category, not be overloaded to also mean the category itself.
- Treat `BusinessSystem` → `GrowthSystem` as a single, deliberate rename
  (type, folder names, route param names where user-facing) timed with the
  second category's launch — not a partial rename done alongside unrelated
  work.
- Rename `MyBusinessSystemsPage`/`MyBusinessSystemsSection` to a
  category-neutral name (e.g. "My Growth Systems") at that same moment —
  see the naming gap in §5.
- Model "Track Progress" (see §3) as real persistence only once
  authentication exists (§8) — don't build a partial, session-only
  progress tracker before then.
