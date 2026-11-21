import { Link } from 'react-router-dom'
import { ArrowRight, Award, GraduationCap } from 'lucide-react'
import { coursePath } from '../../modules/workspace/config'
import { MY_COURSE_STATUS, myCourseStatus } from './myCourseStatus'
import type { CourseOverview } from '../../modules/academy/useAcademyOverview'
import type { UserProduct } from '../../types/productLibrary'

interface Props {
  product: UserProduct
  overview?: CourseOverview
  /** One row instead of a card (the list view). */
  row?: boolean
}

// A course on My Courses (21/11/2026, the owner's design): cover with its
// status, the category, title and description, the real progress, and the
// button that fits — Resume / Start learning / Review material — plus
// "Certificate" once it's finished (it opens the course at its certificate).
// No bookmark or "…" menu: neither exists yet.
export default function MyCourseCard({ product, overview, row = false }: Props) {
  const status = myCourseStatus(overview)
  const s = MY_COURSE_STATUS[status]
  const percent = overview?.percent ?? 0
  const to = coursePath(product.slug)

  const cover = (
    <div className={`relative overflow-hidden bg-navy ${row ? 'aspect-[16/10] w-full sm:w-52 sm:shrink-0 sm:rounded-l-[20px]' : 'aspect-[16/8]'}`}>
      {product.coverImage ? (
        <img src={product.coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-navy to-primary/70 text-white">
          <GraduationCap size={34} strokeWidth={1.6} aria-hidden />
        </div>
      )}
      <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-softer ${s.pill}`}>{s.label}</span>
    </div>
  )

  return (
    <div className={`flex overflow-hidden rounded-[20px] border border-navy/[0.07] bg-white shadow-softer ${row ? 'flex-col sm:flex-row' : 'flex-col'}`}>
      {cover}
      <div className="flex flex-1 flex-col p-5">
        {product.tag && <span className="w-fit rounded-md bg-blue-50 px-2 py-0.5 text-[11.5px] font-semibold text-primary">{product.tag}</span>}
        <h3 className="mt-2 font-display text-[18px] font-bold leading-snug text-navy">{product.title}</h3>
        {product.description && <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-navy/55">{product.description}</p>}
        <div className="mt-4 flex items-center gap-3">
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-navy/[0.07]">
            <span className={`block h-full rounded-full ${s.bar}`} style={{ width: `${percent}%` }} />
          </span>
          <span className="text-[13px] font-semibold text-navy/65">{percent}%</span>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
          <Link
            to={to}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition-opacity ${
              status === 'done' ? 'border border-primary/30 text-primary hover:bg-blue-50' : 'bg-primary text-white shadow-softer hover:opacity-95'
            }`}
          >
            {s.action} <ArrowRight size={15} aria-hidden />
          </Link>
          {status === 'done' && (
            <Link
              to={`${to}#certificate`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13.5px] font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              <Award size={15} aria-hidden /> Certificate
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
