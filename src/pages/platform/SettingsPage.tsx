import { Link, useSearchParams } from 'react-router-dom'
import { Bell, ChevronRight, CreditCard, Receipt, Shield, Sparkles, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import ProfileSettings from '../../components/account/ProfileSettings'
import PasswordSettings from '../../components/account/PasswordSettings'
import EmailUpdatesSettings from '../../components/newsletter/EmailUpdatesSettings'
import DeleteAccountSettings from '../../components/account/DeleteAccountSettings'

type Tab = 'profile' | 'notifications' | 'security' | 'billing'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

const BILLING_LINKS = [
  { to: '/platform/membership', icon: Sparkles, title: 'Membership', text: 'Your plan, what it includes, renewals and changes.' },
  { to: '/platform/purchases', icon: Receipt, title: 'Purchases & receipts', text: 'Everything you bought, with receipts, and how you got each access.' },
]

// Settings (new look 20/11/2026, the owner's design): one page with tabs —
// Profile (name, e-mail; /platform/profile now opens here), Notifications
// (the newsletter), Security (password) and Billing (shortcuts to Membership
// and Purchases, which keep their own pages) — and the Danger zone below.
// No Integrations tab: there are none. The tab lives in ?tab= so links can
// open the right one.
export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const asked = params.get('tab') as Tab | null
  const tab: Tab = TABS.some((t) => t.id === asked) ? (asked as Tab) : 'profile'

  return (
    <>
      <SEO title="Settings" description="Manage your account, preferences, and membership details." path="/platform/settings" />
      <p className="text-[14px] text-navy/50">
        <span className="text-primary">BGrowth Platform</span> <span aria-hidden>/</span> Settings
      </p>
      <h1 className="mt-2 font-display text-[34px] font-extrabold tracking-tight text-navy md:text-[40px]">Settings</h1>
      <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-navy/55">Manage your account, preferences, and membership details.</p>

      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Settings">
          <ul className="grid grid-cols-2 gap-1 rounded-[20px] border border-navy/[0.07] bg-white p-1.5 shadow-softer lg:flex lg:flex-col">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = id === tab
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setParams(id === 'profile' ? {} : { tab: id }, { replace: true })}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[14.5px] font-medium transition-colors ${
                      active ? 'bg-blue-50 text-primary lg:shadow-[inset_3px_0_0_var(--color-primary)]' : 'text-navy/70 hover:bg-bg-soft hover:text-navy'
                    }`}
                  >
                    <Icon size={18} aria-hidden /> {label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0 rounded-[24px] border border-navy/[0.07] bg-white p-5 shadow-softer sm:p-7">
          {tab === 'profile' && (
            <>
              <h2 className="mb-5 font-display text-[22px] font-bold text-navy">Profile</h2>
              <ProfileSettings />
            </>
          )}
          {tab === 'notifications' && <EmailUpdatesSettings />}
          {tab === 'security' && (
            <>
              <h2 className="mb-5 font-display text-[22px] font-bold text-navy">Security</h2>
              <PasswordSettings />
            </>
          )}
          {tab === 'billing' && (
            <>
              <h2 className="font-display text-[22px] font-bold text-navy">Billing</h2>
              <p className="mt-1 text-[14px] text-navy/55">Your plan and your purchases each have their own page.</p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {BILLING_LINKS.map(({ to, icon: Icon, title, text }) => (
                  <Link key={to} to={to} className="group flex items-start gap-4 rounded-2xl border border-navy/[0.08] p-5 transition-colors hover:border-primary/30">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary">
                      <Icon size={20} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-navy">{title}</span>
                      <span className="mt-0.5 block text-[13.5px] leading-snug text-navy/55">{text}</span>
                    </span>
                    <ChevronRight size={18} className="mt-1 shrink-0 text-navy/30 group-hover:text-primary" aria-hidden />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-8">
        <DeleteAccountSettings />
      </div>
    </>
  )
}
