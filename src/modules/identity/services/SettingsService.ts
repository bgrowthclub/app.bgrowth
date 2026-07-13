import type { UserSettings } from '../types/settings'

// Interface only — no implementation.
export interface SettingsService {
  getSettings(userId: string): Promise<UserSettings>
  updateSettings(userId: string, changes: Partial<UserSettings>): Promise<UserSettings>
}
