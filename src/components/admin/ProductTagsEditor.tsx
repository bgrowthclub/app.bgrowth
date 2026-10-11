import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { AdminTag } from '../../modules/admin/types'

// Same key rule as the server (api/admin.ts tagSlug).
export function tagKey(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface Props {
  tags: AdminTag[]
  all: AdminTag[]
  busy: boolean
  onChange: (names: string[]) => void
}

// One product's tags in Admin → Catalog → Tags: remove with ×, add by
// typing (suggestions from the list; Enter adds a new one).
export default function ProductTagsEditor({ tags, all, busy, onChange }: Props) {
  const [text, setText] = useState('')
  const chosen = useMemo(() => new Set(tags.map((t) => t.slug)), [tags])
  const key = tagKey(text)
  const suggestions = key ? all.filter((t) => !chosen.has(t.slug) && (t.slug.includes(key) || t.name.toLowerCase().includes(text.toLowerCase()))).slice(0, 8) : []
  const names = tags.map((t) => t.name)

  const add = (name: string) => {
    const clean = name.trim()
    if (!tagKey(clean) || chosen.has(tagKey(clean))) return setText('')
    onChange([...names, clean])
    setText('')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-2.5 py-1 text-[12px] font-semibold text-primary">
          {t.name}
          <button type="button" disabled={busy} aria-label={`Remove ${t.name}`} onClick={() => onChange(names.filter((n) => n !== t.name))} className="opacity-60 hover:opacity-100">
            <X size={12} />
          </button>
        </span>
      ))}
      <div className="relative">
        <input
          value={text}
          disabled={busy || tags.length >= 20}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add(suggestions[0] && suggestions[0].slug === key ? suggestions[0].name : text)
            }
          }}
          placeholder="+ tag"
          aria-label="Add a tag"
          className="w-28 rounded-full border border-dashed border-navy/15 bg-white px-3 py-1 text-[12px] text-navy outline-none focus:w-44 focus:border-primary/40"
        />
        {suggestions.length > 0 && (
          <ul className="absolute left-0 z-20 mt-1 max-h-56 w-56 overflow-y-auto rounded-xl border border-navy/10 bg-white py-1 shadow-soft">
            {suggestions.map((t) => (
              <li key={t.id}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(t.name)} className="block w-full px-3 py-1.5 text-left text-[13px] text-navy hover:bg-bg-soft">
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
