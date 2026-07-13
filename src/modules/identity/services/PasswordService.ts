import type { PasswordResetRequest, PasswordResetConfirmation } from '../types/auth'

// Interface only — no implementation.
export interface PasswordService {
  requestReset(request: PasswordResetRequest): Promise<void>
  confirmReset(confirmation: PasswordResetConfirmation): Promise<void>
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>
}
