import type { MemberPageBlock, MemberPageBlockType, MemberPageColor, MemberPageService } from './types'
import type { MemberPageSkin, MemberPageTemplate } from './memberPageTemplates'

// Page models made OUTSIDE the code (16/11/2026, plan item 23): a "page
// package" (.zip) made by ChatGPT is imported in Admin → Pages → Page models,
// and the model is kept in portal.site_settings key `page_models`. A model is
// DATA — sections, example texts, a color — drawn by one of the looks that
// exist in code (`look`). A new look is still code.
//
// The model's photos are a SHOWCASE only: the public model gallery and the
// previews show them; a member's page never gets them (it starts with their
// own photos). They are uploaded once, under pages/models/<id>/.
//
// Live models reach the browser through api/ingles.ts?action=site, which the
// SiteGate reads before anything is drawn — so by the time a page renders,
// its imported model (and look) is known. Same shape as api/admin.ts
// (cleanImportedModel) — change both.

export type Bi = { en: string; pt: string }

export interface ImportedBlockData {
  title?: Bi
  body?: Bi
  button?: Bi
  buttonLink?: string
  items?: { title: Bi; body?: Bi }[]
}

export interface ImportedPageModel {
  id: string
  look: MemberPageSkin
  color: MemberPageColor
  categories: string[]
  name: Bi
  description: Bi
  blocks: { type: MemberPageBlockType; data?: ImportedBlockData }[]
  example: {
    headline?: Bi
    bio?: Bi
    location?: Bi
    services?: { title: Bi; description?: Bi; price?: Bi }[]
    highlights?: { title: Bi; description?: Bi }[]
  }
  // Absolute URLs (showcase only). services/highlights follow the example's order.
  images: {
    photo?: string
    cover?: string
    about?: string
    gallery?: string[]
    services?: (string | null)[]
    highlights?: (string | null)[]
  }
  status: 'draft' | 'live'
  importedAt?: string
  updatedAt?: string
}

export const IMPORTED_LOOKS: MemberPageSkin[] = ['professional', 'local', 'service', 'creative', 'personal', 'affiliate', 'picks', 'links', 'card']
export const IMPORTED_BLOCK_TYPES: MemberPageBlockType[] = [
  'hero', 'contact', 'highlights', 'services', 'about', 'testimonials', 'gallery', 'text', 'faq', 'area', 'cta', 'credentials', 'products', 'signup',
]
export const MODEL_ID = /^[a-z0-9][a-z0-9-]{1,39}$/

// The live imported models, set once the site settings arrive.
let registry: ImportedPageModel[] = []
export function setImportedModels(list: unknown) {
  registry = Array.isArray(list) ? (list as ImportedPageModel[]).filter((m) => m && typeof m.id === 'string' && IMPORTED_LOOKS.includes(m.look)) : []
}
export function importedModels(): ImportedPageModel[] {
  return registry
}
export function importedLook(id: string): MemberPageSkin | null {
  return registry.find((m) => m.id === id)?.look ?? null
}

const pick = (v: Bi | undefined, lang: 'en' | 'pt') => (v ? v[lang] || v.en : undefined)

/** One imported model as the editor's model list sees it. */
export function importedTemplate(m: ImportedPageModel, lang: 'en' | 'pt'): MemberPageTemplate {
  const blocks: MemberPageBlock[] = m.blocks.map((block, i) => {
    const d = block.data
    const data = d
      ? {
          ...(d.title ? { title: pick(d.title, lang) } : {}),
          ...(d.body ? { body: pick(d.body, lang) } : {}),
          ...(d.button ? { button: pick(d.button, lang) } : {}),
          ...(d.buttonLink ? { buttonLink: d.buttonLink } : {}),
          ...(d.items ? { items: d.items.map((it) => ({ title: pick(it.title, lang) ?? '', ...(it.body ? { body: pick(it.body, lang) } : {}) })) } : {}),
        }
      : undefined
    return { id: `${block.type}-tpl-${i}`, type: block.type, ...(data ? { data } : {}) }
  })
  // The example a member's page starts with: texts only, never the photos.
  const services: MemberPageService[] = (m.example.services ?? []).map((s) => ({
    title: pick(s.title, lang) ?? '',
    ...(s.description ? { description: pick(s.description, lang) } : {}),
    ...(s.price ? { price: pick(s.price, lang) } : {}),
  }))
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    color: m.color,
    blocks,
    example: { ...(m.example.headline ? { headline: pick(m.example.headline, lang) } : {}), ...(services.length ? { services } : {}) },
    look: m.look,
    imported: m,
  }
}

/** The showcase version: example texts plus the model's own photos. */
export function importedShowcase(m: ImportedPageModel, lang: 'en' | 'pt') {
  const t = importedTemplate(m, lang)
  const blocks = t.blocks.map((block) => {
    if (block.type === 'about' && m.images.about) return { ...block, data: { ...block.data, images: [m.images.about] } }
    if (block.type === 'gallery' && m.images.gallery?.length) return { ...block, data: { ...block.data, images: m.images.gallery } }
    return block
  })
  return {
    display_name: pick(m.name, lang) ?? m.id,
    headline: t.example.headline ?? null,
    bio: pick(m.example.bio, lang) ?? null,
    photo_url: m.images.photo ?? null,
    location: pick(m.example.location, lang) ?? null,
    services: (t.example.services ?? []).map((s, i) => ({ ...s, ...(m.images.services?.[i] ? { image: m.images.services[i] as string } : {}) })),
    highlights: (m.example.highlights ?? []).map((h, i) => ({
      title: pick(h.title, lang) ?? '',
      ...(h.description ? { description: pick(h.description, lang) } : {}),
      ...(m.images.highlights?.[i] ? { image: m.images.highlights[i] as string } : {}),
    })),
    blocks,
    cover: m.images.cover,
  }
}
