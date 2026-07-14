import type { AccessService } from '../services/AccessService'
import { createAccessService } from '../services/AccessService'
import { createHttpAccessRepository } from '../store/HttpAccessRepository'

// The real, browser-only AccessService singleton — reads through
// /api/access rather than Supabase directly, since the browser must
// never hold SUPABASE_SERVICE_ROLE_KEY. Every browser caller (Product
// Library, Dashboard sections, CheckoutSuccessPage) imports this, never
// services/AccessService.ts's factory directly and never
// server/accessService.ts. See ARCHITECTURE.md's "Server/client
// boundary" section.
export const accessService: AccessService = createAccessService(createHttpAccessRepository())
