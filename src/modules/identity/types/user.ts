import type { MembershipTierId } from '../../commerce/types/membership'
import type { UserPreferences, WorkspacePreferences, UserSettings } from './settings'

export interface Avatar {
  url?: string
  initials?: string
}

// A single owned Growth System's (or any Product's) progress — the
// architecture "Track Progress" needs (see ARCHITECTURE.md §3 in the main
// doc). No persistence; this is the shape a future ProgressService would
// read/write.
export interface UserProgress {
  productId: string
  percentComplete: number
  lastActivityAt?: string
}

export interface UserAchievements {
  badgeIds: string[]
  achievementIds: string[]
  points: number
  level: number
}

// A richer profile view than the flat fields on User — what a future
// ProfileService.getProfile() would return, composing several User fields
// together for a Profile page.
export interface UserProfile {
  firstName?: string
  lastName?: string
  displayName: string
  avatar: Avatar
  language: string
  country?: string
  timezone?: string
  bio?: string
}

// Aggregate, read-only stats for a Profile page — not itself a User field
// (the explicit User field list doesn't include it), but composes with
// `achievements`/`progress` when a Profile page eventually renders one.
export interface UserStats {
  systemsCompleted: number
  systemsOwned: number
  memberSince: string
}

// BGrowth Identity™'s canonical member model — supports every current and
// future BGrowth product, not just Workspace. `membership` reuses
// Commerce's MembershipTierId rather than a second enum (see
// modules/commerce/types/membership.ts) — Identity never redefines a
// concept Commerce already owns.
export interface User {
  id: string
  email: string
  displayName: string
  firstName?: string
  lastName?: string
  photo?: string
  membership: MembershipTierId
  language: string
  country?: string
  timezone?: string
  preferences: UserPreferences
  workspace: WorkspacePreferences
  achievements: UserAchievements
  rewards: number // total reward points — mirrors the sum of Commerce's Reward ledger
  benefits: string[] // Benefit ids (see modules/commerce/types/benefits.ts)
  ownedProducts: string[] // Product ids — mirrors Commerce's ProductAccess/UserEntitlement
  createdProducts: string[] // Marketplace creator products, future
  favoriteProducts: string[]
  progress: UserProgress[]
  settings: UserSettings
  createdAt: string
  updatedAt: string
  // Escape hatch for a field a future product needs before this interface
  // is formally extended — never read ad hoc without adding the field
  // properly once its shape is known.
  futureFields?: Record<string, unknown>
}
