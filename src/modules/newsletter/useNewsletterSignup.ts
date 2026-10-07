import { useState } from 'react'
import type { FormEvent } from 'react'
import { newsletterService } from './newsletterService'

// State behind every "Subscribe" form on the site (footer, Knowledge,
// Resources): sends the address and says what happens next.
export function useNewsletterSignup(source: string) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'check-email' | 'subscribed' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || state === 'sending') return
    setState('sending')
    setError(null)
    try {
      setState(await newsletterService.subscribe(email.trim(), source))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setState('error')
    }
  }

  const message =
    state === 'check-email'
      ? 'Almost there — check your inbox and tap the link to confirm.'
      : state === 'subscribed'
        ? 'You’re subscribed. Choose your interests anytime in Settings.'
        : state === 'error'
          ? error
          : null

  return { email, setEmail, submit, state, message, done: state === 'check-email' || state === 'subscribed' }
}
