import { Plus } from 'lucide-react'
import Popover from './Popover'

// Placeholder only — no quick actions exist yet for any product in the
// ecosystem. This establishes where they'll be surfaced once they do.
export default function QuickActionButton() {
  return (
    <Popover
      panelClassName="w-60 p-2"
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          aria-label="New"
          aria-haspopup="true"
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-xl bg-grad-primary px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-softer transition-transform duration-300 hover:-translate-y-0.5"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">New</span>
        </button>
      )}
    >
      <p className="px-3 py-2.5 text-[13px] text-navy/40">Quick actions are coming soon.</p>
    </Popover>
  )
}
