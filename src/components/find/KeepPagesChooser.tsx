import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'
import { myPageService } from '../../modules/find/memberPageService'
import type { MemberPageSummary } from '../../modules/find/types'

interface Props {
  pages: MemberPageSummary[]
  allowance: number
  language: 'en' | 'pt'
  onSaved: () => void
}

// The member has more pages online than their plan now allows (08/11/2026,
// Portal migration 0081). Rather than a rule picking for them, they choose.
//
// NOTHING IS DELETED, and the text says so plainly: the pages left out go
// off the web and stay exactly as they are, so raising the plan again — or
// changing their mind here — brings them straight back. A person reading
// "choose which to keep" assumes the others are being thrown away, and that
// fear is what makes them pick in a panic.
export default function KeepPagesChooser({ pages, allowance, language, onSaved }: Props) {
  const t = TEXT[language]
  // Pre-ticked with what is online today (the first N by the same rule the
  // database uses), so doing nothing changes nothing.
  const [kept, setKept] = useState<string[]>(() => pages.slice(0, Math.max(1, allowance)).map((p) => p.id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (id: string) => {
    setError(null)
    setKept((list) => {
      if (list.includes(id)) return list.filter((x) => x !== id)
      if (list.length >= allowance) return list
      return [...list, id]
    })
  }

  const save = () => {
    if (!kept.length) {
      setError(t.pickOne)
      return
    }
    setBusy(true)
    setError(null)
    myPageService
      .keepPages(kept)
      .then(onSaved)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t.failed))
      .finally(() => setBusy(false))
  }

  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
      <h2 className="flex items-center gap-2 font-display text-[17px] font-bold text-amber-900">
        <AlertTriangle size={17} aria-hidden />
        {t.title(allowance)}
      </h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-amber-900/80">{t.body}</p>

      <ul className="mt-4 space-y-2">
        {pages.map((page) => {
          const on = kept.includes(page.id)
          const full = !on && kept.length >= allowance
          return (
            <li key={page.id}>
              <label className={`flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 ${full ? 'opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={on}
                  disabled={full}
                  onChange={() => toggle(page.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-navy">{page.display_name || page.slug}</span>
                  <span className="block truncate text-[12.5px] text-navy/50">bgrowth.app/p/{page.slug}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {error && <p className="mt-3 text-[13px] font-semibold text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} disabled={busy}>
          {busy ? t.saving : t.save}
        </Button>
        <span className="text-[12.5px] text-amber-900/70">
          {kept.length}/{allowance}
        </span>
      </div>
    </section>
  )
}

const TEXT = {
  en: {
    title: (n: number) => `Your plan now includes ${n} page${n === 1 ? '' : 's'}`,
    body: 'You have more than that online. Choose which ones stay — the others come off the web but are kept exactly as they are, so they come back the moment you have room for them again. Nothing is deleted.',
    save: 'Keep these online',
    saving: 'Saving…',
    pickOne: 'Choose at least one page.',
    failed: 'Couldn’t save that.',
  },
  pt: {
    title: (n: number) => `Seu plano agora inclui ${n} página${n === 1 ? '' : 's'}`,
    body: 'Você tem mais do que isso no ar. Escolha quais ficam — as outras saem da web, mas continuam guardadas exatamente como estão e voltam assim que houver espaço de novo. Nada é apagado.',
    save: 'Manter estas no ar',
    saving: 'Salvando…',
    pickOne: 'Escolha pelo menos uma página.',
    failed: 'Não consegui salvar.',
  },
}
