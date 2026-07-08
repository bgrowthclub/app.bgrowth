import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'

// Placeholder only — this repo has one light theme (tokens.css); there is no
// dark-mode token set to switch to yet. Toggling only swaps the icon so the
// affordance is visible where the real theme system will attach later.
export default function ThemeToggleButton() {
  const [dark, setDark] = useState(false)

  return (
    <button
      onClick={() => setDark((v) => !v)}
      aria-label="Toggle theme (coming soon)"
      title="Theme — coming soon"
      className="grid h-9 w-9 place-items-center rounded-full text-navy/50 transition-colors hover:bg-bg-soft hover:text-navy"
    >
      {dark ? <Moon size={17} strokeWidth={2} /> : <Sun size={17} strokeWidth={2} />}
    </button>
  )
}
