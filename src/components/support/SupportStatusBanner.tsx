import { Clock, MessageCircle } from 'lucide-react'
import type { SupportHours } from '../../modules/support/types'
import { describeSupportHours } from '../../modules/support/hours'

interface Props {
  online: boolean
  hours: SupportHours
}

// "We're online" (live chat) vs "We're offline" (we answer next business
// day, by e-mail too) — the same conversation either way.
export default function SupportStatusBanner({ online, hours }: Props) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-[13.5px] ${
        online ? 'bg-emerald-50 text-emerald-800' : 'bg-bg-soft text-navy/70'
      }`}
    >
      {online ? <MessageCircle size={17} className="mt-0.5 shrink-0" /> : <Clock size={17} className="mt-0.5 shrink-0" />}
      <p>
        {online ? (
          <>
            <strong className="font-semibold">We’re online.</strong> Send a message and we’ll answer here in a few minutes.
          </>
        ) : (
          <>
            <strong className="font-semibold text-navy">We’re offline right now.</strong> Leave your message — we’ll answer on
            the next business day, here and by e-mail.
          </>
        )}{' '}
        <span className="opacity-70">Hours: {describeSupportHours(hours)}.</span>
      </p>
    </div>
  )
}
