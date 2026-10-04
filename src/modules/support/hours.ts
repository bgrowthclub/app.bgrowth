import type { SupportHours } from './types'

// Support hours helpers — the same rule the server uses (api/support.ts),
// so the page can switch between "online" and "offline" on its own as the
// clock passes the opening or closing time.

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const SUPPORT_TIMEZONES: { id: string; label: string }[] = [
  { id: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { id: 'America/Denver', label: 'Mountain Time (Denver)' },
  { id: 'America/Chicago', label: 'Central Time (Chicago)' },
  { id: 'America/New_York', label: 'Eastern Time (New York)' },
  { id: 'America/Sao_Paulo', label: 'Brasília Time (São Paulo)' },
  { id: 'Europe/Lisbon', label: 'Lisbon' },
]

export function isSupportOnline(hours: SupportHours, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: hours.timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const day = WEEKDAYS.indexOf(get('weekday'))
  const minutes = Number(get('hour')) * 60 + Number(get('minute'))
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  return hours.days.includes(day) && minutes >= toMin(hours.start) && minutes < toMin(hours.end)
}

function time12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

// "Mon–Fri" / "Mon, Wed, Fri" / "Every day"
function describeDays(days: number[]) {
  const sorted = [...days].sort()
  if (sorted.length === 7) return 'Every day'
  const consecutive = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1)
  if (consecutive && sorted.length > 2) return `${WEEKDAYS[sorted[0]]}–${WEEKDAYS[sorted[sorted.length - 1]]}`
  return sorted.map((d) => WEEKDAYS[d]).join(', ')
}

export function describeSupportHours(hours: SupportHours) {
  const tz = SUPPORT_TIMEZONES.find((t) => t.id === hours.timezone)?.label.split(' (')[0] ?? hours.timezone
  return `${describeDays(hours.days)}, ${time12(hours.start)}–${time12(hours.end)} ${tz}`
}

export const WEEKDAY_LABELS = WEEKDAYS
