import { BarChart3 } from 'lucide-react'
import FilterPill from '../ui/FilterPill'
import EmptyState from '../ui/EmptyState'
import type { MemberPageStats, MemberPageStatRow } from '../../modules/find/types'

const PERIODS = [7, 30, 90] as const

const LABELS = {
  en: {
    days: (n: number) => `${n} days`,
    visits: 'Page visits',
    clicks: 'Clicks',
    courseVisits: 'Course visits',
    courseLeads: 'Course e-mails',
    perDay: 'Visits per day',
    perLink: 'What people clicked',
    noClicks: 'No clicks in this period yet.',
    notReady: 'The numbers start once the database update (Portal migration 0045) runs.',
    privacy: 'Only totals are counted — nothing about who visited.',
    featured: 'Featured',
    links: { whatsapp: 'WhatsApp', email: 'E-mail', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', website: 'Website', other: 'Link' } as Record<string, string>,
  },
  pt: {
    days: (n: number) => `${n} dias`,
    visits: 'Visitas à página',
    clicks: 'Cliques',
    courseVisits: 'Visitas ao curso',
    courseLeads: 'E-mails do curso',
    perDay: 'Visitas por dia',
    perLink: 'Onde as pessoas clicaram',
    noClicks: 'Ainda não houve cliques neste período.',
    notReady: 'Os números começam depois da atualização do banco (migration 0045 do Portal).',
    privacy: 'Contamos só os totais — nada sobre quem visitou.',
    featured: 'Destaque',
    links: { whatsapp: 'WhatsApp', email: 'E-mail', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', website: 'Site', other: 'Link' } as Record<string, string>,
  },
}

type Labels = (typeof LABELS)['en']

const CARD = 'rounded-xl3 border border-navy/[0.06] bg-white shadow-softer'

function sum(rows: MemberPageStatRow[], kind: MemberPageStatRow['kind']) {
  return rows.filter((r) => r.kind === kind).reduce((n, r) => n + r.count, 0)
}

function targetLabel(target: string, t: Labels) {
  if (target.startsWith('link:')) return t.links[target.slice(5)] ?? target.slice(5)
  if (target.startsWith('featured:')) return `${target.slice(9)} · ${t.featured}`
  return target
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
}

// A member page's numbers: visits, clicks per button/featured item and the
// course's visits and e-mails, over 7/30/90 days. Shared by the owner's
// "My Page" and Admin → Pages.
export default function MemberPageStatsView({ stats, days, onDays, language, error }: Props) {
  const t = LABELS[language] ?? LABELS.en
  const rows = stats?.rows ?? []
  const visits = sum(rows, 'view')
  const clicks = sum(rows, 'click')
  const courseVisits = sum(rows, 'course_view')
  const courseLeads = sum(rows, 'course_lead')
  const hasCourse = rows.some((r) => r.kind === 'course_view' || r.kind === 'course_lead')

  const perDay = new Map<string, number>()
  for (const r of rows) if (r.kind === 'view') perDay.set(r.day, (perDay.get(r.day) ?? 0) + r.count)
  const daysShown = dayList(days)
  const maxDay = Math.max(1, ...daysShown.map((d) => perDay.get(d) ?? 0))

  const perTarget = new Map<string, number>()
  for (const r of rows) if (r.kind === 'click') perTarget.set(r.target, (perTarget.get(r.target) ?? 0) + r.count)
  const targets = [...perTarget.entries()].sort((a, b) => b[1] - a[1])
  const maxTarget = Math.max(1, ...targets.map(([, n]) => n))

  const tiles = [
    { label: t.visits, value: visits },
    { label: t.clicks, value: clicks },
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

          <div className={`${CARD} p-5`}>
            <p className="text-[13px] font-semibold text-navy/60">{t.perLink}</p>
            {targets.length === 0 ? (
              <p className="mt-3 text-[14px] text-navy/45">{t.noClicks}</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {targets.map(([target, n]) => (
                  <li key={target}>
                    <div className="flex items-baseline justify-between gap-3 text-[14px]">
                      <span className="truncate text-navy">{targetLabel(target, t)}</span>
                      <span className="shrink-0 font-semibold text-navy">{n}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-bg-soft">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(n / maxTarget) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-[12.5px] text-navy/40">{t.privacy}</p>
        </>
      )}
    </div>
  )
}
