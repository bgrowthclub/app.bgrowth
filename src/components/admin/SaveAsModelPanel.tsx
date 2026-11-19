import { useState } from 'react'
import Button from '../ui/Button'
import { CARD, INPUT, SMALL_BUTTON } from './styles'
import { adminService } from '../../modules/admin/adminService'
import { modelColorOf, modelFromPage, modelFromPageProblem } from '../../modules/find/modelFromPage'
import { pageSkin } from '../../modules/find/memberPageTemplates'
import type { MemberPage } from '../../modules/find/types'

const LABEL = 'mb-1 block text-[12px] font-semibold uppercase tracking-wide text-navy/40'
const slugOf = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

// Admin → Pages → a page → "Save as model" (19/11/2026): the page becomes a
// page model, saved as a DRAFT in Imported models, where it is published
// with its plans. See modules/find/modelFromPage.ts.
export default function SaveAsModelPanel({ page, onClose, onSaved }: { page: MemberPage; onClose: () => void; onSaved: (name: string) => void }) {
  const [id, setId] = useState(slugOf(page.display_name))
  const [nameEn, setNameEn] = useState(page.language === 'en' ? page.display_name : '')
  const [namePt, setNamePt] = useState(page.language === 'pt' ? page.display_name : '')
  const [descEn, setDescEn] = useState('')
  const [descPt, setDescPt] = useState('')
  const [category, setCategory] = useState('')
  const [replace, setReplace] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const problem = modelFromPageProblem(page)
  const { color, custom } = modelColorOf(page)

  async function save() {
    setError(null)
    if (!nameEn.trim() && !namePt.trim()) return setError('Write the model’s name.')
    if (!descEn.trim() && !descPt.trim()) return setError('Write one line saying who the model is for.')
    setBusy(true)
    try {
      const name = { en: nameEn.trim() || namePt.trim(), pt: namePt.trim() || nameEn.trim() }
      const description = { en: descEn.trim() || descPt.trim(), pt: descPt.trim() || descEn.trim() }
      const model = modelFromPage(page, { id, name, description, category })
      await adminService.savePageModel(model, replace)
      onSaved(name.en)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t save the model.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`${CARD} space-y-4 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[16px] font-bold text-navy">Save “{page.display_name}” as a page model</h3>
          <p className="mt-1 text-[13px] text-navy/55">
            It becomes a draft in <strong>Imported models</strong> (look: {pageSkin(page.template) ?? '—'}, color: {color}). Publish it there and choose its plans. Texts are copied as written, in the page’s language, to both languages; the photos are the model’s showcase only.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-[13px] font-semibold text-navy/50 hover:text-navy">
          Close
        </button>
      </div>
      {problem ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] text-amber-700">{problem}</p>
      ) : (
        <>
          {custom && <p className="rounded-xl bg-bg-soft px-4 py-3 text-[12.5px] text-navy/60">The page uses its own color; a model keeps one of the ready colors, so it gets {color}.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Model name (English)</span>
              <input className={INPUT} value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Modern Restaurant" />
            </label>
            <label className="block">
              <span className={LABEL}>Model name (Português)</span>
              <input className={INPUT} value={namePt} onChange={(e) => setNamePt(e.target.value)} placeholder="Restaurante contemporâneo" />
            </label>
            <label className="block">
              <span className={LABEL}>Who it’s for (English)</span>
              <input className={INPUT} value={descEn} onChange={(e) => setDescEn(e.target.value)} placeholder="A restaurant page to show dishes and bring guests in" />
            </label>
            <label className="block">
              <span className={LABEL}>Who it’s for (Português)</span>
              <input className={INPUT} value={descPt} onChange={(e) => setDescPt(e.target.value)} placeholder="Página de restaurante para mostrar pratos e atrair clientes" />
            </label>
            <label className="block">
              <span className={LABEL}>Category</span>
              <input className={INPUT} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Restaurants & Food" />
            </label>
            <label className="block">
              <span className={LABEL}>Model id</span>
              <input className={INPUT} value={id} onChange={(e) => setId(slugOf(e.target.value))} />
            </label>
          </div>
          <label className="flex items-start gap-2 text-[13px] text-navy/70">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            <span>If a model with this id exists, replace it (pages already on it keep working)</span>
          </label>
          {error && <p className="text-[13px] text-red-500">{error}</p>}
          <Button type="button" onClick={() => void save()} disabled={busy} className={SMALL_BUTTON}>
            {busy ? 'Saving…' : 'Save as model (draft)'}
          </Button>
        </>
      )}
    </div>
  )
}
