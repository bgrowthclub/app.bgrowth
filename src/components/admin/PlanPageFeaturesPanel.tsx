import { useMemo, useState } from 'react'
import { downloadCsv } from '../../lib/downloadCsv'
import Button from '../ui/Button'
import { CARD, SMALL_BUTTON } from './styles'
import { adminService } from '../../modules/admin/adminService'
import type { AdminPlan } from '../../modules/admin/types'
import type { PlanEntitlements } from '../../modules/commerce/types/membership'
import { memberPageTemplates } from '../../modules/find/memberPageTemplates'
import { PAGE_FEATURE_MAX, pageFeaturesOf } from '../../modules/find/pageFeatures'
import type { PageFeatures } from '../../modules/find/pageFeatures'

// Admin → Plans → Page (15/11/2026, the owner's decision: "a list of every
// function, a column per plan, a checkbox in each line"). One line per thing a
// member can do with their page — including one line per page model — and one
// column per plan. It opens filled with what each plan gives TODAY (a plan
// saved before this table follows "part" / "whole page"), so nothing changes
// until a box is changed. Saved per plan through PUT plan-page, which touches
// only the page part of the plan's entitlements.

type PageEnt = Pick<PlanEntitlements, 'memberPage' | 'pageTemplates' | 'pages' | 'pageLinks' | 'pageNoIndex' | 'pageInsights' | 'pageFeatures'>

const BOOL_ROWS: { key: keyof PageFeatures; label: string; hint?: string }[] = [
  { key: 'hide', label: 'Hide sections' },
  { key: 'sections', label: 'Add and reorder sections', hint: 'Off = the model’s sections, as they are' },
  { key: 'color', label: 'Choose the page color', hint: 'Off = the model’s color' },
  { key: 'cover', label: 'Cover image' },
  { key: 'address', label: 'Choose the address (bgrowth.app/p/…)', hint: 'Off = made from the name' },
  { key: 'gallery', label: 'Photo gallery' },
  { key: 'signup', label: 'E-mail list' },
  { key: 'style', label: 'Background tint, dark color, floating button' },
  { key: 'freeColors', label: 'Any background color and a text color' },
  { key: 'stats', label: 'Page numbers (visits, clicks)' },
  { key: 'noBrand', label: 'No BGrowth brand', hint: 'The disclaimer and “Report” always stay' },
]

const pageEnt = (e: PlanEntitlements): PageEnt => ({
  memberPage: e.memberPage,
  pageTemplates: e.pageTemplates,
  pages: e.pages,
  pageLinks: e.pageLinks,
  pageNoIndex: e.pageNoIndex,
  pageInsights: e.pageInsights,
  pageFeatures: e.pageFeatures,
})

export default function PlanPageFeaturesPanel({ plans, onSaved }: { plans: AdminPlan[]; onSaved: (planId: string, entitlements: PlanEntitlements) => void }) {
  const columns = useMemo(() => plans.filter((p) => p.status !== 'disabled').sort((a, b) => a.rank - b.rank), [plans])
  const [drafts, setDrafts] = useState<Record<string, PageEnt>>(() => Object.fromEntries(columns.map((p) => [p.id, pageEnt(p.entitlements ?? {})])))
  const [changed, setChanged] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const featuresOf = (p: AdminPlan) => pageFeaturesOf(drafts[p.id], p.is_free)
  function edit(p: AdminPlan, fn: (d: PageEnt, f: PageFeatures | null) => PageEnt) {
    setDrafts((all) => ({ ...all, [p.id]: fn(all[p.id] ?? {}, pageFeaturesOf(all[p.id], p.is_free)) }))
    setChanged((c) => (c.includes(p.id) ? c : [...c, p.id]))
    setNotice(null)
  }
  // A feature change writes EVERY line out, so a later change of the
  // part/whole default can never move the others.
  const setFeature = (p: AdminPlan, patch: Partial<PageFeatures>) =>
    edit(p, (d, f) => (f ? { ...d, pageFeatures: { ...f, ...patch } } : d))

  async function save() {
    setBusy(true)
    setError(null)
    try {
      for (const id of changed) {
        const plan = columns.find((p) => p.id === id)
        if (!plan) continue
        const d = drafts[id] ?? {}
        const f = pageFeaturesOf(d, plan.is_free)
        // "Whole page" in the database = may add and reorder sections; the
        // public page and the review queue still read that level.
        const out: PageEnt = f ? { ...d, memberPage: f.sections ? 'full' : 'partial', pageFeatures: f } : {}
        const r = await adminService.savePlanPage(id, out)
        onSaved(id, r.entitlements)
      }
      setNotice(`Saved ${changed.length === 1 ? '1 plan' : `${changed.length} plans`}.`)
      setChanged([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save.')
    } finally {
      setBusy(false)
    }
  }

  // Download the table as a spreadsheet (16/11/2026, the owner's request):
  // the same lines and values the table shows, as they are on screen.
  function exportCsv() {
    const yes = (b: boolean) => (b ? 'Yes' : '—')
    const line = (title: string, get: (p: AdminPlan, d: PageEnt, f: PageFeatures) => string) => [
      title,
      ...columns.map((p) => {
        const f = featuresOf(p)
        return f ? get(p, drafts[p.id] ?? {}, f) : 'No page'
      }),
    ]
    const all = memberPageTemplates('en')
    downloadCsv('bgrowth-page-features-by-plan', [
      ['Feature', ...columns.map((p) => p.name)],
      ['Has their own page', ...columns.map((p) => yes(Boolean(featuresOf(p))))],
      line('How many pages', (_p, d) => String(d.pages ?? 1)),
      line('Contact buttons', (_p, d) => (d.pageLinks ? String(d.pageLinks) : 'No limit')),
      line('Featured photos or videos', (_p, _d, f) => String(f.highlights)),
      line('Products', (_p, _d, f) => String(f.products)),
      ...BOOL_ROWS.map((row) => line(row.label, (_p, _d, f) => yes(Boolean(f[row.key])))),
      line('What visitors looked for', (_p, d) => yes(d.pageInsights === true)),
      line('Shows up on Google', (_p, d) => yes(d.pageNoIndex !== true)),
      ...all.map((t) => line(`Model: ${t.name.en}`, (_p, d) => yes(!d.pageTemplates?.length || d.pageTemplates.includes(t.id)))),
    ])
  }

  if (!columns.length) return <p className="text-[13.5px] text-navy/50">Create a plan first.</p>

  const head = 'px-2 py-2 text-center text-[12px] font-semibold text-navy'
  const cell = 'px-2 py-1.5 text-center'
  const label = 'sticky left-0 z-10 bg-white py-1.5 pr-3 text-left text-[13px] text-navy/80'
  const group = 'sticky left-0 z-10 bg-bg-soft px-2 pb-1.5 pt-4 text-left text-[11.5px] font-semibold uppercase tracking-wide text-navy/45'
  const num = 'w-16 rounded-lg border border-navy/10 px-2 py-1 text-center text-[13px] text-navy disabled:opacity-30'

  const numberRow = (title: string, hint: string, get: (d: PageEnt, f: PageFeatures) => number | '', put: (p: AdminPlan, n: number | undefined) => void, max: number, min = 0) => (
    <tr className="border-t border-navy/[0.05]">
      <td className={label}>
        {title}
        <span className="block text-[11.5px] text-navy/40">{hint}</span>
      </td>
      {columns.map((p) => {
        const f = featuresOf(p)
        return (
          <td key={p.id} className={cell}>
            <input
              type="number"
              min={min}
              max={max}
              disabled={!f}
              value={f ? get(drafts[p.id] ?? {}, f) : ''}
              aria-label={`${title} — ${p.name}`}
              onChange={(e) => {
                const raw = e.target.value
                const n = raw === '' ? undefined : Math.max(min, Math.min(max, Math.round(Number(raw))))
                put(p, Number.isFinite(n as number) ? n : undefined)
              }}
              className={num}
            />
          </td>
        )
      })}
    </tr>
  )

  return (
    <div className={`${CARD} p-5`}>
      <p className="mb-4 text-[13.5px] text-navy/60">
        What each plan can do with its member page, line by line. Tick a box to give it; a number sets the limit. It opens with what each plan gives today.
        A member with more than one plan gets the most of each line.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white" />
              {columns.map((p) => (
                <th key={p.id} className={head}>
                  {p.name}
                  {p.status === 'hidden' && <span className="block text-[10.5px] font-normal text-navy/40">hidden</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={group} colSpan={columns.length + 1}>
                The page
              </td>
            </tr>
            <tr className="border-t border-navy/[0.05]">
              <td className={label}>Has their own page</td>
              {columns.map((p) => {
                const has = Boolean(featuresOf(p))
                return (
                  <td key={p.id} className={cell}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={has}
                      aria-label={`Has their own page — ${p.name}`}
                      onChange={(e) => edit(p, (d) => (e.target.checked ? { ...d, memberPage: d.memberPage ?? 'partial' } : {}))}
                    />
                  </td>
                )
              })}
            </tr>
            {numberRow('How many pages', 'Empty = 1', (d) => d.pages ?? '', (p, n) => edit(p, (d) => ({ ...d, pages: n && n > 0 ? n : undefined })), 10, 1)}
            {numberRow('Contact buttons', 'Empty = no limit', (d) => d.pageLinks ?? '', (p, n) => edit(p, (d) => ({ ...d, pageLinks: n && n > 0 ? n : undefined })), 12, 1)}
            {numberRow('Featured photos or videos', `Up to ${PAGE_FEATURE_MAX.highlights}`, (_d, f) => f.highlights, (p, n) => setFeature(p, { highlights: n ?? 0 }), PAGE_FEATURE_MAX.highlights)}
            {numberRow('Products', `Up to ${PAGE_FEATURE_MAX.products}`, (_d, f) => f.products, (p, n) => setFeature(p, { products: n ?? 0 }), PAGE_FEATURE_MAX.products)}
            {BOOL_ROWS.map((row) => (
              <tr key={row.key} className="border-t border-navy/[0.05]">
                <td className={label}>
                  {row.label}
                  {row.hint && <span className="block text-[11.5px] text-navy/40">{row.hint}</span>}
                </td>
                {columns.map((p) => {
                  const f = featuresOf(p)
                  return (
                    <td key={p.id} className={cell}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary disabled:opacity-30"
                        disabled={!f}
                        checked={Boolean(f?.[row.key])}
                        aria-label={`${row.label} — ${p.name}`}
                        onChange={(e) => setFeature(p, { [row.key]: e.target.checked })}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="border-t border-navy/[0.05]">
              <td className={label}>What visitors looked for</td>
              {columns.map((p) => (
                <td key={p.id} className={cell}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary disabled:opacity-30"
                    disabled={!featuresOf(p)}
                    checked={drafts[p.id]?.pageInsights === true}
                    aria-label={`What visitors looked for — ${p.name}`}
                    onChange={(e) => edit(p, (d) => ({ ...d, pageInsights: e.target.checked || undefined }))}
                  />
                </td>
              ))}
            </tr>
            <tr className="border-t border-navy/[0.05]">
              <td className={label}>
                Shows up on Google
                <span className="block text-[11.5px] text-navy/40">Off = the link works, search engines don’t list it</span>
              </td>
              {columns.map((p) => (
                <td key={p.id} className={cell}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary disabled:opacity-30"
                    disabled={!featuresOf(p)}
                    checked={drafts[p.id]?.pageNoIndex !== true}
                    aria-label={`Shows up on Google — ${p.name}`}
                    onChange={(e) => edit(p, (d) => ({ ...d, pageNoIndex: e.target.checked ? undefined : true }))}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className={group} colSpan={columns.length + 1}>
                Page models
              </td>
            </tr>
            {memberPageTemplates('en').map((t) => (
              <tr key={t.id} className="border-t border-navy/[0.05]">
                <td className={label}>{t.name.en}</td>
                {columns.map((p) => {
                  const d = drafts[p.id] ?? {}
                  const list = d.pageTemplates
                  const on = Boolean(featuresOf(p)) && (!list?.length || list.includes(t.id))
                  return (
                    <td key={p.id} className={cell}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary disabled:opacity-30"
                        disabled={!featuresOf(p)}
                        checked={on}
                        aria-label={`${t.name.en} — ${p.name}`}
                        onChange={(e) =>
                          edit(p, (cur) => {
                            const all = memberPageTemplates('en').map((x) => x.id)
                            const now = cur.pageTemplates?.length ? cur.pageTemplates : all
                            const next = e.target.checked ? [...new Set([...now, t.id])] : now.filter((x) => x !== t.id)
                            // At least one model: an empty list would mean "all".
                            if (!next.length) return cur
                            // Every model ticked = no list, which is how "all" is stored.
                            return { ...cur, pageTemplates: next.length && next.length < all.length ? next : undefined }
                          })
                        }
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={busy || !changed.length} onClick={() => void save()} className={SMALL_BUTTON}>
          {busy ? 'Saving…' : changed.length ? `Save changes (${changed.length === 1 ? '1 plan' : `${changed.length} plans`})` : 'Save changes'}
        </Button>
        <button type="button" onClick={exportCsv} className="rounded-lg border border-navy/10 px-3 py-1.5 text-[13px] font-semibold text-primary hover:bg-bg-soft">
          Download CSV
        </button>
        {changed.length > 0 && <span className="text-[12.5px] text-navy/45">The file shows the table as it is on screen, unsaved changes included.</span>}
        {notice && <span className="text-[13px] text-emerald-700">{notice}</span>}
        {error && <span className="text-[13px] text-red-500">{error}</span>}
      </div>
    </div>
  )
}
