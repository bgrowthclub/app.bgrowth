import type { ProductAccess } from '../types/access'

// The seam between "where ProductAccess records are stored" and
// AccessService, which owns the business logic of "does this member have
// access" but never how that record is actually persisted — mirrors
// OrderRepository's role for Order records (see OrderRepository.ts).
// LocalAccessRepository (store/LocalAccessRepository.ts) is the only
// implementation today, backed by an in-memory array. A future database-
// or API-backed AccessRepository implements this exact same interface and
// replaces it — nothing above this layer (AccessService, OrderService, or
// any page) ever changes when that happens.
export interface AccessRepository {
  saveAccess(access: ProductAccess): Promise<ProductAccess>
  getAccess(memberId: string, productId: string): Promise<ProductAccess | undefined>
  listAccessForMember(memberId: string): Promise<ProductAccess[]>
}
