// Every media asset a Product can carry, in one place — see CLAUDE.md §16
// on never scattering commerce fields ad hoc. Before this, Product had
// four separate top-level image fields (`thumbnail`, `heroImage`,
// `previewImage`, `gallery`); this consolidates all of it, plus the asset
// kinds this milestone adds (Videos, Downloads), and leaves room for a
// future kind via `futureAssets` without another Product-level field.
export interface ProductAsset {
  id: string
  url: string
  label?: string
}

export interface ProductAssets {
  thumbnail?: string
  heroImage?: string
  previewImages: ProductAsset[]
  gallery: ProductAsset[]
  videos: ProductAsset[]
  downloads: ProductAsset[]
  // Escape hatch for an asset kind a future product type needs before this
  // interface is formally extended — never read ad hoc without also
  // adding the field properly once its shape is known.
  futureAssets?: Record<string, ProductAsset[]>
}

export function createEmptyProductAssets(): ProductAssets {
  return { previewImages: [], gallery: [], videos: [], downloads: [] }
}
