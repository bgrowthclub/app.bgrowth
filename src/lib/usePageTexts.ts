import { useEffect, useState } from 'react'
import { getSiteContent } from '../modules/site/siteService'
import { PAGE_TEXT_DEFAULTS } from '../data/pageTexts'
import type { PageTexts } from '../data/pageTexts'

// The Home / About / Coming Soon texts as edited in Admin → Site → Page
// texts (portal.site_content key "page-texts"), loaded once per visit. A
// field never edited — or before the saved version arrives — shows its
// built-in text (data/pageTexts.ts).
let loading: Promise<PageTexts> | null = null
let loaded: PageTexts | null = null

function load() {
  loading ??= getSiteContent<PageTexts>('page-texts')
    .then((row) => (loaded = row?.value ?? {}))
    .catch(() => ({}))
  return loading
}

export function usePageTexts() {
  const [saved, setSaved] = useState<PageTexts>(loaded ?? {})
  useEffect(() => {
    let cancelled = false
    load().then((t) => !cancelled && setSaved(t))
    return () => {
      cancelled = true
    }
  }, [])

  function text(id: string): string {
    const v = saved[id]
    if (typeof v === 'string' && v.trim()) return v
    const d = PAGE_TEXT_DEFAULTS[id]
    return typeof d === 'string' ? d : ''
  }

  function items(id: string): string[] {
    const v = saved[id]
    if (Array.isArray(v) && v.length) return v
    const d = PAGE_TEXT_DEFAULTS[id]
    return Array.isArray(d) ? d : []
  }

  return { text, items }
}
