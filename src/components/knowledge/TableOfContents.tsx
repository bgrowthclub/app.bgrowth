import { List } from 'lucide-react'

export interface TocHeading {
  id: string
  text: string
}

interface Props {
  headings: TocHeading[]
}

// A sticky in-page contents list for the Article Page — built from the
// article body's own heading blocks (see lib/articleToc.ts), never a
// hand-authored duplicate of the article's structure.
export default function TableOfContents({ headings }: Props) {
  if (headings.length === 0) return null

  return (
    <nav className="no-print rounded-xl3 border border-navy/[0.06] bg-white p-5 shadow-softer" aria-label="Table of contents">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-navy/35">
        <List size={13} />
        On this page
      </p>
      <ul className="mt-3 space-y-2.5">
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="text-[13px] leading-snug text-navy/60 transition-colors hover:text-primary">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
