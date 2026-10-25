import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import logo from '../../assets/logo.png'
import Button from '../ui/Button'
import { useSiteNavigation } from '../../lib/useSiteNavigation'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { isExternalLink } from '../../data/siteNavigation'

export type NavMode = 'public' | 'member'

interface NavItem {
  label: string
  to: string
}

// Public nav: the built-in Home · Solutions · Knowledge · About, or the
// menu edited in Admin → Site → Menu & footer (data/siteNavigation.ts,
// lib/useSiteNavigation.ts). A link may be an https:// address.

// Member nav: My Systems · Resources · Account · Logout. "My Systems"
// points straight at the Customer Platform's Product Library
// (/platform/my-systems) — the single ownership source now that the
// legacy public /my-systems page just redirects there (see App.tsx).
const MEMBER_LINKS: NavItem[] = [
  { label: 'My Systems', to: '/platform/my-systems' },
  { label: 'Resources', to: '/my-systems#resources' },
  { label: 'Account', to: '/account' },
]

// `banner`: the announcement bar (AnnouncementBar), shown above the menu.
export default function Navbar({ mode = 'public', banner }: { mode?: NavMode; banner?: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const siteNav = useSiteNavigation()
  // Signed in on a public page (catalog, product…): a way back to the
  // member area instead of Login / Join.
  const { user } = useIdentity()
  const links = mode === 'member' ? MEMBER_LINKS : siteNav.menu

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock page scroll while the mobile bottom sheet is open, same as any
  // modal/sheet overlay would.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-50 print:hidden"
    >
      {banner}
      <div className={`transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}>
      <div className="container-px mx-auto max-w-page">
        <div
          className={`relative flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 ${
            scrolled
              ? 'border border-navy/[0.06] bg-white/80 shadow-soft backdrop-blur-xl'
              : 'border border-transparent bg-transparent'
          }`}
        >
          <Link to={mode === 'member' ? '/platform/my-systems' : '/'} className="flex items-center gap-2.5">
            {/* Circular masked container — the source PNG is a square icon
                on a flat white canvas, which read as "an image pasted on
                top" once everything else went pill/circle-shaped. Cropping
                it into a circle (rather than editing the asset) keeps this
                a pure presentation fix. */}
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full shadow-softer">
              <img src={logo} alt="BGrowth" className="h-full w-full scale-110 object-cover" />
            </span>
            <span className="font-display text-[17px] font-bold tracking-tight text-navy">
              BGrowth
            </span>
          </Link>

          {/* Centered relative to the entire bar (not just the space left
              between the logo and the right-side buttons) — absolutely
              positioned and centered on the bar's own midpoint, Apple-nav
              style, so an uneven logo/buttons width never throws it off. */}
          <nav className="hidden items-center gap-2 lg:absolute lg:left-1/2 lg:top-1/2 lg:flex lg:-translate-x-1/2 lg:-translate-y-1/2">
            {links.map((link) => {
              // Same-page anchor items (Solutions, Knowledge) resolve to the
              // same pathname as Home ("/") — without this they'd all light
              // up together on the homepage. Only a real distinct route
              // (Home, About, My Systems, etc.) should ever show as active.
              const isAnchor = link.to.includes('#')
              if (isExternalLink(link.to))
                return (
                  <a
                    key={link.label}
                    href={link.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full px-4 py-2 text-[13.5px] font-medium text-navy/70 transition-colors hover:bg-bg-soft hover:text-navy"
                  >
                    {link.label}
                  </a>
                )
              return (
                <NavLink
                  key={link.label}
                  to={link.to}
                  end
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors ${
                      isActive && !isAnchor
                        ? 'bg-bg-soft text-navy'
                        : 'text-navy/70 hover:bg-bg-soft hover:text-navy'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {mode === 'public' && user ? (
              <Button to="/platform/dashboard" className="!px-5 !py-2.5 !text-[13.5px]">
                My Dashboard
              </Button>
            ) : mode === 'public' ? (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-navy/60 transition-colors hover:text-navy"
                >
                  Login
                </Link>
                <Button to="/register" className="!px-5 !py-2.5 !text-[13.5px]">
                  Join BGrowth
                </Button>
              </>
            ) : (
              <button className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold text-navy/50 transition-colors hover:text-navy/80">
                <LogOut size={14} />
                Logout
              </button>
            )}
          </div>

          {/* On phones the "My Dashboard" button above is inside the menu
              sheet, so a signed-in member had to open the menu just to get
              back to their area (reported 25/10/2026). This icon puts that
              one tap back in the header, next to the menu button. */}
          {mode === 'public' && user && (
            <Link
              to="/platform/dashboard"
              className="grid h-9 w-9 place-items-center rounded-full text-primary transition-colors hover:bg-primary/[0.08] lg:hidden"
              aria-label="My Dashboard"
              title="My Dashboard"
            >
              <LayoutDashboard size={19} />
            </Link>
          )}

          <button
            className="grid h-9 w-9 place-items-center rounded-full text-navy lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </div>
      </div>

      {/* Mobile navigation — a bottom sheet (iOS-style) rather than a
          dropdown: slides up from the bottom with rounded top corners and
          large touch targets, dismissed by the backdrop or an item tap. */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-navy/30 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-navy/[0.06] bg-white p-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_-10px_rgba(16,97,236,0.18)] lg:hidden"
            >
              <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-navy/10" />
              <div className="flex flex-col gap-0.5">
                {links.map((link) =>
                  isExternalLink(link.to) ? (
                    <a
                      key={link.label}
                      href={link.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="rounded-2xl px-4 py-4 text-[16px] font-medium text-navy/80 transition-colors hover:bg-bg-soft"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className="rounded-2xl px-4 py-4 text-[16px] font-medium text-navy/80 transition-colors hover:bg-bg-soft"
                    >
                      {link.label}
                    </Link>
                  ),
                )}
              </div>
              <div className="my-2 border-t border-navy/[0.06]" />
              {mode === 'public' && user ? (
                <Button to="/platform/dashboard" className="!h-14 w-full" onClick={() => setOpen(false)}>
                  My Dashboard
                </Button>
              ) : mode === 'public' ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl px-4 py-4 text-center text-[16px] font-semibold text-navy/70 transition-colors hover:bg-bg-soft"
                  >
                    Login
                  </Link>
                  <Button to="/register" className="!h-14 w-full" onClick={() => setOpen(false)}>
                    Join BGrowth
                  </Button>
                </div>
              ) : (
                <button className="btn-secondary w-full" onClick={() => setOpen(false)}>
                  Logout
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
