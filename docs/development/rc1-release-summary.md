# Platform Foundation RC1 — Release Summary

**Branch:** `claude/engineering-foundation-p70xwe`
**Target:** `main` (currently frozen at `0201ec1` — "Sprint 5 - Member Experience Foundation")
**Scope:** 40 commits, 181 files changed, ~11,245 insertions / ~780 deletions
**Merge type:** Clean fast-forward — `main` is a strict ancestor of this branch, so there is no conflict risk, only review risk.

## Why this is bigger than "Sprints 6–8"

`main` was never updated past Sprint 5. Every one of the following shipped
on this branch since then, in this order, and none of it exists in `main`
today: the permanent engineering docs (CLAUDE.md/ARCHITECTURE.md/VISION.md),
the Platform Shell (Milestone 4.1) and its evolution into BGrowth
Workspace™, the Commerce and Identity architecture foundations (Milestone
5.1/5.2), a full homepage narrative redesign (multiple Hero iterations),
the Workspace™/Business-System terminology rename, the purchase flow
(Checkout), the Product Library / Member Area, and finally Sprints 6–8
(the Product Engine and its connection to the Runtime). This document
summarizes all of it, since all of it is what would land in `main` in one
merge.

---

## 1. New Features

### BGrowth Workspace™ (Platform Shell)
The authenticated member shell — `PlatformLayout`, `Sidebar`, `TopBar`,
`GlobalSearch`, `Popover`, and the Dashboard's section components
(Continue Building, My Business Systems, Recently Added, Recommended,
Quick Actions, Member Benefits). Locked/"coming soon" nav items for
ecosystem products not built yet (Academy, Club, Marketplace, Find), with
a `ComingSoonModal`.

### BGrowth Identity™
Provider-agnostic identity layer (`modules/identity/`): typed interfaces
for every future real provider (`AuthenticationService`, `SessionService`,
`ProfileService`, `SettingsService`, `NotificationService`,
`PasswordService`, `VerificationService`, `ProviderAdapter`), plus a real,
working mock implementation — `MockIdentityProvider` + `useIdentity()` —
that actually drives Login/Register/Forgot/Reset/Verify-Email and route
protection (`ProtectedRoute`, `GuestRoute`). This is the first real
authentication behavior in the app, even though it's entirely client-side
mock state.

### BGrowth Commerce™
Provider-agnostic commerce domain layer (`modules/commerce/`): types and
service interfaces for `Product`, `Purchase`, `MembershipPlan`,
`ProductAccess`, `Pricing`, `Benefits`, `Partners`, `Rewards`, most of
which are interface + mock-data only (no real implementation yet —
`PurchaseService`, `MembershipService`, `PricingService`, `BenefitService`,
`PartnerService`, `RewardService`, `CheckoutProvider`, `ProviderAdapter`).
Three services are real, working implementations: `ProductService`
(read-only, Runtime-facing), `ProductAdminService` (write, Studio-facing),
and `AccessService` (access-independent-of-payment-method lookups).

### Homepage redesign
Full narrative rebuild: several Hero iterations landing on a
goal-oriented, search-first hero; `LifeWorlds` (Workspace™ ecosystem
categories); `StartHere` (browse carousel, now reading live published
products — see below); `Knowledge` (articles preview); `AboutStory`. The
older sections (`FeaturedSystems`, `Testimonials`, `HowItWorks`,
`Industries`, `BecomeMember`) were removed, not kept alongside the new
ones (see Breaking Changes).

### Checkout
`CheckoutPage` and `CheckoutSuccessPage`, with `PricingCard` and
`PurchaseCard` as the two purchase entry points from the Product Page.
Simulates the order-review step of a purchase flow; no real payment
processing exists (the "Continue to Secure Checkout" button is a
documented, intentional no-op — Stripe integration is explicitly future
work).

### Member Area / Product Library
`MyBusinessSystemsPage` ("My Workspaces"), `ProductLibraryCard`, and the
Dashboard's ownership sections, all reading a member's owned products
through `AccessService` + `ProductService` rather than ad hoc mock arrays
(see Sprint 8 below — this was rewired mid-branch, not built this way
from the start).

### BGrowth Studio / Product Engine (Sprints 6–8)
An internal Product Management tool at `/studio/products` — a deliberate
third layout (`StudioLayout`), separate from the public site and the
Workspace. A 6-tab editor (General, Content Source, Pricing, Images,
Website, Publishing) over every `Product` field, including:
- **Content Source** — generalized "import a Workspace" into a pluggable
  provider registry (`studio/lib/contentSources/`); only GrowthSystem has
  a real provider today, others render as "coming soon."
- **ProductAssets** — Thumbnail, Hero Image, Gallery, Preview Images,
  Videos, Downloads consolidated onto one model instead of scattered
  Product fields.
- **Versioning** — Draft/Published version history; publishing appends a
  version instead of overwriting the last one.
- **Preview** — a `ProductPreviewService` + inline `PreviewDialog`,
  preparing the architecture for a future standalone "Preview Website"
  feature.
- A minimal, temporary Studio sidebar (single "Product Engine" item) so
  the tool is reachable without typing the URL directly.

### Runtime ↔ Product Engine connection (Sprint 8)
A **Published Product Repository** (`modules/commerce/store/`) that
Studio's Publish action writes into, and that `ProductService` reads from
exclusively — so a product is live on every surface the instant it's
published, with no rebuild and no manual refresh step. Homepage
(`getFeatured()`), Workspace Catalog (`getPublished()`), the dynamic
Product Page (`getProductBySlug()`), Related Products (`getRelated()`),
platform Search (`searchProducts()`), Checkout, and the Member Area's
Product Library were all migrated off hardcoded/ad hoc data onto this
service.

### Terminology and ecosystem rename
"Business Systems" → "Workspace™" across member-facing copy;
`/industries` → `/workspaces` (`WorkspaceCategory` replacing
`Industry`); Life Worlds section rebranded as the Workspace™ ecosystem
entry point.

### Content architecture scaffold (dormant)
`src/content/` — types (`ContentManifest`, `ContentProduct`) and READMEs
describing a future file-based authoring format Studio would eventually
export to. **Not wired into the running app** — no page, component, or
service reads from it. See "Deprecated / Dormant" below.

---

## 2. Architectural Changes

- **Three top-level layouts, not two**: `AppLayout` (public marketing),
  `PlatformLayout` (member Workspace), and `StudioLayout` (internal
  Product Engine) — the last a deliberate, documented exception to the
  original "exactly two layouts" rule, explicitly authorized for this
  reason.
- **Provider-agnostic domain modules**: `modules/identity/` and
  `modules/commerce/` both separate a permanent, real interface layer from
  whatever concrete provider eventually backs it (a real auth vendor, a
  real payment processor) — application code depends on the interface,
  never a provider SDK.
- **Read/write service separation**: `ProductService` (read-only, what the
  Runtime consumes) is a distinct implementation from `ProductAdminService`
  (write, what Studio uses) — both operate on the same underlying mock
  "database," but neither can accidentally do the other's job.
- **Published Product Repository as the publish boundary**: Studio's draft
  working store (`MOCK_PRODUCTS`) and the Published Product Repository are
  two separate in-memory stores. Publishing is the only thing that copies
  a product from one to the other; a product can be edited further after
  publishing without any of those edits going live until Publish is
  clicked again.
- **Governance rules formalized in CLAUDE.md**: the Component Evolution
  Rule (extend vs. fork a shared component), "never delete a component
  without explicit approval," and "preserve product intent over
  engineering convenience" are now permanent, documented rules governing
  all future work, not just the commits that introduced them.
- **CLAUDE.md / ARCHITECTURE.md / VISION.md / PRODUCT_CATALOG.md**
  established as the governing document set for the whole project — none
  of these existed in `main` at all.

---

## 3. Breaking Changes (relative to what `main` has today)

- **Homepage sections removed**, not kept alongside their replacements:
  `BecomeMember.tsx`, `FeaturedSystems.tsx`, `HowItWorks.tsx`,
  `Industries.tsx`, `Testimonials.tsx` are deleted.
- **`/industries` route removed.** `IndustriesPage.tsx` and
  `data/industries.ts` are deleted; replaced by `/workspaces`
  (`WorkspacesPage.tsx`) and `/preview/:category`
  (`CategoryPreviewPage.tsx`) backed by `data/workspaceCategories.ts`.
  Any external link to `/industries` will 404.
- **`Navbar.tsx`, `Footer.tsx`, `Hero.tsx`, `SEO.tsx` rewritten** — visual
  and structural changes to every page that renders inside `AppLayout`.
- **`data/systems.ts` gained new required accessors** (`getAllSystems`,
  `getRecentlyAddedSystems`, `getRecommendedSystems`, `searchSystems`,
  `getOwnedSystems`) — any code that previously imported `SYSTEMS`
  directly (main's version may have) needs to move to an accessor.
- **App is now wrapped in `MockIdentityProvider`** (`main.tsx`) — anything
  rendered outside that provider tree loses access to `useIdentity()`.
- **`/platform/*` is now gated** behind a mock session via
  `ProtectedRoute` — a signed-out visitor is redirected to `/login`. This
  is new, real (if mock) gating behavior, not present in `main`.

---

## 4. Routes Added

New since `main`:

| Route | Notes |
|---|---|
| `/checkout`, `/checkout/success` | Purchase flow |
| `/workspaces`, `/preview/:category` | Replaces `/industries` |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | BGrowth Identity™ auth pages |
| `/account` | Redirect to `/platform/profile` |
| `/platform` + 11 child routes | `dashboard`, `my-systems`, `academy`, `community`, `marketplace`, `find`, `resources`, `profile`, `membership`, `settings`, `support` — all gated by `ProtectedRoute` |
| `/studio` + `/studio/products` | Internal Product Engine, no auth gate yet (documented gap) |

Removed since `main`: `/industries`.

Unchanged: `/`, `/systems`, `/product/:slug`, `/my-systems` (legacy,
untouched), `/system/:slug`, `/system/:slug/module/:moduleSlug`,
`/resources`, `/pricing`, `/about`.

---

## 5. Services Added

**Commerce** (`modules/commerce/services/`): `ProductService` (real),
`ProductAdminService` (real), `AccessService` (real), `ProductPreviewService`
(real, minimal), `ProductRepository` / `RemoteProductSource` (interfaces
only — the seam a future GitHub/S3/API-backed source implements),
`PurchaseService`, `MembershipService`, `PricingService`,
`BenefitService`, `PartnerService`, `RewardService`, `CheckoutProvider`,
`ProviderAdapter` (interfaces + mock data only, no real implementation).

**Identity** (`modules/identity/services/`): `AuthenticationService`,
`IdentityService`, `SessionService`, `ProfileService`,
`SettingsService`, `NotificationService`, `PasswordService`,
`VerificationService`, `ProviderAdapter` (interfaces only — the real,
working behavior lives in `mock/MockIdentityProvider.tsx`, not in these
interface files).

**Store** (`modules/commerce/store/`): `publishedProductStore`,
`publishedProductRepository` (real, backs `ProductService`).

---

## 6. Components Added

By folder (new files only; see §3 for modified existing components):

- **`components/platform/`** (Workspace shell): `PlatformLayout`,
  `Sidebar`, `SidebarGroup`, `SidebarItem`, `TopBar`, `GlobalSearch`,
  `SearchBox`, `Popover`, `UserMenu`, `NotificationButton`,
  `ThemeToggleButton`, `MembershipBadge`, `WorkspaceHero`,
  `QuickActionButton`, `QuickActionsSection`, `ContinueBuildingSection`,
  `MyBusinessSystemsSection`, `RecentlyAddedSection`,
  `RecommendedSection`, `MemberBenefitsSection`, `ComingSoonModal` +
  `ComingSoonModalProvider`, `PlaceholderPage`, `platformNav.ts`.
- **`components/sections/`** (homepage): `LifeWorlds`, `StartHere`,
  `Knowledge`, `AboutStory`.
- **`components/systems/`**: `WorkspaceCoverCard`, `ProductLibraryCard`,
  `OwnedSystemCard` (superseded, see §8).
- **`components/runtime/`**: `RelatedProductsPanel`.
- **`components/ui/`**: `AuthCard`, `Avatar`, `Carousel`, `PurchaseCard`.
- **`studio/`** (entire tree, new): `StudioLayout`, `ProductEnginePage`,
  `ProductListPanel`, `PublishDialog`, `PreviewDialog`, all 6 tab
  components, `Field`, `formStyles`, and the `lib/` support files
  (`assetList`, `emptyProduct`, `publishValidation`, `workspaceImport`
  (superseded, see §8), `contentSources/*`).

---

## 7. Pages Added

`CheckoutPage`, `CheckoutSuccessPage`, `WorkspacesPage`,
`CategoryPreviewPage`, all 5 `pages/auth/*` pages, all 11
`pages/platform/*` pages, `studio/pages/ProductEnginePage`.

---

## 8. Deprecated / Dormant — Intentionally Left in Place

Per this repo's no-silent-deletion rule, none of these were removed. Each
is confirmed to have zero remaining call sites/imports:

- **`components/systems/OwnedSystemCard.tsx`** — superseded by
  `ProductLibraryCard`.
- **`studio/components/tabs/WorkspaceTab.tsx`** — superseded by
  `ContentSourceTab.tsx`.
- **`studio/lib/workspaceImport.ts`** — superseded by
  `contentSources/growthSystemSource.ts`.
- **`modules/commerce/mock/mockProducts.ts`'s `createLocalProductRepository`**
  — superseded by `store/publishedProductRepository.ts`. (Not previously
  flagged with an in-code comment; flagged here now.)
- **`src/content/`** — not deprecated, but dormant: types-only scaffold
  for a future Studio export format, explicitly documented as "not wired
  into the running app" in its own README. No adapter connecting it to
  `BusinessSystem`/`Product` exists yet.

All five are safe to remove once explicitly approved, but recommend
removal as a deliberate, standalone follow-up rather than folding it into
this release.
