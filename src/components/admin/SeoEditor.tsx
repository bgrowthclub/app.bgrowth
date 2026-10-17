import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import Button from '../ui/Button'
import { CARD, INPUT, LINK_BUTTON, SMALL_BUTTON, formatDate, pillClass } from './styles'
import { SEO_PAGES } from '../../data/seoPages'
import type { SeoPageOverride, SeoSettings } from '../../data/seoPages'
import { adminService } from '../../modules/admin/adminService'
import { shrinkImage } from '../../lib/shrinkImage'

const KEY = 'seo'

function Counter({ value, ideal }: { value: string; ideal: number }) {
  const over = value.length > ideal
  return <span className={`text-[11.5px] ${over ? 'text-amber-600' : 'text-navy/35'}`}>{value.length}/{ideal}</span>
}

// A share image: upload (shrunk to 1200px wide) or paste an https:// link.
function ImageField({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setBusy(true)
    setError(null)
    try {
      onChange(await adminService.uploadSiteImage(await shrinkImage(file, 1200)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t upload the image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <span className="text-[13px] font-semibold text-navy">{label}</span>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt="" className="h-20 w-[152px] rounded-lg border border-navy/10 object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-red-500 shadow"
              aria-label="Remove image"
            >
              <X size={13} />
            </button>
          </div>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className={`${LINK_BUTTON} inline-flex items-center gap-1 border border-navy/10 text-primary hover:bg-bg-soft`}
        >
          <ImagePlus size={14} /> {busy ? 'Uploading…' : value ? 'Change' : 'Upload'}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void upload(file)
          }}
        />
        <input className={`${INPUT} min-w-[220px] flex-1`} value={value} placeholder="…or paste an https:// image link" onChange={(e) => onChange(e.target.value.trim())} />
      </div>
      {error && <p className="mt-1 text-[12.5px] text-red-500">{error}</p>}
    </div>
  )
}

// Admin → Site → SEO (portal.site_content key "seo"): each main page's
// Google title/description and share image, plus the default share image.
// The same values feed the link previews on WhatsApp and social networks
// (api/ingles.ts?action=og). Empty field = the page's built-in text.
export default function SeoEditor() {
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(true)
  const [edited, setEdited] = useState<{ updated_at: string; updated_by: string | null } | null>(null)
  const [defaultImage, setDefaultImage] = useState('')
  const [pages, setPages] = useState<Record<string, SeoPageOverride>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function fill(value: SeoSettings | null) {
    setDefaultImage(value?.defaultImage ?? '')
    setPages(value?.pages ?? {})
  }

  useEffect(() => {
    adminService
      .getSiteContent<SeoSettings>(KEY)
      .then(({ content, ready: isReady }) => {
        setReady(isReady)
        setEdited(content ? { updated_at: content.updated_at, updated_by: content.updated_by } : null)
        fill(content?.value ?? null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the SEO settings.'))
      .finally(() => setLoading(false))
  }, [])

  function setPage(path: string, patch: SeoPageOverride) {
    setPages((all) => ({ ...all, [path]: { ...all[path], ...patch } }))
  }

  async function save() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const saved = await adminService.saveSiteContent<SeoSettings>(KEY, { defaultImage, pages })
      setEdited({ updated_at: saved.updated_at, updated_by: saved.updated_by })
      fill(saved.value)
      setNotice('Saved. Google picks up changes when it next visits; WhatsApp and the networks can keep an old preview for a while.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save.')
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    if (!window.confirm('Go back to the built-in titles and descriptions, with no share images?')) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await adminService.resetSiteContent(KEY)
      setEdited(null)
      fill(null)
      setNotice('Back to the built-in texts.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t restore it.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-navy">SEO & link previews</h2>
        <p className="mt-0.5 text-[13.5px] text-navy/55">What Google shows, and what appears when someone shares a link on WhatsApp or social networks.</p>
      </div>

      <details className={`${CARD} px-5 py-3 text-[13.5px] text-navy/70`}>
        <summary className="cursor-pointer font-semibold text-navy">How it works</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            <strong>Title</strong> and <strong>description</strong> are what Google shows for the page, and what a shared link shows on
            WhatsApp, Instagram, Facebook, LinkedIn and others. “ | BGrowth” is added after the title automatically.
          </li>
          <li>Keep the title under about 60 characters and the description under about 155 — longer text gets cut off (the counter turns orange).</li>
          <li>Leave a field empty to use the page’s built-in text (shown in grey).</li>
          <li>
            <strong>Share image</strong>: the picture in a link preview. Each page can have its own; otherwise the <strong>default share image</strong>{' '}
            is used. Best size: 1200 × 630 pixels.
          </li>
          <li>Product, bundle and member pages fill themselves in: the product’s name, short description and cover image (or the member’s photo).</li>
          <li>
            <strong>Save</strong> applies everything at once. Google updates when it next visits the site; WhatsApp and the networks can keep an old
            preview of a link for a few days.
          </li>
          <li>
            <strong>Restore original</strong> goes back to the built-in texts with no share images. Every change is listed in Admin → Activity. Only
            Admins can edit this.
          </li>
        </ul>
      </details>

      {!ready ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">Run the database update (Portal migration 0053) to use this tab.</p>
      ) : loading ? (
        <p className="py-10 text-center text-[14px] text-navy/40">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div className={`${CARD} space-y-4 p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-[15px] font-bold text-navy">Default share image</h3>
              <span className={pillClass(edited ? 'blue' : 'gray')}>
                {edited ? `Edited · ${formatDate(edited.updated_at)}${edited.updated_by ? ` by ${edited.updated_by}` : ''}` : 'Built-in'}
              </span>
            </div>
            <ImageField label="Used by every page that has no image of its own" value={defaultImage} onChange={setDefaultImage} />
          </div>

          {SEO_PAGES.map((page) => {
            const value = pages[page.path] ?? {}
            const title = value.title ?? ''
            const description = value.description ?? ''
            return (
              <div key={page.path} className={`${CARD} space-y-4 p-5`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-[15px] font-bold text-navy">{page.label}</h3>
                  <a href={page.path} target="_blank" rel="noreferrer" className="text-[12.5px] text-primary hover:underline">
                    bgrowth.app{page.path === '/' ? '' : page.path}
                  </a>
                </div>
                <label className="block">
                  <span className="flex items-center justify-between text-[13px] font-semibold text-navy">
                    Title <Counter value={title || page.title} ideal={60} />
                  </span>
                  <input className={`${INPUT} mt-1`} value={title} maxLength={70} placeholder={page.title} onChange={(e) => setPage(page.path, { title: e.target.value })} />
                </label>
                <label className="block">
                  <span className="flex items-center justify-between text-[13px] font-semibold text-navy">
                    Description <Counter value={description || page.description} ideal={155} />
                  </span>
                  <textarea
                    className={`${INPUT} mt-1`}
                    rows={2}
                    value={description}
                    maxLength={300}
                    placeholder={page.description}
                    onChange={(e) => setPage(page.path, { description: e.target.value })}
                  />
                </label>
                <ImageField label="Share image (optional)" value={value.image ?? ''} onChange={(image) => setPage(page.path, { image })} />

                <div className="rounded-xl bg-bg-soft px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/35">On Google</p>
                  <p className="mt-1 truncate text-[16px] text-primary">{`${title || page.title} | BGrowth`}</p>
                  <p className="text-[12.5px] text-emerald-700">bgrowth.app{page.path === '/' ? '' : page.path}</p>
                  <p className="line-clamp-2 text-[13px] text-navy/60">{description || page.description}</p>
                </div>
              </div>
            )
          })}

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
