import type { NotificationPreferences } from '../types/settings'

// Interface only — no implementation.
export interface NotificationService {
  getPreferences(userId: string): Promise<NotificationPreferences>
  updatePreferences(userId: string, changes: Partial<NotificationPreferences>): Promise<NotificationPreferences>
}
