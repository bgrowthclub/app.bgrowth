import type { ReactNode } from 'react'

// Turns the addresses written inside a text into links, without ever
// treating the text as markup.
//
// An article's body is plain text by design: the Studio publishes structured
// blocks so the site never has to sanitize author-written HTML. The cost was
// that an address typed in a paragraph just sat there as text (noticed
// 30/10/2026). This splits the text on addresses and returns the pieces —
// the text itself is still rendered as text, and only a recognized address
// becomes a link.
//
// Only http:// and https:// (and a bare www., which is read as https) are
// linked. Anything else — javascript:, data:, a mail merge field — stays
// text, which is the point.
const ADDRESS = /\b(?:https?:\/\/|www\.)[^\s<>()[\]{}"']+/gi

// Punctuation that ends a sentence rather than the address.
const TRAILING = /[.,;:!?)\]}'"»]+$/

export function linkify(text: string): ReactNode {
  if (!text || !/(?:https?:\/\/|www\.)/i.test(text)) return text

  const out: ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  ADDRESS.lastIndex = 0

  while ((match = ADDRESS.exec(text)) !== null) {
    const raw = match[0]
    const trimmed = raw.replace(TRAILING, '')
    if (!trimmed) continue
    const start = match.index
    if (start > last) out.push(text.slice(last, start))
    const href = trimmed.toLowerCase().startsWith('www.') ? `https://${trimmed}` : trimmed
    out.push(
      <a
        key={`${start}-${trimmed}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
      >
        {trimmed}
      </a>,
    )
    last = start + trimmed.length
  }

  if (last === 0) return text
  if (last < text.length) out.push(text.slice(last))
  return out
}
