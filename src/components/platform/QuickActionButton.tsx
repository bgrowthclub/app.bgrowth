import { useState } from 'react'
import { Plus } from 'lucide-react'

// Placeholder only — no quick actions exist yet for any product in the
// ecosystem. This establishes where they'll be surfaced once they do.
export default function QuickActionButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-grad-primary px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-softer transition-transform duration-300 hover:-translate-y-0.5"
      >
        <Plus size={15} />
        <span className="hidden sm:inline">New</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl2 border border-navy/[0.06] bg-white p-2 shadow-glow">
            <p className="px-3 py-2.5 text-[13px] text-navy/40">Quick actions are coming soon.</p>
          </div>
        </>
      )}
    </div>
  )
}
