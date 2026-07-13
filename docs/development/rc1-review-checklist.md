# Platform Foundation RC1 — Review Checklist

Companion to `rc1-release-summary.md`. Walk through this in a browser
against a running Preview Deployment (or `npm run dev`) before cutting the
final Release Candidate commit. Check off each item; note failures inline
rather than silently fixing and re-checking — a fix should be traceable to
what this checklist caught.

## Build verification

- [ ] `npm run build` completes with zero TypeScript errors
- [ ] `npm run build` completes with zero Vite errors (warnings about chunk
      size are known/expected — not a failure)
- [ ] `npx tsc --noEmit` is clean on its own
- [ ] No `node_modules/` or `dist/` drift left in `git status` after the
      build (see CLAUDE.md §14)

## Console errors

For every route below, open the browser console and confirm no errors
(React warnings about keys, hook rules, or failed prop types are real
findings, not noise — the pre-existing favicon 404 / proxy `ERR_CONNECTION_RESET`
noise seen throughout this environment is not):

- [ ] `/` (Homepage)
- [ ] `/systems` (Workspace Catalog)
- [ ] `/product/start-your-notary-business` (a real product)
- [ ] `/checkout` (direct visit with no state — should redirect, not error)
- [ ] `/platform/dashboard` (after logging in)
- [ ] `/studio/products`

## Broken links

- [ ] Every link in `Navbar` and `Footer` resolves (no 404s)
- [ ] Every Workspace Catalog card's "View System" link resolves to a real
      product page
- [ ] Homepage's featured row cards link to real product pages
- [ ] "Back to Business Systems" / "Back to Product" links on the Product
      Page and Checkout resolve correctly
- [ ] Sidebar items in `/platform/*` that are locked ("coming soon") do
      **not** navigate — they open the `ComingSoonModal` instead
- [ ] `/account` redirects to `/platform/profile`
- [ ] A stale/removed link to `/industries` is not present anywhere in
      current copy (route was removed this release — see release summary
      §3)

## Homepage (`/`)

- [ ] Hero renders, search input accepts text, rotating "I want to ___"
      examples cycle
- [ ] Popular goals row scrolls horizontally (wheel, drag, and touch)
- [ ] LifeWorlds section renders every `WORKSPACE_CATEGORIES` entry with
      correct counts
- [ ] StartHere ("Start with one goal") shows only **published AND
      featured** products — confirm by publishing/unpublishing/toggling
      Featured on a product in Studio and reloading
- [ ] Knowledge section shows 3 article previews
- [ ] AboutStory renders
- [ ] No layout shift or overlap at 1280px, 768px, and 375px widths

## Workspace Catalog (`/systems`)

- [ ] Shows every **published** product, not a hardcoded list — confirm by
      publishing a new product in Studio and reloading without a code
      change
- [ ] Industry filter pills work and reflect real `CATEGORIES`
- [ ] Module Type filter pills work and only show types actually present
      in the published catalog
- [ ] Search box filters by title/description
- [ ] Sort (Featured / Price asc / Price desc / Name A–Z) all produce
      correct ordering
- [ ] Empty state renders correctly when a filter combination matches
      nothing

## Product Pages (`/product/:slug`)

- [ ] Loads via `ProductService.getProductBySlug`, not a hardcoded lookup
      (confirm: a product created and published purely in Studio, with no
      matching hardcoded entry, has a working page)
- [ ] Title, subtitle, description, price, benefits, What's Included, FAQ
      all reflect the **Product** record, not just the underlying
      Workspace's raw fields (confirm: edit a Product's title/price in
      Studio without touching its Content Source — the product page
      should show the edited values)
- [ ] For a GrowthSystem-sourced product: Modules Included, Resources,
      Reviews, Who Is This For sections render from the underlying
      BusinessSystem
- [ ] For a product with no GrowthSystem source: those sections are
      absent, not broken/empty
- [ ] Related Products section shows only products actually set in
      Studio's Website tab (`relatedProductIds`) — never a hardcoded
      relationship, and hidden entirely when none are set
- [ ] "Get Workspace" / "Preview Workspace" buttons both work
- [ ] Direct visit to a slug that doesn't exist redirects to `/systems`

## Checkout (`/checkout`, `/checkout/success`)

- [ ] Direct visit with no navigation state redirects to `/systems`
      (doesn't crash)
- [ ] Order summary shows the live Product's title/price (loaded via
      `ProductService`, not a stale snapshot passed through navigation
      state)
- [ ] Coupon field is present but inert (no real discount logic expected
      yet)
- [ ] "Continue to Secure Checkout" does not error (documented no-op —
      confirm it's still a no-op, not a broken handler)
- [ ] Checkout Success page renders the same live product info correctly

## Member Area (`/platform/my-systems`, Dashboard sections)

- [ ] "My Workspaces" shows exactly the mock member's owned products (2
      today: Start Your Notary Business™, Daily Notary Operations™) — not
      zero, not all published products
- [ ] Search/filter/sort within My Workspaces all work
- [ ] Grid/List view toggle works
- [ ] Dashboard's "Continue Your Workspace" shows one owned product
- [ ] Dashboard's "My Workspaces" preview section matches the full list
- [ ] Status badges (Not Started / In Progress / Completed) reflect real
      `UserProgress` data, not a placeholder

## Product Engine (`/studio/products`)

- [ ] Reachable via the sidebar's "Product Engine" link (not just by
      typing the URL)
- [ ] Left panel: search, Status filter pills, Type filter pills, product
      list, "+ New Product" all work
- [ ] All 6 tabs (General, Content Source, Pricing, Images, Website,
      Publishing) load and save correctly for both a new and an existing
      product
- [ ] Content Source tab: selecting a Workspace auto-fills General tab
      fields; switching Content Source Type to an unregistered type (e.g.
      Planner) shows the disabled "coming soon" state, not an error
- [ ] Images tab: Thumbnail/Hero/Preview Images/Gallery/Videos/Downloads
      all save and reload correctly
- [ ] Publishing tab: validation checklist accurately reflects missing
      fields; Publish button is disabled until all checks pass; Version
      display (Draft vX · Published vY) increments correctly across
      Save/Publish
- [ ] Preview Website button opens a dialog reflecting current unsaved
      draft state
- [ ] Publishing a product makes it appear on Homepage/Catalog/its own
      Product Page/Search/Checkout **immediately**, with no reload and no
      code change (the core promise of Sprint 8 — re-verify it hasn't
      regressed)
- [ ] Archiving a product removes it from all of the above immediately

## Dashboard (`/platform/dashboard`)

- [ ] Greeting/welcome copy renders with the mock member's name
- [ ] Quick Actions section renders and links resolve
- [ ] Member Benefits section renders
- [ ] Recently Added / Recommended sections render (still reading
      `data/systems.ts` directly — not part of this release's
      ProductService migration; confirm they still work, not that they
      were migrated)

## Navigation

- [ ] Navbar shows correct public vs. member nav based on route prefix
      and auth state
- [ ] Sidebar active-state highlighting matches the current route in both
      `/platform/*` and `/studio/*`
- [ ] Mobile nav (hamburger / bottom sheet, whichever this Hero iteration
      landed on) opens and closes correctly
- [ ] Logging out from `/platform/*` redirects correctly and re-visiting a
      `/platform/*` route redirects to `/login`

## Search

- [ ] Platform TopBar search (`GlobalSearch`) returns real published
      products for a matching query, plus Resources — not stale/hardcoded
      results
- [ ] Marketplace/Community rows in search results are clearly inert
      placeholders, not broken links
- [ ] Empty query and no-match query both handled without error

## Mobile responsiveness

Check at minimum 375px (small phone), 768px (tablet), 1024px (small
laptop) for:

- [ ] Homepage (Hero, LifeWorlds, StartHere horizontal scroll, Knowledge)
- [ ] Workspace Catalog filters/grid
- [ ] Product Page (hero layout, purchase card placement)
- [ ] Checkout (two-column layout collapsing correctly)
- [ ] Platform Dashboard and Sidebar (collapse/drawer behavior)
- [ ] Studio (sidebar is desktop-only by design — confirm the mobile
      header fallback still shows and links correctly below the `md`
      breakpoint)

## Accessibility

- [ ] All interactive elements (buttons, links, form inputs) are reachable
      by keyboard (Tab/Shift+Tab) in a logical order
- [ ] Focus states are visible, not suppressed
- [ ] Form inputs (Login, Register, Checkout coupon, Studio's product
      editor fields) have associated labels
- [ ] Images that carry meaning have alt text; decorative icons don't
      need it
- [ ] Color contrast on primary text/background combinations is
      reasonable (spot-check, not a full WCAG audit)
- [ ] Modal/dialog components (ComingSoonModal, PublishDialog,
      PreviewDialog) trap focus and are dismissible via Escape
