import { InputHTMLAttributes, ReactNode } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  labelAction?: ReactNode
}

// Shared labeled input for every Authentication System form (Login,
// Register, Forgot Password, Reset Password, Verify Email) — label, error
// message, and aria wiring live here once instead of being rebuilt per page.
export default function AuthInput({ label, error, labelAction, id, className = '', ...rest }: Props) {
  const errorId = `${id}-error`

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-semibold text-navy">
          {label}
        </label>
        {labelAction}
      </div>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-2xl border bg-white px-5 py-4 text-[15px] text-navy placeholder:text-navy/30 transition-all duration-200 ${
          error
            ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.08)]'
            : 'border-navy/10 focus:border-primary/30 focus:shadow-[0_0_0_4px_rgba(16,97,236,0.08)]'
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-[12.5px] font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
