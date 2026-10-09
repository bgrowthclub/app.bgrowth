import { useEffect, useState } from 'react'
import { CheckCircle2, ClipboardCheck, ExternalLink, XCircle } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import FilterPill from '../../../components/ui/FilterPill'
import AdminStatTile from '../../../components/admin/AdminStatTile'
import CatalogHealthRow from '../../../components/admin/CatalogHealthRow'
import { CARD, formatDate } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminCatalogHealth } from '../../../modules/admin/types'

const STUDIO_URL = 'https://studio.bgrowth.app'
type Filter = 'all' | 'problems' | 'warnings'

function Check({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <li className="flex items-start gap-2 py-1.5 text-[13.5px]">
      {ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />}
      <span className="text-navy/70">
        {label}
        {hint && <span className="ml-1 text-navy/40">{hint}</span>}
      </span>
    </li>
  )
}

// Admin → Catalog: is every published Workspace ready to sell and well
// presented, and is the system set up (settings, database updates, the
// automatic e-mails)? Fixes to a Workspace are made in the Studio.
export default function AdminCatalogPage() {
  const [data, setData] = useState<AdminCatalogHealth | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    adminService
      .getCatalogHealth()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t check the catalog.'))
  }, [])

  const all = data?.workspaces ?? []
  const withProblems = all.filter((w) => w.issues.some((i) => i.level === 'problem'))
  const withWarnings = all.filter((w) => !w.issues.some((i) => i.level === 'problem') && w.issues.length > 0)
  const shown = filter === 'problems' ? withProblems : filter === 'warnings' ? withWarnings : all

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Catalog · Admin" description="Catalog and system health." path="/platform/admin/catalog" />
      <SectionHeader
        eyebrow="Admin"
        title="Catalog"
        description="Every published Workspace checked: what stops it from selling or working, and what would make its page better. Fix them in the Studio."
        className="mb-8"
      />

      {!data ? (
        error ? (
          <EmptyState icon={ClipboardCheck} title="We couldn’t check the catalog." description={error} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Checking…</p>
        )
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <AdminStatTile label="Published" value={String(all.length)} />
            <AdminStatTile label="With problems" value={String(withProblems.length)} hint="can’t sell or open properly" />
            <AdminStatTile label="With warnings" value={String(withWarnings.length)} hint="page could be better" />
            <AdminStatTile label="All good" value={String(all.length - withProblems.length - withWarnings.length)} />
          </div>

          {data.orphans.length > 0 && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">
              In the catalog but no longer published: {data.orphans.join(', ')}. Unpublish them again in the Studio.
            </p>
          )}

          <section>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <FilterPill label={`All (${all.length})`} active={filter === 'all'} onClick={() => setFilter('all')} />
              <FilterPill label={`Problems (${withProblems.length})`} active={filter === 'problems'} onClick={() => setFilter('problems')} />
              <FilterPill label={`Warnings (${withWarnings.length})`} active={filter === 'warnings'} onClick={() => setFilter('warnings')} />
              <a
                href={STUDIO_URL}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
              >
                Open the Studio <ExternalLink size={14} />
              </a>
            </div>
            {shown.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="Nothing here." description="No Workspace in this group." />
            ) : (
              <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
                {shown.map((w) => (
                  <CatalogHealthRow key={w.id} workspace={w} />
                ))}
              </div>
            )}
          </section>

          <section className={`${CARD} p-6`}>
            <h2 className="font-display text-lg font-bold text-navy">System</h2>
            <p className="mt-0.5 text-[13px] text-navy/45">What the site needs to run — never the values themselves.</p>
            <div className="mt-5 grid gap-8 md:grid-cols-3">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-navy/40">Settings (Vercel)</p>
                <ul className="mt-2">
                  {data.system.settings.map((s) => (
                    <Check key={s.name} ok={s.ok} label={s.name} hint={!s.ok && s.optional ? '(optional)' : undefined} />
                  ))}
                  <Check ok={data.system.newsletterAddress} label="Newsletter mailing address" hint={data.system.newsletterAddress ? undefined : '(Admin → Newsletter)'} />
                </ul>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-navy/40">Database updates</p>
                <ul className="mt-2">
                  {data.system.updates.map((u) => (
                    <Check key={u.name} ok={u.ok} label={u.name} />
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-navy/40">Automatic e-mails — last sent</p>
                <ul className="mt-2 space-y-2">
                  {data.system.activity.map((a) => (
                    <li key={a.name} className="text-[13.5px]">
                      <span className="block text-navy/70">{a.name}</span>
                      <span className="text-[12.5px] text-navy/40">{a.at ? formatDate(a.at) : 'not yet'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
