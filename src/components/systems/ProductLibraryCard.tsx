import { ArrowRight, BarChart2, Clock } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { getProductActionLabel, getProductActionRoute, getProductLibraryStatus } from '../../lib/productLibrary'
import type { ProductLibraryStatus, UserProduct } from '../../types/productLibrary'

interface Props {
  product: UserProduct
  size?: 'default' | 'featured' | 'library'
}

const STATUS_LABEL: Record<ProductLibraryStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  completed: 'Completed',
}

// Kept entirely within the existing primary/navy palette (no new color
// token) — status is communicated by weight/intensity, not a new hue.
const STATUS_CLASS: Record<ProductLibraryStatus, string> = {
  'not-started': 'bg-bg-soft text-navy/40',
  'in-progress': 'bg-primary/10 text-primary',
  completed: 'bg-grad-primary text-white',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// The one reusable card for every product a member owns — used for the
// Dashboard's "Continue Your Workspace" hero (size="featured"), the
// Dashboard's "My Workspaces" preview (size="default"), and the full
// Library page (size="library", with purchase metadata). A sibling to the
// pre-purchase catalog card (systems/BusinessSystemCard), never a variant
// of it — this one always assumes ownership (Open/Continue, never a price
// or a "Buy" CTA). Nothing here is Workspace-specific: icon, badges,
// difficulty/time, and the primary action's label + route all come from
// `product` (a UserProduct) and are type-derived (see
// lib/productLibrary.ts), so this card already works for a future Course,
// Membership, or standalone Planner™/Calculator™ without changing a line
// here. Supersedes systems/OwnedSystemCard, which is left in place (now
// unused) per CLAUDE.md's no-silent-deletion rule.
export default function ProductLibraryCard({ product, size = 'default' }: Props) {
  const featured = size === 'featured'
  const library = size === 'library'
  const Icon = product.icon
  const actionLabel = featured ? 'Continue' : getProductActionLabel(product.type)
  const actionRoute = getProductActionRoute(product)
  const status = getProductLibraryStatus(product)

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl3 border border-navy/[0.06] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow ${
        featured ? 'md:flex-row md:hover:-translate-y-0' : ''
      }`}
    >
      {/* Cover — icon tile stands in until Studio provides a real thumbnail */}
      <div
        className={`grid shrink-0 place-items-center bg-grad-primary text-white ${
          featured ? 'h-40 md:h-auto md:w-64' : 'h-32'
        }`}
      >
        <Icon size={featured ? 44 : 30} strokeWidth={1.7} />
      </div>

      <div className={`flex flex-1 flex-col p-6 ${featured ? 'md:p-8' : ''}`}>
        <div className={`flex flex-wrap items-center gap-2 ${library ? 'justify-between' : ''}`}>
          <Badge variant="soft">{product.tag}</Badge>
          {library ? (
            <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${STATUS_CLASS[status]}`}>
              {STATUS_LABEL[status]}
            </span>
          ) : (
            product.subTag && <Badge variant="outline">{product.subTag}</Badge>
          )}
        </div>

        <h3 className={`mt-3 font-display font-bold text-navy ${featured ? 'text-2xl' : 'text-[17px]'}`}>
          {product.title}
        </h3>

        <p
          className={`mt-2 text-navy/50 ${
            featured ? 'text-[15px] leading-relaxed' : 'text-[13.5px] leading-relaxed'
          }`}
        >
          {product.description}
        </p>

        {library ? (
          <div className="mt-4 space-y-1.5 border-t border-navy/[0.06] pt-4 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-navy/40">Purchased</span>
              <span className="font-medium text-navy/60">{formatDate(product.purchase.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-navy/40">Last Opened</span>
              <span className="font-medium text-navy/60">
                {product.lastOpenedAt ? formatDate(product.lastOpenedAt) : 'Not opened yet'}
              </span>
            </div>
          </div>
        ) : (
          (product.difficulty || product.estimatedTime) && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-navy/40">
              {product.difficulty && (
                <span className="inline-flex items-center gap-1.5">
                  <BarChart2 size={12} />
                  {product.difficulty}
                </span>
              )}
              {product.estimatedTime && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} />
                  {product.estimatedTime}
                </span>
              )}
            </div>
          )
        )}

        <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
          <Button to={actionRoute} icon={<ArrowRight size={15} />}>
            {actionLabel}
          </Button>
          <Button to={`/product/${product.slug}`} variant="secondary">
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}
