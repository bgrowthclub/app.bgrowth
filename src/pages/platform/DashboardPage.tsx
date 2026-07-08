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
    <div className="space-y-14">
      <SEO
        title="Dashboard"
        description="Your BGrowth Workspace — continue your Business Systems, discover what's next, and manage your membership."
        path="/platform/dashboard"
      />
      <WorkspaceHero />
      <ContinueBuildingSection />
      <MyBusinessSystemsSection />
      <RecommendedSection />
      <RecentlyAddedSection />
      <QuickActionsSection />
      <MemberBenefitsSection />
    </div>
  )
}
