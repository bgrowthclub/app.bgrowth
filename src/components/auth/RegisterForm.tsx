import { FormEvent, useState } from 'react'
import Button from '../ui/Button'
import AuthInput from './AuthInput'
import { validateEmail, validateRequired, validatePasswordsMatch } from './validation'

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    const fullNameError = validateRequired(fullName, 'Full Name')
    if (fullNameError) next.fullName = fullNameError
    const emailError = validateEmail(email)
    if (emailError) next.email = emailError
    const passwordError = validateRequired(password, 'Password')
    if (passwordError) next.password = passwordError
    const confirmError = validateRequired(confirmPassword, 'Confirm Password') || validatePasswordsMatch(password, confirmPassword)
    if (confirmError) next.confirmPassword = confirmError
    return next
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    // TODO(identity): see src/lib/identity.ts — the single shared
    // integration point every Authentication System page connects through.
    // Not implemented yet; this intentionally does nothing further —
    // no redirect, no fake result.
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <AuthInput
        id="register-full-name"
        label="Full Name"
        type="text"
        autoComplete="name"
        placeholder="Jane Cooper"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
      />

      <AuthInput
        id="register-email"
        label="Email Address"
        type="email"
        autoComplete="email"
        placeholder="you@business.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <AuthInput
        id="register-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <AuthInput
        id="register-confirm-password"
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
      />

      <Button type="submit" className="w-full">
        Create Account
      </Button>
    </form>
  )
}
