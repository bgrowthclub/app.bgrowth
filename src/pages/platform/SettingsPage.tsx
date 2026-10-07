import SEO from '../../components/seo/SEO'
import EmailUpdatesSettings from '../../components/newsletter/EmailUpdatesSettings'

export default function SettingsPage() {
  return (
    <>
      <SEO title="Settings" description="Manage your account, preferences, and membership details." path="/platform/settings" />
      <p className="eyebrow">BGrowth Platform</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">Settings</h1>
      <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-navy/55">
        Manage your account, preferences, and membership details.
      </p>
      <div className="mt-10 max-w-3xl">
        <EmailUpdatesSettings />
      </div>
    </>
  )
}
