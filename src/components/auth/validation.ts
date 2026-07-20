// Shared, framework-agnostic validation helpers for the Authentication
// System — plain functions, no React dependency, reusable by every
// auth form (Login, Register, Forgot Password, Reset Password, Verify Email).

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRequired(value: string, fieldLabel: string): string | undefined {
  if (!value.trim()) return `${fieldLabel} is required.`
  return undefined
}

export function validateEmail(value: string): string | undefined {
  const required = validateRequired(value, 'Email address')
  if (required) return required
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address.'
  return undefined
}

export function validatePasswordsMatch(password: string, confirmPassword: string): string | undefined {
  if (confirmPassword !== password) return 'Passwords do not match.'
  return undefined
}
