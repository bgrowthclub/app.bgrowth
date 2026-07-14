import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface ArticleRef {
  slug: string
  title: string
}

interface Props {
  prev?: ArticleRef
  next?: ArticleRef
}

export default function PrevNextArticleNav({ prev, next }: Props) {
  if (!prev && !next) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          to={`/knowledge/article/${prev.slug}`}
          className="group flex items-center gap-3 rounded-2xl border border-navy/[0.06] bg-white p-5 shadow-softer transition-colors hover:border-primary/20"
        >
          <ArrowLeft size={16} className="shrink-0 text-navy/30 transition-transform duration-300 group-hover:-translate-x-0.5" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/35">Previous</p>
            <p className="truncate text-[13.5px] font-semibold text-navy">{prev.title}</p>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={`/knowledge/article/${next.slug}`}
          className="group flex items-center justify-end gap-3 rounded-2xl border border-navy/[0.06] bg-white p-5 text-right shadow-softer transition-colors hover:border-primary/20"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/35">Next</p>
            <p className="truncate text-[13.5px] font-semibold text-navy">{next.title}</p>
          </div>
          <ArrowRight size={16} className="shrink-0 text-navy/30 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}
