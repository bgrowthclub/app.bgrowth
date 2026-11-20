import { ChevronDown, Info } from 'lucide-react'

// The Journey's notice (written in Studio) as one line that opens (20/11/2026,
// the owner's design). The full text is always one click away; nothing is
// added to it. Replaced JourneyNotice on both Journey pages.
export default function JourneyNoticeBar({ text, validatedStates = [] }: { text: string; validatedStates?: string[] }) {
  const clean = text.trim()
  if (!clean) return null
  const first = clean.split('\n')[0]
  return (
    <details className="group rounded-[20px] border border-navy/[0.07] bg-white shadow-softer">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <Info size={18} className="shrink-0 text-navy/60" aria-hidden />
        <span className="shrink-0 text-[14px] font-bold text-navy">Important notice</span>
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-navy/55 group-open:invisible">{first}</span>
        <ChevronDown size={18} className="shrink-0 text-navy/40 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-navy/[0.06] px-5 py-4 text-[13.5px] leading-relaxed text-navy/70">
        <p className="whitespace-pre-line">{clean}</p>
        {validatedStates.length > 0 && (
          <p className="mt-1.5 text-[12.5px] text-navy/50">State-specific steps are shown only for states we have checked: {validatedStates.join(', ')}.</p>
        )}
      </div>
    </details>
  )
}
