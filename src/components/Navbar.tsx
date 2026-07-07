import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import logo from '../assets/logo.png'

const LINKS = [
  { label: 'Browse Systems', href: '#systems' },
  { label: 'Industries', href: '#industries' },
  { label: 'Resources', href: '#resources' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'py-3' : 'py-5'
      }`}
    >
      <div className="container-px mx-auto max-w-7xl">
        <div
          className={`flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 ${
            scrolled
              ? 'border border-navy/[0.06] bg-white/80 shadow-soft backdrop-blur-xl'
              : 'border border-transparent bg-transparent'
          }`}
        >
          <a href="#" className="flex items-center gap-2.5">
            <img src={logo} alt="BGrowth" className="h-8 w-8 object-contain" />
            <span className="font-display text-[17px] font-bold tracking-tight text-navy">
              BGrowth
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-full px-4 py-2 text-[13.5px] font-medium text-navy/70 transition-colors hover:bg-bg-soft hover:text-navy"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <a
              href="#login"
              className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-navy/70 transition-colors hover:text-navy"
            >
              Login
            </a>
            <a href="#join" className="btn-primary !px-5 !py-2.5 !text-[13.5px]">
              Join BGrowth Club
            </a>
          </div>

          <button
            className="grid h-9 w-9 place-items-center rounded-full text-navy lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex flex-col gap-1 rounded-2xl border border-navy/[0.06] bg-white/95 p-3 shadow-soft backdrop-blur-xl lg:hidden"
          >
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-navy/80 hover:bg-bg-soft"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-navy/[0.06] pt-3">
              <a href="#login" className="btn-secondary">Login</a>
              <a href="#join" className="btn-primary">Join BGrowth Club</a>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
