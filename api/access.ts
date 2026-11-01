import type { VercelRequest, VercelResponse } from '@vercel/node'

// Off since Sprint 53 (security audit): this legacy route returned any
// member's access with no sign-in. A member's access is read through
// api/account.ts, under the signed-in member's own session.
//
// 01/11/2026 — it used to import accessService from ../src/…, which a
// Vercel function CANNOT do: `src/` is not deployed with the function, so
// the import fails at module load with ERR_MODULE_NOT_FOUND. The 410 below
// never got a chance to run — a call crashed with a 500 instead. That is
// exactly what took /api/account down on 31/10/2026 (Sprint 175), and
// neither `tsc` nor `npm run build` catches it. The route is kept here,
// answering 410, with nothing to import. Its old logic is in git history
// (before Sprint 53); if it is ever needed again it has to be written
// server-side and self-contained, with a session check.
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(410).json({ error: 'Not available.' })
}
