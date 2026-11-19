import { IMPORTED_BLOCK_TYPES, IMPORTED_LOOKS, MODEL_ID } from './importedModels'
import type { Bi, ImportedPageModel } from './importedModels'
import { memberPageTemplates, pageBlocks, pageSkin } from './memberPageTemplates'
import type { MemberPage, MemberPageColor } from './types'

// "Save as model" (19/11/2026, the owner's choice): a page built in Admin →
// Pages becomes a page model, so a model no longer has to come as a ZIP made
// by ChatGPT. The result has the same shape a package gives
// (ImportedPageModel, checked again by api/admin.ts cleanImportedModel) and
// is saved as a DRAFT; it goes live from Imported models, with its plans.
//
// The page is written in one language: its texts go to both (en and pt), so
// the model never shows blank to someone using the other one. Its photos
// become the model's showcase — as with a package, a member's page started
// from the model never gets them.

const COLORS: MemberPageColor[] = ['blue', 'teal', 'green', 'purple', 'rose', 'orange', 'navy']
const both = (s: string | null | undefined): Bi | undefined => {
  const t = (s ?? '').trim()
  return t ? { en: t, pt: t } : undefined
}

export interface ModelFromPageInput {
  id: string
  name: Bi
  description: Bi
  category: string
}

/** Why this page can't become a model, or null. */
export function modelFromPageProblem(page: MemberPage): string | null {
  const look = pageSkin(page.template)
  if (!look || !IMPORTED_LOOKS.includes(look)) return 'This page uses one of the old one-column models. Switch it to a site look (Professional, Company with a team, Link Page…) first.'
  const blocks = pageBlocks(page).filter((b) => !b.hidden && IMPORTED_BLOCK_TYPES.includes(b.type))
  if (blocks.length < 2) return 'A model needs at least 2 visible sections.'
  return null
}

/** The page's color as a model color: a swatch stays; a custom color falls back to the look's own. */
export function modelColorOf(page: MemberPage): { color: MemberPageColor; custom: boolean } {
  const c = page.theme?.color
  if (c && COLORS.includes(c as MemberPageColor)) return { color: c as MemberPageColor, custom: false }
  const own = memberPageTemplates(page.language).find((t) => t.id === page.template)?.color
  return { color: own && COLORS.includes(own) ? own : 'blue', custom: Boolean(c) }
}

export function modelFromPage(page: MemberPage, input: ModelFromPageInput): Omit<ImportedPageModel, 'status'> {
  if (!MODEL_ID.test(input.id)) throw new Error('Model id: lowercase letters, numbers and hyphens (2–40).')
  const look = pageSkin(page.template)
  if (!look || !IMPORTED_LOOKS.includes(look)) throw new Error(modelFromPageProblem(page) ?? 'This look can’t be a model.')
  const visible = pageBlocks(page).filter((b) => !b.hidden && IMPORTED_BLOCK_TYPES.includes(b.type))
  const seen = new Set<string>()
  const blocks: ImportedPageModel['blocks'] = []
  let about: string | undefined
  let gallery: string[] = []
  for (const b of visible) {
    if (['hero', 'contact', 'highlights', 'services', 'about', 'products', 'signup'].includes(b.type) && seen.has(b.type)) continue
    seen.add(b.type)
    const d = b.data ?? {}
    if (b.type === 'about' && d.images?.[0]) about = d.images[0]
    if (b.type === 'gallery' && d.images?.length) gallery = d.images.slice(0, 12)
    const data = {
      ...(both(d.title) ? { title: both(d.title) } : {}),
      ...(both(d.body) ? { body: both(d.body) } : {}),
      ...(both(d.button) ? { button: both(d.button) } : {}),
      // Only the destinations a model keeps: a section, https, or a contact button.
      ...(d.buttonLink && (/^#[a-z]+$/.test(d.buttonLink) || /^https:\/\//.test(d.buttonLink) || /^contact:[a-z_]+$/.test(d.buttonLink)) ? { buttonLink: d.buttonLink } : {}),
      ...(d.items?.length ? { items: d.items.slice(0, 12).filter((it) => it.title.trim()).map((it) => ({ title: both(it.title)!, ...(both(it.body) ? { body: both(it.body) } : {}) })) } : {}),
    }
    blocks.push({ type: b.type, ...(Object.keys(data).length ? { data } : {}) })
  }
  const services = page.services.filter((s) => s.title.trim()).slice(0, 8)
  const highlights = page.highlights.filter((h) => h.title.trim()).slice(0, 8)
  return {
    id: input.id,
    look,
    color: modelColorOf(page).color,
    categories: input.category.trim() ? [input.category.trim()] : [],
    name: input.name,
    description: input.description,
    blocks,
    example: {
      ...(both(page.headline) ? { headline: both(page.headline) } : {}),
      ...(both(page.bio) ? { bio: both(page.bio) } : {}),
      ...(both(page.location) ? { location: both(page.location) } : {}),
      ...(services.length
        ? { services: services.map((s) => ({ title: both(s.title)!, ...(both(s.description) ? { description: both(s.description) } : {}), ...(both(s.price) ? { price: both(s.price) } : {}) })) }
        : {}),
      ...(highlights.length ? { highlights: highlights.map((h) => ({ title: both(h.title)!, ...(both(h.description) ? { description: both(h.description) } : {}) })) } : {}),
    },
    images: {
      ...(page.photo_url ? { photo: page.photo_url } : {}),
      ...(page.theme?.cover ? { cover: page.theme.cover } : {}),
      ...(about ? { about } : {}),
      ...(gallery.length ? { gallery } : {}),
      ...(services.some((s) => s.image) ? { services: services.map((s) => s.image ?? null) } : {}),
      ...(highlights.some((h) => h.image) ? { highlights: highlights.map((h) => h.image ?? null) } : {}),
    },
  }
}
