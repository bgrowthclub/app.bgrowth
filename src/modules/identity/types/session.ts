import type { User } from './user'
import type { IdentityProviderId } from './provider'

export type SessionStatus = 'authenticated' | 'guest' | 'loading'

export interface Session {
  id: string
  userId: string
  provider: IdentityProviderId
  createdAt: string
  expiresAt?: string
  rememberMe: boolean
}

export interface AuthResult {
  user: User
  session: Session
}
