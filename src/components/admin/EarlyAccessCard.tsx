import { useEffect, useState } from 'react'
import { DoorOpen } from 'lucide-react'
import { CARD } from './styles'
import { adminService } from '../../modules/admin/adminService'

// Admin → Members → a member → Early access (17/11/2026, the owner's
// choice): let one person in before launch — they pass the closed site and
// can edit their own page while "Subscribers build their own page" is off.
// Their page still needs a plan that includes it and must be handed to them
// (Admin → Pages); no Admin area opens for them. Once the site opens, it no
// longer changes anything.
export default function EarlyAccessCard({ userId }: { userId: string }) {
  const [on, setOn] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminService
      .getEarlyAccess(userId)
      .then(setOn)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'))
  }, [userId])

  async function toggle(next: boolean) {
    setBusy(true)
    setError('')
    try {
      await adminService.setEarlyAccess(userId, next)
      setOn(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`${CARD} p-5`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-primary"
          checked={Boolean(on)}
          disabled={on === null || busy}
          onChange={(e) => void toggle(e.target.checked)}
        />
        <span>
          <span className="flex items-center gap-2 text-[14.5px] font-semibold text-navy">
            <DoorOpen size={16} className="text-primary" /> Early access
          </span>
          <span className="mt-0.5 block text-[13px] leading-relaxed text-navy/55">
            Enters the site before launch and can edit their own page. Their page still needs to be handed to them (Admin → Pages) and a plan
            that includes a page. No part of the Admin opens for them.
          </span>
        </span>
      </label>
      {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
    </div>
  )
}
