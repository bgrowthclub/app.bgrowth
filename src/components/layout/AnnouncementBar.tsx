import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import type { SiteAnnouncement } from '../../modules/site/types'

const TONES: Record<SiteAnnouncement['tone'], string> = {
  news: 'bg-primary text-white',
  promo: 'bg-emerald-600 text-white',
  notice: 'bg-amber-100 text-amber-900',
}

// The bar at the very top of the public site (Admin → Site, Portal
// migration 0046). One line; the visitor can close it until the notice
// changes. Rendered inside the fixed Navbar header, with a spacer of the
// same height in AppLayout.
export default function AnnouncementBar({ announcement, onClose }: { announcement: SiteAnnouncement; onClose: () => void }) {
  const link = announcement.link_url
  const label = announcement.link_label || 'Learn more'
  const linkClass = 'ml-2 shrink-0 font-semibold underline underline-offset-2'
  return (
    <div className={`print:hidden ${TONES[announcement.tone] ?? TONES.news}`}>
      <div className="container-px relative mx-auto flex h-10 max-w-page items-center justify-center pr-10 text-[13px]">
        <p className="min-w-0 truncate">
          <span className="font-semibold">{announcement.title}</span>
          {announcement.body && <span className="hidden opacity-90 sm:inline"> — {announcement.body}</span>}
        </p>
        {link &&
          (link.startsWith('/') ? (
            <Link to={link} className={linkClass}>
              {label} →
            </Link>
          ) : (
            <a href={link} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {label} →
            </a>
          ))}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close announcement"
          className="absolute right-3 grid h-7 w-7 place-items-center rounded-full opacity-80 transition-opacity hover:opacity-100 sm:right-6"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
