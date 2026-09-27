import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { isAuthApiError } from '@supabase/supabase-js'
import type { Session } from '@supabase/supabase-js'
import type { User } from '../types/user'
import type { LoginCredentials, RegistrationData } from '../types/auth'
import { IdentityContext } from '../IdentityContext'
import type { IdentityStatus } from '../IdentityContext'
import { supabase } from './supabaseClient'
import { loadPortalMember } from './portalMember'

const NOT_CONFIGURED = 'Sign-in isn’t available right now. Please try again later.'

// Supabase's own error messages are technical — these are the ones a member
// can actually hit, reworded. Anything else falls back to its own message.
function friendlyError(error: unknown): string {
  if (isAuthApiError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'Email or password is incorrect.'
      case 'email_not_confirmed':
        return 'Confirm your email first — open the verification link we sent you.'
      case 'user_already_exists':
      case 'email_exists':
        return 'An account with this email already exists. Sign in instead.'
      case 'weak_password':
        return 'Choose a stronger password (at least 8 characters).'
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return 'Too many attempts. Wait a minute and try again.'
      case 'same_password':
        return 'Choose a password different from your current one.'
    }
  }
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Please try again.'
}

// Where the links inside Supabase's auth emails send the member back to.
// These routes exist in App.tsx; the domain must be listed in Supabase →
// Authentication → URL Configuration → Redirect URLs.
const verifyRedirect = () => `${window.location.origin}/verify-email`
const resetRedirect = () => `${window.location.origin}/reset-password`

// BGrowth Identity™'s real provider — Supabase Auth on the Portal's
// project, so a member has one account across the Website and the Portal.
// Pages never talk to Supabase; they read useIdentity() exactly as before.
export function SupabaseIdentityProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<IdentityStatus>(supabase ? 'loading' : 'guest')
  const [busy, setBusy] = useState(false)
  const [user, setUser] = useState<User | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [emailVerified, setEmailVerified] = useState(false)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const loadTicket = useRef(0)

  const applySession = useCallback(async (session: Session | null) => {
    const ticket = ++loadTicket.current
    if (!supabase || !session) {
      setUser(undefined)
      setEmailVerified(false)
      setStatus('guest')
      return
    }
    const member = await loadPortalMember(supabase, session.user)
    if (ticket !== loadTicket.current) return // a newer session change won
    setUser(member)
    setEmailVerified(Boolean(session.user.email_confirmed_at))
    setStatus('authenticated')
  }, [])

  useEffect(() => {
    if (!supabase) return
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      if (event === 'SIGNED_OUT') setPasswordRecovery(false)
      // Deferred: supabase-js warns against awaiting other Supabase calls
      // inside this callback (it holds the auth lock).
      setTimeout(() => void applySession(session), 0)
    })
    return () => subscription.unsubscribe()
  }, [applySession])

  // An error belongs to the screen it happened on.
  const { pathname } = useLocation()
  useEffect(() => setError(undefined), [pathname])

  const login = async ({ email, password }: LoginCredentials) => {
    setError(undefined)
    if (!supabase) return setError(NOT_CONFIGURED)
    setBusy(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (signInError) throw signInError
      // onAuthStateChange applies the session; GuestRoute then redirects.
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const register = async ({ email, password, displayName }: RegistrationData) => {
    setError(undefined)
    if (!supabase) {
      setError(NOT_CONFIGURED)
      return false
    }
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Fill in every field to create an account.')
      return false
    }
    setBusy(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: displayName.trim() }, emailRedirectTo: verifyRedirect() },
      })
      if (signUpError) {
        // The account is created before the email is sent — a failed send
        // is recoverable from the Verify Email page's "Resend" button.
        if (isAuthApiError(signUpError) && signUpError.code === 'over_email_send_rate_limit') return true
        throw signUpError
      }
      // With email confirmation on, an already-registered address comes
      // back as a user with no identities instead of an error.
      if (data.user && data.user.identities?.length === 0) {
        setError('An account with this email already exists. Sign in instead.')
        return false
      }
      return true
    } catch (e) {
      setError(friendlyError(e))
      return false
    } finally {
      setBusy(false)
    }
  }

  const resendVerification = async (email: string) => {
    setError(undefined)
    if (!supabase) {
      setError(NOT_CONFIGURED)
      return false
    }
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: verifyRedirect() },
    })
    if (resendError) {
      setError(friendlyError(resendError))
      return false
    }
    return true
  }

  const logout = () => {
    // Local scope: signs out this browser only, not every device.
    void supabase?.auth.signOut({ scope: 'local' })
    setUser(undefined)
    setEmailVerified(false)
    setPasswordRecovery(false)
    setStatus('guest')
  }

  const requestPasswordReset = async (email: string) => {
    setError(undefined)
    if (!supabase) {
      setError(NOT_CONFIGURED)
      return false
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: resetRedirect(),
    })
    if (resetError) {
      setError(friendlyError(resetError))
      return false
    }
    return true
  }

  const resetPassword = async (newPassword: string) => {
    setError(undefined)
    if (!supabase) {
      setError(NOT_CONFIGURED)
      throw new Error('not-configured')
    }
    if (newPassword.length < 8) {
      setError('Choose a password with at least 8 characters.')
      throw new Error('invalid-password')
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setError(friendlyError(updateError))
      throw updateError
    }
    setPasswordRecovery(false)
  }

  return (
    <IdentityContext.Provider
      value={{
        status,
        busy,
        user,
        error,
        emailVerified,
        passwordRecovery,
        login,
        register,
        resendVerification,
        logout,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </IdentityContext.Provider>
  )
}
