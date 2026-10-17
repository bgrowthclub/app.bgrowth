import { useEffect, useState } from 'react'
import { getSiteContent } from '../../modules/site/siteService'
import type { SeoSettings } from '../../data/seoPages'

// Lightweight head-tag manager for a client-rendered SPA. No dependency
// (react-helmet, etc.) — just upserts <meta>/<link> tags on mount and
// restores nothing on unmount, since the next page's <SEO> immediately
// overwrites the same tags. Good enough for a Vite SPA; if this project
// ever moves to SSR/prerendering, swap the implementation here only —
// every page already calls <SEO> the same way, so nothing else changes.
//
// NOTE: update SITE_URL to the real production domain once it's live.
const SITE_URL = 'https://bgrowth.app'

interface Props {
  title: string
  description: string
  keywords?: string[]
  path: string // e.g. "/workspaces" — used for canonical + og:url
  ogImage?: string
}

// Admin → Site → SEO (portal.site_content key "seo"), loaded once per visit:
// a page's own title/description/share image, and the default share image.
let settingsPromise: Promise<SeoSettings | null> | null = null
function loadSettings() {
  settingsPromise ??= getSiteContent<SeoSettings>('seo')
    .then((row) => row?.value ?? null)
    .catch(() => null)
  return settingsPromise
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

export default function SEO({ title: builtInTitle, description: builtInDescription, keywords, path, ogImage: pageImage }: Props) {
  const [settings, setSettings] = useState<SeoSettings | null>(null)
  useEffect(() => {
    let cancelled = false
    loadSettings().then((s) => !cancelled && setSettings(s))
    return () => {
      cancelled = true
    }
  }, [])

  const custom = settings?.pages?.[path]
  const title = custom?.title || builtInTitle
  const description = custom?.description || builtInDescription
  const ogImage = custom?.image || pageImage || settings?.defaultImage

  useEffect(() => {
    const fullTitle = `${title} | BGrowth`
    document.title = fullTitle

    upsertMeta('name', 'description', description)
    if (keywords?.length) upsertMeta('name', 'keywords', keywords.join(', '))

    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:url', `${SITE_URL}${path}`)
    upsertMeta('property', 'og:site_name', 'BGrowth')
    if (ogImage) upsertMeta('property', 'og:image', ogImage)
    upsertMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary')

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
