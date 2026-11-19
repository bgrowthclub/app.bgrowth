import { Link } from 'react-router-dom'
import { knowledgeCategoryLook } from './knowledgeCategoryIcons'

interface Props {
  slug: string
  name: string
  count: number
}

// One category on the Knowledge hub (19/11/2026): a colored icon, the name
// and how many articles it has. A sibling of CategoryTile (the row style
// other pages keep), not a variant of it.
export default function KnowledgeCategoryCard({ slug, name, count }: Props) {
  const { icon: Icon, tone } = knowledgeCategoryLook(slug)
  return (
    <Link
      to={`/knowledge/category/${slug}`}
      className="group flex h-full flex-col rounded-2xl border border-navy/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-soft"
    >
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
        <Icon size={19} strokeWidth={1.8} />
      </span>
      <span className="mt-4 text-[13.5px] font-semibold leading-snug text-navy group-hover:text-primary">{name}</span>
      <span className="mt-0.5 text-[12px] text-navy/45">
        {count} {count === 1 ? 'article' : 'articles'}
      </span>
    </Link>
  )
}
