import { useEffect, useMemo, useState } from 'react'
import { Lock, X } from 'lucide-react'
import Button from '../ui/Button'
import { knowledgeService } from '../../modules/knowledge/services/KnowledgeService'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'

const SITE_URL = 'https://bgrowth.app'

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// One article as a block of the e-mail: cover, title (linked), excerpt and
// "Read more". A members-only article's link opens the start of it with the
// sign-up box on the site.
export function articleEmailHtml(article: KnowledgeArticleIndexEntry) {
  const link = `${SITE_URL}/knowledge/article/${article.slug}`
  const title = escapeHtml(article.title)
  return [
    article.coverImage ? `<img src="${escapeHtml(article.coverImage)}" alt="${title}">` : '',
    `<h3><a href="${link}">${title}</a></h3>`,
    article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : '',
    `<p><a href="${link}">${article.language === 'pt' ? 'Ler mais →' : 'Read more →'}</a></p>`,
  ].join('')
}

interface Props {
  onInsert: (html: string) => void
  onClose: () => void
}

// Admin → Newsletter: pick published Knowledge articles to add to the e-mail
// (the "news digest"). Only articles already published on the site appear.
export default function NewsletterArticlePicker({ onInsert, onClose }: Props) {
  const [articles, setArticles] = useState<KnowledgeArticleIndexEntry[] | null>(null)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>([])

  useEffect(() => {
    knowledgeService.getLatestArticles(500).then(setArticles)
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (articles ?? []).filter((a) => !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q))
  }, [articles, query])

  function toggle(id: string) {
    setPicked((list) => (list.includes(id) ? list.filter((p) => p !== id) : [...list, id]))
  }

  function insert() {
    const byId = new Map((articles ?? []).map((a) => [a.id, a]))
    // In the order they were ticked.
    const html = picked
      .map((id) => byId.get(id))
      .filter((a): a is KnowledgeArticleIndexEntry => Boolean(a))
      .map(articleEmailHtml)
      .join('<hr>')
    onInsert(html)
  }

  return (
    <div className="border-b border-navy/[0.06] bg-bg-soft/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13.5px] font-semibold text-navy">Insert articles from Knowledge</p>
        <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-navy/50 hover:bg-white">
          <X size={16} />
        </button>
      </div>
      <p className="mt-0.5 text-[12.5px] text-navy/50">
        Tick one or more published articles; each goes into the e-mail with its cover, title, summary and a “Read more” link.
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles…"
        className="mt-3 w-full rounded-xl border border-navy/10 bg-white px-3 py-2 text-[13.5px] text-navy"
      />
      <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
        {articles === null ? (
          <p className="py-4 text-center text-[13px] text-navy/40">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-navy/40">
            {articles.length ? 'No article matches.' : 'No published articles yet — publish them in Studio → Knowledge Engine.'}
          </p>
        ) : (
          visible.map((a) => (
            <label key={a.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2 hover:bg-bg-soft">
              <input type="checkbox" checked={picked.includes(a.id)} onChange={() => toggle(a.id)} className="h-4 w-4 accent-primary" />
              {a.coverImage && <img src={a.coverImage} alt="" className="h-9 w-14 shrink-0 rounded-lg object-cover" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-navy">{a.title}</span>
                <span className="flex items-center gap-2 text-[11.5px] text-navy/45">
                  {a.language === 'pt' && <span>Português</span>}
                  {a.access === 'members' && (
                    <span className="inline-flex items-center gap-1">
                      <Lock size={10} /> Members
                    </span>
                  )}
                </span>
              </span>
              {picked.includes(a.id) && <span className="text-[11.5px] font-bold text-primary">{picked.indexOf(a.id) + 1}</span>}
            </label>
          ))
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="button" disabled={picked.length === 0} onClick={insert} className="!px-4 !py-2 text-[13px]">
          Insert {picked.length > 1 ? `${picked.length} articles` : 'article'}
        </Button>
      </div>
    </div>
  )
}
