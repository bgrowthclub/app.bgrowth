import type { EmailVerification } from '../types/auth'

// Interface only — no implementation.
export interface VerificationService {
  sendVerificationEmail(userId: string): Promise<void>
  confirmVerification(token: string): Promise<EmailVerification>
}
