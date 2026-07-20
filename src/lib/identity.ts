// BGrowth Identity — future integration point
// ---------------------------------------------------------------------------
// This is the single place every Authentication System page (Login,
// Register, Forgot Password, Reset Password, Verify Email) will connect
// through once the real BGrowth Identity service exists.
//
// Nothing below is implemented, and nothing here is called from anywhere
// yet. This file only documents the contract each form will eventually
// submit to. Auth forms should reference this file in their submit-handler
// TODO instead of writing an independent, unrelated TODO comment.
//
// TODO(identity): implement each request below, and call it from the
// matching form's submit handler, once the Identity service exists.

// Matches src/components/auth/LoginForm.tsx.
export interface LoginRequest {
  email: string
  password: string
}

// TODO(identity): export async function login(request: LoginRequest): Promise<void> {}

// Matches src/components/auth/RegisterForm.tsx. confirmPassword is a
// client-side-only check (see validatePasswordsMatch) and intentionally
// isn't part of the request.
export interface RegisterRequest {
  fullName: string
  email: string
  password: string
}

// TODO(identity): export async function register(request: RegisterRequest): Promise<void> {}

// Matches src/components/auth/ForgotPasswordForm.tsx. On success, the form
// calls its onSubmitted callback to reveal ForgotPasswordSuccess.
export interface ForgotPasswordRequest {
  email: string
}

// TODO(identity): export async function requestPasswordReset(request: ForgotPasswordRequest): Promise<void> {}

// Matches src/components/auth/ResetPasswordForm.tsx. token comes from the
// reset link's URL (see ResetPasswordPage) and must be validated by the
// Identity service before resetPassword() may run.
export interface ResetPasswordRequest {
  token: string
  password: string
}

// TODO(identity): export async function resetPassword(request: ResetPasswordRequest): Promise<void> {}

// Matches src/pages/VerifyEmailPage.tsx. token comes from the verification
// link's URL and must be validated by the Identity service.
export interface VerifyEmailRequest {
  token: string
}

// TODO(identity): export async function verifyEmail(request: VerifyEmailRequest): Promise<void> {}

// Matches src/components/auth/VerifyEmailFailed.tsx's "Request a new
// verification email" button.
// TODO(identity): export async function resendVerificationEmail(): Promise<void> {}
