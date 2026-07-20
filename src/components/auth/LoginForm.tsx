import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import AuthInput from './AuthInput'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    if (!email.trim()) next.email = 'Email address is required.'
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    return next
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    // TODO: no Identity Authentication API exists yet. Once it does, submit
    // { email, password } here and handle the real success/error response.
    // This intentionally does nothing further — no redirect, no fake result.
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
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

      <Button type="submit" className="w-full">
        Sign In
      </Button>
    </form>
  )
}
