// A Knowledge content author (BGrowth staff or a guest contributor). Kept
// separate from BGrowth Identity's User — an author is a byline, not a
// member account. No photo field on purpose: the Knowledge Hub renders
// authors as initials-in-a-circle (see components/knowledge/AuthorAvatar.tsx)
// rather than stock/real photography.
export interface KnowledgeAuthor {
  id: string
  name: string
  title?: string
  bio?: string
}
