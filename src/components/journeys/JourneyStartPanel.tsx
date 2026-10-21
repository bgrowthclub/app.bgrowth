import { Route, UserPlus } from 'lucide-react'
import Button from '../ui/Button'
import { useIdentity } from '../../modules/identity/IdentityContext'

interface Props {
  /** This Journey's page — where sign-in / sign-up bring the visitor back. */
  path: string
  stageCount: number
  actionCount: number
  isFree: boolean
}

// The "start" box on a Journey's public page. A visitor can only read the
// overview: starting and saving progress need a (free) account — enforced by
// the database, not by this box. Signed-in members start it from their own
// Journey page (next step of the build).
export default function JourneyStartPanel({ path, stageCount, actionCount, isFree }: Props) {
  const { user, status } = useIdentity()
  const next = encodeURIComponent(path)
  return (
    <div className="rounded-xl3 border border-primary/15 bg-white p-6 shadow-softer">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Route size={18} aria-hidden />
        </span>
        <div>
          <p className="font-display text-[15px] font-semibold text-navy">{isFree ? 'Free with a BGrowth account' : 'BGrowth Journey'}</p>
          <p className="text-[12.5px] text-navy/45">
            {stageCount} {stageCount === 1 ? 'stage' : 'stages'} · {actionCount} {actionCount === 1 ? 'action' : 'actions'}
          </p>
        </div>
      </div>
      {status === 'loading' ? (
        <div className="mt-5 h-11 animate-pulse rounded-xl bg-bg-soft" />
      ) : user ? (
        <p className="mt-5 rounded-xl bg-bg-soft px-4 py-3 text-[13.5px] text-navy/60">
          You’re signed in. Starting this Journey and saving your progress opens here very soon.
        </p>
      ) : (
        <>
          <p className="mt-4 text-[13.5px] leading-relaxed text-navy/60">Sign in to start this Journey, check off each step and pick up where you left off.</p>
          <div className="mt-5 flex flex-col gap-2.5">
            <Button to={`/register?next=${next}`} icon={<UserPlus size={16} />}>
              Create free account
            </Button>
            <Button to={`/login?next=${next}`} variant="secondary">
              Sign in to start
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
