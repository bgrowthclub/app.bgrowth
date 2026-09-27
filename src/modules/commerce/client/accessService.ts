import type { AccessService } from '../services/AccessService'
import { createAccessService } from '../services/AccessService'
import { createLocalAccessRepository } from '../store/LocalAccessRepository'

// The browser-only AccessService singleton. Every browser caller (Product
// Library, Dashboard sections, CheckoutSuccessPage) imports this, never
// services/AccessService.ts's factory directly and never
// server/accessService.ts. See ARCHITECTURE.md's "Server/client boundary"
// section.
//
// Backed by LocalAccessRepository (mock grants) for now: the Website is not
// connected to Supabase yet, so /api/access has no database behind it.
// Once the Website joins the shared Supabase project (Website Consolidation
// plan, step 3), swap this one line to createHttpAccessRepository() — the
// browser must never hold SUPABASE_SERVICE_ROLE_KEY, which is exactly why
// that repository reads through /api/access instead.
export const accessService: AccessService = createAccessService(createLocalAccessRepository())
