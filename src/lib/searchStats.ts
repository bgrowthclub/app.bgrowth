// What visitors search for in the catalog (Portal migration 0052) — the
// first data source for the future Product Discovery in Studio's Content
// Engine. Sent through api/ingles.ts (the one public tracking function);
// only daily totals per search are kept, nothing about the visitor.

const URL_ = '/api/ingles?action=search'

const isAutomated = () => typeof navigator !== 'undefined' && navigator.webdriver === true

/** Counts a finished search once per browser session (a reload isn't a new search). */
export function recordCatalogSearch(query: string, results: number) {
  const q = query.trim().replace(/\s+/g, ' ').toLowerCase()
  if (q.length < 2 || isAutomated()) return
  const key = `bgrowth.search.${q}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    /* private mode: count anyway */
  }
  try {
    const payload = JSON.stringify({ q, results })
    if (navigator.sendBeacon?.(URL_, new Blob([payload], { type: 'text/plain' }))) return
    void fetch(URL_, { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'application/json' } })
  } catch {
    /* counting never breaks the page */
  }
}
