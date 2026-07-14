import { Route } from 'lucide-react'
import Badge from '../ui/Badge'
import type { LearningPath } from '../../modules/knowledge/types/learningPath'

interface Props {
  path: LearningPath
}

// A preview card for a future BGrowth Journey — deliberately not a <Link>
// (there is no Journeys product to open yet), just an honest "coming soon"
// preview of the article sequence behind it. See LearningPath's doc
// comment for why this is modeled now rather than left as static JSX.
export default function LearningPathCard({ path }: Props) {
  return (
    <div className="flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
          <Route size={21} strokeWidth={1.75} />
        </div>
        {path.comingSoon && <Badge variant="outline">Coming Soon</Badge>}
      </div>
      <h3 className="mt-5 font-display text-[16px] font-bold leading-snug text-navy">{path.title}</h3>
      <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-navy/50">{path.description}</p>
      <p className="mt-5 text-[12px] font-medium text-navy/35">{path.articleSlugs.length} resources in this path</p>
    </div>
  )
}
