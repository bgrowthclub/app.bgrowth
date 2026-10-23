import { useEffect, useMemo, useState } from 'react'
import Button from '../ui/Button'
import { CARD, INPUT, LINK_BUTTON, SMALL_BUTTON, formatDate, pillClass } from './styles'
import { PAGE_TEXT_BLOCKS, PAGE_TEXT_DEFAULTS } from '../../data/pageTexts'
import type { PageTextBlock, PageTexts } from '../../data/pageTexts'
import { adminService } from '../../modules/admin/adminService'

const KEY = 'page-texts'
const PAGES: PageTextBlock['page'][] = ['Home', 'About', 'Coming soon', 'Member pages']
const PAGE_PATHS: Record<PageTextBlock['page'], string> = { Home: '/', About: '/about', 'Coming soon': '/', 'Member pages': '/' }

// Lists are edited one item per line.
function toDraft(saved: PageTexts): Record<string, string> {
  const draft: Record<string, string> = {}
  for (const [id, def] of Object.entries(PAGE_TEXT_DEFAULTS)) {
    const v = saved[id] ?? def
    draft[id] = Array.isArray(v) ? v.join('\n') : v
  }
  return draft
}

function defaultText(id: string) {
  const d = PAGE_TEXT_DEFAULTS[id]
  return Array.isArray(d) ? d.join('\n') : d
}

// Only what differs from the built-in text is saved, so an untouched field
// keeps following the site's own text.
function fromDraft(draft: Record<string, string>): PageTexts {
  const out: PageTexts = {}
  for (const [id, value] of Object.entries(draft)) {
    if (value.trim() === defaultText(id).trim() || !value.trim()) continue
    out[id] = Array.isArray(PAGE_TEXT_DEFAULTS[id])
      ? value
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      : value.trim()
  }
  return out
}

// Admin → Site → Page texts (portal.site_content key "page-texts"): the
// titles, sentences, buttons and lists of the Home, About and Coming Soon
// pages, block by block. The layout and images stay as they are.
export default function PageTextsEditor() {
  const [page, setPage] = useState<PageTextBlock['page']>('Home')
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(true)
  const [edited, setEdited] = useState<{ updated_at: string; updated_by: string | null } | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>(() => toDraft({}))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    adminService
      .getSiteContent<PageTexts>(KEY)
      .then(({ content, ready: isReady }) => {
        setReady(isReady)
        setEdited(content ? { updated_at: content.updated_at, updated_by: content.updated_by } : null)
        setDraft(toDraft(content?.value ?? {}))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the page texts.'))
      .finally(() => setLoading(false))
  }, [])

  const blocks = useMemo(() => PAGE_TEXT_BLOCKS.filter((b) => b.page === page), [page])

  async function save() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const saved = await adminService.saveSiteContent<PageTexts>(KEY, fromDraft(draft))
      setEdited({ updated_at: saved.updated_at, updated_by: saved.updated_by })
      setDraft(toDraft(saved.value))
      setNotice('Saved — visitors see the new texts the next time they open the site.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save.')
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    if (!window.confirm('Go back to the built-in texts on all three pages?')) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await adminService.resetSiteContent(KEY)
      setEdited(null)
      setDraft(toDraft({}))
      setNotice('Back to the built-in texts.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t restore it.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-navy">Page texts</h2>
        <p className="mt-0.5 text-[13.5px] text-navy/55">The titles, sentences and buttons of the Home, About and Coming Soon pages.</p>
      </div>

      <details className={`${CARD} px-5 py-3 text-[13.5px] text-navy/70`}>
        <summary className="cursor-pointer font-semibold text-navy">How it works</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Pick a page (Home, About, Coming soon or Member pages). Each box is one part of the page, in the order it appears.</li>
          <li>Member pages: the invitation shown at the bottom of every public member page, above “Powered by BGrowth”, and the standard affiliate (earnings) note of Affiliate Picks pages — each page shows the English or Portuguese version, in its own language.</li>
          <li>Every field starts with the text the site shows today. Change only what you want; the layout and images stay the same.</li>
          <li>
            Fields marked <strong>one per line</strong> are lists (for example the rotating examples and the popular goals at the top of the
            Home): write each item on its own line.
          </li>
          <li>
            <strong>Original</strong> next to a field puts that field’s built-in text back. An empty field also shows the built-in text.
          </li>
          <li>
            <strong>Save</strong> applies the three pages at once; visitors see it the next time they open the site. <strong>Restore original</strong>{' '}
            goes back to the built-in texts everywhere.
          </li>
          <li>Keep titles short — very long titles can break the layout on phones. Check the page after saving.</li>
          <li>Every change is listed in Admin → Activity. Only Admins can edit this.</li>
        </ul>
      </details>

      {!ready ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">Run the database update (Portal migration 0053) to use this tab.</p>
      ) : loading ? (
        <p className="py-10 text-center text-[14px] text-navy/40">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {PAGES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                    p === page ? 'bg-primary text-white' : 'bg-bg-soft text-navy/60 hover:text-navy'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <span className={pillClass(edited ? 'blue' : 'gray')}>
              {edited ? `Edited · ${formatDate(edited.updated_at)}${edited.updated_by ? ` by ${edited.updated_by}` : ''}` : 'Built-in'}
            </span>
          </div>

          {page !== 'Coming soon' && page !== 'Member pages' && (
            <a href={PAGE_PATHS[page]} target="_blank" rel="noreferrer" className="inline-block text-[12.5px] text-primary hover:underline">
              Open the {page} page in a new tab
            </a>
          )}

          {blocks.map((block) => (
            <div key={block.title} className={`${CARD} space-y-4 p-5`}>
              <h3 className="font-display text-[15px] font-bold text-navy">{block.title}</h3>
              {block.fields.map((field) => {
                const value = draft[field.id] ?? ''
                const changed = value.trim() !== defaultText(field.id).trim()
                return (
                  <label key={field.id} className="block">
                    <span className="flex items-center justify-between gap-3 text-[13px] font-semibold text-navy">
                      <span>
                        {field.label}
                        {field.kind === 'list' && <span className="ml-1 font-normal text-navy/40">— one per line</span>}
                      </span>
                      {changed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            setDraft((d) => ({ ...d, [field.id]: defaultText(field.id) }))
                          }}
                          className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}
                        >
                          Original
                        </button>
                      )}
                    </span>
                    {field.kind === 'line' ? (
                      <input className={`${INPUT} mt-1`} value={value} maxLength={200} onChange={(e) => setDraft((d) => ({ ...d, [field.id]: e.target.value }))} />
                    ) : (
                      <textarea
                        className={`${INPUT} mt-1 leading-relaxed`}
                        rows={field.kind === 'list' ? Math.min(10, Math.max(4, value.split('\n').length + 1)) : 3}
                        value={value}
                        onChange={(e) => setDraft((d) => ({ ...d, [field.id]: e.target.value }))}
                      />
                    )}
                  </label>
                )
              })}
            </div>
          ))}

          {error && <p className="text-[13.5px] text-red-500">{error}</p>}
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}

          <div className="flex flex-wrap justify-between gap-3">
            <Button type="button" variant="secondary" disabled={busy || !edited} onClick={() => void restore()} className={SMALL_BUTTON}>
              Restore original
            </Button>
            <Button type="button" disabled={busy} onClick={() => void save()} className={SMALL_BUTTON}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
