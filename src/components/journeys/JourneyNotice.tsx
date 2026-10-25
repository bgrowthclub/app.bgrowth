import { Info } from 'lucide-react'

// The notice every Journey carries (written in Studio): general information
// never replaces the rules that apply where the member lives. Plain text.
export default function JourneyNotice({ text, validatedStates = [] }: { text: string; validatedStates?: string[] }) {
  if (!text.trim()) return null
  return (
    <div className="flex gap-3 rounded-xl2 border border-amber-200/70 bg-amber-50/70 p-4 text-[13.5px] leading-relaxed text-navy/70">
      <Info size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
      <div>
        <p className="whitespace-pre-line">{text}</p>
        {validatedStates.length > 0 && (
          <p className="mt-1.5 text-[12.5px] text-navy/50">State-specific steps are shown only for states we have checked: {validatedStates.join(', ')}.</p>
        )}
      </div>
    </div>
  )
}
