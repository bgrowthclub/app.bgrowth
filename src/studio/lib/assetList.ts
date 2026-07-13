import type { ProductAsset } from '../../modules/commerce/types/assets'

let counter = 0

// Keeps the Images tab's plain "one URL per line" inputs working while the
// underlying model is ProductAsset[] (see types/assets.ts) — the id here
// is just React-key plumbing, regenerated on every edit. Per-asset
// metadata (label/alt text) is a future Studio editor concern, not a
// reason to change this shape again.
export function urlsToAssets(urls: string[]): ProductAsset[] {
  return urls.map((url) => ({ id: `asset-${Date.now()}-${counter++}`, url }))
}

export function assetsToUrls(assets: ProductAsset[]): string[] {
  return assets.map((a) => a.url)
}
