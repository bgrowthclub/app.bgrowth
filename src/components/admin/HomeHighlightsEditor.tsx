import { useState } from 'react'
import { ArrowDown, ArrowUp, X } from 'lucide-react'
import Button from '../ui/Button'
import { CARD, INPUT, LINK_BUTTON, SMALL_BUTTON } from './styles'
import type { AdminSiteProduct } from '../../modules/admin/types'

const KIND: Record<string, string> = { workspace: 'Workspace', calculator: 'Calculator', bundle: 'Bundle' }
const MAX = 12

interface Props {
  products: AdminSiteProduct[]
  initial: string[]
  onSave: (ids: string[]) => Promise<void>
}

// Which products the Home highlights, in order (Admin → Site). Empty = the
// Home shows the latest products, as before.
export default function HomeHighlightsEditor({ products, initial, onSave }: Props) {
  const [ids, setIds] = useState<string[]>(initial)
  const [adding, setAdding] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const byId = new Map(products.map((p) => [p.id, p]))
  const available = products.filter((p) => !ids.includes(p.id))
  const changed = ids.join() !== initial.join()

  const move = (i: number, dir: -1 | 1) =>
    setIds((list) => {
      const next = [...list]
      ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
      return next
    })

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await onSave(ids)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save the highlights.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={`${CARD} space-y-4 p-6`}>
      <div>
        <h2 className="font-display text-lg font-bold text-navy">Home highlights</h2>
        <p className="mt-0.5 text-[13.5px] text-navy/55">
          The products in the “Start Here” row of the Home, in this order. Leave it empty to show the latest products.
        </p>
      </div>

      {ids.length === 0 ? (
        <p className="rounded-xl bg-bg-soft px-4 py-3 text-[13.5px] text-navy/55">No highlights — the Home shows the latest products.</p>
      ) : (
        <ol className="divide-y divide-navy/[0.06] rounded-xl border border-navy/[0.06]">
          {ids.map((id, i) => {
            const p = byId.get(id)
            return (
              <li key={id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-5 text-[12px] font-bold text-navy/35">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-navy">{p?.name ?? 'Product no longer published'}</p>
                  <p className="text-[12px] text-navy/45">{p ? KIND[p.content_type] ?? p.content_type : 'It will be skipped'}</p>
                </div>
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className={`${LINK_BUTTON} !px-1.5 text-navy/50 hover:bg-bg-soft`}>
                  <ArrowUp size={15} />
                </button>
                <button type="button" aria-label="Move down" disabled={i === ids.length - 1} onClick={() => move(i, 1)} className={`${LINK_BUTTON} !px-1.5 text-navy/50 hover:bg-bg-soft`}>
                  <ArrowDown size={15} />
                </button>
                <button type="button" aria-label="Remove" onClick={() => setIds((list) => list.filter((x) => x !== id))} className={`${LINK_BUTTON} !px-1.5 text-red-500 hover:bg-red-50`}>
                  <X size={15} />
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {ids.length < MAX && available.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Product to add" value={adding} onChange={(e) => setAdding(e.target.value)} className={`${INPUT} sm:max-w-md`}>
            <option value="">Add a product…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({KIND[p.content_type] ?? p.content_type})
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            disabled={!adding}
            onClick={() => {
              setIds((list) => [...list, adding])
              setAdding('')
              setSaved(false)
            }}
            className={SMALL_BUTTON}
          >
            Add
          </Button>
        </div>
      )}

      {error && <p className="text-[13.5px] text-red-500">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="button" disabled={saving || !changed} onClick={() => void save()} className={SMALL_BUTTON}>
          {saving ? 'Saving…' : 'Save highlights'}
        </Button>
        {saved && !changed && <span className="text-[13px] font-medium text-emerald-600">Saved — the Home shows them now.</span>}
      </div>
    </section>
  )
}
