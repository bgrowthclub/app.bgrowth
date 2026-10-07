import { useState } from 'react'
import type { FormEvent } from 'react'
import { newsletterService } from './newsletterService'

// State behind every "Subscribe" form on the site (footer, Knowledge,
// Resources): subscribes at once, then hands back the token the inline
// "pick your topics" step uses.
export function useNewsletterSignup(source: string) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'subscribed' | 'error'>('idle')
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || state === 'sending') return
    setState('sending')
    setError(null)
    try {
      const result = await newsletterService.subscribe(email.trim(), source)
      setToken(result.token ?? null)
      setState('subscribed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setState('error')
    }
  }

  const message =
    state === 'subscribed'
      ? token
        ? 'You’re subscribed! Want only some topics? Pick them below — or skip, and you’ll hear about everything.'
        : 'You’re subscribed.'
      : state === 'error'
        ? error
        : null

  return { email, setEmail, submit, state, message, token, done: state === 'subscribed' }
}
