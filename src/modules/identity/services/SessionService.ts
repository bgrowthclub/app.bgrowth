import type { Session } from '../types/session'

// Interface only — no implementation.
export interface SessionService {
  getSession(sessionId: string): Promise<Session | undefined>
  refreshSession(sessionId: string): Promise<Session>
  endSession(sessionId: string): Promise<void>
}
