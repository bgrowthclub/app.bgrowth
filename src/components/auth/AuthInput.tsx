import { InputHTMLAttributes, ReactNode, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  labelAction?: ReactNode
}

// Shared labeled input for every Authentication System form (Login,
// Register, Forgot Password, Reset Password, Verify Email) — label, error
// message, and aria wiring live here once instead of being rebuilt per page.
// type="password" fields automatically get a show/hide toggle — purely a
// client-side display concern, doesn't touch validation or auth logic.
export default function AuthInput({ label, error, labelAction, id, type, className = '', ...rest }: Props) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const errorId = `${id}-error`

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-semibold text-navy">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-2xl border bg-white px-5 py-3.5 text-sm text-navy placeholder:text-navy/30 transition-colors ${
            isPassword ? 'pr-12' : ''
          } ${
            error
              ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.08)]'
              : 'border-navy/10 focus:border-primary/30 focus:shadow-[0_0_0_4px_rgba(16,97,236,0.08)]'
          } ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-navy/35 transition-colors hover:text-navy/60"
          >
            {visible ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-[12.5px] font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
