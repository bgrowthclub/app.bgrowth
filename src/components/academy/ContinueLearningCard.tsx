import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { coursePath } from '../../modules/workspace/config'
import type { UserProduct } from '../../types/productLibrary'

// One course the member is working through, as the Academy's "Continue
// Learning" row draws it (07/11/2026): cover, name, and how far along.
//
// A SIBLING of ProductLibraryCard, not a mode of it (CLAUDE.md §6). That
// card is the library's full record — bought on, last opened, access
// source; this one is a row of three across, where only "where was I" and
// "how far" matter. Giving the library card a `compact` variant would have
// bent it to a context it doesn't serve.
export default function ContinueLearningCard({ product }: { product: UserProduct }) {
  const percent = product.progress ? Math.max(0, Math.min(100, Math.round(product.progress.percentComplete))) : null

  return (
    <Link
      to={coursePath(product.slug)}
      className="group flex items-center gap-4 rounded-xl2 border border-navy/[0.07] bg-white p-3 transition-shadow hover:shadow-md"
    >
      <span className="h-[70px] w-[70px] shrink-0 overflow-hidden rounded-xl bg-bg-soft">
        {product.coverImage ? (
          <img src={product.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <GraduationCap size={22} className="text-navy/25" aria-hidden />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] font-bold text-navy">{product.title}</span>
        {/* No bar rather than an invented one: a course never ticked, or a
            record saved before the lesson total was stamped on it, honestly
            says "Not started yet" (see modules/academy/progress.ts). */}
        {percent === null ? (
          <span className="mt-1 block text-[13px] text-navy/45">Not started yet</span>
        ) : (
          <span className="mt-2 flex items-center gap-2.5">
            <span
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-soft"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress"
            >
              <span className="block h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </span>
            <span className="shrink-0 text-[12.5px] font-bold text-navy/55">{percent}%</span>
          </span>
        )}
      </span>
    </Link>
  )
}
