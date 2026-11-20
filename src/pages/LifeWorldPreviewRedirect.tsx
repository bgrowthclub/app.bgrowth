import { Navigate, useParams } from 'react-router-dom'

// /preview/:category was each Life World's "coming soon" page until
// 20/11/2026; every world now has its own page at /workspaces/:slug.
export default function LifeWorldPreviewRedirect() {
  const { category } = useParams<{ category: string }>()
  return <Navigate to={category ? `/workspaces/${encodeURIComponent(category)}` : '/workspaces'} replace />
}
