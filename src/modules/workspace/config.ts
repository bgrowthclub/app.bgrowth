// Where a Studio-published Workspace can be bought until checkout moves
// into this site (step 4 of the Portal plan): the Portal's own product page,
// which sells with the same account (e-mail = identity). After purchase the
// Workspace shows up in this site's My Workspaces automatically.
export const PORTAL_URL = 'https://portal.bgrowth.app'

export function portalProductUrl(slug: string) {
  return `${PORTAL_URL}/product/${encodeURIComponent(slug)}`
}

// The customer-area route that opens a Studio-published Workspace.
export function workspaceViewerPath(slug: string, instanceId?: string) {
  const base = `/platform/workspace/${encodeURIComponent(slug)}`
  return instanceId ? `${base}?instance=${encodeURIComponent(instanceId)}` : base
}
