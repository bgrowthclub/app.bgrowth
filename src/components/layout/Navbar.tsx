import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import logo from '../../assets/logo.png'
import Button from '../ui/Button'

export type NavMode = 'public' | 'member'

interface NavItem {
  label: string
  to: string
}

// Public nav: BGrowth · Business Systems · Industries · Resources · Pricing · About · Login
// Sections without a dedicated page yet link to the matching homepage anchor.
const PUBLIC_LINKS: NavItem[] = [
  { label: 'Business Systems', to: '/systems' },
  { label: 'Industries', to: '/#industries' },
  { label: 'Resources', to: '/#resources' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'About', to: '/#about' },
]

// Member nav: My Systems · Resources · Account · Logout
const MEMBER_LINKS: NavItem[] = [
  { label: 'My Systems', to: '/my-systems' },
  { label: 'Resources', to: '/my-systems#resources' },
  { label: 'Account', to: '/account' },
]

export default function Navbar({ mode = 'public' }: { mode?: NavMode }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const links = mode === 'member' ? MEMBER_LINKS : PUBLIC_LINKS

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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 print:hidden ${
        scrolled ? 'py-3' : 'py-5'
      }`}
    >
      <div className="container-px mx-auto max-w-page">
        <div
          className={`flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 ${
            scrolled
              ? 'border border-navy/[0.06] bg-white/80 shadow-soft backdrop-blur-xl'
              : 'border border-transparent bg-transparent'
          }`}
        >
          <Link to={mode === 'member' ? '/my-systems' : '/'} className="flex items-center gap-2.5">
            <img src={logo} alt="BGrowth" className="h-8 w-8 object-contain" />
            <span className="font-display text-[17px] font-bold tracking-tight text-navy">
              BGrowth
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors ${
                    isActive ? 'bg-bg-soft text-navy' : 'text-navy/70 hover:bg-bg-soft hover:text-navy'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {mode === 'public' ? (
              <>
                {/* Visual placeholder only — auth is handled outside this project */}
                <span className="cursor-default rounded-full px-4 py-2 text-[13.5px] font-semibold text-navy/40">
                  Login
                </span>
                <Button to="/systems" className="!px-5 !py-2.5 !text-[13.5px]">
                  Browse Systems
                </Button>
              </>
            ) : (
              <button className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold text-navy/50 transition-colors hover:text-navy/80">
                <LogOut size={14} />
                Logout
              </button>
            )}
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
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-navy/80 hover:bg-bg-soft"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-navy/[0.06] pt-3">
              {mode === 'public' ? (
                <>
                  <span className="cursor-default rounded-xl border border-navy/10 px-4 py-3 text-center text-sm font-semibold text-navy/40">
                    Login
                  </span>
                  <Button to="/systems" className="w-full" onClick={() => setOpen(false)}>
                    Browse Systems
                  </Button>
                </>
              ) : (
                <button className="btn-secondary" onClick={() => setOpen(false)}>
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
