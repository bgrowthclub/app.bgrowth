import type { Product } from '../../commerce/types/product'

// What a Studio product is called in copy: a Workspace, a Calculator
// (Sprint 78) or a Download (Sprint 86) — a single PDF or a Kit.
export type StudioProductNoun = 'Workspace' | 'Calculator' | 'PDF' | 'Kit'

export function studioProductNoun(product: Pick<Product, 'type' | 'downloadKind'>): StudioProductNoun {
  if (product.type === 'Calculator') return 'Calculator'
  if (product.type === 'Download') return product.downloadKind ?? 'PDF'
  return 'Workspace'
}
