import { useEffect } from 'react'

// Lightweight head-tag manager for a client-rendered SPA. No dependency
// (react-helmet, etc.) — just upserts <meta>/<link> tags on mount and
// restores nothing on unmount, since the next page's <SEO> immediately
// overwrites the same tags. Good enough for a Vite SPA; if this project
// ever moves to SSR/prerendering, swap the implementation here only —
// every page already calls <SEO> the same way, so nothing else changes.
//
// NOTE: update SITE_URL to the real production domain once it's live.
const SITE_URL = 'https://bgrowth.club'

interface Props {
  title: string
  description: string
  keywords?: string[]
  path: string // e.g. "/industries" — used for canonical + og:url
  ogImage?: string
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export default function SEO({ title, description, keywords, path, ogImage }: Props) {
  useEffect(() => {
    const fullTitle = `${title} | BGrowth`
    document.title = fullTitle

    upsertMeta('name', 'description', description)
    if (keywords?.length) upsertMeta('name', 'keywords', keywords.join(', '))

    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:url', `${SITE_URL}${path}`)
    if (ogImage) upsertMeta('property', 'og:image', ogImage)

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', `${SITE_URL}${path}`)
  }, [title, description, keywords, path, ogImage])

  return null
}
