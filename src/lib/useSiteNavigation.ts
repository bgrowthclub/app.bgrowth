import { useEffect, useState } from 'react'
import { getSiteContent } from '../modules/site/siteService'
import { DEFAULT_NAVIGATION } from '../data/siteNavigation'
import type { SiteNavigation } from '../data/siteNavigation'

// The top menu and footer as edited in Admin → Site → Menu & footer
// (portal.site_content key "navigation"), loaded once per visit; the
// built-in version until it arrives or when nothing was saved.
let loading: Promise<SiteNavigation> | null = null
let loaded: SiteNavigation | null = null

function load() {
  loading ??= getSiteContent<Partial<SiteNavigation>>('navigation')
    .then((row) => {
      const v = row?.value ?? {}
      loaded = {
        menu: v.menu?.length ? v.menu : DEFAULT_NAVIGATION.menu,
        footerLinks: v.footerLinks ?? DEFAULT_NAVIGATION.footerLinks,
        legalLinks: v.legalLinks ?? DEFAULT_NAVIGATION.legalLinks,
        tagline: v.tagline || DEFAULT_NAVIGATION.tagline,
        newsletterText: v.newsletterText || DEFAULT_NAVIGATION.newsletterText,
        socials: v.socials ?? DEFAULT_NAVIGATION.socials,
      }
      return loaded
    })
    .catch(() => DEFAULT_NAVIGATION)
  return loading
}

export function useSiteNavigation(): SiteNavigation {
  const [nav, setNav] = useState<SiteNavigation>(loaded ?? DEFAULT_NAVIGATION)
  useEffect(() => {
    let cancelled = false
    load().then((n) => !cancelled && setNav(n))
    return () => {
      cancelled = true
    }
  }, [])
  return nav
}
