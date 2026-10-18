import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import { CARD, INPUT, LINK_BUTTON, SMALL_BUTTON, formatDate, pillClass } from './styles'
import { DEFAULT_NAVIGATION, SITE_PAGE_SUGGESTIONS, SOCIAL_NETWORKS } from '../../data/siteNavigation'
import type { SiteLink, SiteNavigation } from '../../data/siteNavigation'
import { adminService } from '../../modules/admin/adminService'

const KEY = 'navigation'
const PAGES_LIST_ID = 'site-page-suggestions'

type LinkListKey = 'menu' | 'footerLinks' | 'legalLinks'

const LISTS: { key: LinkListKey; title: string; hint: string; max: number }[] = [
  { key: 'menu', title: 'Top menu', hint: 'The links across the top of the public site (and its mobile menu). Up to 8.', max: 8 },
  { key: 'footerLinks', title: 'Footer · Explore', hint: 'The “Explore” column of the footer. Up to 12.', max: 12 },
  { key: 'legalLinks', title: 'Footer · bottom row', hint: 'The small links at the very bottom (legal pages, contact). Up to 8.', max: 8 },
]

function withDefaults(value: Partial<SiteNavigation> | null | undefined): SiteNavigation {
  const v = value ?? {}
  return {
    menu: v.menu?.length ? v.menu : DEFAULT_NAVIGATION.menu,
    footerLinks: v.footerLinks ?? DEFAULT_NAVIGATION.footerLinks,
    legalLinks: v.legalLinks ?? DEFAULT_NAVIGATION.legalLinks,
    tagline: v.tagline || DEFAULT_NAVIGATION.tagline,
    newsletterText: v.newsletterText || DEFAULT_NAVIGATION.newsletterText,
    socials: v.socials ?? DEFAULT_NAVIGATION.socials,
  }
}

function LinkList({
  title,
  hint,
  max,
  links,
  onChange,
}: {
  title: string
  hint: string
  max: number
  links: SiteLink[]
  onChange: (links: SiteLink[]) => void
}) {
  function update(index: number, patch: Partial<SiteLink>) {
    onChange(links.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }
  function move(index: number, by: number) {
    const target = index + by
    if (target < 0 || target >= links.length) return
    const next = [...links]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className={`${CARD} space-y-3 p-5`}>
      <div>
        <h3 className="font-display text-[15px] font-bold text-navy">{title}</h3>
        <p className="mt-0.5 text-[12.5px] text-navy/50">{hint}</p>
      </div>
      {links.map((link, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input className={`${INPUT} w-40 flex-none`} value={link.label} maxLength={40} placeholder="Name" onChange={(e) => update(i, { label: e.target.value })} />
          <input
            className={`${INPUT} min-w-[180px] flex-1`}
            value={link.to}
            list={PAGES_LIST_ID}
            placeholder="/page or https://…"
            onChange={(e) => update(i, { to: e.target.value.trim() })}
          />
          <div className="flex">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`} aria-label="Move up">
              <ArrowUp size={15} />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === links.length - 1}
              className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}
              aria-label="Move down"
            >
              <ArrowDown size={15} />
            </button>
            <button
              type="button"
              onClick={() => onChange(links.filter((_, j) => j !== i))}
              className={`${LINK_BUTTON} text-red-500 hover:bg-red-50`}
              aria-label="Remove link"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
      {links.length < max && (
        <button
          type="button"
          onClick={() => onChange([...links, { label: '', to: '' }])}
          className={`${LINK_BUTTON} inline-flex items-center gap-1 text-primary hover:bg-bg-soft`}
        >
          <Plus size={14} /> Add link
        </button>
      )}
    </div>
  )
}

// Admin → Site → Menu & footer (portal.site_content key "navigation"): the
// public site's top menu, the footer's link columns, its two sentences and
// the social network icons. Until saved, the site shows the built-in version
// (data/siteNavigation.ts).
export default function NavigationEditor() {
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(true)
  const [edited, setEdited] = useState<{ updated_at: string; updated_by: string | null } | null>(null)
  const [nav, setNav] = useState<SiteNavigation>(DEFAULT_NAVIGATION)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    adminService
      .getSiteContent<Partial<SiteNavigation>>(KEY)
      .then(({ content, ready: isReady }) => {
        setReady(isReady)
        setEdited(content ? { updated_at: content.updated_at, updated_by: content.updated_by } : null)
        setNav(withDefaults(content?.value))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the menu.'))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const saved = await adminService.saveSiteContent<SiteNavigation>(KEY, nav)
      setEdited({ updated_at: saved.updated_at, updated_by: saved.updated_by })
      setNav(withDefaults(saved.value))
      setNotice('Saved — visitors see the new menu and footer the next time they open the site.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save.')
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    if (!window.confirm('Go back to the built-in menu and footer?')) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await adminService.resetSiteContent(KEY)
      setEdited(null)
      setNav(DEFAULT_NAVIGATION)
      setNotice('Back to the built-in menu and footer.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t restore it.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-navy">Menu & footer</h2>
        <p className="mt-0.5 text-[13.5px] text-navy/55">The links at the top of the public site, the footer and the social network icons.</p>
      </div>

      <details className={`${CARD} px-5 py-3 text-[13.5px] text-navy/70`}>
        <summary className="cursor-pointer font-semibold text-navy">How it works</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            <strong>Top menu</strong> is the row of links at the top of the public site (also in the menu that opens on phones). The members’ side
            menu is not changed here.
          </li>
          <li>
            Each link has a <strong>name</strong> (what people read) and an <strong>address</strong>: a page of this site starting with “/” (pick
            one from the list that opens when you click the field, e.g. /systems for the Catalog) or a full https:// address, which opens in a new
            tab.
          </li>
          <li>Use the arrows to change the order, the bin to remove a link, “Add link” for a new one.</li>
          <li>
            <strong>Social networks</strong>: paste the full address of each profile. Leave it empty to hide that icon.
          </li>
          <li>
            <strong>Save</strong> applies everything at once; visitors see it the next time they open the site. <strong>Restore original</strong> goes
            back to the built-in menu and footer.
          </li>
          <li>Every change is listed in Admin → Activity. Only Admins can edit this.</li>
        </ul>
      </details>

      {!ready ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">Run the database update (Portal migration 0053) to use this tab.</p>
      ) : loading ? (
        <p className="py-10 text-center text-[14px] text-navy/40">Loading…</p>
      ) : (
        <div className="space-y-5">
          <datalist id={PAGES_LIST_ID}>
            {SITE_PAGE_SUGGESTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          <div className="flex justify-end">
            <span className={pillClass(edited ? 'blue' : 'gray')}>
              {edited ? `Edited · ${formatDate(edited.updated_at)}${edited.updated_by ? ` by ${edited.updated_by}` : ''}` : 'Built-in'}
            </span>
          </div>

          {LISTS.map((list) => (
            <LinkList
              key={list.key}
              title={list.title}
              hint={list.hint}
              max={list.max}
              links={nav[list.key]}
              onChange={(links) => setNav((n) => ({ ...n, [list.key]: links }))}
            />
          ))}

          <div className={`${CARD} space-y-4 p-5`}>
            <h3 className="font-display text-[15px] font-bold text-navy">Footer texts</h3>
            <label className="block">
              <span className="text-[13px] font-semibold text-navy">Sentence under the logo</span>
              <textarea className={`${INPUT} mt-1`} rows={2} maxLength={200} value={nav.tagline} onChange={(e) => setNav((n) => ({ ...n, tagline: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-navy">Newsletter line</span>
              <input className={`${INPUT} mt-1`} maxLength={150} value={nav.newsletterText} onChange={(e) => setNav((n) => ({ ...n, newsletterText: e.target.value }))} />
            </label>
          </div>

          <div className={`${CARD} space-y-3 p-5`}>
            <div>
              <h3 className="font-display text-[15px] font-bold text-navy">Social networks</h3>
              <p className="mt-0.5 text-[12.5px] text-navy/50">The icons in the footer. Empty = hidden.</p>
            </div>
            {SOCIAL_NETWORKS.map((net) => (
              <label key={net.id} className="flex flex-wrap items-center gap-3">
                <span className="w-24 text-[13px] font-semibold text-navy">{net.label}</span>
                <input
                  className={`${INPUT} min-w-[220px] flex-1`}
                  value={nav.socials[net.id] ?? ''}
                  placeholder="https://…"
                  onChange={(e) => setNav((n) => ({ ...n, socials: { ...n.socials, [net.id]: e.target.value.trim() } }))}
                />
              </label>
            ))}
          </div>

          {error && <p className="text-[13.5px] text-red-500">{error}</p>}
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}

          <div className="flex flex-wrap justify-between gap-3">
            <Button type="button" variant="secondary" disabled={busy || !edited} onClick={() => void restore()} className={SMALL_BUTTON}>
              Restore original
            </Button>
            <Button type="button" disabled={busy} onClick={() => void save()} className={SMALL_BUTTON}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
