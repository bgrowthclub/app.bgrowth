import { studioWorkspaceService, isStudioCatalogAvailable } from './studioWorkspaceService'
import { computeWorkspaceProgress } from '../hooks/useWorkspaceProgress'
import type { WorkspaceData } from '../types/content'

export interface StudioDocument {
  id: string
  label: string
  updatedAt: string
  percent: number
  productSlug: string
  productName: string
}

export interface StudioDocumentGroup {
  productSlug: string
  productName: string
  documents: StudioDocument[]
}

// Every saved record a member has made in any Studio Workspace — the same
// list as the Portal's "My Documents", grouped by Workspace. Progress uses
// the viewer's own rules against each Workspace's published content.
export async function listStudioDocuments(userId: string): Promise<StudioDocumentGroup[]> {
  if (!isStudioCatalogAvailable) return []
  const instances = await studioWorkspaceService.listAllInstances(userId)
  const productIds = [...new Set(instances.map((i) => i.product_id))]
  const products = await studioWorkspaceService.getProductsByIds(productIds)
  const byId = new Map(products.map((p) => [p.id, p]))

  const groups = new Map<string, StudioDocumentGroup>()
  for (const instance of instances) {
    const product = byId.get(instance.product_id)
    // RLS hides a product the member can no longer see — skip its records.
    if (!product) continue
    const percent = product.content
      ? computeWorkspaceProgress(product.content, (instance.data ?? {}) as WorkspaceData).percent
      : 0
    const group = groups.get(product.id) ?? { productSlug: product.slug, productName: product.name, documents: [] }
    group.documents.push({
      id: instance.id,
      label: instance.label,
      updatedAt: instance.updated_at,
      percent,
      productSlug: product.slug,
      productName: product.name,
    })
    groups.set(product.id, group)
  }
  return [...groups.values()]
}
