import type { Product } from '../../commerce/types/product'

// What a Studio product is called in copy: a Workspace, a Calculator
// (Sprint 78), a Download (Sprint 86) — a single PDF or a Kit — or, since
// 30/10/2026, a Course (BGrowth Academy™).
export type StudioProductNoun = 'Workspace' | 'Calculator' | 'PDF' | 'Kit' | 'Course'

export function studioProductNoun(product: Pick<Product, 'type' | 'downloadKind'>): StudioProductNoun {
  if (product.type === 'Calculator') return 'Calculator'
  if (product.type === 'Course') return 'Course'
  if (product.type === 'Download') return product.downloadKind ?? 'PDF'
  return 'Workspace'
}
