import { createContext, useContext } from 'react'
import type { User } from './types/user'
import type { LoginCredentials, RegistrationData } from './types/auth'

export type IdentityStatus = 'loading' | 'authenticated' | 'guest'

// The contract every BGrowth Identity™ provider implements and every page
// or component reads through useIdentity(). Provider-agnostic on purpose:
// SupabaseIdentityProvider (the real one, see supabase/) and
// MockIdentityProvider (kept, no longer mounted) both fill this same shape,
// so no page ever knows which provider is behind it.
export interface IdentityContextValue {
  // 'loading' only while the stored session is first being restored — an
  // in-flight login/register sets `busy` instead, so GuestRoute never
  // unmounts the form mid-submit.
  status: IdentityStatus
  busy: boolean
  user: User | undefined
  // The last action's human-readable error; cleared on every new action and
  // on every route change.
  error: string | undefined
  emailVerified: boolean
  // True while the visitor arrived through a password-reset email link —
  // ResetPasswordPage only shows its form in this state (or when signed in).
  passwordRecovery: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  // Resolves true once the account exists and a verification email is on
  // its way (the member is NOT signed in until they open it).
  register: (data: RegistrationData) => Promise<boolean>
  resendVerification: (email: string) => Promise<boolean>
  logout: () => void
  requestPasswordReset: (email: string) => Promise<boolean>
  resetPassword: (newPassword: string) => Promise<void>
}

export const IdentityContext = createContext<IdentityContextValue | undefined>(undefined)

export function useIdentity() {
  const ctx = useContext(IdentityContext)
  if (!ctx) throw new Error('useIdentity must be used within a BGrowth Identity™ provider')
  return ctx
}
