import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageCircle,
  LifeBuoy,
  DollarSign,
  Handshake,
  Briefcase,
  Newspaper,
  Mail,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
} from 'lucide-react'
import SEO from '../components/seo/SEO'
import SectionContainer from '../components/layout/SectionContainer'
import SectionHeader from '../components/ui/SectionHeader'
import FAQ from '../components/ui/FAQ'
import PremiumCTA from '../components/ui/PremiumCTA'
import ContactHero from '../components/contact/ContactHero'
import ContactForm, { CONTACT_CATEGORIES } from '../components/contact/ContactForm'

const HELP_REASONS = [
  { icon: MessageCircle, title: 'General Questions', description: 'Not sure where to start? Ask us anything about BGrowth.', category: CONTACT_CATEGORIES[0] },
  { icon: LifeBuoy, title: 'Support', description: 'Need help with a Business System or your account? We’ve got you.', category: CONTACT_CATEGORIES[1] },
  { icon: DollarSign, title: 'Sales', description: 'Questions about pricing, plans, or BGrowth Club membership.', category: CONTACT_CATEGORIES[2] },
  { icon: Handshake, title: 'Partnerships', description: 'Interested in partnering with BGrowth? Let’s talk.', category: CONTACT_CATEGORIES[3] },
  { icon: Briefcase, title: 'Business Opportunities', description: 'Bring us an idea, a collaboration, or a new opportunity.', category: CONTACT_CATEGORIES[4] },
  { icon: Newspaper, title: 'Media', description: 'Press and media inquiries about BGrowth.', category: CONTACT_CATEGORIES[5] },
]

const CONTACT_INFO = [
  { icon: Mail, label: 'Email', value: 'hello@bgrowth.com' },
  { icon: Clock, label: 'Business Hours', value: 'Mon–Fri, 9am–6pm ET' },
  { icon: MapPin, label: 'Location', value: 'Remote-first · United States' },
  { icon: Phone, label: 'Phone', value: '+1 (555) 010-0192' },
]

const SOCIALS = [
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
  { icon: Youtube, label: 'YouTube', href: 'https://youtube.com' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
]

const CONTACT_FAQ = [
  { question: 'How quickly will I receive a reply?', answer: 'We typically respond within 1–2 business days. Support and sales inquiries are usually answered faster.' },
  { question: 'Can I request a custom service?', answer: 'Yes. Tell us what you need using the Business Opportunities or Sales category, and our team will follow up with next steps.' },
  { question: 'How do partnerships work?', answer: 'Partnerships are evaluated case by case. Send us a message with a few details about your business and what you have in mind.' },
  { question: 'Where can I report an issue?', answer: 'Use the Support category on the form below, and our team will get back to you as quickly as possible.' },
  { question: 'How can I contact support?', answer: 'Select Support when sending a message below — that routes your message straight to the right team.' },
]

const COMMUNITY_LINKS = [
  { title: 'Knowledge', description: 'Free guides, articles and practical advice across business, career and more.', to: '/knowledge' },
  { title: 'Academy', description: 'Structured courses and learning paths — explore our current guides while Academy is built out.', to: '/knowledge' },
  { title: 'Marketplace', description: 'Browse templates, tools and Business Systems available right now.', to: '/systems' },
  { title: 'BGrowth Club', description: 'Membership pricing, exclusive resources and a growing professional community.', to: '/club' },
  { title: 'Products', description: 'See every Business System built for your profession.', to: '/systems' },
]

export default function ContactPage() {
  const [category, setCategory] = useState('')

  const handleHelpReason = (reasonCategory: string) => {
    setCategory(reasonCategory)
    document.getElementById('message')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <SEO
        title="Contact"
        description="Get in touch with BGrowth — general questions, support, sales, partnerships, business opportunities and media inquiries."
        keywords={['contact bgrowth', 'bgrowth support', 'bgrowth partnerships']}
        path="/contact"
      />

      <ContactHero />

      <SectionContainer aria-label="How Can We Help">
        <SectionHeader eyebrow="How Can We Help?" title="Tell us what you need." className="mb-10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_REASONS.map((reason) => (
            <div key={reason.title} className="flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-bg-soft text-primary">
                <reason.icon size={17} strokeWidth={2} aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-[15px] font-bold text-navy">{reason.title}</h3>
              <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-navy/50">{reason.description}</p>
              <button
                type="button"
                onClick={() => handleHelpReason(reason.category)}
                className="mt-5 inline-flex w-fit items-center gap-1 text-[12.5px] font-semibold text-primary"
              >
                Contact us
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </SectionContainer>

      <SectionContainer background="soft" aria-label="Contact Information">
        <SectionHeader eyebrow="Contact Information" title="Reach us directly." className="mb-10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACT_INFO.map((info) => (
            <div key={info.label} className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-bg-soft text-primary">
                <info.icon size={17} strokeWidth={2} aria-hidden="true" />
              </div>
              <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-navy/40">{info.label}</p>
              <p className="mt-1 text-[14px] font-medium text-navy">{info.value}</p>
            </div>
          ))}

          <div className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-bg-soft text-primary">
              <Instagram size={17} strokeWidth={2} aria-hidden="true" />
            </div>
            <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-navy/40">Social Media</p>
            <div className="mt-2.5 flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-8 w-8 place-items-center rounded-full border border-navy/10 bg-white text-navy/45 transition-colors hover:border-primary/20 hover:text-primary"
                >
                  <s.icon size={14} strokeWidth={2} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer id="message" width="narrow" aria-label="Send a Message">
        <SectionHeader eyebrow="Send a Message" title="We’d love to hear from you." align="center" className="mx-auto mb-10" />
        <ContactForm category={category} onCategoryChange={setCategory} />
      </SectionContainer>

      <SectionContainer background="soft" width="narrow" aria-label="Frequently Asked Questions">
        <SectionHeader eyebrow="FAQ" title="Frequently asked questions." align="center" className="mx-auto mb-10" />
        <FAQ items={CONTACT_FAQ} />
      </SectionContainer>

      <SectionContainer aria-label="Community">
        <SectionHeader
          eyebrow="Community"
          title="Not sure where to look?"
          description="Depending on what you need, one of these might get you there faster than waiting on a reply."
          className="mb-10"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNITY_LINKS.map((link) => (
            <Link
              key={link.title}
              to={link.to}
              className="group flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
            >
              <h3 className="font-display text-[15px] font-bold text-navy">{link.title}</h3>
              <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-navy/50">{link.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary">
                Visit
                <ArrowRight
                  size={13}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </SectionContainer>

      <SectionContainer aria-label="Ready to Grow With BGrowth" className="!pt-0">
        <PremiumCTA
          eyebrow="BGROWTH CLUB™"
          title="Ready to Grow With BGrowth?"
          description="Explore our products, join the community and discover practical solutions designed to help you learn, launch, work, manage and grow."
          primaryLabel="Explore Products"
          primaryTo="/systems"
          secondaryLabel="Join BGrowth Club"
          secondaryTo="/club"
        />
      </SectionContainer>
    </div>
  )
}
