import { supabase } from '../../identity/supabase/supabaseClient'
import type { KnowledgeRepository } from '../services/KnowledgeRepository'
import type { KnowledgeAccess, KnowledgeArticle, KnowledgeArticleIndexEntry, KnowledgeBodyBlock } from '../types/article'
import type { KnowledgeType } from '../types/knowledgeType'
import { KNOWLEDGE_TYPES } from '../types/knowledgeType'
import type { KnowledgeCategory } from '../types/category'
import type { FeaturedContent } from '../types/featuredContent'

// Articles published from BGrowth Studio → Knowledge Engine (Portal
// migrations 0054/0055). Visitors read portal.knowledge_articles (published
// only; a members-only article carries just its first blocks); a signed-in
// member gets the whole body from portal.knowledge_article_bodies, which
// visitors can't read. Nothing published yet (or the migrations not run) =
// an empty Knowledge hub, never an error page.

interface ArticleRow {
  id: string
  slug: string
  title: string
  excerpt: string
  featured_image: string
  content_type: string
  category: string
  language: string
  reading_time: string
  tags: string[] | null
  author_id: string
  blocks?: unknown
  featured_options: { featured?: boolean; featuredOnHomepage?: boolean } | null
  publish_date: string | null
  published_at: string
  updated_at: string
  access: string
  locked: boolean
  required_plan?: string | null
  required_plan_name?: string | null
}

const BASE_COLUMNS =
  'id, slug, title, excerpt, featured_image, content_type, category, language, reading_time, tags, author_id, featured_options, publish_date, published_at, updated_at, access, locked'
// Plan columns exist since Portal migration 0060; before it, the base ones.
const INDEX_COLUMNS = `${BASE_COLUMNS}, required_plan, required_plan_name`

// Runs a query with the plan columns, falling back to the base columns when
// the database doesn't have them yet.
async function withPlanColumns<T>(run: (columns: string) => PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const first = await run(INDEX_COLUMNS)
  if (!first.error) return first
  return run(BASE_COLUMNS)
}

export const KNOWLEDGE_AUTHOR = { id: 'bgrowth', name: 'BGrowth Team' }

export function knowledgeSlug(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Studio's content types beyond the hub's own list show as Article.
function toType(value: string): KnowledgeType {
  return (KNOWLEDGE_TYPES as string[]).includes(value) ? (value as KnowledgeType) : 'Article'
}

function minutes(readingTime: string): number {
  return Number.parseInt(readingTime, 10) || 1
}

function toEntry(row: ArticleRow): KnowledgeArticleIndexEntry {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    type: toType(row.content_type),
    categorySlug: knowledgeSlug(row.category || 'general'),
    tagSlugs: (row.tags ?? []).map(knowledgeSlug).filter(Boolean),
    authorId: KNOWLEDGE_AUTHOR.id,
    // The original date (e.g. a Wix post's) when there is one.
    publishedAt: row.publish_date || row.published_at,
    readingTimeMinutes: minutes(row.reading_time),
    featured: Boolean(row.featured_options?.featured || row.featured_options?.featuredOnHomepage),
    coverImage: row.featured_image || undefined,
    language: row.language === 'pt' ? 'pt' : 'en',
    access: (row.access === 'everyone' ? 'everyone' : row.access?.startsWith('plan:') ? 'plan' : 'members') as KnowledgeAccess,
    ...(row.access?.startsWith('plan:')
      ? { requiredPlan: { slug: row.required_plan || row.access.slice(5), name: row.required_plan_name || row.access.slice(5) } }
      : {}),
  }
}

// Studio's content blocks → the hub's body blocks. Callouts and checklists
// become a paragraph; cta, download, code and faq have their own kinds since
// 30/10/2026 (they used to be dropped in silence). Gallery, comparison,
// table and embed are still skipped — the Studio has no editor for them, so
// nobody can write one.
function toBody(blocks: unknown): KnowledgeBodyBlock[] {
  if (!Array.isArray(blocks)) return []
  const body: KnowledgeBodyBlock[] = []
  for (const block of blocks as { type?: string; data?: Record<string, unknown> }[]) {
    const d = block?.data ?? {}
    const text = typeof d.text === 'string' ? d.text : ''
    switch (block?.type) {
      case 'paragraph':
        if (text.trim()) body.push({ kind: 'paragraph', text })
        break
      case 'heading':
        if (text.trim()) body.push({ kind: 'heading', text, level: Number(d.level) === 3 ? 3 : 2 })
        break
      case 'quote':
        if (text.trim()) body.push({ kind: 'quote', text })
        break
      case 'image':
        if (typeof d.url === 'string' && d.url) body.push({ kind: 'image', url: d.url, text: typeof d.caption === 'string' ? d.caption : '' })
        break
      case 'video':
        if (typeof d.url === 'string' && d.url) body.push({ kind: 'video', url: d.url, text: '' })
        break
      case 'divider':
        body.push({ kind: 'divider', text: '' })
        break
      case 'callout': {
        const title = typeof d.title === 'string' ? d.title : ''
        const all = [title, text].filter((t) => t.trim()).join('\n')
        if (all) body.push({ kind: 'paragraph', text: all })
        break
      }
      case 'checklist': {
        const items = Array.isArray(d.items) ? (d.items as { text?: string }[]).map((i) => `• ${i?.text ?? ''}`) : []
        const title = typeof d.title === 'string' && d.title.trim() ? [d.title] : []
        if (items.length) body.push({ kind: 'paragraph', text: [...title, ...items].join('\n') })
        break
      }
      // A card with a link: the Studio's "CTA". Its `type` is only a
      // suggestion of wording, so what is drawn is what the author typed.
      case 'cta': {
        const url = typeof d.linkUrl === 'string' ? d.linkUrl.trim() : ''
        const title = typeof d.title === 'string' ? d.title : ''
        if (url && (title.trim() || typeof d.buttonText === 'string'))
          body.push({
            kind: 'cta',
            text: typeof d.description === 'string' ? d.description : '',
            title,
            url,
            label: typeof d.buttonText === 'string' ? d.buttonText : '',
          })
        break
      }
      case 'download': {
        const url = typeof d.url === 'string' ? d.url.trim() : ''
        const name = typeof d.filename === 'string' ? d.filename : ''
        if (url && name.trim()) body.push({ kind: 'download', text: '', title: name, url, label: typeof d.size === 'string' ? d.size : '' })
        break
      }
      case 'code': {
        const code = typeof d.code === 'string' ? d.code : ''
        if (code.trim()) body.push({ kind: 'code', text: code, language: typeof d.language === 'string' ? d.language : '' })
        break
      }
      case 'faq': {
        const items = (Array.isArray(d.questions) ? (d.questions as { q?: string; a?: string }[]) : [])
          .map((i) => ({ q: typeof i?.q === 'string' ? i.q : '', a: typeof i?.a === 'string' ? i.a : '' }))
          .filter((i) => i.q.trim())
        if (items.length) body.push({ kind: 'faq', text: '', items })
        break
      }
    }
  }
  return body
}

export function createStudioKnowledgeRepository(): KnowledgeRepository {
  let index: Promise<ArticleRow[]> | null = null

  function loadRows(): Promise<ArticleRow[]> {
    if (!index) {
      index = (async () => {
        if (!supabase) return []
        const client = supabase
        const { data, error } = await withPlanColumns((columns) =>
          client.from('knowledge_articles').select(columns).order('published_at', { ascending: false }),
        )
        if (error) {
          console.warn('[knowledge] articles not available:', error.message)
          return []
        }
        return (data ?? []) as unknown as ArticleRow[]
      })()
      // Try again on the next page if it failed (e.g. offline).
      index.then((rows) => rows.length === 0 && (index = null))
    }
    return index
  }

  return {
    async loadArticleIndex() {
      return (await loadRows()).map(toEntry)
    },

    async loadArticle(slug) {
      if (!supabase) return undefined
      const client = supabase
      const { data, error } = await withPlanColumns((columns) => client.from('knowledge_articles').select(`${columns}, blocks`).eq('slug', slug).maybeSingle())
      if (error || !data) return undefined
      const row = data as unknown as ArticleRow
      let blocks = row.blocks
      let locked = row.locked
      if (locked) {
        // Only a signed-in member (on the required plan, for plan articles —
        // migration 0060) gets a row here; anyone else keeps the start.
        const { data: full, error: fullError } = await supabase.from('knowledge_article_bodies').select('blocks').eq('slug', slug).maybeSingle()
        if (!fullError && full) {
          blocks = (full as { blocks: unknown }).blocks
          locked = false
        }
      }
      const article: KnowledgeArticle = {
        ...toEntry(row),
        body: toBody(blocks),
        updatedAt: row.updated_at,
        locked,
      }
      return article
    },

    async loadCategories() {
      const seen = new Map<string, KnowledgeCategory>()
      for (const row of await loadRows()) {
        const name = row.category || 'General'
        const slug = knowledgeSlug(name)
        if (!seen.has(slug)) seen.set(slug, { id: slug, slug, name })
      }
      return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
    },

    async loadAuthors() {
      return [KNOWLEDGE_AUTHOR]
    },

    async loadTags() {
      const seen = new Map<string, string>()
      for (const row of await loadRows()) for (const tag of row.tags ?? []) seen.set(knowledgeSlug(tag), tag)
      return [...seen.entries()].map(([slug, name]) => ({ id: slug, slug, name }))
    },

    async loadFeaturedContent() {
      const featured: FeaturedContent[] = []
      ;(await loadRows()).forEach((row, i) => {
        if (!(row.featured_options?.featured || row.featured_options?.featuredOnHomepage)) return
        const type = toType(row.content_type)
        const placement = type === 'Guide' ? 'featured-guides' : type === 'Video' ? 'featured-videos' : 'featured-articles'
        featured.push({ id: row.id, articleSlug: row.slug, placement, order: i })
      })
      return featured
    },

    async loadLearningPaths() {
      return []
    },
  }
}
