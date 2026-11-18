import { useState } from 'react'
import { fitPageHex, isHexColor } from '../../modules/find/memberPageTemplates'
import type { PageColorRole } from '../../modules/find/memberPageTemplates'

// "More colors" next to a row of swatches (15/11/2026, the owner's decision):
// the device's own color picker, so any color — at no weight to the page.
// What comes back is made readable first (fitPageHex): a color too light for
// white text, or too dark for a background, is nudged until it reads well,
// and the swatch says so.

const LABEL: Record<PageColorRole, string> = {
  primary: 'More colors',
  dark: 'More dark colors',
  background: 'More background colors',
}

// `fit` (18/11/2026, free colors): the page's own rule instead of the role's —
// a free background is kept as picked, a text color is made readable on the
// page's background. `label` names it.
export default function CustomColorSwatch({
  value,
  role,
  onPick,
  fit,
  label,
}: {
  value: string | undefined
  role: PageColorRole
  onPick: (hex: string) => void
  fit?: (hex: string) => string
  label?: string
}) {
  const [adjusted, setAdjusted] = useState(false)
  const own = isHexColor(value) ? value : null
  return (
    <span className="inline-flex items-center gap-2">
      <label
        title={label ?? LABEL[role]}
        className={`relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-navy/15 ring-offset-2 transition ${own ? 'ring-2 ring-navy' : ''}`}
        style={{ background: own ?? 'conic-gradient(#ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)' }}
      >
        <span className="sr-only">{label ?? LABEL[role]}</span>
        <input
          type="color"
          value={own ?? (role === 'background' ? '#f5f5f5' : role === 'dark' ? '#1f2933' : '#1061ec')}
          onChange={(e) => {
            const picked = e.target.value.toLowerCase()
            const fitted = fit ? fit(picked) : fitPageHex(picked, role)
            setAdjusted(fitted !== picked)
            onPick(fitted)
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      {own && adjusted && <span className="text-[11.5px] text-navy/45">Adjusted a little so it stays easy to read</span>}
    </span>
  )
}
