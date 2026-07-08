import type { User, UserProfile } from '../types/user'

// Interface only — no implementation.
export interface ProfileService {
  getProfile(userId: string): Promise<UserProfile>
  updateProfile(userId: string, changes: Partial<UserProfile>): Promise<User>
}
