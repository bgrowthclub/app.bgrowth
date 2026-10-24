import { ExternalLink } from 'lucide-react'
import { LINK_BUTTON, formatDate, pillClass } from './styles'
import type { MemberPage } from '../../modules/find/types'

interface Props {
  page: MemberPage
  onEdit: () => void
  onNumbers: () => void
  onContacts: () => void
  onRemove: () => void
  // Released before launch: open at its own address while the site is closed.
  releasedEarly: boolean
  siteOpen?: boolean
  onToggleRelease: () => void
  releasing?: boolean
  // BGrowth Demo (page.is_demo): public while the site is closed; only
  // admins change it. No release button then.
  onToggleDemo: () => void
  demoBusy?: boolean
}

// One public page in Admin → Pages.
export default function AdminMemberPageRow({ page, onEdit, onNumbers, onContacts, onRemove, releasedEarly, onToggleRelease, releasing, onToggleDemo, demoBusy }: Props) {
  const published = page.status === 'published'
  const demo = page.is_demo === true
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      {page.photo_url ? (
        <img src={page.photo_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-bg-soft text-[13px] font-bold text-primary">
          {page.display_name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold text-navy">{page.display_name}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-navy/45">
          bgrowth.app/p/{page.slug} · updated {formatDate(page.updated_at)}
          {page.owner_email && <> · owner {page.owner_email}</>}
        </p>
      </div>
      <span className={pillClass(published ? 'green' : 'gray')}>{published ? 'Published' : 'Draft'}</span>
      {demo && (
        <span className={pillClass('blue')} title="Public while the site is closed (if published and allowed by its plan)">
          BGrowth Demo
        </span>
      )}
      {releasedEarly && !demo && <span className={pillClass(published ? 'blue' : 'gray')}>{published ? 'Public before launch' : 'Public before launch · publish it to open'}</span>}
      <div className="flex items-center gap-1">
        {published && (
          <a href={`/p/${encodeURIComponent(page.slug)}`} target="_blank" rel="noreferrer" className={`${LINK_BUTTON} inline-flex items-center gap-1 text-navy/60 hover:bg-bg-soft`}>
            View <ExternalLink size={13} />
          </a>
        )}
        {!demo && (
        <button
          type="button"
          onClick={onToggleRelease}
          disabled={releasing}
          title={releasedEarly ? 'Back behind “Coming soon” while the site is closed' : 'Anyone with the link can open this page while the rest of the site is closed'}
          className={`${LINK_BUTTON} ${releasedEarly ? 'text-navy/60' : 'text-primary'} hover:bg-bg-soft disabled:opacity-50`}
        >
          {releasing ? '…' : releasedEarly ? 'Remove public access' : 'Make page public'}
        </button>
        )}
        <button
          type="button"
          onClick={onToggleDemo}
          disabled={demoBusy}
          className={`${LINK_BUTTON} ${demo ? 'text-navy/60' : 'text-primary'} hover:bg-bg-soft disabled:opacity-50`}
        >
          {demoBusy ? '…' : demo ? 'Remove BGrowth Demo status' : 'Mark as BGrowth Demo'}
        </button>
        <button type="button" onClick={onNumbers} className={`${LINK_BUTTON} text-navy/60 hover:bg-bg-soft`}>
          Numbers
        </button>
        <button type="button" onClick={onContacts} className={`${LINK_BUTTON} text-navy/60 hover:bg-bg-soft`}>
          Contacts
        </button>
        <button type="button" onClick={onEdit} className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}>
          Edit
        </button>
        <button type="button" onClick={onRemove} className={`${LINK_BUTTON} text-red-500 hover:bg-red-50`}>
          Delete
        </button>
      </div>
    </div>
  )
}
