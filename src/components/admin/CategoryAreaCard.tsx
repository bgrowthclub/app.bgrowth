import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { AdminCategory } from '../../modules/admin/types'
import { CARD, INPUT, LINK_BUTTON, pillClass } from './styles'

interface Props {
  area: AdminCategory
  areas: AdminCategory[]
  items: AdminCategory[]
  counts: Map<string, number>
  busy: boolean
  onCreate: (name: string, areaId: string) => Promise<boolean>
  onRename: (category: AdminCategory, name: string) => Promise<boolean>
  onMove: (category: AdminCategory, areaId: string) => void
  onDelete: (category: AdminCategory) => void
}

// One Area (a Growth Category) and the categories inside it.
export default function CategoryAreaCard({ area, areas, items, counts, busy, onCreate, onRename, onMove, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const total = (counts.get(area.id) ?? 0) + items.reduce((n, c) => n + (counts.get(c.id) ?? 0), 0)

  async function add(e: FormEvent) {
    e.preventDefault()
    if (await onCreate(newName.trim(), area.id)) {
      setNewName('')
      setAdding(false)
    }
  }

  async function rename(e: FormEvent, category: AdminCategory) {
    e.preventDefault()
    if (await onRename(category, editName.trim())) setEditingId(null)
  }

  return (
    <div className={`${CARD} p-5`}>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="min-w-0 flex-1 truncate font-display text-[15px] font-bold text-navy">{area.name}</h3>
        <span className={pillClass(total ? 'blue' : 'gray')}>
          {total} {total === 1 ? 'Workspace' : 'Workspaces'}
        </span>
      </div>

      {items.length === 0 && !adding && <p className="mb-2 text-[13px] text-navy/40">No categories yet.</p>}

      <ul className="divide-y divide-navy/[0.06]">
        {items.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2 py-2">
            {editingId === c.id ? (
              <form onSubmit={(e) => rename(e, c)} className="flex min-w-0 flex-1 items-center gap-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={`${INPUT} !py-1.5`} autoFocus />
                <button type="submit" disabled={busy || !editName.trim()} aria-label="Save name" className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}>
                  <Check size={15} />
                </button>
                <button type="button" onClick={() => setEditingId(null)} aria-label="Cancel" className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}>
                  <X size={15} />
                </button>
              </form>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-[14px] text-navy">{c.name}</span>
                <span className="text-[12px] text-navy/40">{counts.get(c.id) ?? 0}</span>
                <select
                  value={area.id}
                  disabled={busy}
                  onChange={(e) => onMove(c, e.target.value)}
                  aria-label={`Move ${c.name} to another area`}
                  className="max-w-[9rem] rounded-lg border border-navy/10 bg-white px-2 py-1 text-[12px] text-navy/60"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(c.id)
                    setEditName(c.name)
                  }}
                  aria-label={`Rename ${c.name}`}
                  className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}
                >
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => onDelete(c)} aria-label={`Delete ${c.name}`} className={`${LINK_BUTTON} text-red-500 hover:bg-red-50`}>
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <form onSubmit={add} className="mt-3 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category, e.g. Pet Care"
            className={`${INPUT} !py-1.5`}
            autoFocus
          />
          <button type="submit" disabled={busy || !newName.trim()} className={`${LINK_BUTTON} bg-primary text-white hover:bg-primary/90`}>
            Add
          </button>
          <button type="button" onClick={() => setAdding(false)} className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}>
            Cancel
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={`${LINK_BUTTON} mt-2 inline-flex items-center gap-1.5 text-primary hover:bg-bg-soft`}>
          <Plus size={14} /> Add category
        </button>
      )}
    </div>
  )
}
