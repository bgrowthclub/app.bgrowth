import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Eye, Monitor, Smartphone, Trash2, Upload } from 'lucide-react'
import { CARD, LINK_BUTTON, SMALL_BUTTON, pillClass } from './styles'
import Button from '../ui/Button'
import ResponsiveFrame from '../ui/ResponsiveFrame'
import MemberPageView from '../find/MemberPageView'
import { adminService } from '../../modules/admin/adminService'
import { importedTemplate } from '../../modules/find/importedModels'
import type { ImportedPageModel } from '../../modules/find/importedModels'
import { templatePreview } from '../../modules/find/memberPageTemplates'
import { photoDataUrl, readModelPackage, withPhotoUrls } from '../../modules/find/modelPackage'
import type { PackageModel, ReadPackage } from '../../modules/find/modelPackage'

// Admin → Pages → Imported models (16/11/2026, plan item 23): a page package
// (.zip from ChatGPT — contract in the Plano BGrowth Pages doc) is read here,
// checked and previewed BEFORE anything is saved; "Save as draft" uploads its
// photos once (showcase only) and keeps the model as a draft; "Publish" puts
// it in every editor's model list. A model some page uses can't go back to
// draft or be deleted — retire it in "Page models" instead.

type Lang = 'en' | 'pt'

function Preview({ model, lang }: { model: Omit<ImportedPageModel, 'status'>; lang: Lang }) {
  const page = { ...templatePreview(importedTemplate({ ...model, status: 'draft' }, lang), lang), template: model.look }
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="min-w-0">
        <p className="mb-1.5 text-[12px] font-semibold text-navy/50">
          <Monitor size={13} className="mr-1 inline" /> Computer
        </p>
        <div className="max-h-[520px] overflow-y-auto rounded-xl border border-navy/[0.08]">
          <ResponsiveFrame width={1280}>
            <MemberPageView preview page={page} />
          </ResponsiveFrame>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[240px]">
        <p className="mb-1.5 text-[12px] font-semibold text-navy/50">
          <Smartphone size={13} className="mr-1 inline" /> Phone
        </p>
        <div className="max-h-[520px] overflow-y-auto rounded-[1.6rem] border-[6px] border-navy/80">
          <ResponsiveFrame width={390}>
            <MemberPageView preview page={page} />
          </ResponsiveFrame>
        </div>
      </div>
    </div>
  )
}

function LangSwitch({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <span className="inline-flex rounded-lg border border-navy/10 p-0.5 text-[12.5px] font-semibold">
      {(['en', 'pt'] as const).map((l) => (
        <button key={l} type="button" onClick={() => onChange(l)} className={`rounded-md px-2.5 py-1 ${value === l ? 'bg-navy text-white' : 'text-navy/55'}`}>
          {l === 'en' ? 'English' : 'Português'}
        </button>
      ))}
    </span>
  )
}

export default function ImportedModelsPanel() {
  const [open, setOpen] = useState(false)
  const [models, setModels] = useState<ImportedPageModel[] | null>(null)
  const [pkg, setPkg] = useState<ReadPackage | null>(null)
  const [lang, setLang] = useState<Lang>('en')
  const [showing, setShowing] = useState<string | null>(null)
  const [replace, setReplace] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const input = useRef<HTMLInputElement>(null)
  // Publishing asks which plans get the model (16/11/2026, the owner's choice).
  const [plans, setPlans] = useState<{ id: string; name: string }[] | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string[]>([])

  async function startPublish(id: string) {
    setError('')
    let list = plans
    if (!list) {
      try {
        const res = await adminService.listPlans()
        list = res.plans
          .filter((p) => p.status !== 'disabled' && (p.entitlements?.memberPage === 'partial' || p.entitlements?.memberPage === 'full'))
          .sort((a, b) => a.rank - b.rank)
          .map((p) => ({ id: p.id, name: p.name }))
        setPlans(list)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load the plans.')
        return
      }
    }
    setChosen(list.map((p) => p.id))
    setPublishing(id)
  }

  const load = () =>
    adminService
      .listPageModels()
      .then(setModels)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the models.'))

  useEffect(() => {
    if (open && !models) void load()
  }, [open])

  async function pick(file: File | undefined) {
    if (!file) return
    setError('')
    setNotice('')
    setShowing(null)
    setPkg(await readModelPackage(file))
    if (input.current) input.current.value = ''
  }

  async function run(key: string, fn: () => Promise<string>) {
    setBusy(key)
    setError('')
    setNotice('')
    try {
      setNotice(await fn())
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy('')
    }
  }

  // Upload the photos one by one, then save the model with their addresses.
  const saveDraft = (p: PackageModel) =>
    run(`save:${p.model.id}`, async () => {
      const batch = Date.now().toString(36)
      const urls: Record<string, string> = {}
      for (const photo of p.photos) urls[photo.name] = await adminService.uploadPageModelImage(p.model.id, photo.name, await photoDataUrl(photo), batch)
      const res = await adminService.savePageModel(withPhotoUrls(p.model, (n) => urls[n]), Boolean(replace[p.model.id]))
      // The package box closes once nothing is left in it to save.
      setPkg((cur) => {
        const left = cur ? cur.models.filter((x) => x.model.id !== p.model.id) : []
        return cur && left.length ? { ...cur, models: left } : null
      })
      return `“${res.model.name.en}” saved as a draft. Check it below, then publish.`
    })

  const exists = (id: string) => Boolean(models?.some((m) => m.id === id))

  return (
    <div className={`${CARD} p-5`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span>
          <span className="block font-display text-[16px] font-bold text-navy">Imported models</span>
          <span className="block text-[13px] text-navy/50">Add page models from a package (.zip) — check, preview, then publish.</span>
        </span>
        {open ? <ChevronUp size={18} className="text-navy/40" /> : <ChevronDown size={18} className="text-navy/40" />}
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13.5px] text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <input ref={input} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
            <Button type="button" onClick={() => input.current?.click()} className={SMALL_BUTTON}>
              <Upload size={15} /> Import a package (.zip)
            </Button>
            <LangSwitch value={lang} onChange={setLang} />
            <span className="text-[12.5px] text-navy/45">The model’s photos only show in previews and the model gallery — never on a member’s page.</span>
          </div>

          {pkg && (
            <div className="space-y-3 rounded-xl border border-navy/[0.08] bg-bg-soft/60 p-4">
              <p className="text-[13px] font-semibold text-navy">Package read — nothing saved yet</p>
              {pkg.errors.map((e) => (
                <p key={e} className="text-[13px] text-red-600">
                  {e}
                </p>
              ))}
              {pkg.models.map((p) => {
                const blocked = p.errors.length > 0 || pkg.errors.length > 0 || (exists(p.model.id) && !replace[p.model.id])
                const local = withPhotoUrls(p.model, (n) => p.photos.find((x) => x.name === n)?.url)
                return (
                  <div key={p.model.id} className="rounded-xl border border-navy/[0.08] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-[15px] font-bold text-navy">
                          {p.model.name[lang] || p.model.id} <span className="text-[12.5px] font-normal text-navy/45">· {p.model.id} · look {p.model.look}</span>
                        </p>
                        <p className="text-[12.5px] text-navy/55">
                          {p.model.blocks.length} sections · {p.photos.length} photos · {p.model.categories.join(', ') || 'no category'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setShowing(showing === `pkg:${p.model.id}` ? null : `pkg:${p.model.id}`)} className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}>
                          <Eye size={14} /> Preview
                        </button>
                        <Button type="button" disabled={blocked || Boolean(busy)} onClick={() => void saveDraft(p)} className={SMALL_BUTTON}>
                          {busy === `save:${p.model.id}` ? 'Uploading…' : 'Save as draft'}
                        </Button>
                      </div>
                    </div>
                    {exists(p.model.id) && (
                      <label className="mt-2 flex items-center gap-2 text-[13px] text-amber-700">
                        <input type="checkbox" checked={Boolean(replace[p.model.id])} onChange={(e) => setReplace({ ...replace, [p.model.id]: e.target.checked })} />
                        A model “{p.model.id}” already exists — replace it (pages on it keep working)
                      </label>
                    )}
                    {p.errors.map((e) => (
                      <p key={e} className="mt-1.5 text-[13px] text-red-600">
                        {e}
                      </p>
                    ))}
                    {p.warnings.map((w) => (
                      <p key={w} className="mt-1.5 flex items-start gap-1.5 text-[12.5px] text-amber-700">
                        <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {w}
                      </p>
                    ))}
                    {p.photos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.photos.map((ph) => (
                          <img key={ph.name} src={ph.url} alt={ph.name} title={ph.name} className="h-14 w-20 rounded-md object-cover" />
                        ))}
                      </div>
                    )}
                    {showing === `pkg:${p.model.id}` && p.errors.length === 0 && (
                      <div className="mt-4">
                        <Preview model={local} lang={lang} />
                      </div>
                    )}
                  </div>
                )
              })}
              <button type="button" onClick={() => setPkg(null)} className={`${LINK_BUTTON} text-navy/50 hover:bg-white`}>
                Close the package
              </button>
            </div>
          )}

          {!models && !error && <p className="text-[13.5px] text-navy/40">Loading…</p>}
          {models && models.length === 0 && !pkg && <p className="text-[13.5px] text-navy/45">No imported models yet.</p>}
          {models?.map((m) => (
            <div key={m.id} className="rounded-xl border border-navy/[0.08] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-bold text-navy">
                    {m.name[lang]} <span className="text-[12.5px] font-normal text-navy/45">· {m.id} · look {m.look}</span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[12.5px] text-navy/55">
                    <span className={pillClass(m.status === 'live' ? 'green' : 'gray')}>{m.status === 'live' ? 'Published' : 'Draft'}</span>
                    {m.categories.join(', ') || 'no category'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setShowing(showing === m.id ? null : m.id)} className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}>
                    <Eye size={14} /> Preview
                  </button>
                  <Button
                    type="button"
                    variant={m.status === 'live' ? 'secondary' : undefined}
                    disabled={Boolean(busy)}
                    onClick={() =>
                      m.status === 'live'
                        ? void run(`status:${m.id}`, async () => (await adminService.setPageModelStatus(m.id, 'draft'), `“${m.name.en}” is a draft again.`))
                        : void startPublish(m.id)
                    }
                    className={SMALL_BUTTON}
                  >
                    {m.status === 'live' ? 'Back to draft' : 'Publish'}
                  </Button>
                  {m.status === 'live' && (
                    <button type="button" disabled={Boolean(busy)} onClick={() => void startPublish(m.id)} className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}>
                      Plans
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Delete ${m.name.en}`}
                    title={`Delete ${m.name.en}`}
                    disabled={Boolean(busy)}
                    onClick={() => {
                      if (window.confirm(`Delete the model “${m.name.en}”? Its photos stay stored.`)) void run(`del:${m.id}`, async () => (await adminService.deletePageModel(m.id), `“${m.name.en}” deleted.`))
                    }}
                    className={`${LINK_BUTTON} text-red-500 hover:bg-red-50`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {publishing === m.id && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                  <p className="text-[13.5px] font-semibold text-navy">Which plans get this model?</p>
                  <p className="mt-0.5 text-[12.5px] text-navy/50">Plans left unticked show it locked (“Higher plan”). Also editable in Admin → Plans → Page.</p>
                  {plans && plans.length === 0 && <p className="mt-2 text-[13px] text-navy/50">No plan has a page yet — the model goes to every page the team makes.</p>}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                    {plans?.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-[13.5px] text-navy/75">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={chosen.includes(p.id)}
                          onChange={(e) => setChosen(e.target.checked ? [...chosen, p.id] : chosen.filter((x) => x !== p.id))}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() =>
                        void run(`status:${m.id}`, async () => {
                          const res = await adminService.setPageModelStatus(m.id, 'live', chosen)
                          setPublishing(null)
                          return `“${m.name.en}” is published${res.plans?.length ? ` for ${res.plans.join(', ')}` : ''} — reload the editor to see it.`
                        })
                      }
                      className={SMALL_BUTTON}
                    >
                      {m.status === 'live' ? 'Save plans' : 'Publish'}
                    </Button>
                    <button type="button" onClick={() => setPublishing(null)} className={`${LINK_BUTTON} text-navy/50 hover:bg-white`}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {showing === m.id && (
                <div className="mt-4">
                  <Preview model={m} lang={lang} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
