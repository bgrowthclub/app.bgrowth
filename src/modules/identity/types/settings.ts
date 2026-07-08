// Account Area architecture — Profile/Language live directly on User (see
// user.ts); the rest of the Account Area (Security, Notifications,
// Preferences, Appearance, Privacy) is modeled here. "Connected Accounts,"
// "Devices," and "Sessions" are intentionally not modeled yet — they're
// future Account Area tabs with no shape defined until they're built.

export interface NotificationPreferences {
  emailNotifications: boolean
  productUpdates: boolean
  communityActivity: boolean
  marketingEmails: boolean
  // Escape hatch for a channel this interface doesn't model yet (push,
  // SMS, in-app) — extend properly once the shape is known.
  futureChannels?: Record<string, boolean>
}

export interface WorkspacePreferences {
  sidebarCollapsed: boolean
  defaultView: 'grid' | 'list'
  showContinueBuilding: boolean
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  passwordLastChangedAt?: string
  activeSessionCount: number
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'members-only' | 'private'
  showActivityToCommunity: boolean
  allowDataForRecommendations: boolean
}

// "Appearance" + quick, frequently-read preferences — kept separate from
// the heavier UserSettings aggregate below so a component that only needs
// theme/locale doesn't have to pull in notifications/security/privacy too.
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  locale: string
}

export interface UserSettings {
  notifications: NotificationPreferences
  security: SecuritySettings
  privacy: PrivacySettings
}
