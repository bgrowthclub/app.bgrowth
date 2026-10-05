// Links inside Workspace content come from Studio templates and are never
// trusted: only web, e-mail, phone and inline-file links are kept.
const SAFE_URL = /^(https?:|mailto:|tel:|data:(?!text\/html)|blob:|#|\/)/i

export function safeUrl(url: string | undefined | null): string {
  const value = (url ?? '').trim()
  return SAFE_URL.test(value) ? value : '#'
}
