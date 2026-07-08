import type { LoginCredentials, RegistrationData } from '../types/auth'
import type { AuthResult } from '../types/session'

// Interface only — no implementation. mock/MockIdentityProvider.tsx
// simulates the same login/register/logout operations directly in React
// state (with localStorage for "Remember Me"), since this milestone
// explicitly asks for working mock auth, not just a typed contract.
export interface AuthenticationService {
  login(credentials: LoginCredentials): Promise<AuthResult>
  register(data: RegistrationData): Promise<AuthResult>
  logout(sessionId: string): Promise<void>
}
