import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import Button from '../ui/Button'
import MemberPageView from '../find/MemberPageView'
import { CARD, INPUT, LINK_BUTTON, SMALL_BUTTON } from './styles'
import { adminService } from '../../modules/admin/adminService'
import { videoEmbed } from '../../modules/find/memberPageService'
import { shrinkImage } from '../../lib/shrinkImage'
import type { AdminMemberPageDraft } from '../../modules/admin/types'
import type { MemberPage, MemberPageHighlight, MemberPageLink, MemberPageLinkType, MemberPageService } from '../../modules/find/types'

interface Props {
  page: MemberPage | null
  onSave: (draft: AdminMemberPageDraft) => Promise<void>
  onCancel: () => void
}

const LABEL = 'mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-navy/40'

const LINK_TYPES: { id: MemberPageLinkType; label: string; placeholder: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '+1 555 123 4567' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@…' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@…' },
  { id: 'email', label: 'E-mail', placeholder: 'name@example.com' },
  { id: 'website', label: 'Website', placeholder: 'https://…' },
  { id: 'other', label: 'Other link', placeholder: 'https://…' },
]

function toSlug(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function move<T>(list: T[], index: number, delta: number): T[] {
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(index + delta, 0, item)
  return next
}

// One editable row of a list (links, services, featured work): its fields
// plus move up/down and remove.
function ListRow({ index, total, onMove, onRemove, children }: { index: number; total: number; onMove: (delta: number) => void; onRemove: () => void; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-navy/[0.08] p-3">
      <div className="min-w-0 flex-1 space-y-2">{children}</div>
      <div className="flex shrink-0 flex-col gap-0.5">
        <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)} className={`${LINK_BUTTON} !px-1.5 text-navy/50 hover:bg-bg-soft`}>
          <ArrowUp size={14} />
        </button>
        <button type="button" aria-label="Move down" disabled={index === total - 1} onClick={() => onMove(1)} className={`${LINK_BUTTON} !px-1.5 text-navy/50 hover:bg-bg-soft`}>
          <ArrowDown size={14} />
        </button>
        <button type="button" aria-label="Remove" onClick={onRemove} className={`${LINK_BUTTON} !px-1.5 text-red-500 hover:bg-red-50`}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function AddButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${LINK_BUTTON} inline-flex items-center gap-1.5 text-primary hover:bg-bg-soft`}>
      <Plus size={14} /> {label}
    </button>
  )
}

// Create or edit a member's public page, with the page itself shown live
// beside the form. A draft stays off the site; publishing puts it at
// bgrowth.app/p/<address>.
export default function MemberPageEditor({ page, onSave, onCancel }: Props) {
  const [displayName, setDisplayName] = useState(page?.display_name ?? '')
  const [slug, setSlug] = useState(page?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(page))
  const [headline, setHeadline] = useState(page?.headline ?? '')
  const [location, setLocation] = useState(page?.location ?? '')
  const [bio, setBio] = useState(page?.bio ?? '')
  const [photoUrl, setPhotoUrl] = useState(page?.photo_url ?? '')
  const [language, setLanguage] = useState<MemberPage['language']>(page?.language ?? 'en')
  const [ownerEmail, setOwnerEmail] = useState(page?.owner_email ?? '')
  const [links, setLinks] = useState<MemberPageLink[]>(page?.links ?? [])
  const [services, setServices] = useState<MemberPageService[]>(page?.services ?? [])
  const [highlights, setHighlights] = useState<MemberPageHighlight[]>(page?.highlights ?? [])
  const [uploading, setUploading] = useState<string | null>(null)
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const published = page?.status === 'published'

  async function upload(file: File, key: string, done: (url: string) => void) {
    setUploading(key)
    setError(null)
    try {
      done(await adminService.uploadMemberPageImage(await shrinkImage(file, key === 'photo' ? 600 : 1200)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t upload the image.')
    } finally {
      setUploading(null)
    }
  }

  function pickImage(key: string, done: (url: string) => void) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void upload(file, key, done)
    }
    input.click()
  }

  async function save(status: MemberPage['status']) {
    setSaving(status)
    setError(null)
    try {
      await onSave({ id: page?.id, slug, displayName, headline, bio, photoUrl, location, links, services, highlights, language, status, ownerEmail })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save the page.')
    } finally {
      setSaving(null)
    }
  }

  const setLink = (i: number, patch: Partial<MemberPageLink>) => setLinks((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const setService = (i: number, patch: Partial<MemberPageService>) => setServices((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const setHighlight = (i: number, patch: Partial<MemberPageHighlight>) => setHighlights((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  return (
    <div className={`${CARD} p-6`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="font-display text-lg font-bold text-navy">{page ? 'Edit page' : 'New page'}</h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="rounded-lg p-1.5 text-navy/40 hover:bg-bg-soft hover:text-navy">
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-bg-soft text-[11px] text-navy/35">Photo</span>
            )}
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                disabled={uploading !== null}
                className={`${LINK_BUTTON} inline-flex items-center gap-1.5 text-primary hover:bg-bg-soft`}
              >
                <ImagePlus size={15} /> {uploading === 'photo' ? 'Uploading…' : photoUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {photoUrl && (
                <button type="button" onClick={() => setPhotoUrl('')} className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}>
                  Remove photo
                </button>
              )}
            </div>
            <input
              ref={photoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void upload(file, 'photo', setPhotoUrl)
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Name</span>
              <input
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  if (!slugTouched) setSlug(toSlug(e.target.value.split(/\s+/)[0] ?? ''))
                }}
                maxLength={80}
                className={INPUT}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Address</span>
              <div className="flex items-center rounded-xl border border-navy/10 bg-white pl-3.5 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
                <span className="text-sm text-navy/40">bgrowth.app/p/</span>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(toSlug(e.target.value))
                  }}
                  maxLength={40}
                  className="w-full bg-transparent py-2.5 pr-3.5 text-sm text-navy outline-none"
                />
              </div>
            </label>
          </div>

          <label className="block">
            <span className={LABEL}>What they do (one line)</span>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={140} className={INPUT} placeholder="e.g. English teacher for Brazilians moving to the US" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Where (optional)</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} className={INPUT} placeholder="e.g. Orlando, FL · Online" />
            </label>
            <label className="block">
              <span className={LABEL}>Page language</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value as MemberPage['language'])} className={INPUT}>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className={LABEL}>Owner — BGrowth account e-mail (optional)</span>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className={INPUT}
              placeholder="The member sees this page’s numbers in My Page"
            />
          </label>

          <section>
            <span className={LABEL}>Contact buttons (the first one is the big one)</span>
            <div className="space-y-2">
              {links.map((link, i) => (
                <ListRow key={i} index={i} total={links.length} onMove={(d) => setLinks((l) => move(l, i, d))} onRemove={() => setLinks((l) => l.filter((_, j) => j !== i))}>
                  <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                    <select value={link.type} onChange={(e) => setLink(i, { type: e.target.value as MemberPageLinkType })} className={INPUT} aria-label="Type">
                      {LINK_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={link.url}
                      onChange={(e) => setLink(i, { url: e.target.value })}
                      className={INPUT}
                      placeholder={LINK_TYPES.find((t) => t.id === link.type)?.placeholder}
                      aria-label="Address"
                    />
                  </div>
                  <input value={link.label} onChange={(e) => setLink(i, { label: e.target.value })} maxLength={40} className={INPUT} placeholder="Button text (optional)" aria-label="Button text" />
                </ListRow>
              ))}
            </div>
            <AddButton label="Add a button" disabled={links.length >= 12} onClick={() => setLinks((l) => [...l, { type: l.length === 0 ? 'whatsapp' : 'instagram', label: '', url: '' }])} />
          </section>

          <section>
            <span className={LABEL}>Featured (optional)</span>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <ListRow key={i} index={i} total={highlights.length} onMove={(d) => setHighlights((l) => move(l, i, d))} onRemove={() => setHighlights((l) => l.filter((_, j) => j !== i))}>
                  <input value={h.title} onChange={(e) => setHighlight(i, { title: e.target.value })} maxLength={100} className={INPUT} placeholder="Title" aria-label="Title" />
                  <textarea value={h.description ?? ''} onChange={(e) => setHighlight(i, { description: e.target.value })} rows={2} maxLength={400} className={INPUT} placeholder="Short description" aria-label="Description" />
                  <input value={h.url ?? ''} onChange={(e) => setHighlight(i, { url: e.target.value })} className={INPUT} placeholder="Link (https://…, optional)" aria-label="Link" />
                  {h.url?.trim() && (
                    <input value={h.cta ?? ''} onChange={(e) => setHighlight(i, { cta: e.target.value })} maxLength={40} className={INPUT} placeholder={language === 'pt' ? 'Texto do botão (ex.: Começar grátis) — padrão: Saiba mais' : 'Button text (e.g. Start free) — default: Learn more'} aria-label="Button text" />
                  )}
                  <input value={h.video ?? ''} onChange={(e) => setHighlight(i, { video: e.target.value })} className={INPUT} placeholder="Video link — YouTube, TikTok or Instagram (optional, shows instead of the image)" aria-label="Video link" />
                  {h.video?.trim() && !videoEmbed(h.video) && <p className="text-[12.5px] text-red-500">Use a YouTube, TikTok or Instagram video link.</p>}
                  <div className="flex items-center gap-3">
                    {h.image && <img src={h.image} alt="" className="h-10 w-16 rounded-md object-cover" />}
                    <button
                      type="button"
                      disabled={uploading !== null}
                      onClick={() => pickImage(`h${i}`, (url) => setHighlight(i, { image: url }))}
                      className={`${LINK_BUTTON} inline-flex items-center gap-1.5 text-primary hover:bg-bg-soft`}
                    >
                      <ImagePlus size={14} /> {uploading === `h${i}` ? 'Uploading…' : h.image ? 'Change image' : 'Add image'}
                    </button>
                    {h.image && (
                      <button type="button" onClick={() => setHighlight(i, { image: '' })} className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}>
                        Remove image
                      </button>
                    )}
                  </div>
                </ListRow>
              ))}
            </div>
            <AddButton label="Add featured work" disabled={highlights.length >= 8} onClick={() => setHighlights((l) => [...l, { title: '', description: '', url: '', image: '', video: '' }])} />
          </section>

          <section>
            <span className={LABEL}>Services (optional)</span>
            <div className="space-y-2">
              {services.map((s, i) => (
                <ListRow key={i} index={i} total={services.length} onMove={(d) => setServices((l) => move(l, i, d))} onRemove={() => setServices((l) => l.filter((_, j) => j !== i))}>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px]">
                    <input value={s.title} onChange={(e) => setService(i, { title: e.target.value })} maxLength={100} className={INPUT} placeholder="Service" aria-label="Service" />
                    <input value={s.price ?? ''} onChange={(e) => setService(i, { price: e.target.value })} maxLength={40} className={INPUT} placeholder="Price (optional)" aria-label="Price" />
                  </div>
                  <input value={s.description ?? ''} onChange={(e) => setService(i, { description: e.target.value })} maxLength={400} className={INPUT} placeholder="Short description (optional)" aria-label="Description" />
                </ListRow>
              ))}
            </div>
            <AddButton label="Add a service" disabled={services.length >= 12} onClick={() => setServices((l) => [...l, { title: '', description: '', price: '' }])} />
          </section>

          <label className="block">
            <span className={LABEL}>About (optional)</span>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={6} maxLength={3000} className={INPUT} />
          </label>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <span className={LABEL}>Preview</span>
          <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-navy/[0.08] bg-bg">
            <MemberPageView
              preview
              page={{
                display_name: displayName.trim() || 'Name',
                headline: headline.trim() || null,
                bio: bio.trim() || null,
                photo_url: photoUrl || null,
                location: location.trim() || null,
                links: links.filter((l) => l.url.trim()),
                services: services.filter((s) => s.title.trim()),
                highlights: highlights.filter((h) => h.title.trim()),
                language,
              }}
            />
          </div>
        </aside>
      </div>

      {error && <p className="mt-6 text-[14px] text-red-500">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-navy/[0.06] pt-5">
        <Button type="button" variant="secondary" onClick={() => void save('draft')} disabled={saving !== null || uploading !== null} className={SMALL_BUTTON}>
          {saving === 'draft' ? 'Saving…' : published ? 'Unpublish' : 'Save as draft'}
        </Button>
        <Button type="button" onClick={() => void save('published')} disabled={saving !== null || uploading !== null} className={SMALL_BUTTON}>
          {saving === 'published' ? 'Publishing…' : published ? 'Save changes' : 'Publish'}
        </Button>
      </div>
    </div>
  )
}
