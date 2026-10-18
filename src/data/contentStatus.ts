// Is the Knowledge hub (/knowledge/*) showing real content? Since Sprint 112
// it reads the articles published from BGrowth Studio → Knowledge Engine
// (the migrated Wix blog posts and new ones), so it is on. While the site is
// closed (SiteGate) only the team sees it.
export const KNOWLEDGE_LIVE = true

// The Resources page (/resources) still lists example downloads, guides and
// tools (data/resources.ts), so it keeps showing "coming soon" with an
// e-mail sign-up until it has real content.
export const RESOURCES_LIVE = false
