import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calculator,
  Crown,
  ExternalLink,
  FileText,
  FolderOpen,
  Gift,
  GraduationCap,
  Hourglass,
  KeyRound,
  LifeBuoy,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import { workspaceViewerPath } from '../../modules/workspace/config'
import type { AccountAccess, AccountOrder, AccountPurchases } from '../../modules/account/types'

const CARD = 'rounded-[22px] border border-navy/[0.07] bg-white shadow-softer'
const PILL = 'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold'
const TONE = {
  green: 'bg-emerald-50 text-emerald-700',
  gray: 'bg-navy/[0.05] text-navy/50',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-600',
}

function day(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)
}

const ORDER_STATUS: Record<AccountOrder['status'], { label: string; tone: keyof typeof TONE }> = {
  paid: { label: 'Paid', tone: 'green' },
  pending: { label: 'Pending', tone: 'amber' },
  refunded: { label: 'Refunded', tone: 'gray' },
  partly_refunded: { label: 'Partly refunded', tone: 'gray' },
}

const ACCESS_STATUS: Record<AccountAccess['status'], { label: string; tone: keyof typeof TONE }> = {
  active: { label: 'Active', tone: 'green' },
  expired: { label: 'Expired', tone: 'gray' },
  cancelled: { label: 'Cancelled', tone: 'red' },
}

// What an order is, by the product's type — its icon, tag and colors.
const ORDER_LOOK: Record<string, { label: string; icon: LucideIcon; tile: string; tag: string }> = {
  plan: { label: 'Plan', icon: Crown, tile: 'bg-gradient-to-br from-primary to-indigo-600', tag: 'bg-blue-50 text-primary' },
  workspace: { label: 'Workspace', icon: FolderOpen, tile: 'bg-primary', tag: 'bg-blue-50 text-primary' },
  course: { label: 'Course', icon: GraduationCap, tile: 'bg-violet-600', tag: 'bg-violet-50 text-violet-700' },
  pdf: { label: 'Download', icon: FileText, tile: 'bg-rose-600', tag: 'bg-rose-50 text-rose-700' },
  calculator: { label: 'Calculator', icon: Calculator, tile: 'bg-emerald-600', tag: 'bg-emerald-50 text-emerald-700' },
  bundle: { label: 'Bundle', icon: Package, tile: 'bg-amber-500', tag: 'bg-amber-50 text-amber-700' },
  other: { label: 'Product', icon: ShoppingBag, tile: 'bg-navy', tag: 'bg-navy/[0.05] text-navy/60' },
}

const GROUPS: { kind: AccountAccess['kind'][]; title: string; icon: LucideIcon; tone: string }[] = [
  { kind: ['purchase'], title: 'Purchased', icon: ShoppingBag, tone: 'text-primary' },
  { kind: ['free'], title: 'Free products', icon: Sparkles, tone: 'text-emerald-600' },
  { kind: ['team'], title: 'Given by the BGrowth team', icon: Gift, tone: 'text-violet-600' },
  { kind: ['trial'], title: 'Free trials', icon: Hourglass, tone: 'text-amber-600' },
  { kind: ['other'], title: 'Other access', icon: KeyRound, tone: 'text-navy/50' },
]
const GROUP_TILE: Record<AccountAccess['kind'], string> = {
  purchase: 'bg-blue-50 text-primary',
  free: 'bg-emerald-50 text-emerald-600',
  team: 'bg-violet-50 text-violet-600',
  trial: 'bg-amber-50 text-amber-600',
  other: 'bg-navy/[0.05] text-navy/50',
}

function productPath(slug: string | null, bundle: boolean) {
  if (!slug) return null
  return bundle ? `/bundle/${slug}` : `/product/${slug}`
}

function OrderRow({ o }: { o: AccountOrder }) {
  const look = ORDER_LOOK[o.kind === 'plan' ? 'plan' : o.productType ?? 'other'] ?? ORDER_LOOK.other
  const Icon = look.icon
  const st = ORDER_STATUS[o.status]
  const path = o.kind === 'plan' ? null : productPath(o.productSlug, o.isBundle)
  const name = o.productName ?? 'Product'
  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${look.tile}`}>
        <Icon size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${look.tag}`}>{look.label}</span>
        <p className="mt-1 truncate text-[15px] font-bold text-navy">
          {path ? (
            <Link to={path} className="hover:text-primary">
              {name}
            </Link>
          ) : (
            name
          )}
        </p>
        <p className="text-[12.5px] text-navy/45">{day(o.createdAt)}</p>
      </div>
      <div className="text-right">
        <p className="text-[16px] font-bold tabular-nums text-navy">{money(o.amount, o.currency)}</p>
        <span className={`${PILL} mt-1 ${TONE[st.tone]}`}>{st.label}</span>
      </div>
      {o.receiptUrl ? (
        <a
          href={o.receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-navy/10 px-3 py-2 text-[13px] font-semibold text-navy/70 transition-colors hover:border-primary/30 hover:text-primary"
        >
          <Receipt size={14} aria-hidden /> Receipt
        </a>
      ) : (
        <span className="text-[12.5px] text-navy/35">No receipt</span>
      )}
    </li>
  )
}

function AccessCard({ a }: { a: AccountAccess }) {
  const st = ACCESS_STATUS[a.status]
  const Icon = GROUPS.find((g) => g.kind.includes(a.kind))?.icon ?? KeyRound
  const when =
    a.status === 'active'
      ? a.endsAt
        ? `Until ${day(a.endsAt)}`
        : a.kind === 'trial'
          ? null
          : 'No end date'
      : a.endsAt
        ? `Ended ${day(a.endsAt)}`
        : null
  return (
    <div className={`${CARD} flex flex-col p-5`}>
      <div className="flex gap-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${GROUP_TILE[a.kind]}`}>
          <Icon size={19} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${PILL} ${TONE[st.tone]}`}>
              {a.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />}
              {st.label}
            </span>
            {when && <span className="text-[11.5px] text-navy/40">{when}</span>}
          </div>
          <p className="mt-1.5 text-[15px] font-bold leading-snug text-navy">{a.productName}</p>
          <p className="mt-1 text-[12.5px] text-navy/50">Since {day(a.startedAt)}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-navy/[0.06] pt-4">
        <span className="text-[12px] text-navy/45">{a.origin}</span>
        {a.status === 'active' && a.productSlug ? (
          <Link to={workspaceViewerPath(a.productSlug)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary/90">
            Open <ArrowRight size={14} aria-hidden />
          </Link>
        ) : a.status === 'active' && a.productName === 'All Workspaces' ? (
          <Link to="/platform/my-systems" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary/90">
            Open Workspaces <ArrowRight size={14} aria-hidden />
          </Link>
        ) : a.status !== 'active' && a.inPlans ? (
          <Link to="/platform/membership" className="inline-flex items-center gap-1.5 rounded-xl border border-navy/10 px-4 py-2 text-[13px] font-semibold text-navy/70 transition-colors hover:border-primary/30 hover:text-primary">
            <Crown size={14} aria-hidden /> Included in plans
          </Link>
        ) : a.status !== 'active' && a.productSlug ? (
          <Link to={`/product/${a.productSlug}`} className="inline-flex items-center gap-1.5 rounded-xl border border-navy/10 px-4 py-2 text-[13px] font-semibold text-navy/70 transition-colors hover:border-primary/30 hover:text-primary">
            Buy <ExternalLink size={13} aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

// Account → Purchases & Access (redesigned 19/11/2026, the owner's design):
// every payment — product orders and the plan's own charges — with its
// receipt, then every access on the account grouped by where it came from.
// Everything shown is read from Stripe or the account; nothing is made up.
export default function PurchaseHistory({ data }: { data: AccountPurchases }) {
  const { orders, accesses, ordersAvailable } = data
  return (
    <div className="space-y-12">
      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <Receipt size={20} className="text-primary" aria-hidden />
          <div>
            <h2 className="font-display text-[20px] font-bold text-navy">Orders &amp; receipts</h2>
            <p className="text-[13px] text-navy/50">Every payment on your account — products and your plan.</p>
          </div>
        </div>
        {!ordersAvailable ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">
            We couldn’t load your orders right now. Your access below is up to date — please try again later.
          </p>
        ) : orders.length === 0 ? (
          <EmptyState icon={Receipt} title="No paid orders yet." description="Products you buy and your plan’s payments show here with their receipt." />
        ) : (
          <ul className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
            {orders.map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center gap-2.5">
          <KeyRound size={20} className="text-emerald-600" aria-hidden />
          <div>
            <h2 className="font-display text-[20px] font-bold text-navy">Your access</h2>
            <p className="text-[13px] text-navy/50">Everything on your account and where it came from.</p>
          </div>
        </div>
        {accesses.length === 0 ? (
          <EmptyState icon={KeyRound} title="Nothing on your account yet." description="Free products, trials and purchases show here." />
        ) : (
          <div className="space-y-8">
            {GROUPS.map((g) => {
              const list = accesses.filter((a) => g.kind.includes(a.kind))
              if (!list.length) return null
              const Icon = g.icon
              return (
                <div key={g.title}>
                  <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-navy/50">
                    <Icon size={15} className={g.tone} aria-hidden /> {g.title}
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {list.map((a) => (
                      <AccessCard key={a.id} a={a} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col items-start gap-5 rounded-[26px] bg-navy px-6 py-8 text-white shadow-glow sm:flex-row sm:items-center sm:justify-between sm:px-9">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-300">
            <LifeBuoy size={14} aria-hidden /> Need help?
          </p>
          <h2 className="mt-2 font-display text-[21px] font-bold">Questions about access or billing?</h2>
          <p className="mt-1 text-[14px] text-white/65">Our support team can help with access, receipts and payments.</p>
        </div>
        <Link to="/platform/support" className="btn-primary inline-flex shrink-0 items-center gap-2">
          Talk to support <ArrowRight size={16} aria-hidden />
        </Link>
      </section>
    </div>
  )
}
