import { Lock } from 'lucide-react'
import Button from '../ui/Button'
import { useIdentity } from '../../modules/identity/IdentityContext'

// Shown under the start of a locked article. Members-only: the rest is for
// signed-in members (free account) — after signing in the visitor comes back
// (GuestRoute's ?next=). For a plan (Sprint 125): the rest is for members on
// that plan or a higher one — signed-in members are pointed to the plans.
export default function ArticleMembersGate({ path, planName }: { path: string; planName?: string }) {
  const { user } = useIdentity()
  const next = encodeURIComponent(path)
  return (
    <div className="relative !mt-0">
      <div className="pointer-events-none absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white" />
      <div className="rounded-xl3 border border-primary/15 bg-bg-soft p-7 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white text-primary shadow-softer">
          <Lock size={18} />
        </span>
        {planName ? (
          <>
            <h2 className="mt-4 font-display text-xl font-bold text-navy">For {planName} members</h2>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-navy/60">
              This article is part of the {planName} plan and above. Choose a plan to read it all — plus every guide made for subscribers.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Button to="/pricing">See the plans</Button>
              {!user && (
                <Button to={`/login?next=${next}`} variant="secondary">
                  I already subscribe
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-4 font-display text-xl font-bold text-navy">Keep reading for free</h2>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-navy/60">
              This article is for BGrowth members. Create your free account to read it all — plus every members' guide as it comes out.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Button to={`/register?next=${next}`}>Create free account</Button>
              <Button to={`/login?next=${next}`} variant="secondary">
                I already have an account
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
