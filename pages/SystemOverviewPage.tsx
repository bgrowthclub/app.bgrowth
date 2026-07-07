import { useParams, Navigate } from 'react-router-dom'
import BusinessSystemRuntime from '../components/runtime/BusinessSystemRuntime'
import { getSystemBySlug } from '../data/systems'

export default function SystemOverviewPage() {
  const { slug } = useParams<{ slug: string }>()
  const system = slug ? getSystemBySlug(slug) : undefined

  if (!system) return <Navigate to="/systems" replace />

  return <BusinessSystemRuntime system={system} />
}
