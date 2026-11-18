import type { PlanEntitlements } from '../commerce/types/membership'

// What a plan lets a member do with their page, one line per feature
// (15/11/2026, the owner's decision: "everything listed, a checkbox per plan").
// Set in Admin → Plans → Page (components/admin/PlanPageFeaturesPanel) and kept
// in the plan's entitlements as `pageFeatures`.
//
// A plan saved before the table existed has no `pageFeatures`: it gets what
// "Part of the page" / "The whole page" always meant, so nothing changed the
// day this shipped. COPIED in api/account.ts and api/ingles.ts (a function
// must not import from src/ — CLAUDE.md §13) — change all three.

export interface PageFeatures {
  color: boolean // choose the page color (else the model's)
  cover: boolean // cover image
  address: boolean // choose the address bgrowth.app/p/…
  hide: boolean // hide sections
  sections: boolean // add and reorder sections
  gallery: boolean // photo gallery
  signup: boolean // e-mail list
  style: boolean // background tint, dark color, floating button
  stats: boolean // the page's numbers (visits, clicks)
  noBrand: boolean // no BGrowth brand on the page
  freeColors: boolean // any background color and a text color (18/11/2026); default paid plans
  highlights: number // featured photos / videos
  products: number // product picks
}

export const PARTIAL_PAGE_FEATURES: PageFeatures = {
  color: false,
  cover: false,
  address: false,
  hide: true,
  sections: false,
  gallery: false,
  signup: false,
  style: true,
  stats: false,
  noBrand: true,
  freeColors: true,
  highlights: 1,
  products: 12,
}

export const FULL_PAGE_FEATURES: PageFeatures = {
  color: true,
  cover: true,
  address: true,
  hide: true,
  sections: true,
  gallery: true,
  signup: true,
  style: true,
  stats: true,
  noBrand: true,
  freeColors: true,
  highlights: 8,
  products: 60,
}

export const PAGE_FEATURE_MAX = { highlights: 8, products: 60 }

const BOOL_KEYS = ['color', 'cover', 'address', 'hide', 'sections', 'gallery', 'signup', 'style', 'stats', 'noBrand', 'freeColors'] as const

// One plan's features: null when the plan gives no page. The BGrowth brand
// only leaves paid pages unless the table says otherwise (Sprint 253 rule).
export function pageFeaturesOf(ent: PlanEntitlements | null | undefined, isFree: boolean): PageFeatures | null {
  if (!ent || (ent.memberPage !== 'partial' && ent.memberPage !== 'full')) return null
  const base = { ...(ent.memberPage === 'full' ? FULL_PAGE_FEATURES : PARTIAL_PAGE_FEATURES), noBrand: !isFree, freeColors: !isFree }
  const own = ent.pageFeatures ?? {}
  const out = { ...base }
  for (const k of BOOL_KEYS) if (typeof own[k] === 'boolean') out[k] = own[k] as boolean
  if (typeof own.highlights === 'number') out.highlights = clamp(own.highlights, 0, PAGE_FEATURE_MAX.highlights)
  if (typeof own.products === 'number') out.products = clamp(own.products, 0, PAGE_FEATURE_MAX.products)
  return out
}

// Several live plans: the most generous of each line.
export function mergePageFeatures(list: (PageFeatures | null)[]): PageFeatures | null {
  const real = list.filter((f): f is PageFeatures => Boolean(f))
  if (!real.length) return null
  const out = { ...real[0] }
  for (const f of real.slice(1)) {
    for (const k of BOOL_KEYS) out[k] = out[k] || f[k]
    out.highlights = Math.max(out.highlights, f.highlights)
    out.products = Math.max(out.products, f.products)
  }
  return out
}

function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : min
}
