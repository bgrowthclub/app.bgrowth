import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchBox from './SearchBox'
import { productService } from '../../modules/commerce/services/ProductService'
import { searchResources } from '../../data/resources'
import type { Product } from '../../modules/commerce/types/product'

// Global search across the ecosystem — Products (read through
// ProductService, the Runtime↔Product Engine connection — see the
// milestone that wired this up) and Resources are real, Marketplace and
// Community have no data source yet so they're shown as inert placeholder
// rows, per the current phase (no backend, no search API).
export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const trimmed = query.trim()

  const [productResults, setProductResults] = useState<Product[]>([])

  useEffect(() => {
    if (!trimmed) {
      setProductResults([])
      return
    }
    let cancelled = false
    productService.searchProducts(trimmed).then((results) => {
      if (!cancelled) setProductResults(results.slice(0, 3))
    })
    return () => {
      cancelled = true
    }
  }, [trimmed])

  const resourceResults = useMemo(() => (trimmed ? searchResources(trimmed, 3) : []), [trimmed])
  const hasResults = productResults.length > 0 || resourceResults.length > 0

  return (
    <div className="relative">
      <SearchBox value={query} onChange={setQuery} placeholder="Search the platform…" />

      {trimmed && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setQuery('')} />
          <div className="absolute left-0 right-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl2 border border-navy/[0.06] bg-white p-2 shadow-glow">
            {!hasResults && (
              <p className="px-3 py-4 text-center text-[13px] text-navy/40">No matches for "{trimmed}".</p>
            )}

            {productResults.length > 0 && (
              <div className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-navy/30">
                  Workspaces
                </p>
                {productResults.map((s) => (
                  <Link
                    key={s.slug}
                    to={`/product/${s.slug}`}
                    onClick={() => setQuery('')}
                    className="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy/80 hover:bg-bg-soft"
                  >
                    {s.title}
                  </Link>
                ))}
              </div>
            )}

            {resourceResults.length > 0 && (
              <div className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-navy/30">
                  Resources
                </p>
                {resourceResults.map((r) => (
                  <Link
                    key={r.title}
                    to="/resources"
                    onClick={() => setQuery('')}
                    className="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy/80 hover:bg-bg-soft"
                  >
                    {r.title}
                  </Link>
                ))}
              </div>
            )}

            <div className="border-t border-navy/[0.06] pt-2">
              <p className="px-3 py-1.5 text-[12px] text-navy/35">Marketplace — coming soon</p>
              <p className="px-3 py-1.5 text-[12px] text-navy/35">Community — coming soon</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
