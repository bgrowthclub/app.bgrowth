// The site's main public pages and their built-in Google/link-preview text.
// Each page passes its entry to <SEO>; Admin → Site → SEO can replace the
// title, description and share image (portal.site_content key "seo"), and
// set the default share image used everywhere else.

export interface SeoPage {
  path: string
  label: string
  title: string
  description: string
}

export const SEO_PAGES: SeoPage[] = [
  {
    path: '/',
    label: 'Home',
    title: 'Business Systems That Help You Grow Anywhere',
    description:
      'Interactive Workspaces, planners and ready-to-use kits that help you organize, plan and grow your business, career and life — from BGrowth.',
  },
  {
    path: '/systems',
    label: 'Catalog',
    title: 'Catalog',
    description: 'Browse every BGrowth Workspace, calculator, download and bundle — buy once, keep it and use it whenever you need.',
  },
  {
    path: '/workspaces',
    label: 'Life Worlds',
    title: 'Life Worlds',
    description: 'Choose an interactive workspace designed to help you organize, learn, plan and accomplish meaningful goals.',
  },
  {
    path: '/about',
    label: 'About',
    title: 'About',
    description: 'BGrowth builds interactive Workspaces — not courses — that help people turn ambition into action, in business, career, and life.',
  },
  {
    path: '/contact',
    label: 'Contact',
    title: 'Contact',
    description: 'Get in touch with BGrowth — general questions, support, sales, partnerships, business opportunities and media inquiries.',
  },
  {
    path: '/resources',
    label: 'Resources',
    title: 'Resources',
    description: 'Free guides, templates, and tools for launching and running a service business — from BGrowth.',
  },
  {
    path: '/knowledge',
    label: 'Knowledge',
    title: 'Knowledge',
    description: 'BGrowth Knowledge — practical business education, free resources, and expert guidance in one place.',
  },
]

export function seoPage(path: string): SeoPage {
  return SEO_PAGES.find((p) => p.path === path) ?? SEO_PAGES[0]
}

// What Admin → Site → SEO saves (portal.site_content key "seo").
export interface SeoPageOverride {
  title?: string
  description?: string
  image?: string
}

export interface SeoSettings {
  defaultImage?: string
  pages?: Record<string, SeoPageOverride>
}
