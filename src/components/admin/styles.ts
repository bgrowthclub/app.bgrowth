// Shared class strings for the Website's Admin area — the site's own
// card/input look (tokens only), in one place instead of repeated inline.
export const CARD = 'rounded-xl3 border border-navy/[0.06] bg-white shadow-softer'

export const INPUT =
  'w-full rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/15'

export const SMALL_BUTTON = '!rounded-xl !px-4 !py-2 !text-[13px]'

export const LINK_BUTTON =
  'rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40'

export type Tone = 'green' | 'blue' | 'amber' | 'gray' | 'red'

const TONES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-bg-soft text-primary',
  amber: 'bg-amber-50 text-amber-700',
  gray: 'bg-navy/[0.05] text-navy/50',
  red: 'bg-red-50 text-red-600',
}

export function pillClass(tone: Tone) {
  return `inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONES[tone]}`
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// <input type="date"> value (YYYY-MM-DD) → end of that day, local time.
export function endOfDayIso(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59).toISOString()
}

export function todayInput(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
