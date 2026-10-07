import type { GrowthCategoryId } from '../../types/growth'

// The newsletter as the visitor/member sees it (api/newsletter.ts).
export type NewsletterStatus = 'none' | 'pending' | 'subscribed' | 'unsubscribed'

export interface NewsletterPreferences {
  email: string
  status: NewsletterStatus
  // Areas they want news about. Empty = every area.
  interests: GrowthCategoryId[]
}
