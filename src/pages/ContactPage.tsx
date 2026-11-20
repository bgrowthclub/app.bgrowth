import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, Clock, HelpCircle, LifeBuoy, Mail } from 'lucide-react'
import SEO from '../components/seo/SEO'
import { seoPage } from '../data/seoPages'
import FAQ from '../components/ui/FAQ'
import ContactForm from '../components/contact/ContactForm'
import { LEGAL_EMAIL } from '../data/legal'
import { useIdentity } from '../modules/identity/IdentityContext'

// Only real, confirmed contact details belong here — no placeholder phone
// numbers, status pages or help centers that don't exist. The e-mail is the
// one the owner chose for customers (data/legal.ts).
const CONTACT_FAQ = [
  { question: 'How quickly will I receive a reply?', answer: 'We typically respond within 1–2 business days.' },
  { question: 'Can I request a custom service?', answer: 'Yes. Tell us what you need in the form, and our team will follow up with next steps.' },
  { question: 'How do partnerships work?', answer: 'Partnerships are evaluated case by case. Choose Partnerships in the form and tell us a little about your business and what you have in mind.' },
  {
    question: 'How do I report a problem with a product?',
    answer: 'If you have an account, open a conversation in Support inside your account — every product also has a “Need help with this?” button. Otherwise, choose “Help with a product” in the form.',
  },
  { question: 'Where can I find what’s new?', answer: 'Subscribe to our newsletter — we announce every new product and feature there.' },
]

// Pages that exist today. Add one here when it opens.
const RESOURCES = [
  { label: 'Knowledge', to: '/knowledge' },
  { label: 'Catalog', to: '/systems' },
  { label: 'Pricing', to: '/pricing' },
]

const CARD = 'rounded-[24px] border border-navy/[0.07] bg-white p-6 shadow-softer'

// Contact (redesigned 20/11/2026, the owner's design): a light top with the
// reply time we already promise, then quick answers, the e-mail and the
// pages that may help on the left, and the form on the right.
export default function ContactPage() {
  const { user } = useIdentity()

  return (
    <div>
      <SEO
        title={seoPage('/contact').title}
        description={seoPage('/contact').description}
        keywords={['contact bgrowth', 'bgrowth support', 'bgrowth partnerships']}
        path="/contact"
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-bg to-blue-50/60 pb-14 pt-32 md:pb-16 md:pt-40">
        <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="container-px relative mx-auto max-w-page">
          <h1 className="font-display text-[40px] font-extrabold leading-[1.05] tracking-tight text-navy sm:text-[60px]">How can we help?</h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-navy/60 sm:text-[18px]">
            We’re here to support you every step of the way. Tell us what you need and we’ll get back to you soon.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-navy/[0.08] bg-white px-4 py-2 text-[14px] text-navy/70 shadow-softer">
            <Clock size={16} className="text-primary" aria-hidden /> Replies in <strong className="font-semibold text-primary">1–2 business days</strong>
          </p>
        </div>
      </section>

      <section className="container-px mx-auto max-w-page pb-24 pt-10">
        {user && (
          <Link
            to="/platform/support"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/15 bg-blue-50 px-5 py-4 text-[14px] text-navy transition-colors hover:border-primary/30"
          >
            <LifeBuoy size={18} className="shrink-0 text-primary" aria-hidden />
            <span className="flex-1">
              <strong className="font-semibold">Already a member?</strong> Get faster help in Support, inside your account.
            </span>
            <ChevronRight size={17} className="text-primary" aria-hidden />
          </Link>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-6">
            <div className={CARD}>
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-grad-primary text-white">
                  <HelpCircle size={22} aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-[19px] font-bold text-navy">Need a quick answer?</h2>
                  <p className="mt-0.5 text-[13.5px] text-navy/55">Check our frequently asked questions.</p>
                </div>
              </div>
              <div className="mt-5">
                <FAQ items={CONTACT_FAQ} />
              </div>
            </div>

            <div className={`${CARD} flex items-start gap-4`}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-white">
                <Mail size={20} aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-[19px] font-bold text-navy">Reach us directly</h2>
                <p className="mt-0.5 text-[13.5px] text-navy/55">Prefer e-mail? Write to us anytime.</p>
                <a href={`mailto:${LEGAL_EMAIL}`} className="mt-2 inline-block text-[15px] font-semibold text-primary hover:underline">
                  {LEGAL_EMAIL}
                </a>
              </div>
            </div>

            <div className={CARD}>
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-white">
                  <BookOpen size={20} aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-[19px] font-bold text-navy">Helpful pages</h2>
                  <p className="mt-0.5 text-[13.5px] text-navy/55">Guides, articles, our products and plans.</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-navy/[0.06] pt-4">
                {RESOURCES.map((r) => (
                  <Link key={r.to} to={r.to} className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary hover:underline">
                    {r.label} <ChevronRight size={15} aria-hidden />
                  </Link>
                ))}
                {user && (
                  <Link to="/platform/support" className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary hover:underline">
                    Support <ChevronRight size={15} aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div id="message" className="scroll-mt-28">
            <ContactForm defaultName={user?.displayName ?? ''} defaultEmail={user?.email ?? ''} />
          </div>
        </div>
      </section>
    </div>
  )
}
