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
