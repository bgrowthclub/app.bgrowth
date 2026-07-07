import { ArrowUpRight, Clock } from 'lucide-react'

interface Props {
  title: string
  excerpt: string
  readTime: string
  category: string
}

export default function ArticleCard({ title, excerpt, readTime, category }: Props) {
  return (
    <a
      href="#"
      className="group flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
    >
      <span className="w-fit rounded-full bg-bg-soft px-3 py-1 text-[11px] font-semibold text-primary">
        {category}
      </span>
      <h3 className="mt-4 font-display text-[15px] font-bold leading-snug text-navy">{title}</h3>
      <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-navy/50">{excerpt}</p>
      <div className="mt-5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[12px] text-navy/40">
          <Clock size={12} />
          {readTime}
        </span>
        <ArrowUpRight
          size={15}
          className="text-primary transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
    </a>
  )
}
