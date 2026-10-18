import SEO from '../../components/seo/SEO'
import ProfileSettings from '../../components/account/ProfileSettings'

// My Profile (Sprint 110): name, e-mail address and password.
export default function ProfilePage() {
  return (
    <>
      <SEO title="My Profile" description="Your name, e-mail address and password." path="/platform/profile" />
      <p className="eyebrow">BGrowth Platform</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">My Profile</h1>
      <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-navy/55">Your name, e-mail address and password.</p>
      <div className="mt-10">
        <ProfileSettings />
      </div>
    </>
  )
}
