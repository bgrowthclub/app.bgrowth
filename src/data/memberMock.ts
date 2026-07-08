// Placeholder member state for the Workspace — there is no real
// session/account/purchase history yet (see CLAUDE.md: never add real auth
// or persistence without explicit direction). Centralized here so every
// Workspace surface (and the legacy /my-systems page) reads the same mock
// ownership list instead of each hardcoding its own copy.

export const MOCK_MEMBER_NAME = 'Jordan Casey'
export const MOCK_MEMBERSHIP_TIER = 'Free Plan'

// Slugs of Business Systems this mock member "owns". The first entry also
// stands in for "most recently opened" below — there is no real activity
// log, so order in this array is the only signal.
export const PURCHASED_SLUGS = ['start-your-notary-business', 'daily-notary-operations']

export const LAST_OPENED_SLUG = PURCHASED_SLUGS[0]
