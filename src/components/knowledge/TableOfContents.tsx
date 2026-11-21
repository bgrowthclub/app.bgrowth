import { useEffect, useState } from 'react'

export interface TocHeading {
  id: string
  text: string
  /** 2 = a section, 3 = a sub-point under it */
  level?: 2 | 3
}

interface Props {
  headings: TocHeading[]
}

// "On this page" for the Article Page (new look 21/11/2026, the owner's
// design): the article body's own headings — sections numbered, sub-points as
// bullets under them — with the one being read highlighted as the page
// scrolls. Built from the body (lib/articleToc.ts), never written twice.
export default function TableOfContents({ headings }: Props) {
  const [active, setActive] = useState<string | null>(headings[0]?.id ?? null)

  useEffect(() => {
    if (headings.length === 0 || typeof IntersectionObserver === 'undefined') return
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => Boolean(el))
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-110px 0px -65% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null
  let n = 0

  return (
    <nav className="no-print rounded-[24px] border border-navy/[0.07] bg-white p-5 shadow-softer sm:p-6" aria-label="Table of contents">
      <p className="font-display text-[17px] font-bold text-navy">On this page</p>
      <ul className="mt-3 space-y-0.5">
        {headings.map((h) => {
          const sub = h.level === 3
          if (!sub) n += 1
          const on = active === h.id
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`flex gap-2 border-l-2 py-1.5 text-[13.5px] leading-snug transition-colors ${sub ? 'pl-7' : 'pl-3'} ${
                  on ? 'border-primary font-semibold text-primary' : 'border-transparent text-navy/65 hover:text-primary'
                }`}
              >
                <span className={`shrink-0 ${sub ? 'text-navy/30' : ''}`}>{sub ? '•' : `${n}.`}</span>
                <span>{h.text}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
