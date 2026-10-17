import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import { CARD, INPUT, LINK_BUTTON, SMALL_BUTTON, formatDate, pillClass } from './styles'
import { LEGAL_DOCUMENTS } from '../../data/legal'
import type { LegalDocumentData, LegalEditableContent, LegalSection } from '../../data/legal'
import { adminService } from '../../modules/admin/adminService'

const PATHS: Record<LegalDocumentData['slug'], string> = {
  privacy: '/privacy',
  terms: '/terms',
  'refund-policy': '/refund-policy',
}

interface DraftSection {
  heading: string
  text: string
}

// One text box per section: paragraphs separated by a blank line; lines
// starting with "- " are bullet points.
function sectionToText(section: LegalSection) {
  const blocks = [...(section.paragraphs ?? [])]
  if (section.bullets?.length) blocks.push(section.bullets.map((b) => `- ${b}`).join('\n'))
  return blocks.join('\n\n')
}

function textToSection(heading: string, text: string): LegalSection {
  const paragraphs: string[] = []
  const bullets: string[] = []
  for (const block of text.split(/\n\s*\n/)) {
    const prose: string[] = []
    for (const raw of block.split('\n')) {
      const line = raw.trim()
      if (!line) continue
      if (/^[-•]\s+/.test(line)) bullets.push(line.replace(/^[-•]\s+/, ''))
      else prose.push(line)
    }
    if (prose.length) paragraphs.push(prose.join(' '))
  }
  return { heading: heading.trim(), paragraphs, bullets }
}

function toDraft(content: LegalEditableContent) {
  return {
    title: content.title,
    summary: content.summary,
    sections: content.sections.map((s) => ({ heading: s.heading, text: sectionToText(s) })),
  }
}

// Admin → Site → Legal pages (portal.site_content, keys legal:<slug>): edit
// the Privacy Policy, Terms of Service and Refund Policy. Until a page is
// saved here the site shows its built-in text (data/legal.ts); "Restore
// original" goes back to it.
export default function LegalPagesEditor() {
  const [slug, setSlug] = useState<LegalDocumentData['slug']>('terms')
  const builtIn = LEGAL_DOCUMENTS.find((d) => d.slug === slug) ?? LEGAL_DOCUMENTS[0]
  const key = `legal:${slug}`

  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(true)
  const [edited, setEdited] = useState<{ updated_at: string; updated_by: string | null } | null>(null)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [sections, setSections] = useState<DraftSection[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function fill(content: LegalEditableContent) {
    const draft = toDraft(content)
    setTitle(draft.title)
    setSummary(draft.summary)
    setSections(draft.sections)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setNotice(null)
    adminService
      .getSiteContent<LegalEditableContent>(key)
      .then(({ content, ready: isReady }) => {
        if (cancelled) return
        setReady(isReady)
        setEdited(content ? { updated_at: content.updated_at, updated_by: content.updated_by } : null)
        fill(content?.value?.sections?.length ? content.value : builtIn)
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Couldn’t load this page.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // builtIn follows slug (key)
  }, [key])

  function updateSection(index: number, patch: Partial<DraftSection>) {
    setSections((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function move(index: number, by: number) {
    setSections((list) => {
      const next = [...list]
      const target = index + by
      if (target < 0 || target >= next.length) return list
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function save() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const value: LegalEditableContent = {
        title: title.trim(),
        summary: summary.trim(),
        sections: sections.map((s) => textToSection(s.heading, s.text)),
      }
      const saved = await adminService.saveSiteContent(key, value)
      setEdited({ updated_at: saved.updated_at, updated_by: saved.updated_by })
      fill(saved.value)
      setNotice('Saved — the page on the site shows it now, with today as “Last updated”.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save.')
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    if (!window.confirm(`Go back to the original ${builtIn.title}? Your edited version is deleted.`)) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await adminService.resetSiteContent(key)
      setEdited(null)
      fill(builtIn)
      setNotice('Back to the original text.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t restore it.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-navy">Legal pages</h2>
        <p className="mt-0.5 text-[13.5px] text-navy/55">
          In each section, leave a blank line between paragraphs and start a line with “- ” for a bullet point.
        </p>
      </div>

      <details className={`${CARD} px-5 py-3 text-[13.5px] text-navy/70`}>
        <summary className="cursor-pointer font-semibold text-navy">How it works</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Pick a page: Privacy Policy, Terms of Service or Refund Policy.</li>
          <li>Edit the title, the summary under it and the sections — add a section, move it with the arrows or delete it.</li>
          <li>Inside a section: leave a blank line between paragraphs; start a line with “- ” to make it a bullet point.</li>
          <li>
            <strong>Save and publish</strong> puts the new text on the site right away, and the page’s “Last updated” becomes the
            day you saved.
          </li>
          <li>
            <strong>Restore original</strong> goes back to the site’s built-in text and deletes the edited version.
          </li>
          <li>Until you save a page here, the site shows its built-in text.</li>
          <li>
            <strong>View page</strong> opens the page on the site so you can check it.
          </li>
          <li>Every save or restore is listed in Admin → Activity. Only Admins can edit these pages (not Support).</li>
        </ul>
      </details>

      <div className="flex flex-wrap gap-2">
        {LEGAL_DOCUMENTS.map((d) => (
          <button
            key={d.slug}
            type="button"
            onClick={() => setSlug(d.slug)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
              d.slug === slug ? 'bg-primary text-white' : 'bg-bg-soft text-navy/60 hover:text-navy'
            }`}
          >
            {d.title}
          </button>
        ))}
      </div>

      {!ready ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">Run the database update (Portal migration 0053) to edit these pages.</p>
      ) : loading ? (
        <p className="py-10 text-center text-[14px] text-navy/40">Loading…</p>
      ) : (
        <div className={`${CARD} space-y-5 p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={pillClass(edited ? 'blue' : 'gray')}>
              {edited ? `Edited · ${formatDate(edited.updated_at)}${edited.updated_by ? ` by ${edited.updated_by}` : ''}` : 'Original text'}
            </span>
            <a href={PATHS[slug]} target="_blank" rel="noreferrer" className={`${LINK_BUTTON} inline-flex items-center gap-1 text-primary hover:bg-bg-soft`}>
              View page <ExternalLink size={13} />
            </a>
          </div>

          <label className="block">
            <span className="text-[13px] font-semibold text-navy">Title</span>
            <input className={`${INPUT} mt-1`} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-navy">Summary (under the title)</span>
            <textarea className={`${INPUT} mt-1`} rows={2} value={summary} maxLength={500} onChange={(e) => setSummary(e.target.value)} />
          </label>

          <div className="space-y-4">
            {sections.map((s, i) => (
              <div key={i} className="rounded-xl border border-navy/[0.08] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-navy/40">{i + 1}.</span>
                  <input
                    className={INPUT}
                    value={s.heading}
                    maxLength={160}
                    placeholder="Section heading"
                    onChange={(e) => updateSection(i, { heading: e.target.value })}
                  />
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`} aria-label="Move up">
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === sections.length - 1}
                    className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}
                    aria-label="Move down"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSections((list) => list.filter((_, j) => j !== i))}
                    className={`${LINK_BUTTON} text-red-500 hover:bg-red-50`}
                    aria-label="Delete section"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <textarea
                  className={`${INPUT} mt-2 leading-relaxed`}
                  rows={Math.min(14, Math.max(4, s.text.split('\n').length + 1))}
                  value={s.text}
                  onChange={(e) => updateSection(i, { text: e.target.value })}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSections((list) => [...list, { heading: '', text: '' }])}
              className={`${LINK_BUTTON} inline-flex items-center gap-1 text-primary hover:bg-bg-soft`}
            >
              <Plus size={14} /> Add section
            </button>
          </div>

          {error && <p className="text-[13.5px] text-red-500">{error}</p>}
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}

          <div className="flex flex-wrap justify-between gap-3 border-t border-navy/[0.06] pt-4">
            <Button type="button" variant="secondary" disabled={busy || !edited} onClick={() => void restore()} className={SMALL_BUTTON}>
              Restore original
            </Button>
            <Button type="button" disabled={busy || !title.trim() || sections.length === 0} onClick={() => void save()} className={SMALL_BUTTON}>
              {busy ? 'Saving…' : 'Save and publish'}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
