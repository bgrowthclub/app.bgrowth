import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronDown, ChevronRight, Eye, EyeOff, ImagePlus, Lock, Monitor, Plus, Smartphone, Trash2, X } from 'lucide-react'
import Button from '../ui/Button'
import { CARD, INPUT, LINK_BUTTON, SMALL_BUTTON } from '../admin/styles'
import MemberPageView from './MemberPageView'
import ResponsiveFrame from '../ui/ResponsiveFrame'
import { shrinkImage } from '../../lib/shrinkImage'
import { videoEmbed } from '../../modules/find/memberPageService'
import { BLOCK_TYPES, LEGACY_BLOCKS, PAGE_COLORS, blockId, memberPageTemplates, switchTemplateBlocks, templateBlocks, templatePreview } from '../../modules/find/memberPageTemplates'
import type {
  MemberPage,
  MemberPageBlock,
  MemberPageBlockData,
  MemberPageBlockType,
  MemberPageDraft,
  MemberPageHighlight,
  MemberPageLink,
  MemberPageLinkType,
  MemberPageService,
  MemberPageTheme,
} from '../../modules/find/types'

// What the editor allows: 'team' (Admin → Pages: everything + owner),
// 'full' (Enterprise subscriber) and 'partial' (Pro subscriber: a model's
// sections as they are, its color, one featured item, no gallery).
export type MemberPageBuilderMode = 'team' | 'full' | 'partial'

interface Props {
  page: MemberPage | null
  mode: MemberPageBuilderMode
  // Uploads a shrunk image (data URL) and returns its public address.
  upload: (dataUrl: string) => Promise<string>
  onSave: (draft: MemberPageDraft) => Promise<void>
  onCancel?: () => void
  // Extra fields above the sections (the team's owner e-mail).
  extra?: ReactNode
}

const LABEL = 'mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-navy/40'
const SMALL = LINK_BUTTON

const LINK_TYPES: { id: MemberPageLinkType; label: string; placeholder: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '+1 555 123 4567' },
  { id: 'phone', label: 'Call', placeholder: '+1 555 123 4567' },
  { id: 'booking', label: 'Booking', placeholder: 'https://calendly.com/…' },
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

// Another model's sections, keeping what was written; a Pro page (keepExtra
// false) gets exactly the model's sections.
function fitBlocks(templateId: string, language: MemberPage['language'], current: MemberPageBlock[], keepExtra: boolean) {
  const next = switchTemplateBlocks(templateId, language, current)
  return keepExtra ? next : next.slice(0, templateBlocks(templateId, language).length)
}

function move<T>(list: T[], index: number, delta: number): T[] {
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(index + delta, 0, item)
  return next
}

function Row({ children, onRemove, onMove, index, total }: { children: ReactNode; onRemove: () => void; onMove?: (d: number) => void; index: number; total: number }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-navy/[0.08] p-3">
      <div className="min-w-0 flex-1 space-y-2">{children}</div>
      <div className="flex shrink-0 flex-col gap-0.5">
        {onMove && (
          <>
            <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)} className={`${SMALL} !px-1.5 text-navy/50 hover:bg-bg-soft`}>
              <ArrowUp size={14} />
            </button>
            <button type="button" aria-label="Move down" disabled={index === total - 1} onClick={() => onMove(1)} className={`${SMALL} !px-1.5 text-navy/50 hover:bg-bg-soft`}>
              <ArrowDown size={14} />
            </button>
          </>
        )}
        <button type="button" aria-label="Remove" onClick={onRemove} className={`${SMALL} !px-1.5 text-red-500 hover:bg-red-50`}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function Add({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${SMALL} mt-2 inline-flex items-center gap-1.5 text-primary hover:bg-bg-soft`}>
      <Plus size={14} /> {label}
    </button>
  )
}

// The page editor with a live preview: model, basics, look and the page's
// sections (blocks). Shared by Admin → Pages and the subscriber's My Page.
export default function MemberPageBuilder({ page, mode, upload, onSave, onCancel, extra }: Props) {
  const free = mode !== 'partial'
  const [language, setLanguage] = useState<MemberPage['language']>(page?.language ?? 'en')
  const [template, setTemplate] = useState(page ? (page.template ?? 'blank') : '')
  const [blocks, setBlocks] = useState<MemberPageBlock[]>(() => {
    const own = page?.blocks?.length ? page.blocks : page ? LEGACY_BLOCKS.map((b) => ({ ...b, id: blockId() })) : []
    // A Pro page keeps exactly its model's sections (pages from the first
    // models move to the closest look).
    return page && !free && page.template !== template ? fitBlocks(template, page.language, own, false) : own
  })
  const [theme, setTheme] = useState<MemberPageTheme>(page?.theme ?? {})
  const [displayName, setDisplayName] = useState(page?.display_name ?? '')
  const [slug, setSlug] = useState(page?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(page))
  const [headline, setHeadline] = useState(page?.headline ?? '')
  const [location, setLocation] = useState(page?.location ?? '')
  const [bio, setBio] = useState(page?.bio ?? '')
  const [photoUrl, setPhotoUrl] = useState(page?.photo_url ?? '')
  const [links, setLinks] = useState<MemberPageLink[]>(page?.links ?? [])
  const [services, setServices] = useState<MemberPageService[]>(page?.services ?? [])
  const [highlights, setHighlights] = useState<MemberPageHighlight[]>(page?.highlights ?? [])
  const [open, setOpen] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [candidate, setCandidate] = useState<string | null>(null)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('mobile')
  const [uploading, setUploading] = useState<string | null>(null)
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const published = page?.status === 'published'
  const maxHighlights = free ? 8 : 1
  const templates = memberPageTemplates(language)

  function pickImage(key: string, size: number, done: (url: string) => void) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploading(key)
      setError(null)
      try {
        done(await upload(await shrinkImage(file, size)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Couldn’t upload the image.')
      } finally {
        setUploading(null)
      }
    }
    input.click()
  }

  function chooseTemplate(id: string) {
    const t = templates.find((x) => x.id === id)
    if (!t) return
    setTemplate(id)
    // A new page gets the model's sections; switching keeps what was written.
    setBlocks((current) => (current.length ? fitBlocks(id, language, current, free) : templateBlocks(id, language)))
    setCandidate(null)
    setTheme((th) => ({ ...th, color: t.color }))
    if (!headline.trim() && t.example.headline) setHeadline(t.example.headline)
    if (!services.length && t.example.services) setServices(t.example.services)
    setOpen(null)
  }

  async function save(status: MemberPage['status']) {
    setSaving(status)
    setError(null)
    try {
      await onSave({
        id: page?.id,
        slug,
        displayName,
        headline,
        bio,
        photoUrl,
        location,
        links: links.filter((l) => l.url.trim()),
        services: services.filter((s) => s.title.trim()),
        highlights: highlights.filter((h) => h.title.trim()).slice(0, maxHighlights),
        language,
        status,
        template: template || 'professional',
        blocks,
        theme,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save the page.')
    } finally {
      setSaving(null)
    }
  }

  const setBlockData = (id: string, patch: Partial<MemberPageBlockData>) =>
    setBlocks((list) => list.map((b) => (b.id === id ? { ...b, data: { ...(b.data ?? {}), ...patch } } : b)))
  const setLink = (i: number, patch: Partial<MemberPageLink>) => setLinks((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const setService = (i: number, patch: Partial<MemberPageService>) => setServices((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const setHighlight = (i: number, patch: Partial<MemberPageHighlight>) => setHighlights((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const label = (type: MemberPageBlockType) => BLOCK_TYPES.find((t) => t.type === type)?.label ?? type
  // The page as it would be published right now (what the previews show).
  const current = {
    display_name: displayName.trim() || 'Name',
    headline: headline.trim() || null,
    bio: bio.trim() || null,
    photo_url: photoUrl || null,
    location: location.trim() || null,
    links: links.filter((l) => l.url.trim()),
    services: services.filter((s) => s.title.trim()),
    highlights: highlights.filter((h) => h.title.trim()).slice(0, maxHighlights),
    language,
    template: template || null,
    blocks: free ? blocks : blocks.map((b) => ({ ...b, ...(b.type === 'gallery' ? { data: { ...b.data, images: [] } } : {}) })),
    theme: free ? theme : { color: templates.find((t) => t.id === template)?.color },
  }

  function blockEditor(block: MemberPageBlock) {
    const d = block.data ?? {}
    switch (block.type) {
      case 'hero':
        return <p className="text-[13px] text-navy/55">Shows your photo, name, what you do and where — edit them in “Basics” above.</p>
      case 'contact':
        return (
          <div>
            <p className="mb-2 text-[12.5px] text-navy/45">The first button is the big one.</p>
            <div className="space-y-2">
              {links.map((link, i) => (
                <Row key={i} index={i} total={links.length} onMove={(dd) => setLinks((l) => move(l, i, dd))} onRemove={() => setLinks((l) => l.filter((_, j) => j !== i))}>
                  <div className="grid gap-2 sm:grid-cols-[130px_minmax(0,1fr)]">
                    <select value={link.type} onChange={(e) => setLink(i, { type: e.target.value as MemberPageLinkType })} className={INPUT} aria-label="Type">
                      {LINK_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <input value={link.url} onChange={(e) => setLink(i, { url: e.target.value })} className={INPUT} placeholder={LINK_TYPES.find((t) => t.id === link.type)?.placeholder} aria-label="Address" />
                  </div>
                  <input value={link.label} onChange={(e) => setLink(i, { label: e.target.value })} maxLength={40} className={INPUT} placeholder="Button text (optional)" aria-label="Button text" />
                </Row>
              ))}
            </div>
            <Add label="Add a button" disabled={links.length >= 12} onClick={() => setLinks((l) => [...l, { type: l.length === 0 ? 'whatsapp' : 'instagram', label: '', url: '' }])} />
          </div>
        )
      case 'highlights':
        return (
          <div>
            {!free && <p className="mb-2 text-[12.5px] text-navy/45">Your plan shows one featured photo or video.</p>}
            <div className="space-y-2">
              {highlights.slice(0, maxHighlights).map((h, i) => (
                <Row key={i} index={i} total={highlights.length} onMove={free ? (dd) => setHighlights((l) => move(l, i, dd)) : undefined} onRemove={() => setHighlights((l) => l.filter((_, j) => j !== i))}>
                  <input value={h.title} onChange={(e) => setHighlight(i, { title: e.target.value })} maxLength={100} className={INPUT} placeholder="Title" aria-label="Title" />
                  <textarea value={h.description ?? ''} onChange={(e) => setHighlight(i, { description: e.target.value })} rows={2} maxLength={400} className={INPUT} placeholder="Short description" aria-label="Description" />
                  <input value={h.url ?? ''} onChange={(e) => setHighlight(i, { url: e.target.value })} className={INPUT} placeholder="Link (https://…, optional)" aria-label="Link" />
                  {h.url?.trim() && <input value={h.cta ?? ''} onChange={(e) => setHighlight(i, { cta: e.target.value })} maxLength={40} className={INPUT} placeholder="Button text (default: Learn more)" aria-label="Button text" />}
                  <input value={h.video ?? ''} onChange={(e) => setHighlight(i, { video: e.target.value })} className={INPUT} placeholder="Video link — YouTube, TikTok or Instagram (optional)" aria-label="Video link" />
                  {h.video?.trim() && !videoEmbed(h.video) && <p className="text-[12.5px] text-red-500">Use a YouTube, TikTok or Instagram video link.</p>}
                  <div className="flex items-center gap-3">
                    {h.image && <img src={h.image} alt="" className="h-10 w-16 rounded-md object-cover" />}
                    <button type="button" disabled={uploading !== null} onClick={() => pickImage(`h${i}`, 1200, (url) => setHighlight(i, { image: url }))} className={`${SMALL} inline-flex items-center gap-1.5 text-primary hover:bg-bg-soft`}>
                      <ImagePlus size={14} /> {uploading === `h${i}` ? 'Uploading…' : h.image ? 'Change image' : 'Add image'}
                    </button>
                    {h.image && (
                      <button type="button" onClick={() => setHighlight(i, { image: '' })} className={`${SMALL} text-navy/50 hover:bg-bg-soft`}>
                        Remove image
                      </button>
                    )}
                  </div>
                </Row>
              ))}
            </div>
            <Add label="Add featured work" disabled={highlights.length >= maxHighlights} onClick={() => setHighlights((l) => [...l, { title: '', description: '', url: '', image: '', video: '' }])} />
          </div>
        )
      case 'services':
        return (
          <div>
            <div className="space-y-2">
              {services.map((s, i) => (
                <Row key={i} index={i} total={services.length} onMove={(dd) => setServices((l) => move(l, i, dd))} onRemove={() => setServices((l) => l.filter((_, j) => j !== i))}>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px]">
                    <input value={s.title} onChange={(e) => setService(i, { title: e.target.value })} maxLength={100} className={INPUT} placeholder="Service" aria-label="Service" />
                    <input value={s.price ?? ''} onChange={(e) => setService(i, { price: e.target.value })} maxLength={40} className={INPUT} placeholder="Price (optional)" aria-label="Price" />
                  </div>
                  <input value={s.description ?? ''} onChange={(e) => setService(i, { description: e.target.value })} maxLength={400} className={INPUT} placeholder="Short description (optional)" aria-label="Description" />
                </Row>
              ))}
            </div>
            <Add label="Add a service" disabled={services.length >= 12} onClick={() => setServices((l) => [...l, { title: '', description: '', price: '' }])} />
          </div>
        )
      case 'about':
        return <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={6} maxLength={3000} className={INPUT} placeholder="Your story, experience, what makes your work different" aria-label="About" />
      case 'testimonials':
      case 'credentials':
      case 'faq': {
        const items = d.items ?? []
        const [first, second] = block.type === 'faq' ? ['Question', 'Answer'] : block.type === 'credentials' ? ['License or credential', 'Number, issuer, valid until (optional)'] : ['What they said', 'Name']
        return (
          <div className="space-y-2">
            {block.type === 'credentials' && (
              <p className="text-[12.5px] text-navy/50">Shown as you state them, with a note that BGrowth has not verified them. Add only what is true and current.</p>
            )}
            {block.type === 'testimonials' && <p className="text-[12.5px] text-navy/50">Only real words from real clients, with their permission.</p>}
            <input value={d.title ?? ''} onChange={(e) => setBlockData(block.id, { title: e.target.value })} maxLength={120} className={INPUT} placeholder="Section title" aria-label="Section title" />
            {items.map((item, i) => (
              <Row key={i} index={i} total={items.length} onRemove={() => setBlockData(block.id, { items: items.filter((_, j) => j !== i) })}>
                <textarea value={item.title} onChange={(e) => setBlockData(block.id, { items: items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} rows={2} maxLength={300} className={INPUT} placeholder={first} aria-label={first} />
                <input value={item.body ?? ''} onChange={(e) => setBlockData(block.id, { items: items.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} maxLength={600} className={INPUT} placeholder={second} aria-label={second} />
              </Row>
            ))}
            <Add label={block.type === 'faq' ? 'Add a question' : block.type === 'credentials' ? 'Add a credential' : 'Add a testimonial'} disabled={items.length >= 12} onClick={() => setBlockData(block.id, { items: [...items, { title: '', body: '' }] })} />
          </div>
        )
      }
      case 'gallery': {
        const images = d.images ?? []
        if (!free) return <p className="flex items-center gap-2 text-[13px] text-navy/55"><Lock size={14} /> The photo gallery comes with the Enterprise plan.</p>
        return (
          <div className="space-y-2">
            <input value={d.title ?? ''} onChange={(e) => setBlockData(block.id, { title: e.target.value })} maxLength={120} className={INPUT} placeholder="Section title" aria-label="Section title" />
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={src + i} className="relative">
                  <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button type="button" aria-label="Remove photo" onClick={() => setBlockData(block.id, { images: images.filter((_, j) => j !== i) })} className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 text-red-500 shadow-softer">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <Add label={uploading === block.id ? 'Uploading…' : 'Add a photo'} disabled={images.length >= 12 || uploading !== null} onClick={() => pickImage(block.id, 1000, (url) => setBlockData(block.id, { images: [...images, url] }))} />
          </div>
        )
      }
      case 'text':
      case 'area':
      case 'cta':
        return (
          <div className="space-y-2">
            <input value={d.title ?? ''} onChange={(e) => setBlockData(block.id, { title: e.target.value })} maxLength={120} className={INPUT} placeholder="Title" aria-label="Title" />
            <textarea value={d.body ?? ''} onChange={(e) => setBlockData(block.id, { body: e.target.value })} rows={block.type === 'text' ? 5 : 3} maxLength={2000} className={INPUT} placeholder={block.type === 'area' ? 'Cities, counties or regions' : 'Text'} aria-label="Text" />
            {block.type === 'cta' && (
              <input value={d.button ?? ''} onChange={(e) => setBlockData(block.id, { button: e.target.value })} maxLength={40} className={INPUT} placeholder="Button text — opens your first contact button" aria-label="Button text" />
            )}
          </div>
        )
      default:
        return null
    }
  }

  // A new page starts by choosing a model; "change" comes back here. Each
  // model shows a full example (or the person's own content) as it looks on
  // a computer and on a phone; choosing one asks to confirm.
  if (!template || candidate !== null) {
    const hasContent = Boolean(displayName.trim() || blocks.length)
    const sample = (id: string) => {
      const t = templates.find((x) => x.id === id) ?? templates[0]
      const example = templatePreview(t, language)
      if (!hasContent) return example
      return {
        ...current,
        blocks: fitBlocks(t.id, language, blocks, free),
        theme: { ...theme, color: free ? theme.color ?? t.color : t.color },
        template: t.id,
      }
    }
    const chosen = candidate ? templates.find((t) => t.id === candidate) : null
    return (
      <div className={`${CARD} p-6`}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">{chosen ? chosen.name[language] : 'Choose a model'}</h2>
            <p className="mt-1 text-[13.5px] text-navy/55">
              {chosen
                ? chosen.description[language]
                : hasContent
                  ? 'Switching model keeps your texts, photos and contacts.'
                  : 'Each comes with example texts — you replace them with yours.'}
            </p>
          </div>
          {!chosen && (
            <select value={language} onChange={(e) => setLanguage(e.target.value as MemberPage['language'])} className={`${INPUT} max-w-[160px]`} aria-label="Page language">
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          )}
        </div>

        {chosen ? (
          <>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="min-w-0">
                <p className={LABEL}>
                  <Monitor size={13} className="mr-1 inline" /> Computer
                </p>
                <div className="max-h-[560px] overflow-y-auto rounded-xl border border-navy/[0.08]">
                  <ResponsiveFrame width={1280}>
                    <MemberPageView preview page={sample(chosen.id)} />
                  </ResponsiveFrame>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[260px]">
                <p className={LABEL}>
                  <Smartphone size={13} className="mr-1 inline" /> Phone
                </p>
                <div className="max-h-[560px] overflow-y-auto rounded-[1.6rem] border-[6px] border-navy/80">
                  <ResponsiveFrame width={390}>
                    <MemberPageView preview page={sample(chosen.id)} />
                  </ResponsiveFrame>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-navy/[0.06] pt-5">
              <button type="button" onClick={() => setCandidate(template ? '' : null)} className={`${SMALL} inline-flex items-center gap-1.5 text-navy/60 hover:bg-bg-soft`}>
                <ArrowLeft size={14} /> See the other models
              </button>
              <Button type="button" onClick={() => chooseTemplate(chosen.id)} className={SMALL_BUTTON}>
                <Check size={16} /> {template === chosen.id ? 'Keep this model' : 'Use this model'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCandidate(t.id)}
                  className={`group overflow-hidden rounded-2xl border text-left transition-colors hover:border-primary/40 ${template === t.id ? 'border-primary/50 ring-2 ring-primary/15' : 'border-navy/10'}`}
                >
                  <div className="pointer-events-none relative border-b border-navy/[0.06] bg-bg-soft">
                    <ResponsiveFrame width={1280} maxHeight={230}>
                      <MemberPageView preview page={sample(t.id)} />
                    </ResponsiveFrame>
                    <div className="absolute bottom-2 right-2 w-[72px] overflow-hidden rounded-lg border-[3px] border-navy/80 bg-white shadow-softer">
                      <ResponsiveFrame width={390} maxHeight={130}>
                        <MemberPageView preview page={sample(t.id)} />
                      </ResponsiveFrame>
                    </div>
                  </div>
                  <div className="p-4">
                    <span className="flex items-center gap-2 font-semibold text-navy">
                      {t.name[language]}
                      {template === t.id && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Current</span>}
                    </span>
                    <span className="mt-1 block text-[13px] text-navy/55">{t.description[language]}</span>
                    <span className="mt-2 inline-block text-[13px] font-semibold text-primary group-hover:underline">See it on computer and phone →</span>
                  </div>
                </button>
              ))}
            </div>
            {(onCancel || template) && (
              <div className="mt-5 flex justify-end">
                <Button type="button" variant="secondary" onClick={() => (template ? setCandidate(null) : onCancel?.())} className={SMALL_BUTTON}>
                  {template ? 'Back to the editor' : 'Cancel'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className={`${CARD} p-6`}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-navy">{page ? 'Edit page' : 'New page'}</h2>
          <p className="mt-1 text-[13px] text-navy/50">
            Model: {templates.find((t) => t.id === template)?.name[language] ?? template} ·{' '}
            <button type="button" onClick={() => setCandidate('')} className="font-semibold text-primary hover:underline">
              change
            </button>
          </p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} aria-label="Close" className="rounded-lg p-1.5 text-navy/40 hover:bg-bg-soft hover:text-navy">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="min-w-0 space-y-7">
          <section className="space-y-4">
            <span className={LABEL}>Basics</span>
            <div className="flex items-center gap-4">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-bg-soft text-[11px] text-navy/35">Photo</span>
              )}
              <div className="flex flex-col items-start gap-1">
                <button type="button" onClick={() => pickImage('photo', 600, setPhotoUrl)} disabled={uploading !== null} className={`${SMALL} inline-flex items-center gap-1.5 text-primary hover:bg-bg-soft`}>
                  <ImagePlus size={15} /> {uploading === 'photo' ? 'Uploading…' : photoUrl ? 'Change photo' : 'Upload photo'}
                </button>
                {photoUrl && (
                  <button type="button" onClick={() => setPhotoUrl('')} className={`${SMALL} text-navy/50 hover:bg-bg-soft`}>
                    Remove photo
                  </button>
                )}
              </div>
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
                {free ? (
                  <>
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
                  {page?.slug && slug && slug !== page.slug && page.status === 'published' && (
                    <span className="mt-1 block text-[12px] text-navy/45">bgrowth.app/p/{page.slug} will keep working and lead to the new address.</span>
                  )}
                  </>
                ) : (
                  <p className="py-2.5 text-sm text-navy/60">{page?.slug ? `bgrowth.app/p/${page.slug}` : 'Made from your name when you save'}</p>
                )}
              </label>
            </div>
            <label className="block">
              <span className={LABEL}>What you do (one line)</span>
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
            {extra}
          </section>

          {free && (
            <section className="space-y-3">
              <span className={LABEL}>Look</span>
              <div className="flex flex-wrap gap-2">
                {PAGE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    aria-label={c.label}
                    onClick={() => setTheme((t) => ({ ...t, color: c.id }))}
                    className={`h-8 w-8 rounded-full ring-offset-2 transition ${theme.color === c.id ? 'ring-2 ring-navy' : ''}`}
                    style={{ background: `rgb(${c.rgb})` }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                {theme.cover && <img src={theme.cover} alt="" className="h-10 w-20 rounded-md object-cover" />}
                <button type="button" disabled={uploading !== null} onClick={() => pickImage('cover', 1600, (url) => setTheme((t) => ({ ...t, cover: url })))} className={`${SMALL} inline-flex items-center gap-1.5 text-primary hover:bg-bg-soft`}>
                  <ImagePlus size={14} /> {uploading === 'cover' ? 'Uploading…' : theme.cover ? 'Change cover' : 'Add a cover image'}
                </button>
                {theme.cover && (
                  <button type="button" onClick={() => setTheme((t) => ({ ...t, cover: undefined }))} className={`${SMALL} text-navy/50 hover:bg-bg-soft`}>
                    Remove
                  </button>
                )}
              </div>
            </section>
          )}

          <section>
            <span className={LABEL}>Sections {free ? '— move, hide or add' : '— hide the ones you don’t need'}</span>
            <div className="space-y-2">
              {blocks.map((block, i) => {
                const isOpen = open === block.id
                return (
                  <div key={block.id} className={`rounded-xl border ${block.hidden ? 'border-dashed border-navy/15 bg-bg-soft/50' : 'border-navy/[0.08] bg-white'}`}>
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <button type="button" onClick={() => setOpen(isOpen ? null : block.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                        {isOpen ? <ChevronDown size={16} className="shrink-0 text-navy/40" /> : <ChevronRight size={16} className="shrink-0 text-navy/40" />}
                        <span className={`truncate text-[14px] font-semibold ${block.hidden ? 'text-navy/40' : 'text-navy'}`}>{block.data?.title || label(block.type)}</span>
                        {block.data?.title && <span className="hidden text-[12px] text-navy/35 sm:inline">{label(block.type)}</span>}
                      </button>
                      {!free && block.type !== 'hero' && (
                        <button
                          type="button"
                          aria-label={block.hidden ? 'Show' : 'Hide'}
                          title={block.hidden ? 'Show this section' : 'Hide this section'}
                          onClick={() => setBlocks((l) => l.map((b) => (b.id === block.id ? { ...b, hidden: !b.hidden } : b)))}
                          className={`${SMALL} !px-1.5 text-navy/50 hover:bg-bg-soft`}
                        >
                          {block.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                      {free && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => setBlocks((l) => move(l, i, -1))} className={`${SMALL} !px-1.5 text-navy/50 hover:bg-bg-soft`}>
                            <ArrowUp size={14} />
                          </button>
                          <button type="button" aria-label="Move down" disabled={i === blocks.length - 1} onClick={() => setBlocks((l) => move(l, i, 1))} className={`${SMALL} !px-1.5 text-navy/50 hover:bg-bg-soft`}>
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={block.hidden ? 'Show' : 'Hide'}
                            onClick={() => setBlocks((l) => l.map((b) => (b.id === block.id ? { ...b, hidden: !b.hidden } : b)))}
                            className={`${SMALL} !px-1.5 text-navy/50 hover:bg-bg-soft`}
                          >
                            {block.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button type="button" aria-label="Remove section" onClick={() => setBlocks((l) => l.filter((b) => b.id !== block.id))} className={`${SMALL} !px-1.5 text-red-500 hover:bg-red-50`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    {isOpen && <div className="border-t border-navy/[0.06] px-3 py-3">{blockEditor(block)}</div>}
                  </div>
                )
              })}
            </div>
            {free &&
              (adding ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {BLOCK_TYPES.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => {
                        const id = blockId()
                        setBlocks((l) => [...l, { id, type: t.type, ...(['testimonials', 'faq', 'credentials'].includes(t.type) ? { data: { items: [{ title: '', body: '' }] } } : {}) }])
                        setOpen(id)
                        setAdding(false)
                      }}
                      className="rounded-xl border border-navy/10 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-bg-soft"
                    >
                      <span className="block text-[13.5px] font-semibold text-navy">{t.label}</span>
                      <span className="block text-[12px] text-navy/45">{t.hint}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <Add label="Add a section" disabled={blocks.length >= 30} onClick={() => setAdding(true)} />
              ))}
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className={`${LABEL} !mb-0`}>Preview</span>
            <div className="inline-flex rounded-lg border border-navy/10 p-0.5">
              {(['mobile', 'desktop'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold ${device === d ? 'bg-navy text-white' : 'text-navy/55 hover:bg-bg-soft'}`}
                >
                  {d === 'mobile' ? <Smartphone size={13} /> : <Monitor size={13} />} {d === 'mobile' ? 'Phone' : 'Computer'}
                </button>
              ))}
            </div>
          </div>
          <div className={`max-h-[75vh] overflow-y-auto bg-white ${device === 'mobile' ? 'mx-auto max-w-[340px] rounded-[1.6rem] border-[6px] border-navy/80' : 'rounded-2xl border border-navy/[0.08]'}`}>
            <ResponsiveFrame key={device} width={device === 'mobile' ? 390 : 1280}>
              <MemberPageView preview page={current} />
            </ResponsiveFrame>
          </div>
          <p className="mt-2 text-[12px] text-navy/40">This is how visitors will see it. Nothing changes on the site until you publish.</p>
        </aside>
      </div>

      <div className="mt-6 rounded-xl bg-bg-soft px-4 py-3 text-[12.5px] leading-relaxed text-navy/55">
        <p className="font-semibold text-navy/70">Before you publish</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Everything here is public: share only the phone, e-mail and address you want anyone to see.</li>
          <li>Use only photos and videos that are yours or that you have permission to use.</li>
          <li>Testimonials must be real, from real clients, with their permission.</li>
          <li>Licenses and credentials are shown as you state them — keep them true and current.</li>
          <li>Publishing makes the page public. It does not mean BGrowth has checked or verified you, your work, your credentials or your reviews.</li>
        </ul>
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
