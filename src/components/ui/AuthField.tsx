import { ReactNode, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  id: string
  label: string
  type: 'text' | 'email' | 'password'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  // Rendered on the right of the label row — e.g. Login's "Forgot password?".
  labelAside?: ReactNode
}

// One labelled input for the auth pages (ui/AuthCard). A password field
// gets a show/hide toggle; every other type is a plain input. Generic —
// no business meaning, no identity logic: each page still owns its state
// and its useIdentity() call.
export default function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  labelAside,
}: Props) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-[14px] font-medium text-navy">
          {label}
        </label>
        {labelAside && <div className="text-[14px]">{labelAside}</div>}
      </div>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          required={required}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border border-navy/10 bg-bg-soft px-4 py-3.5 text-[15px] text-navy placeholder:text-navy/35 transition-colors focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 ${isPassword ? 'pr-12' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-navy/45 hover:text-navy"
          >
            {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  )
}
