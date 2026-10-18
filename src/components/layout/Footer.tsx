import { Link } from 'react-router-dom'
import { Instagram, Facebook, Youtube, Linkedin, ArrowRight, MessageCircle, AtSign, Twitter, Send, Ghost, Podcast } from 'lucide-react'
import logo from '../../assets/logo.png'
import Button from '../ui/Button'
import { useNewsletterSignup } from '../../modules/newsletter/useNewsletterSignup'
import SignupInterests from '../newsletter/SignupInterests'
import type { ReactNode } from 'react'
import { useSiteNavigation } from '../../lib/useSiteNavigation'
import { SOCIAL_NETWORKS, isExternalLink } from '../../data/siteNavigation'
import type { SiteLink, SocialNetwork } from '../../data/siteNavigation'

// The site's built-in footer, or the one edited in Admin → Site → Menu &
// footer (data/siteNavigation.ts, lib/useSiteNavigation.ts). A social icon
// shows only when its address is filled in.
const SOCIAL_ICONS: Record<SocialNetwork, (props: { size: number; strokeWidth: number }) => ReactNode> = {
  instagram: (p) => <Instagram {...p} />,
  facebook: (p) => <Facebook {...p} />,
  youtube: (p) => <Youtube {...p} />,
  linkedin: (p) => <Linkedin {...p} />,
  whatsapp: (p) => <MessageCircle {...p} />,
  threads: (p) => <AtSign {...p} />,
  x: (p) => <Twitter {...p} />,
  telegram: (p) => <Send {...p} />,
  snapchat: (p) => <Ghost {...p} />,
  spotify: (p) => <Podcast {...p} />,
  tiktok: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.77a5.69 5.69 0 1 0 4.91 5.63V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48Z" />
    </svg>
  ),
  pinterest: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.64 19.31c-.09-.79-.17-2 .03-2.86l1.18-5.01s-.3-.6-.3-1.49c0-1.4.81-2.44 1.82-2.44.86 0 1.27.64 1.27 1.42 0 .86-.55 2.15-.83 3.35-.24 1 .5 1.81 1.48 1.81 1.78 0 3.15-1.88 3.15-4.59 0-2.4-1.73-4.08-4.19-4.08-2.85 0-4.53 2.14-4.53 4.35 0 .86.33 1.79.75 2.29.08.1.09.19.07.29l-.28 1.14c-.04.18-.15.22-.34.13-1.25-.58-2.03-2.41-2.03-3.88 0-3.16 2.3-6.07 6.63-6.07 3.48 0 6.18 2.48 6.18 5.79 0 3.46-2.18 6.24-5.2 6.24-1.02 0-1.97-.53-2.3-1.15l-.62 2.38c-.23.87-.84 1.96-1.25 2.63A10 10 0 1 0 12 2Z" />
    </svg>
  ),
}

function FooterLink({ link, className }: { link: SiteLink; className: string }) {
  return isExternalLink(link.to) ? (
    <a href={link.to} target="_blank" rel="noopener noreferrer" className={className}>
      {link.label}
    </a>
  ) : (
    <Link to={link.to} className={className}>
      {link.label}
    </Link>
  )
}

export default function Footer() {
  const signup = useNewsletterSignup('footer')
  const nav = useSiteNavigation()
  const socials = SOCIAL_NETWORKS.filter((n) => nav.socials[n.id])

  return (
    <footer className="relative border-t border-navy/[0.06] bg-bg-soft print:hidden">
      <div className="container-px mx-auto max-w-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr_1.2fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo} alt="BGrowth" className="h-8 w-8 object-contain" />
              <span className="font-display text-[17px] font-bold tracking-tight text-navy">
                BGrowth
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-navy/45">
              {nav.tagline}
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={nav.socials[s.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-navy/10 bg-white text-navy/45 transition-colors hover:border-primary/20 hover:text-primary"
                >
                  {SOCIAL_ICONS[s.id]({ size: 15, strokeWidth: 2 })}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-navy">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {nav.footerLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} className="text-[13px] text-navy/45 transition-colors hover:text-primary" />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-navy">Newsletter</p>
            <p className="mt-4 text-[13px] text-navy/45">{nav.newsletterText}</p>
            <form onSubmit={signup.submit} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={signup.email}
                onChange={(e) => signup.setEmail(e.target.value)}
                placeholder="you@business.com"
                aria-label="E-mail address"
                className="w-full rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-[13px] text-navy placeholder:text-navy/30 focus:border-primary/30"
              />
              <Button type="submit" className="!px-4 !py-2.5 !text-[13px] shrink-0" icon={<ArrowRight size={14} />}>
                {signup.state === 'sending' ? '…' : signup.done ? 'Joined' : 'Join'}
              </Button>
            </form>
            {signup.message && (
              <p role="status" className={`mt-2 text-[12.5px] ${signup.state === 'error' ? 'text-red-500' : 'text-navy/50'}`}>
                {signup.message}
              </p>
            )}
            {signup.token && <SignupInterests token={signup.token} />}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-navy/[0.06] pt-8 sm:flex-row">
          <p className="text-[12.5px] text-navy/35">
            © {new Date().getFullYear()} BGrowth. All rights reserved.
          </p>
          <div className="flex gap-6 text-[12.5px] text-navy/35">
            {nav.legalLinks.map((link) => (
              <FooterLink key={link.label} link={link} className="hover:text-navy/60" />
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
