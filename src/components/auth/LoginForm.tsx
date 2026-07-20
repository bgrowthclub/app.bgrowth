import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import AuthInput from './AuthInput'
import { validateEmail, validateRequired } from './validation'

interface FormErrors {
  email?: string
  password?: string
}

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    const emailError = validateEmail(email)
    if (emailError) next.email = emailError
    const passwordError = validateRequired(password, 'Password')
    if (passwordError) next.password = passwordError
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
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <AuthInput
        id="login-email"
        label="Email Address"
        type="email"
        autoComplete="email"
        placeholder="you@business.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <AuthInput
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        labelAction={
          <Link to="/forgot-password" className="text-[12.5px] font-semibold text-primary hover:underline">
            Forgot Password?
          </Link>
        }
      />

      <Button type="submit" className="w-full !py-4 !text-[15px]">
        Sign In
      </Button>
    </form>
  )
}
