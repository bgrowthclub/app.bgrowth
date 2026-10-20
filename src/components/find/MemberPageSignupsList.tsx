import { useEffect, useState } from 'react'
import { Download, Trash2, Users } from 'lucide-react'
import type { MemberPageSignup } from '../../modules/find/types'

interface Props {
  load: () => Promise<MemberPageSignup[]>
  remove: (id: string) => Promise<void>
  // Used to name the exported file.
  fileName: string
}

const TEXT = {
  title: 'Contacts',
  intro: 'People who joined the e-mail list on your page. The list is yours: export it to use in your own e-mail or WhatsApp tool. BGrowth never sends to it.',
  empty: 'No one yet. Add the “E-mail list” section to your page and share your link.',
  export: 'Export CSV',
  remove: 'Remove',
  confirm: 'Remove this contact from the list?',
}

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

// A page's e-mail list (Sprint 139): the owner's in My Business Page →
// Contacts, the team's in Admin → Pages.
export default function MemberPageSignupsList({ load, remove, fileName }: Props) {
  const [rows, setRows] = useState<MemberPageSignup[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    load()
      .then((r) => !cancelled && setRows(r))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Couldn’t load the contacts.'))
    return () => {
      cancelled = true
    }
    // load is a new function each render; loading once is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exportCsv() {
    if (!rows) return
    const lines = [['E-mail', 'Name', 'WhatsApp', 'Joined'].join(',')]
    for (const r of rows) lines.push([r.email, r.name ?? '', r.whatsapp ?? '', r.created_at.slice(0, 10)].map(csvCell).join(','))
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}-contacts.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function removeOne(id: string) {
    if (!window.confirm(TEXT.confirm)) return
    try {
      await remove(id)
      setRows((r) => (r ? r.filter((x) => x.id !== id) : r))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t remove the contact.')
    }
  }

  return (
    <div className="rounded-2xl border border-navy/[0.08] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-bold text-navy">
            <Users size={18} className="text-primary" aria-hidden /> {TEXT.title}
            {rows && <span className="rounded-full bg-bg-soft px-2 py-0.5 text-[12px] font-semibold text-navy/55">{rows.length}</span>}
          </p>
          <p className="mt-1 max-w-2xl text-[13px] text-navy/55">{TEXT.intro}</p>
        </div>
        {rows && rows.length > 0 && (
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-navy/10 px-3 py-2 text-[13px] font-semibold text-navy/70 hover:border-primary/40">
            <Download size={15} /> {TEXT.export}
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-[13.5px] text-red-500">{error}</p>}
      {!rows && !error && <p className="mt-4 text-[13.5px] text-navy/40">Loading…</p>}
      {rows && rows.length === 0 && <p className="mt-4 text-[13.5px] text-navy/50">{TEXT.empty}</p>}
      {rows && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-navy/[0.08] text-[12px] uppercase tracking-wide text-navy/40">
                <th className="py-2 pr-3 font-semibold">E-mail</th>
                <th className="py-2 pr-3 font-semibold">Name</th>
                <th className="py-2 pr-3 font-semibold">WhatsApp</th>
                <th className="py-2 pr-3 font-semibold">Joined</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-navy/[0.05]">
                  <td className="py-2 pr-3 text-navy">{r.email}</td>
                  <td className="py-2 pr-3 text-navy/70">{r.name ?? '—'}</td>
                  <td className="py-2 pr-3 text-navy/70">{r.whatsapp ?? '—'}</td>
                  <td className="py-2 pr-3 text-navy/50">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => void removeOne(r.id)} aria-label={TEXT.remove} title={TEXT.remove} className="rounded-lg p-1.5 text-navy/35 hover:bg-red-50 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
