import { Lock, Plus } from 'lucide-react'
import { useComingSoonModal } from './ComingSoonModalProvider'

// Placeholder — no quick actions exist yet for any product in the ecosystem
// (locked, "coming soon" since Sprint 110). This keeps their future place.
export default function QuickActionButton() {
  const { openComingSoon } = useComingSoonModal()
  return (
    <button
      type="button"
      onClick={openComingSoon}
      aria-label="New — coming soon"
      title="New — coming soon"
      className="inline-flex items-center gap-1.5 rounded-xl bg-grad-primary px-3.5 py-2 text-[12.5px] font-semibold text-white opacity-60 shadow-softer transition-opacity duration-300 hover:opacity-80"
    >
      <Plus size={15} />
      <span className="hidden sm:inline">New</span>
      <Lock size={11} className="opacity-80" />
    </button>
  )
}
