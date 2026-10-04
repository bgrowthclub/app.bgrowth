export interface SupportListItem {
  id: string
  title: string
  subtitle: string
  time: string
  // A short highlighted label, e.g. "New reply" or "Waiting".
  badge?: string
  muted?: boolean
}

interface Props {
  items: SupportListItem[]
  activeId: string | null
  onSelect: (id: string) => void
}

function when(iso: string) {
  const d = new Date(iso)
  return new Date().toDateString() === d.toDateString()
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// A list of support conversations — the member's own on /platform/support,
// everyone's in Admin → Support.
export default function SupportConversationList({ items, activeId, onSelect }: Props) {
  return (
    <ul className="divide-y divide-navy/[0.06]">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className={`w-full px-4 py-3.5 text-left transition-colors ${item.id === activeId ? 'bg-bg-soft' : 'hover:bg-bg-soft/60'}`}
          >
            <div className="flex items-baseline gap-2">
              <p className={`min-w-0 flex-1 truncate text-[14px] ${item.muted ? 'text-navy/50' : 'font-semibold text-navy'}`}>
                {item.title}
              </p>
              <span className="shrink-0 text-[11.5px] text-navy/40">{when(item.time)}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[12.5px] text-navy/50">{item.subtitle}</p>
              {item.badge && (
                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-semibold text-white">{item.badge}</span>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
