import { FormEvent, useState } from 'react'
import Button from '../ui/Button'
import AuthInput from './AuthInput'
import { validateRequired, validatePasswordsMatch } from './validation'

interface FormErrors {
  password?: string
  confirmPassword?: string
}

interface Props {
  token: string | null
  onSubmitted: () => void
}

export default function ResetPasswordForm({ token, onSubmitted }: Props) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    const passwordError = validateRequired(password, 'New Password')
    if (passwordError) next.password = passwordError
    const confirmError = validateRequired(confirmPassword, 'Confirm New Password') || validatePasswordsMatch(password, confirmPassword)
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
    // Not implemented yet. The Identity service must validate `token`
    // (captured from the URL by ResetPasswordPage, not validated here)
    // before resetPassword() may run. Once resetPassword() exists and
    // resolves successfully, call onSubmitted() here to reveal the
    // confirmation view — until then this intentionally does nothing
    // further, so onSubmitted is never invoked and that view stays
    // unreachable.
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <AuthInput
        id="reset-password-new"
        label="New Password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <AuthInput
        id="reset-password-confirm"
        label="Confirm New Password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
      />

      <Button type="submit" className="w-full">
        Reset Password
      </Button>
    </form>
  )
}
