import SEO from '../../components/seo/SEO'
import WorkspaceHero from '../../components/platform/WorkspaceHero'
import ContinueBuildingSection from '../../components/platform/ContinueBuildingSection'
import MyBusinessSystemsSection from '../../components/platform/MyBusinessSystemsSection'
import RecommendedSection from '../../components/platform/RecommendedSection'
import RecentlyAddedSection from '../../components/platform/RecentlyAddedSection'
import QuickActionsSection from '../../components/platform/QuickActionsSection'
import MemberBenefitsSection from '../../components/platform/MemberBenefitsSection'

export default function DashboardPage() {
  return (
    // Order since 19/11/2026 (the owner's design): the design's five parts
    // first; Recommended and Recently added kept at the end, by her choice.
    <div className="space-y-12">
      <SEO
        title="Dashboard"
        description="Your BGrowth Workspace — continue your Workspaces, discover what's next, and manage your membership."
        path="/platform/dashboard"
      />
      <WorkspaceHero />
      <ContinueBuildingSection />
      <MyBusinessSystemsSection />
      <QuickActionsSection />
      <MemberBenefitsSection />
      <RecommendedSection />
      <RecentlyAddedSection />
    </div>
  )
}
