import PlaceholderPage from '../../components/platform/PlaceholderPage'

// Named distinctly from the marketing site's ResourcesPage (src/pages/ResourcesPage.tsx)
// to avoid any ambiguity between the two — this is the in-platform equivalent.
export default function PlatformResourcesPage() {
  return (
    <PlaceholderPage
      title="Resources"
      description="Guides, templates, and tools for running your business — available right inside the platform."
      path="/platform/resources"
    />
  )
}
