import { Lock } from 'lucide-react'
import Button from '../ui/Button'

// Shown under the start of a members-only article for a visitor: the rest
// is for signed-in members (free account). After signing in, the visitor
// comes back to the article (GuestRoute's ?next=).
export default function ArticleMembersGate({ path }: { path: string }) {
  const next = encodeURIComponent(path)
  return (
    <div className="relative !mt-0">
      <div className="pointer-events-none absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white" />
      <div className="rounded-xl3 border border-primary/15 bg-bg-soft p-7 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white text-primary shadow-softer">
          <Lock size={18} />
        </span>
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
      </div>
    </div>
  )
}
