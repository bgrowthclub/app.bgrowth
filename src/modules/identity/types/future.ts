// Reserved for BGrowth App™'s future Business/Enterprise membership tiers
// (see VISION.md, modules/commerce/types/membership.ts's 'business' and
// 'enterprise' tiers). Nothing in this app constructs these types yet —
// they exist so RBAC/multi-seat access has a shape to grow into instead of
// being bolted on ad hoc later. See ARCHITECTURE.md §8.

export interface FutureOrganization {
  id: string
  name: string
  ownerUserId: string
  memberIds: string[]
}

export interface FutureTeam {
  id: string
  organizationId: string
  name: string
  memberIds: string[]
}

export type FutureRoleId = 'owner' | 'admin' | 'member' | 'creator' | 'viewer' | (string & {})

export interface FutureRoles {
  userId: string
  organizationId?: string
  teamId?: string
  role: FutureRoleId
}

export interface FuturePermissions {
  roleId: FutureRoleId
  permissions: string[] // permission keys, e.g. 'billing.manage', 'members.invite'
}

export interface FutureInvitation {
  id: string
  organizationId?: string
  teamId?: string
  invitedEmail: string
  role: FutureRoleId
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  invitedByUserId: string
}
