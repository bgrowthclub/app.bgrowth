import type { UserPreferences, UserSettings, WorkspacePreferences } from './types/settings'
import type { UserAchievements } from './types/user'

// Starting values for a real member's fields that have no backing store
// yet (preferences, settings, rewards/achievements). These are neutral
// defaults — nothing here pretends a member has done or earned anything.
// Each moves to real storage when its feature ships.
export const DEFAULT_PREFERENCES: UserPreferences = { theme: 'system', locale: 'en-US' }

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  sidebarCollapsed: false,
  defaultView: 'grid',
  showContinueBuilding: true,
}

export const DEFAULT_ACHIEVEMENTS: UserAchievements = { badgeIds: [], achievementIds: [], points: 0, level: 1 }

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    emailNotifications: true,
    productUpdates: true,
    communityActivity: false,
    marketingEmails: false,
  },
  security: { twoFactorEnabled: false, activeSessionCount: 1 },
  privacy: {
    profileVisibility: 'members-only',
    showActivityToCommunity: false,
    allowDataForRecommendations: true,
  },
}
