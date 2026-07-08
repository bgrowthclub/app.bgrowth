import type { IdentityProviderId } from '../types/provider'
import type { LoginCredentials, RegistrationData } from '../types/auth'
import type { AuthResult } from '../types/session'

// The seam every identity/auth provider integration implements — Firebase
// Authentication, Supabase Auth, Clerk, Auth0, Cognito, a custom backend,
// or any future provider. Nothing in this application or the rest of
// Identity imports a provider SDK directly; everything calls something
// implementing this interface instead, selected by whatever assembles
// BGrowth Identity™'s real implementation later. See ARCHITECTURE.md's
// Identity Architecture section for the full
// Application → BGrowth Identity™ → Provider Adapter → Firebase/... flow.
//
// Interface only — no implementation. mock/MockIdentityProvider.tsx does
// NOT implement this interface (it simulates the same operations directly
// in React state instead) — this is the contract a real adapter will be
// built against once one exists.
export interface IdentityProviderAdapter {
  readonly id: IdentityProviderId
  login(credentials: LoginCredentials): Promise<AuthResult>
  register(data: RegistrationData): Promise<AuthResult>
  logout(sessionId: string): Promise<void>
  getCurrentSession(): Promise<AuthResult | undefined>
}
