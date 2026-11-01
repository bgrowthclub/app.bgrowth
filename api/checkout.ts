import type { VercelRequest, VercelResponse } from '@vercel/node'

// Off since Sprint 53 (security audit): this legacy route took the price,
// the member and the redirect URLs from the request with no sign-in.
// Everything is sold through api/studio-checkout.ts (Workspaces,
// calculators, downloads, bundles) and api/account.ts (plans).
//
// 01/11/2026 — it used to import orderService, paymentManager and the
// Commerce types from ../src/…, which a Vercel function CANNOT do: `src/`
// is not deployed with the function, so the import fails at module load
// with ERR_MODULE_NOT_FOUND. The 410 below never got a chance to run — a
// call crashed with a 500 instead. That is exactly what took /api/account
// down on 31/10/2026 (Sprint 175), and neither `tsc` nor `npm run build`
// catches it. The route is kept here, answering 410, with nothing to
// import. Its old logic is in git history (before Sprint 53).
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(410).json({ error: 'This checkout is no longer available.' })
}
