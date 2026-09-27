import type { KnowledgeBodyBlock } from '../modules/knowledge/types/article'
import type { TocHeading } from '../components/knowledge/TableOfContents'

// Deterministic slug for a heading block's own anchor id — kept simple
// (lowercase, non-alphanumerics to hyphens) since article body text is
// static mock/Studio-authored copy, not user input.
export function slugifyHeading(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || `section-${index}`
}

// Derives the Article Page's Table of Contents from the article body's own
// heading blocks — never hand-authored separately, so the two can never
// drift apart.
export function extractHeadings(body: KnowledgeBodyBlock[]): TocHeading[] {
  return body
    .map((block, index) => (block.kind === 'heading' ? { id: slugifyHeading(block.text, index), text: block.text } : null))
    .filter((h): h is TocHeading => Boolean(h))
}
