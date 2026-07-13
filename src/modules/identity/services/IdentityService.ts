import type { User } from '../types/user'

// Interface only — no implementation beyond the mock provider (see
// mock/MockIdentityProvider.tsx), which does not implement this interface
// directly but demonstrates the same shape via React state.
export interface IdentityService {
  getCurrentUser(): Promise<User | undefined>
  updateUser(userId: string, changes: Partial<User>): Promise<User>
}
