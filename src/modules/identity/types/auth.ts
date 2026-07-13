export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegistrationData {
  email: string
  password: string
  displayName: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmation {
  token: string
  newPassword: string
}

export interface EmailVerification {
  token: string
  email: string
  verifiedAt?: string
}
