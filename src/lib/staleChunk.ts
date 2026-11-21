// After a new version goes live, a page opened before it still asks for the
// old version's files, which no longer exist ("Failed to fetch dynamically
// imported module"). The cure is loading the page again, so we do it once,
// by ourselves (21/11/2026) — never twice in a row for the same address, so a
// real outage can't turn into an endless reload.
const KEY = 'bgrowth.staleReload'

export function isStaleChunkError(error: unknown): boolean {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(text)
}

/** Reloads once per address; false when it already did (show the error then). */
export function reloadForNewVersion(): boolean {
  try {
    if (sessionStorage.getItem(KEY) === window.location.pathname) return false
    sessionStorage.setItem(KEY, window.location.pathname)
  } catch {
    /* private mode: still reload once */
  }
  window.location.reload()
  return true
}

/** Forget the guard once a page has loaded fine. */
export function installStaleChunkReload() {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForNewVersion()) event.preventDefault()
  })
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  }, 10_000)
}
