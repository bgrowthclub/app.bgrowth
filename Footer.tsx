import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Facebook, Youtube, Linkedin, ArrowRight } from 'lucide-react'
import logo from '../../assets/logo.png'
import Button from '../ui/Button'

const LINKS = [
  { label: 'Business Systems', to: '/systems' },
  { label: 'Industries', to: '/industries' },
  { label: 'Resources', to: '/resources' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Contact', to: '/contact' },
]

const SOCIALS = [
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
  { icon: Youtube, label: 'YouTube', href: 'https://youtube.com' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

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
              Business Systems that help service business owners launch, organize, and grow with confidence.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-navy/10 bg-white text-navy/45 transition-colors hover:border-primary/20 hover:text-primary"
                >
                  <s.icon size={15} strokeWidth={2} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-navy">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-[13px] text-navy/45 transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-navy">Newsletter</p>
            <p className="mt-4 text-[13px] text-navy/45">Get new resources and systems first.</p>
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="w-full rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-[13px] text-navy placeholder:text-navy/30 focus:border-primary/30"
              />
              <Button type="submit" className="!px-4 !py-2.5 !text-[13px] shrink-0" icon={<ArrowRight size={14} />}>
                {submitted ? 'Sent' : 'Join'}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-navy/[0.06] pt-8 sm:flex-row">
          <p className="text-[12.5px] text-navy/35">
            © {new Date().getFullYear()} BGrowth. All rights reserved.
          </p>
          <div className="flex gap-6 text-[12.5px] text-navy/35">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.label} to={link.to} className="hover:text-navy/60">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
