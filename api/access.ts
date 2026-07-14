import type { VercelRequest, VercelResponse } from '@vercel/node'
import { accessService } from '../src/modules/commerce/server/accessService'

// The browser's only way to read ProductAccess — see
// store/HttpAccessRepository.ts, which every browser-side AccessService
// call (Product Library, Dashboard sections, ...) is transparently backed
// by. Read-only: this endpoint never grants access — that only ever
// happens server-side, from OrderService.completeOrder.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined
  if (!memberId) {
    res.status(400).json({ error: 'memberId query parameter is required' })
    return
  }

  try {
    const access = await accessService.listAccessForMember(memberId)
    res.status(200).json({ access })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load access' })
  }
}
