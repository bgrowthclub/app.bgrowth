# COMMERCE.md — BGrowth Commerce Engine Developer Guide

This is the working guide for developers building on the Commerce Engine
(`src/modules/commerce/`, `api/`). It's practical, not architectural
record — for the historical "why" behind each decision, see
`ARCHITECTURE.md` §9 (search "Commerce" and "Payment completion
pipeline"). For general codebase rules, see `CLAUDE.md`, especially §16
("BGrowth Commerce™ Rules").

If you're new here, read this top to bottom once before touching any
Commerce file. It will save you from re-deriving decisions that are
already made.

---

## 1. Overall Commerce Architecture

BGrowth Commerce™ is the provider-agnostic domain layer every payment,
membership, reward, benefit, and partner concern is built on. The one
rule that explains almost every structural decision in this module:

> **No part of this application ever depends on Stripe, Supabase, or any
> other specific vendor directly.** The application talks to Commerce's
> interfaces; Commerce talks to a vendor through exactly one seam per
> concern.

That rule is enforced by two separate abstraction layers stacked on top
of each other:

```
Application (pages, components)
        │
        ▼
CommerceEngine            — the facade: orders, pricing, coupons, tax,
                             refunds, webhooks, paymentManager
        │
        ▼
PaymentManager             — resolves a Product's PaymentProfileId to a
                              concrete PaymentProvider
        │
        ▼
PaymentProvider             — the seam every vendor (Stripe today) implements
        │
        ▼
   Stripe / PayPal / Mercado Pago / ...
```

Orthogonal to that (persistence, not payment routing):

```
OrderService / AccessService     — business logic, zero vendor imports
        │
        ▼
OrderRepository / AccessRepository   — the persistence seam
        │
        ▼
SupabaseOrderRepository / SupabaseAccessRepository (server)
HttpAccessRepository (browser, reads through /api/access)
```

Only **Orders** and **Access** persist to a real database (Supabase)
today. Products, Product Packages, Builders, and Workspaces are a
separate, unrelated data path (`data/systems.ts`, the Published Product
Repository) — see `ARCHITECTURE.md` §2/§9 if you need that story too;
this document only covers Commerce.

### What's real vs. interface-only right now

| Piece | Status |
|---|---|
| `ProductService`, `AccessService`, `OrderService`, `PaymentManager` | Real |
| `StripeProvider` (the only `PaymentProvider`) | Real |
| `SupabaseOrderRepository`, `SupabaseAccessRepository`, `HttpAccessRepository` | Real |
| `PurchaseService`, `MembershipService`, `RewardService`, `BenefitService`, `PartnerService`, `PricingService`, `DiscountService`, `TaxService`, `CouponService`, `RefundService`, `WebhookService` | Interface only — typed contracts, no implementation |

Don't assume something works just because a well-named file exists. Check
this table, or check whether the file exports a `createX(...)` factory
*and* a singleton built from it (real) vs. just an `interface` (not).

---

## 2. Request Flow

The complete purchase flow, start to finish:

```
1. Product Page          — member clicks "Buy" / "Get Workspace"
        │
2. Checkout (browser)    — src/pages/CheckoutPage.tsx
        │  calls commerceEngine.paymentManager.createCheckout(...)
        │  (src/modules/commerce/CommerceEngineClient.ts)
        ▼
3. POST /api/checkout    — api/checkout.ts (Vercel Function)
        │  creates the Order (server/orderService.ts)
        │  starts a Stripe Checkout Session (server/paymentManager.ts)
        ▼
4. Stripe Checkout       — hosted page, buyer enters card details
        │  buyer completes payment
        ▼
5. Browser redirects     — to CheckoutPage's successUrl
        │  (src/pages/CheckoutSuccessPage.tsx — polls AccessService
        │  briefly, since the webhook below is asynchronous)
        │
   (in parallel, server-side:)
        ▼
6. Stripe sends webhook  — POST /api/webhooks/stripe
        │  verifies signature, normalizes the event
        │  (services/providers/StripeProvider.ts's webhook() method)
        ▼
7. OrderService.completeOrder(orderId, transactionId)
        │  (server/orderService.ts calls into services/OrderService.ts)
        │  marks the Order completed, then grants access
        ▼
8. AccessService.grantAccess(...)   — one call per Order line item
        │  (server/accessService.ts)
        ▼
9. Supabase                — orders + product_access rows persist
        │
10. My Workspaces (browser) — reads through client/accessService.ts →
        │                     GET /api/access → sees the new grant
        ▼
11. Open Workspace           — member's purchased content is available
```

**The one thing to internalize:** steps 2–3 and steps 6–8 run in
*separate* browser/server contexts that don't share memory. Step 3
(`/api/checkout`) and step 6 (`/api/webhooks/stripe`) are even separate
serverless function invocations from *each other* — that's exactly why
Orders/Access live in Supabase and not an in-memory array (see §7).

---

## 3. Order Lifecycle

An `Order` (`types/purchase.ts`) has exactly one owning service —
`OrderService` (`services/OrderService.ts`, real singleton in
`server/orderService.ts`) — and moves through these states:

```
(none) ──createOrder──▶ pending ──completeOrder──▶ completed
                            │
                            └──cancelOrder──▶ cancelled
```

- **`createOrder(cart, memberId)`** — called from `/api/checkout.ts`,
  before the Stripe Checkout Session is created. Builds subtotal/total
  from the `Cart`'s line items (discount/tax are always zero right now —
  `CouponService`/`TaxService` aren't implemented yet, not a design
  choice). Saves via `OrderRepository`. Status starts `pending`.
- **`completeOrder(orderId, transactionId)`** — the **one** orchestration
  point after payment confirmation. Called only from
  `api/webhooks/stripe.ts`, only for a `checkout.completed` event. Does
  three things, in order: (1) loads the Order, (2) marks it `completed`
  and records `transactionId`, saves it, (3) calls
  `AccessService.grantAccess` once per line item. **Idempotent by
  design** — see the dedicated subsection below, this is the part most
  worth understanding deeply before you touch it.
- **`cancelOrder(orderId)`** — marks an Order `cancelled`. No current
  caller wires this to anything yet (no cancellation flow exists in the
  UI) — it exists on the interface for when one does.
- **`getOrderById`, `listOrdersForMember`** — plain reads.

### Idempotency — why `completeOrder` is not a simple state transition

Stripe (and every real provider) delivers webhooks **at-least-once**, not
exactly-once. A retry after a timeout or non-2xx response is normal
operation, not an edge case. `completeOrder` handles three situations
explicitly:

1. **Sequential duplicate** (a retry arrives after the first delivery
   already completed the order) — the already-`completed` check returns
   the existing Order unchanged. No re-save, no second `grantAccess`
   call, `grantedAt` is never re-stamped.
2. **Concurrent duplicate** (a retry arrives while the first delivery is
   still being processed, within the *same* warm server instance) — an
   `inFlightCompletions` map makes the second caller await the exact same
   in-progress `Promise` instead of re-reading the still-`pending` Order.
3. **Mismatched transaction** (an already-completed Order gets a
   `completeOrder` call with a *different* `transactionId` than the one
   that completed it) — throws. This is a genuine anomaly, not a normal
   retry; a real provider never legitimately re-sends a different
   transaction id for an order it already completed.

**What this does NOT cover:** two duplicate webhook deliveries landing on
*different* serverless instances at the same moment. `inFlightCompletions`
is in-process memory — it doesn't survive across Vercel function
invocations. `SupabaseOrderRepository.saveOrder` today is a plain upsert,
not a conditional update. This is a narrow, known, documented gap (see
`ARCHITECTURE.md`'s "Payment completion pipeline idempotency" section) —
closing it fully needs a conditional update (`UPDATE ... WHERE status =
'pending'`) or a unique constraint on `transaction_id` at the database
layer. Worth fixing before high production volume; not yet done.

---

## 4. Access Lifecycle

`ProductAccess` (`types/access.ts`) answers exactly one question: *can
this member use this product, right now.* Owned by `AccessService`
(`services/AccessService.ts`).

```
grantAccess(access) ──▶ ProductAccess record exists (hasAccess: true)
```

There's no multi-state lifecycle here the way `Order` has — a
`ProductAccess` row simply exists or doesn't, keyed by `(memberId,
productId)`. What varies is **where the grant came from**
(`AccessSource`): `purchase`, `membership`, `bundle`, `reward-unlock`,
`gift`, `coupon`, `trial`, `beta`, `enterprise-seat`, `free-product`.

**The one hard rule:** `grantAccess` for `source: 'purchase'` is called
from exactly one place in the entire codebase —
`OrderService.completeOrder`. Never from a page, a component, a
`PaymentProvider`, or a webhook handler directly. If you find yourself
about to call `accessService.grantAccess(...)` from anywhere else for a
purchase, stop — that's very likely the wrong layer. (Every other
`AccessSource` is a separate, not-yet-built future caller — e.g. a
membership tier activating would call `grantAccess` with `source:
'membership'` from wherever membership activation eventually lives, not
from `OrderService`.)

**Reading access** differs by environment — see §8 (Server vs. Client
boundaries) for why:

- Server code (`/api/*.ts`) imports `accessService` from
  `src/modules/commerce/server/accessService.ts` — reads/writes Supabase
  directly.
- Browser code (pages, components) imports `accessService` from
  `src/modules/commerce/client/accessService.ts` — reads through
  `GET /api/access?memberId=...`, and its `grantAccess`/`saveAccess`
  throws if ever called (the browser must never grant access itself).

---

## 5. PaymentProvider Lifecycle

A `PaymentProvider` (`services/PaymentProvider.ts`) is stateless from the
application's point of view — there's no "lifecycle" in the sense of
state transitions, but there is a fixed sequence of calls across a real
transaction:

```
1. createCheckout(request)        → { checkoutUrl, sessionId, provider }
        (buyer is redirected to checkoutUrl; nothing more happens here
         until the provider tells you what happened, via a webhook)

2. webhook(payload, signature)    → WebhookEvent
        (verifies the signature against the raw payload, normalizes the
         provider's event shape into { type, orderId, transactionId, ... })

   ...later, only if needed:

3. verifyPayment(transactionId)   → Transaction   (re-check a payment's status)
4. refund(transactionId)          → Transaction   (issue a refund)
5. cancel(transactionId)          → Transaction   (cancel a pending payment)
```

Every method takes/returns provider-agnostic shapes
(`CheckoutSessionRequest`/`Result`, `Transaction`, `WebhookEvent`) —
nothing in this interface, or anywhere above it, ever sees a Stripe (or
any vendor's) native type.

**`webhook(payload: string, signature: string)`** — note `payload` is
typed `string`, and it must be the *exact raw, unparsed request body*.
Signature verification is a byte-exact HMAC check; a re-serialized or
JSON-parsed-then-stringified payload will fail verification even if the
content looks identical. This is why `api/webhooks/stripe.ts` disables
Vercel's automatic body parser (`export const config = { api: {
bodyParser: false } }`) and reads the raw stream manually.

---

## 6. Stripe Implementation Overview

`services/providers/StripeProvider.ts` is the first (and only, today)
concrete `PaymentProvider`. It's the **only file in the application
allowed to import the `stripe` SDK** (CLAUDE.md §16).

- **Checkout mode:** hosted Stripe Checkout (`stripe.checkout.sessions.create`,
  `mode: 'payment'`), not Stripe.js/Elements. The buyer is redirected to
  Stripe's own page; this app never touches card data, and needs no
  publishable key client-side for this flow (`VITE_STRIPE_PUBLISHABLE_KEY`
  is documented in `.env.example` but unused — reserved for a future
  embedded checkout).
- **Correlation:** `Cart.id` is reused as Stripe's `client_reference_id`
  (set to the real `Order.id` by `api/checkout.ts` right before calling
  `createCheckout` — no new field was added to `CheckoutSessionRequest`
  for this). The same id is also stashed in the Payment Intent's metadata
  (`payment_intent_data: { metadata: { orderId } }`), so `verifyPayment`/
  `refund`/`cancel` (which only get a `transactionId`, i.e. a Payment
  Intent id) can still resolve which Order it belongs to.
- **Event mapping** (`webhook()`): Stripe's `checkout.session.completed`
  maps to this app's `'checkout.completed'` `WebhookEventType`; a handful
  of others are mapped defensively (`payment_intent.succeeded` →
  `'payment.succeeded'`, etc.) but **only `checkout.completed` is
  actually acted on today** (`api/webhooks/stripe.ts` only calls
  `OrderService.completeOrder` for that type). Any other event type
  throws `"Unhandled Stripe event type"` — by design. The Stripe
  Dashboard webhook endpoint should be configured to send **only**
  `checkout.session.completed`; if you add handling for a new event type
  in `mapStripeEventType`, add it to the Dashboard subscription too, or
  it'll never arrive.
- **Money handling:** Stripe amounts are integer cents; `StripeProvider`
  converts to/from this app's `Money.amount` (a decimal float) at the
  boundary — `Math.round(item.unitPrice.amount * 100)` going out,
  `intent.amount / 100` coming back.

---

## 7. Repository Pattern

Every persisted concern in Commerce follows the same three-layer shape:

```
XService            — business logic, zero storage-detail knowledge
        │  depends on
        ▼
XRepository         — a small interface: save/get/list, nothing more
        │  implemented by
        ▼
LocalXRepository (in-memory, superseded/unused)
SupabaseXRepository (real, server)
HttpXRepository (real, browser, only where the browser needs to read)
```

This is *why* `OrderService`/`AccessService` never import
`@supabase/supabase-js` themselves — they take a repository as a
constructor parameter (`createOrderService(repository, accessService)`,
`createAccessService(repository)`) and call only its 2–3 methods. Swap
the repository, and the service's business logic — idempotency handling,
access-granting orchestration, all of it — doesn't change at all.

**Today's concrete repositories:**

| Repository | Interface | Real implementation | Where it's used |
|---|---|---|---|
| Order | `services/OrderRepository.ts` | `store/SupabaseOrderRepository.ts` | `server/orderService.ts` only |
| Access (server) | `services/AccessRepository.ts` | `store/SupabaseAccessRepository.ts` | `server/accessService.ts` only |
| Access (browser) | `services/AccessRepository.ts` | `store/HttpAccessRepository.ts` (reads through `/api/access`; `saveAccess` throws) | `client/accessService.ts` only |

`store/LocalOrderRepository.ts` and `store/LocalAccessRepository.ts`
still exist (in-memory arrays) but are **not used by anything** — they
predate the Supabase migration and are kept per the no-silent-deletion
policy (CLAUDE.md §12/§18), flagged for removal pending explicit
approval. Don't wire anything to them; if you're tempted to, you
probably want `Supabase*Repository` or `Http*Repository` instead.

---

## 8. Server vs. Client Boundaries

**The rule:** a browser-reachable file (anything under `src/pages/`,
`src/components/`, or imported from either) must never — even
transitively — import `stripe`, `@supabase/supabase-js`, or any file that
does. This is checked, not just hoped for — see "Verifying the boundary"
below.

**How the split works:**

```
services/OrderService.ts       interface + createOrderService(...) factory
services/AccessService.ts      interface + createAccessService(...) factory
services/PaymentManager.ts     interface + createPaymentManager(providers) factory
```

These three files hold **only** their interface and a factory function —
no singleton, no concrete repository or provider import, nothing
environment-specific. That's what makes them safe to import from
anywhere. The real singletons live in two folders that own nothing but
composition:

```
server/orderService.ts     createOrderService(createSupabaseOrderRepository(), accessService)
server/accessService.ts    createAccessService(createSupabaseAccessRepository())
server/paymentManager.ts   createPaymentManager({ stripe: stripeProvider })
                            ← the only file that imports StripeProvider's concrete module

client/accessService.ts    createAccessService(createHttpAccessRepository())
```

- **`server/*.ts` is imported only by `/api/*.ts`.** Never by a page or
  component. If you add a new `/api/*.ts` endpoint that needs
  `orderService`/`accessService`/`paymentManager`, import from `server/`,
  not from `services/`.
- **`client/*.ts` is imported by browser code** (Product Library,
  Dashboard sections, `CheckoutSuccessPage`) wherever the old
  `services/AccessService.ts` singleton used to be imported directly.
- **`CommerceEngineClient.ts`** is the browser's entire payment-facing
  surface. It only does `import type` (fully erased at compile time —
  zero runtime cost) plus one `fetch('/api/checkout')` call in
  `paymentManager.createCheckout`. Every other member (`orders`,
  `pricing`, `coupons`, `tax`, `refunds`, `webhooks`, and
  `paymentManager`'s other four methods) throws `"not available in the
  browser"` if actually called — this flow doesn't need them.

**Why this is a separate concern from "just guard it at runtime":** an
earlier version of `AccessService.ts` picked its repository with a
runtime check (`typeof window === 'undefined' ? Supabase : Http`) *inside
the same file that imported both*. Vite can't tree-shake a branch it
can't statically prove is dead — the unreachable Supabase branch shipped
to the browser anyway (confirmed: `@supabase/supabase-js`'s
`GoTrueClient` signature was present in the built client bundle). Moving
construction into physically separate files, rather than branching inside
one shared file, is what actually keeps the SDK out — not the runtime
check.

**Verifying the boundary yourself**, any time you add or move a Commerce
file:

```bash
# 1. Nothing under src/pages or src/components imports server/
grep -rln "modules/commerce/server" src/pages src/components

# 2. server/ is imported only by api/*.ts
grep -rn "modules/commerce/server" api/

# 3. Rebuild and grep the output bundle for vendor SDK signatures
npm run build
grep -o "GoTrueClient\|supabase-js\|Stripe\.errors\|stripe-node" dist/assets/*.js
```

All three should come back empty (script 3's `grep` should have zero
matches) if the boundary is intact.

---

## 9. How to Add a New Payment Provider

Following the exact pattern `StripeProvider` established:

1. **Implement `PaymentProvider`** in a new file,
   `services/providers/<Provider>.ts` (e.g. `MercadoPagoProvider.ts`).
   This is the *only* file allowed to import that provider's SDK. Give it
   all five methods: `createCheckout`, `verifyPayment`, `refund`,
   `webhook`, `cancel`. Map the provider's native event types to this
   app's `WebhookEventType` inside `webhook()`, the same way
   `StripeProvider.mapStripeEventType` does — and only handle the event
   type(s) you actually act on; throw for anything else.
2. **Register it** in `server/paymentManager.ts`'s `PROVIDERS` map:
   ```ts
   const PROVIDERS: Partial<Record<ProviderId, PaymentProvider>> = {
     stripe: stripeProvider,
     'mercado-pago': mercadoPagoProvider,
   }
   ```
   If the provider id isn't already in `KnownProviderId`
   (`types/provider.ts`), add it there too (or rely on the `(string &
   {})` escape hatch — either works, but adding it gives you autocomplete).
3. **Point a Payment Profile at it** — either as a profile's default
   `providerId`, or (for selling the same product through different
   providers in different regions) as a `regional` profile's
   `regionOverrides` entry in `mock/mockPaymentProfiles.ts`:
   ```ts
   regional: { id: 'regional', label: 'Regional', providerId: 'stripe',
     regionOverrides: { BR: 'mercado-pago' } }
   ```
4. **Add a webhook endpoint**, `api/webhooks/<provider>.ts`, mirroring
   `api/webhooks/stripe.ts`'s shape exactly: disable the body parser, read
   the raw body, call `<provider>Provider.webhook(payload, signature)`,
   then `orderService.completeOrder(event.orderId, event.transactionId)`
   for the relevant event type. Import `orderService` from
   `server/orderService.ts`, never from `services/OrderService.ts`
   directly.
5. **Add the provider's environment variables** to `.env.example`,
   following the existing client-safe/server-only split, and to Vercel's
   project settings.
6. **Nothing else changes.** `CommerceEngine`, `CommerceEngineClient.ts`,
   `PaymentManager`'s interface, `Checkout Page`, and every other
   Commerce file stay exactly as they are — that boundary is the entire
   point of this architecture. If you find yourself editing
   `CheckoutPage.tsx` or `CommerceEngineClient.ts` to add a provider,
   stop — you're almost certainly doing something the architecture
   already prevents needing.

---

## 10. How to Replace the Supabase Repositories

If Orders/Access ever need to move to a different database, or a
different Supabase project shape:

1. **Write a new `OrderRepository`/`AccessRepository` implementation** —
   e.g. `store/PostgresOrderRepository.ts` — satisfying the exact same
   interface `SupabaseOrderRepository`/`SupabaseAccessRepository` already
   do (`saveOrder`/`getOrderById`/`listOrdersForMember`, or
   `saveAccess`/`getAccess`/`listAccessForMember`). No new methods, no
   interface changes — `OrderService`/`AccessService` don't know or care
   which repository they're talking to.
2. **Swap the import in exactly two files**: `server/orderService.ts`
   and/or `server/accessService.ts`. That's the *only* place a concrete
   repository is ever constructed for the server side.
3. **Nothing else changes** — not `OrderService`, not `AccessService`,
   not `/api/checkout.ts`, not `/api/webhooks/stripe.ts`, not
   `CommerceEngineClient.ts`, not any page.
4. If the browser-facing side also needs to change (unlikely — it only
   ever talks to `/api/access`, never a database directly), update
   `api/access.ts`'s import the same way; `HttpAccessRepository.ts` and
   every browser caller are unaffected either way, since they only ever
   see HTTP.
5. **Update the schema doc** — `docs/database/supabase-schema.sql` (or
   its replacement) and this document's §11 (Environment Variables) if
   the new store needs different credentials.

The same recipe applies if you ever need to move *away* from Supabase
entirely (e.g. a self-hosted Postgres) — the repository interface is the
seam specifically so this is a contained, two-file change.

---

## 11. Environment Variables

All server-only — read only inside `/api/*.ts` and the `server/*.ts`
singletons they call. None should ever be `VITE_`-prefixed (Vite inlines
every `VITE_` variable into the public client bundle). Full reference,
including the client-safe/server-only split rationale, lives in
`.env.example`.

| Variable | Read by | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | `services/providers/StripeProvider.ts` | Authenticates every Stripe API call |
| `STRIPE_WEBHOOK_SECRET` | `services/providers/StripeProvider.ts` | Verifies inbound webhook signatures (`stripe.webhooks.constructEvent`) |
| `SUPABASE_URL` | `store/SupabaseOrderRepository.ts`, `store/SupabaseAccessRepository.ts` | Supabase project endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | same two files | Bypasses Row Level Security for server-side reads/writes — **never** expose this client-side |
| `VITE_STRIPE_PUBLISHABLE_KEY` | *(not currently read anywhere)* | Reserved for a future embedded (Stripe.js/Elements) checkout; the current hosted-Checkout flow doesn't need it |

Local development: copy `.env.example` to `.env.local` and fill in real
Test Mode / dev-project values. `vercel dev` (not plain `npm run dev`) is
required to actually exercise `/api/*` locally — the Vite dev server
alone doesn't route it.

---

## 12. Common Debugging Steps

**"Checkout failed with status 404" in the browser.**
You're running plain `npm run dev` (Vite only) — it doesn't serve
`/api/*` at all. Use `vercel dev`, or test against a real Preview
Deployment.

**Webhook never seems to complete the Order ("Order not found" from
`completeOrder`).**
Almost always one of:
- The Stripe Dashboard's webhook endpoint URL is wrong or points at a
  different deployment than the one that created the Order.
- `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` differ between whatever
  environment ran `/api/checkout` and whatever ran
  `/api/webhooks/stripe` (e.g. one pointed at a dev project, the other
  at staging) — check both functions' env vars in the Vercel dashboard.
- The Order genuinely doesn't exist yet (webhook arrived before
  `/api/checkout`'s Supabase write committed) — check the `orders` table
  directly in Supabase's table editor.

**Webhook signature verification fails
("Webhook signature verification failed").**
- `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint's actual signing
  secret in the Stripe Dashboard (each registered endpoint has its own
  secret — copy-pasting from a different environment's endpoint is the
  usual culprit).
- Something upstream of `api/webhooks/stripe.ts` re-parsed or re-encoded
  the request body before it got there. Confirm `export const config = {
  api: { bodyParser: false } }` is still present — if Vercel's default
  JSON body parser runs, the raw bytes needed for signature verification
  are gone by the time the handler sees them.

**"Unhandled Stripe event type" errors in the webhook function's logs.**
Expected and correct if the Stripe Dashboard's webhook endpoint is
subscribed to more event types than `StripeProvider.mapStripeEventType`
handles. Either narrow the Dashboard subscription to just
`checkout.session.completed`, or extend `mapStripeEventType` (and
`api/webhooks/stripe.ts`'s handling) if you have a real reason to act on
another event type.

**Access isn't showing up in My Workspaces after a successful purchase.**
1. Confirm the webhook actually fired and returned 200 (Stripe
   Dashboard's webhook logs).
2. Query the `product_access` table in Supabase directly for the
   member/product pair — if the row exists there but the UI doesn't show
   it, the bug is in `client/accessService.ts` → `/api/access` → the
   Product Library read path, not in the payment pipeline.
3. If the row doesn't exist in Supabase either, the bug is upstream —
   check `completeOrder`'s logs (did `grantAccess` throw? did
   `completeOrder` even get called?).

**Bundle size crept back up / a vendor SDK leaked into the client
bundle.**
Run the three-command check in §8 ("Verifying the boundary yourself").
The likely cause is a new import added directly to `services/*.ts`
instead of to `server/*.ts` or `client/*.ts` — check whether the file you
just edited (or a file it imports) pulled in `stripe` or
`@supabase/supabase-js` at the top level, unconditionally.

**Duplicate access grants, or an Order re-processed unexpectedly.**
Re-read §3's idempotency subsection. Check whether the duplicate calls
landed in the *same* warm serverless instance (the in-process
`inFlightCompletions` guard should have caught it — if it didn't, that's
a real bug) or *different* instances (the known, documented gap — see
`ARCHITECTURE.md`'s idempotency section for the fix this needs).

**Local type errors under `/api/` that `npm run build` doesn't catch.**
The root `tsconfig.json` only covers `src/` — it never sees `/api/*.ts`.
Run `npx tsc -p api/tsconfig.json --noEmit` separately; this is not part
of `npm run build` and won't fail CI unless you run it explicitly.
