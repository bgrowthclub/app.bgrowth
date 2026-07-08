import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types/user'
import type { LoginCredentials, RegistrationData } from '../types/auth'
import { MOCK_USER } from './mockUser'

export type IdentityStatus = 'loading' | 'authenticated' | 'guest'

interface IdentityContextValue {
  status: IdentityStatus
  user: User | undefined
  error: string | undefined
  emailVerified: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegistrationData) => Promise<void>
  logout: () => void
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (newPassword: string) => Promise<void>
  verifyEmail: () => void
}

const IdentityContext = createContext<IdentityContextValue | undefined>(undefined)

// The only place this milestone touches browser storage — purely to
// simulate "Remember Me" across a page reload. No backend, no real
// session token; see CLAUDE.md's Identity rules.
const STORAGE_KEY = 'bgrowth.identity.mockSession'

function simulateNetworkDelay() {
  return new Promise((resolve) => setTimeout(resolve, 450))
}

// A complete, self-contained mock implementation of BGrowth Identity™ —
// login, register, logout, remember me, password reset, and email
// verification, all simulated in React state (+ localStorage for "Remember
// Me"). This does NOT implement IdentityProviderAdapter — it stands in for
// the whole Application → Identity boundary until a real provider (and a
// real IdentityProviderAdapter implementation) exists. See ARCHITECTURE.md.
export function MockIdentityProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<IdentityStatus>('loading')
  const [user, setUser] = useState<User | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [emailVerified, setEmailVerified] = useState(false)

  useEffect(() => {
    const remembered = window.localStorage.getItem(STORAGE_KEY) === 'true'
    if (remembered) {
      // A remembered session is a returning, already-verified member —
      // only a fresh Register starts out unverified (see register below).
      setUser(MOCK_USER)
      setEmailVerified(true)
      setStatus('authenticated')
    } else {
      setStatus('guest')
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    setError(undefined)
    setStatus('loading')
    await simulateNetworkDelay()

    if (!credentials.email.trim() || !credentials.password.trim()) {
      setError('Enter an email and password to continue.')
      setStatus('guest')
      return
    }

    setUser({ ...MOCK_USER, email: credentials.email })
    setEmailVerified(true) // an existing member logging in is already verified
    setStatus('authenticated')
    if (credentials.rememberMe) window.localStorage.setItem(STORAGE_KEY, 'true')
  }

  const register = async (data: RegistrationData) => {
    setError(undefined)
    setStatus('loading')
    await simulateNetworkDelay()

    if (!data.email.trim() || !data.password.trim() || !data.displayName.trim()) {
      setError('Fill in every field to create an account.')
      setStatus('guest')
      return
    }

    const [firstName, ...lastNameParts] = data.displayName.trim().split(' ')
    setUser({
      ...MOCK_USER,
      email: data.email,
      displayName: data.displayName,
      firstName,
      lastName: lastNameParts.join(' '),
    })
    setEmailVerified(false)
    setStatus('authenticated')
    window.localStorage.setItem(STORAGE_KEY, 'true')
  }

  const logout = () => {
    window.localStorage.removeItem(STORAGE_KEY)
    setUser(undefined)
    setEmailVerified(false)
    setStatus('guest')
  }

  const requestPasswordReset = async (_email: string) => {
    setError(undefined)
    await simulateNetworkDelay()
    // Simulated only — no email is actually sent.
  }

  const resetPassword = async (newPassword: string) => {
    setError(undefined)
    await simulateNetworkDelay()
    if (!newPassword.trim() || newPassword.length < 8) {
      setError('Choose a password with at least 8 characters.')
      throw new Error('invalid-password')
    }
    // Simulated only — no password is actually stored anywhere.
  }

  const verifyEmail = () => {
    setEmailVerified(true)
  }

  return (
    <IdentityContext.Provider
      value={{ status, user, error, emailVerified, login, register, logout, requestPasswordReset, resetPassword, verifyEmail }}
    >
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity() {
  const ctx = useContext(IdentityContext)
  if (!ctx) throw new Error('useIdentity must be used within a MockIdentityProvider')
  return ctx
}
