import { formatMinutes } from '../../modules/journeys/estimate'
import { Link } from 'react-router-dom'
import { Check, Clock, ExternalLink, Lock, Sparkles } from 'lucide-react'
import { ACTION_KIND } from './JourneyStagePreview'
import { videoEmbed } from '../../modules/find/memberPageService'
import type { VideoEmbed } from '../../modules/find/memberPageService'
import type { ActionAccess } from '../../modules/journeys/resourceAccess'
import type { JourneyAction } from '../../modules/journeys/types'

// The player for a video action. Same frame the articles use, so a vertical
// video (Shorts, Reels, TikTok) gets a taller, narrower box.
function JourneyVideo({ embed, title }: { embed: VideoEmbed; title: string }) {
  return (
    <div
      className={`mt-3 overflow-hidden rounded-xl2 bg-navy ${
        embed.vertical ? 'aspect-[9/16] max-h-[460px] max-w-[260px]' : 'aspect-video w-full'
      }`}
    >
      <iframe
        src={embed.src}
        title={title}
        className="h-full w-full"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}

interface Props {
  action: JourneyAction
  access: ActionAccess
  done: boolean
  /** Whether the member can tick it (never "coming soon" / "unavailable"). */
  markable: boolean
  onToggle: () => void
  /** The action to pick up from. */
  highlight?: boolean
}

function money(cents: number | null, currency: string | null) {
  if (cents == null) return null
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format(cents / 100)
  } catch {
    return `$${(cents / 100).toFixed(2)}`
  }
}

const LINK_BTN = 'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors'

// The resource part of an action, as THIS member can use it: open, get it
// free, buy (or see which plan includes it), coming soon, unavailable.
function ResourceButton({ access }: { access: ActionAccess }) {
  switch (access.kind) {
    case 'open':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Link to={access.to} className={`${LINK_BTN} bg-primary text-white hover:bg-primary/90`}>
            {access.label}
          </Link>
          {access.viaPlan && <span className="text-[12px] text-navy/45">Included in your {access.viaPlan} plan</span>}
          {access.trial && <span className="text-[12px] text-navy/45">Free trial</span>}
        </div>
      )
    case 'get_free':
      return (
        <Link to={access.to} className={`${LINK_BTN} border border-primary/25 bg-white text-primary hover:border-primary/50`}>
          Get it free
        </Link>
      )
    case 'locked':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Link to={access.to} className={`${LINK_BTN} border border-navy/10 bg-white text-navy hover:border-primary/30`}>
            <Lock size={14} aria-hidden /> {access.trialEnded ? 'Trial ended — see options' : `Buy${money(access.priceCents, access.currency) ? ` · ${money(access.priceCents, access.currency)}` : ''}`}
          </Link>
          {access.planName && (
            <Link to="/platform/membership" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
              <Sparkles size={13} aria-hidden /> Included in the {access.planName} plan and above
            </Link>
          )}
        </div>
      )
    case 'bundle':
      return (
        <Link to={access.to} className={`${LINK_BTN} border border-navy/10 bg-white text-navy hover:border-primary/30`}>
          See the bundle{money(access.priceCents, access.currency) ? ` · ${money(access.priceCents, access.currency)}` : ''}
        </Link>
      )
    case 'article':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Link to={access.to} className={`${LINK_BTN} border border-primary/25 bg-white text-primary hover:border-primary/50`}>
            Read the article
          </Link>
          {access.requiredPlanName && <span className="text-[12px] text-navy/45">For {access.requiredPlanName} plan members</span>}
        </div>
      )
    case 'external':
      return (
        <a href={access.href} target="_blank" rel="noopener noreferrer" className={`${LINK_BTN} border border-primary/25 bg-white text-primary hover:border-primary/50`}>
          {access.label} <ExternalLink size={13} aria-hidden />
        </a>
      )
    case 'coming_soon':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[12.5px] font-semibold text-amber-700">
          <Clock size={13} aria-hidden /> Coming soon
        </span>
      )
    case 'unavailable':
      return <span className="rounded-full bg-navy/[0.05] px-3 py-1 text-[12.5px] font-semibold text-navy/45">Not available right now</span>
    default:
      return null
  }
}

// One action on the member's Journey page: what to do (plain text), the
// resource as they can use it, and the "done" tick — which only the member
// sets; opening a resource never ticks it.
export default function JourneyActionCard({ action, access, done, markable, onToggle, highlight }: Props) {
  const kind = ACTION_KIND[action.kind]
  const Icon = kind.icon
  return (
    <li
      id={`action-${action.id}`}
      className={`scroll-mt-28 rounded-xl2 border bg-white p-4 shadow-softer transition-colors md:p-5 ${
        highlight ? 'border-primary/40 ring-2 ring-primary/10' : done ? 'border-emerald-200/70' : 'border-navy/[0.06]'
      } ${markable ? '' : 'opacity-80'}`}
    >
      <div className="flex gap-3.5">
        <button
          type="button"
          onClick={onToggle}
          disabled={!markable}
          aria-pressed={done}
          aria-label={done ? `Mark “${action.title}” as not done` : `Mark “${action.title}” as done`}
          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${
            done ? 'border-emerald-500 bg-emerald-500 text-white' : markable ? 'border-navy/20 text-transparent hover:border-primary' : 'cursor-not-allowed border-navy/10 bg-navy/[0.03] text-transparent'
          }`}
        >
          <Check size={15} strokeWidth={3} aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-wide text-primary/80">
              <Icon size={13} aria-hidden /> {kind.label}
            </span>
            {action.estimatedMinutes != null && <span className="text-[11.5px] font-medium text-navy/40">{formatMinutes(action.estimatedMinutes)}</span>}
            {action.optional && <span className="text-[11.5px] font-medium text-navy/40">Optional</span>}
            {action.states.length > 0 && <span className="text-[11.5px] font-medium text-navy/45">{action.states.join(', ')} only</span>}
            {highlight && !done && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Next</span>}
          </div>
          <p className={`mt-1 font-semibold leading-snug ${done ? 'text-navy/50 line-through decoration-navy/20' : 'text-navy'}`}>{action.title}</p>
          {action.instructions && <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-navy/65">{action.instructions}</p>}
          {/* A video action plays here, on the member's own Journey page, so
              they don't lose their place (decided 25/10/2026). BGrowth hosts
              nothing: the file stays on YouTube/TikTok/Instagram and this is
              their own player, the same one articles and member pages use.
              A link we can't recognise keeps the plain button below. */}
          {action.kind === 'video' && access.kind === 'external' && videoEmbed(access.href) && (
            <JourneyVideo embed={videoEmbed(access.href)!} title={action.title} />
          )}
          {access.kind !== 'task' && (
            <div className="mt-3">
              <ResourceButton access={access} />
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
