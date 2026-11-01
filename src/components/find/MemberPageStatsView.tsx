import { BarChart3 } from 'lucide-react'
import FilterPill from '../ui/FilterPill'
import EmptyState from '../ui/EmptyState'
import { MEMBER_PAGE_LABELS } from '../../modules/find/memberPageService'
import type { MemberPageStats, MemberPageStatRow } from '../../modules/find/types'

const PERIODS = [7, 30, 90] as const

const LABELS = {
  en: {
    days: (n: number) => `${n} days`,
    visits: 'Page visits',
    clicks: 'Clicks',
    courseVisits: 'Course visits',
    courseLeads: 'Course e-mails',
    signups: 'List sign-ups',
    perDay: 'Visits per day',
    perLink: 'Contact buttons',
    perProduct: 'Products and featured items',
    searched: 'What people looked for',
    searchFound: 'Searches that found something',
    searchEmpty: 'Searches that found nothing',
    searchEmptyHint: 'The most useful list here: what people wanted and didn’t find.',
    perCategory: 'Categories people opened',
    noSearches: 'No searches in this period yet.',
    noClicks: 'No clicks in this period yet.',
    notReady: 'The numbers start once the database update (Portal migration 0045) runs.',
    privacy: 'Only totals are counted — nothing about who visited.',
    featured: 'Featured',
    links: { whatsapp: 'WhatsApp', whatsapp_group: 'WhatsApp group', phone: 'Call', booking: 'Booking', email: 'E-mail', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', website: 'Website', other: 'Link' } as Record<string, string>,
  },
  pt: {
    days: (n: number) => `${n} dias`,
    visits: 'Visitas à página',
    clicks: 'Cliques',
    courseVisits: 'Visitas ao curso',
    courseLeads: 'E-mails do curso',
    signups: 'Inscrições na lista',
    perDay: 'Visitas por dia',
    perLink: 'Botões de contato',
    perProduct: 'Produtos e destaques',
    searched: 'O que as pessoas procuraram',
    searchFound: 'Buscas que acharam',
    searchEmpty: 'Buscas que não acharam nada',
    searchEmptyHint: 'A lista mais útil daqui: o que as pessoas queriam e não encontraram.',
    perCategory: 'Categorias abertas',
    noSearches: 'Ainda não houve buscas neste período.',
    noClicks: 'Ainda não houve cliques neste período.',
    notReady: 'Os números começam depois da atualização do banco (migration 0045 do Portal).',
    privacy: 'Contamos só os totais — nada sobre quem visitou.',
    featured: 'Destaque',
    links: { whatsapp: 'WhatsApp', whatsapp_group: 'Grupo do WhatsApp', phone: 'Ligar', booking: 'Agendamento', email: 'E-mail', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', website: 'Site', other: 'Link' } as Record<string, string>,
  },
}

type Labels = (typeof LABELS)['en']

const CARD = 'rounded-xl3 border border-navy/[0.06] bg-white shadow-softer'

function sum(rows: MemberPageStatRow[], kind: MemberPageStatRow['kind']) {
  return rows.filter((r) => r.kind === kind).reduce((n, r) => n + r.count, 0)
}

function targetLabel(target: string, t: Labels) {
  if (target.startsWith('link:')) return t.links[target.slice(5)] ?? target.slice(5)
  if (target.startsWith('featured:')) return target.slice(9)
  return target
}

/** A product category's name, from the same list the page itself shows. */
function categoryLabel(id: string, language: 'en' | 'pt') {
  const labels = MEMBER_PAGE_LABELS[language] ?? MEMBER_PAGE_LABELS.en
  return (labels.categories as Record<string, string>)[id] ?? id
}

/** Adds up one kind of row per target, biggest first. */
function byTarget(rows: MemberPageStatRow[], keep: (r: MemberPageStatRow) => boolean) {
  const totals = new Map<string, number>()
  for (const r of rows) if (keep(r)) totals.set(r.target, (totals.get(r.target) ?? 0) + r.count)
  return [...totals.entries()].sort((a, b) => b[1] - a[1])
}

// One ranked list with a bar per line — used for contact buttons, products,
// searches and categories, so the four read the same way.
function BarList({ title, hint, entries, empty, label, language }: {
  title: string
  hint?: string
  entries: [string, number][]
  empty: string
  label?: (target: string) => string
  language: 'en' | 'pt'
}) {
  const max = Math.max(1, ...entries.map(([, n]) => n))
  return (
    <div className={`${CARD} p-5`}>
      <p className="text-[13px] font-semibold text-navy/60">{title}</p>
      {hint && <p className="mt-1 text-[12.5px] text-navy/40">{hint}</p>}
      {entries.length === 0 ? (
        <p className="mt-3 text-[14px] text-navy/45">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {entries.map(([target, n]) => (
            <li key={target}>
              <div className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="truncate text-navy">{label ? label(target) : target}</span>
                <span className="shrink-0 font-semibold text-navy">{n.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-bg-soft">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(n / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// The last `days` days, oldest first, as YYYY-MM-DD.
function dayList(days: number) {
  const out: string[] = []
  for (let i = days - 1; i >= 0; i -= 1) out.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10))
  return out
}

interface Props {
  stats: MemberPageStats | null
  days: number
  onDays: (days: number) => void
  language: 'en' | 'pt'
  error?: string | null
  // What visitors looked for (01/11/2026): shown to the team, and to an owner
  // whose plan includes it or whose page the team switched it on for. The
  // plain numbers above are every owner's and are never hidden.
  insights?: boolean
}

// A member page's numbers: visits, clicks per button/featured item and the
// course's visits and e-mails, over 7/30/90 days. Shared by the owner's
// "My Page" and Admin → Pages.
export default function MemberPageStatsView({ stats, days, onDays, language, error, insights = false }: Props) {
  const t = LABELS[language] ?? LABELS.en
  const rows = stats?.rows ?? []
  const visits = sum(rows, 'view')
  const clicks = sum(rows, 'click')
  const courseVisits = sum(rows, 'course_view')
  const courseLeads = sum(rows, 'course_lead')
  const signups = sum(rows, 'signup')
  const hasCourse = rows.some((r) => r.kind === 'course_view' || r.kind === 'course_lead')

  const perDay = new Map<string, number>()
  for (const r of rows) if (r.kind === 'view') perDay.set(r.day, (perDay.get(r.day) ?? 0) + r.count)
  const daysShown = dayList(days)
  const maxDay = Math.max(1, ...daysShown.map((d) => perDay.get(d) ?? 0))

  // Clicks split in two (01/11/2026): a contact button and a product are
  // different questions — "did they want to talk to me" and "what did they
  // want". They used to share one list, where a page with many products
  // buried the contacts.
  const contacts = byTarget(rows, (r) => r.kind === 'click' && !r.target.startsWith('featured:'))
  const products = byTarget(rows, (r) => r.kind === 'click' && r.target.startsWith('featured:'))
  // What visitors typed, and what they wanted and didn't find.
  const searchesFound = byTarget(rows, (r) => r.kind === 'search')
  const searchesEmpty = byTarget(rows, (r) => r.kind === 'search_empty')
  const categories = byTarget(rows, (r) => r.kind === 'category')
  const hasSearch = insights && (searchesFound.length > 0 || searchesEmpty.length > 0 || categories.length > 0)

  const tiles = [
    { label: t.visits, value: visits },
    { label: t.clicks, value: clicks },
    ...(signups > 0 ? [{ label: t.signups, value: signups }] : []),
    ...(hasCourse
      ? [
          { label: t.courseVisits, value: courseVisits },
          { label: t.courseLeads, value: courseLeads },
        ]
      : []),
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <FilterPill key={p} label={t.days(p)} active={days === p} onClick={() => onDays(p)} />
        ))}
      </div>

      {error ? (
        <p className="text-[14px] text-red-500">{error}</p>
      ) : !stats ? (
        <p className="py-10 text-center text-[14px] text-navy/40">…</p>
      ) : !stats.ready ? (
        <EmptyState icon={BarChart3} title={t.visits} description={t.notReady} />
      ) : (
        <>
          <div className={`grid gap-3 ${tiles.length > 2 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
            {tiles.map((tile) => (
              <div key={tile.label} className={`${CARD} p-4`}>
                <p className="text-[12.5px] font-semibold text-navy/50">{tile.label}</p>
                <p className="mt-1 font-display text-3xl font-bold text-navy">{tile.value.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}</p>
              </div>
            ))}
          </div>

          <div className={`${CARD} p-5`}>
            <p className="text-[13px] font-semibold text-navy/60">{t.perDay}</p>
            <div className="mt-4 flex h-32 items-end gap-[2px]" role="img" aria-label={t.perDay}>
              {daysShown.map((d) => {
                const n = perDay.get(d) ?? 0
                return (
                  <div key={d} className="group relative flex h-full flex-1 items-end" title={`${d}: ${n}`}>
                    <div className="w-full rounded-t bg-primary/80" style={{ height: `${n === 0 ? 2 : Math.max(6, (n / maxDay) * 100)}%`, opacity: n === 0 ? 0.25 : 1 }} />
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11.5px] text-navy/40">
              <span>{daysShown[0].slice(5).split('-').reverse().join('/')}</span>
              <span>{daysShown[daysShown.length - 1].slice(5).split('-').reverse().join('/')}</span>
            </div>
          </div>

          <BarList title={t.perLink} entries={contacts} empty={t.noClicks} label={(x) => targetLabel(x, t)} language={language} />

          {products.length > 0 && (
            <BarList title={t.perProduct} entries={products} empty={t.noClicks} label={(x) => targetLabel(x, t)} language={language} />
          )}

          {hasSearch && (
            <div className="space-y-5">
              <p className="font-display text-[15px] font-bold text-navy">{t.searched}</p>
              {searchesEmpty.length > 0 && (
                <BarList title={t.searchEmpty} hint={t.searchEmptyHint} entries={searchesEmpty} empty={t.noSearches} language={language} />
              )}
              {searchesFound.length > 0 && <BarList title={t.searchFound} entries={searchesFound} empty={t.noSearches} language={language} />}
              {categories.length > 0 && (
                <BarList title={t.perCategory} entries={categories} empty={t.noSearches} label={(c) => categoryLabel(c, language)} language={language} />
              )}
            </div>
          )}

          <p className="text-[12.5px] text-navy/40">{t.privacy}</p>
        </>
      )}
    </div>
  )
}
