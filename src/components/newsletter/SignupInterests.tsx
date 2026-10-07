import { useState } from 'react'
import InterestPicker from './InterestPicker'
import { newsletterService } from '../../modules/newsletter/newsletterService'
import type { GrowthCategoryId } from '../../types/growth'

interface Props {
  token: string
}

// Right after someone subscribes: optionally narrow it to the areas they
// care about, without leaving the page.
export default function SignupInterests({ token }: Props) {
  const [interests, setInterests] = useState<GrowthCategoryId[]>([])
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function save() {
    setState('saving')
    try {
      await newsletterService.savePreferences(token, { interests })
      setState('saved')
    } catch {
      setState('error')
    }
  }

  if (state === 'saved') {
    return <p role="status" className="mt-3 text-[13px] font-medium text-primary">Saved — thanks!</p>
  }

  return (
    <div className="mt-4 space-y-3">
      <InterestPicker value={interests} onChange={setInterests} disabled={state === 'saving'} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={state === 'saving'}
          className="rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === 'saving' ? 'Saving…' : 'Save my topics'}
        </button>
        {state === 'error' && <span className="text-[13px] text-red-500">Couldn’t save. Please try again.</span>}
      </div>
    </div>
  )
}
