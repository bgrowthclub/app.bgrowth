import { FormEvent, useState } from 'react'
import Button from '../ui/Button'
import AuthInput from './AuthInput'
import { validateEmail } from './validation'

interface FormErrors {
  email?: string
}

interface Props {
  onSubmitted: () => void
}

export default function ForgotPasswordForm({ onSubmitted }: Props) {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    const emailError = validateEmail(email)
    if (emailError) next.email = emailError
    return next
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    // TODO(identity): see src/lib/identity.ts — the single shared
    // integration point every Authentication System page connects through.
    // Not implemented yet. Once requestPasswordReset() exists and resolves
    // successfully, call onSubmitted() here to reveal the confirmation view
    // — until then this intentionally does nothing further, so onSubmitted
    // is never invoked and that view stays unreachable.
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <AuthInput
        id="forgot-password-email"
        label="Email Address"
        type="email"
        autoComplete="email"
        placeholder="you@business.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <Button type="submit" className="w-full">
        Send Reset Link
      </Button>
    </form>
  )
}
