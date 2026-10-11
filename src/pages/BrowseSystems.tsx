import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import SearchToolbar from '../components/ui/SearchToolbar'
import FilterPill from '../components/ui/FilterPill'
import BusinessSystemCard from '../components/systems/BusinessSystemCard'
import StudioWorkspaceCard from '../components/systems/StudioWorkspaceCard'
import BundleCard from '../components/systems/BundleCard'
import { MODULE_TYPE_CONFIG } from '../components/systems/ModuleBadge'
import EmptyState from '../components/ui/EmptyState'
import Grid from '../components/layout/Grid'
import { loadBundleProducts, loadPublishedSystemProducts, loadStudioWorkspaceProducts, systemForCard } from '../lib/publishedCatalog'
import type { Product } from '../modules/commerce/types/product'
import { GROWTH_CATEGORIES } from '../types/growth'
import { useCategoryLooks } from '../lib/useCategoryLooks'
import { useProductTags } from '../lib/useProductTags'
import { studioPortalId } from '../modules/commerce/store/studioProductRepository'
import type { CategoryLookKeys } from '../lib/useCategoryLooks'
import { categoryLook } from '../components/systems/categoryIcons'
import type { ModuleType } from '../types/system'

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name: A–Z', value: 'name-asc' },
]

// Goal-style searches from the Home hero ("Become a Mobile Notary") rarely
// match a title word for word, so a system also matches when any of the
// query's meaningful words appears in it ("mobile", "notary"). Generic verbs
// and filler words are ignored so they don't match everything.
const SEARCH_STOPWORDS = new Set(['become', 'start', 'business', 'improve', 'build', 'better', 'learn', 'with', 'your', 'from', 'that', 'this', 'want'])

function matchesSearch(query: string, text: string) {
  const q = query.trim().toLowerCase()
  if (q === '') return true
  const haystack = text.toLowerCase()
  if (haystack.includes(q)) return true
  const words = q.split(/\s+/).filter((w) => w.length >= 4 && !SEARCH_STOPWORDS.has(w))
  return words.some((w) => haystack.includes(w))
}

export default function BrowseSystems() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') ?? 'All'
  // Seeded from ?q= so the Home hero search lands on already-filtered results.
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  // Any value from ?category= is kept: Studio categories come from the
  // database (Admin → Categories), not only the static list.
  const [category, setCategory] = useState(initialCategory)
  const [area, setArea] = useState(searchParams.get('area') ?? 'All')
  const [moduleType, setModuleType] = useState<ModuleType | 'All'>('All')
  const [tag, setTag] = useState(searchParams.get('tag') ?? 'All')
  const [allTags, setAllTags] = useState(false)
  const [sort, setSort] = useState('featured')

  // The Workspace Catalog — reads the Runtime↔Product Engine connection's
  // Published Product Repository (via ProductService.getPublished())
  // instead of a hardcoded catalog filter. A newly published product shows
  // up here automatically, no code change required. See
  // lib/publishedCatalog.ts.
  const [publishedSystems, setPublishedSystems] = useState<Awaited<ReturnType<typeof loadPublishedSystemProducts>>>(
    [],
  )

  // Workspaces published from BGrowth Studio — listed before the example
  // systems (see lib/publishedCatalog.ts).
  const [studioProducts, setStudioProducts] = useState<Product[]>([])
  // Bundles of those Workspaces (Portal migration 0041) — listed first.
  const [bundles, setBundles] = useState<Product[]>([])

  useEffect(() => {
    let cancelled = false
    loadPublishedSystemProducts().then((pairs) => {
      if (!cancelled) setPublishedSystems(pairs)
    })
    loadStudioWorkspaceProducts().then((products) => {
      if (!cancelled) setStudioProducts(products)
    })
    loadBundleProducts()
      .then((products) => {
        if (!cancelled) setBundles(products)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  // Each product's own title/description/price merged onto its system —
  // see systemForCard's doc comment on why the catalog can't render
  // BusinessSystem's raw fields directly. Also gives every card a unique
  // key (the product's slug), so two products ever wrapping the same
  // Workspace render as two distinct cards, not a collapsed duplicate.
  const publishedList = useMemo(() => publishedSystems.map(systemForCard), [publishedSystems])

  // Derived from the catalog rather than a fixed list — a module type only
  // shows as a filter option if some published system actually has one.
  const allModuleTypes: ModuleType[] = useMemo(
    () => Array.from(new Set(publishedList.flatMap((s) => s.modules.map((m) => m.type)))),
    [publishedList],
  )

  // Industry pills: every category a published Studio Workspace uses
  // (Admin → Categories).
  const industries = useMemo(
    () => ['All', ...Array.from(new Set(studioProducts.flatMap((p) => (p.industry ? [p.industry] : [])))).sort()],
    [studioProducts],
  )

  // Area pills (Growth Categories) appear once Workspaces exist in more than
  // one Area; the static examples are all Business & Entrepreneurship.
  // Icons and colors chosen in Admin → Catalog → Categories.
  const looks = useCategoryLooks()
  const lookIcon = (look: CategoryLookKeys | undefined, active: boolean) => {
    if (!look) return undefined
    const { Icon, color } = categoryLook(look)
    return (
      <span className={`grid h-5 w-5 place-items-center rounded-full ${active ? 'bg-white/20 text-white' : color.soft}`}>
        <Icon size={12} />
      </span>
    )
  }

  // Tags (Admin → Catalog → Tags): a Workspace or bundle matches a tag
  // pill, and a search also matches its tags. Only tags in use show, most
  // used first.
  const productTags = useProductTags()
  const tagsOf = (id: string) => productTags.get(studioPortalId(id) ?? '') ?? []
  const hasTag = (id: string) => tag === 'All' || tagsOf(id).includes(tag)
  const tagChoices = useMemo(() => {
    const count = new Map<string, number>()
    for (const p of [...studioProducts, ...bundles]) {
      for (const t of productTags.get(studioPortalId(p.id) ?? '') ?? []) count.set(t, (count.get(t) ?? 0) + 1)
    }
    return Array.from(count).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name)
  }, [studioProducts, bundles, productTags])
  const shownTags = allTags ? tagChoices : tagChoices.slice(0, 12)

  const areas = useMemo(() => {
    const present = new Set<string>(studioProducts.map((p) => p.category))
    if (publishedList.length) present.add('business-entrepreneurship')
    return GROWTH_CATEGORIES.filter((g) => present.has(g.id))
  }, [studioProducts, publishedList])

  // Studio Workspaces carry no module types, so a Module Type filter hides
  // them; Industry matches the Workspace's Studio category.
  const studioResults = useMemo(() => {
    if (moduleType !== 'All') return []
    const list = studioProducts.filter(
      (p) =>
        (area === 'All' || p.category === area) &&
        (category === 'All' || p.industry === category) &&
        hasTag(p.id) &&
        matchesSearch(query, `${p.title} ${p.description} ${tagsOf(p.id).join(' ')}`),
    )
    return [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.basePrice - b.basePrice
      if (sort === 'price-desc') return b.basePrice - a.basePrice
      if (sort === 'name-asc') return a.title.localeCompare(b.title)
      return 0
    })
  }, [studioProducts, query, category, area, moduleType, sort, tag, productTags])

  // Same filters as the Workspaces; each bundle with the Workspaces it includes.
  const bundleResults = useMemo(() => {
    if (moduleType !== 'All') return []
    const byId = new Map(studioProducts.map((p) => [p.id, p]))
    return bundles
      .filter(
        (b) =>
          (area === 'All' || b.category === area) &&
          (category === 'All' || b.industry === category) &&
          hasTag(b.id) &&
          matchesSearch(query, `${b.title} ${b.description} ${tagsOf(b.id).join(' ')}`),
      )
      .map((bundle) => ({
        bundle,
        items: (bundle.includedProductIds ?? []).flatMap((id) => {
          const item = byId.get(id)
          return item ? [item] : []
        }),
      }))
      .filter(({ items }) => items.length > 0)
  }, [bundles, studioProducts, query, category, area, moduleType, tag, productTags])

  const results = useMemo(() => {
    let list = publishedList.filter((s) => {
      if (tag !== 'All') return false
      if (area !== 'All' && area !== 'business-entrepreneurship') return false
      const matchesCategory = category === 'All' || s.category === category
      const matchesModule = moduleType === 'All' || s.modules.some((m) => m.type === moduleType)
      const matchesQuery = matchesSearch(query, `${s.title} ${s.shortDescription}`)
      return matchesCategory && matchesModule && matchesQuery
    })

    list = [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name-asc') return a.title.localeCompare(b.title)
      return 0 // 'featured' — catalog order
    })

    return list
  }, [publishedList, query, category, area, moduleType, sort, tag])

  const updateParams = (nextArea: string, nextCategory: string, nextTag = tag) => {
    const params: Record<string, string> = {}
    if (nextArea !== 'All') params.area = nextArea
    if (nextCategory !== 'All') params.category = nextCategory
    if (nextTag !== 'All') params.tag = nextTag
    setSearchParams(params)
  }

  const handleCategory = (c: string) => {
    setCategory(c)
    updateParams(area, c)
  }

  const handleArea = (a: string) => {
    setArea(a)
    updateParams(a, category)
  }

  const handleTag = (t: string) => {
    setTag(t)
    updateParams(area, category, t)
  }

  return (
    <section className="pt-36 pb-24 md:pt-44">
      <div className="container-px mx-auto max-w-page">
        <div className="max-w-2xl">
          <p className="eyebrow">Business Systems™</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Find the system built for your business.
          </h1>
        </div>

        <div className="mt-8">
          <SearchToolbar
            query={query}
            onQueryChange={setQuery}
            sortValue={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
          />
        </div>

        <div className="mt-6 space-y-3">
          {areas.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-navy/30">Area</span>
              <FilterPill label="All" active={area === 'All'} onClick={() => handleArea('All')} />
              {areas.map((g) => (
                <FilterPill key={g.id} label={g.label} active={area === g.id} onClick={() => handleArea(g.id)} icon={lookIcon(looks.bySlug.get(g.id), area === g.id)} />
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-navy/30">Industry</span>
            {industries.map((c) => (
              <FilterPill key={c} label={c} active={category === c} onClick={() => handleCategory(c)} icon={lookIcon(looks.byName.get(c), category === c)} />
            ))}
          </div>
          {tagChoices.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-navy/30">Tags</span>
              <FilterPill label="All" active={tag === 'All'} onClick={() => handleTag('All')} />
              {(tag !== 'All' && !shownTags.includes(tag) ? [tag, ...shownTags] : shownTags).map((t) => (
                <FilterPill key={t} label={t} active={tag === t} onClick={() => handleTag(t)} />
              ))}
              {tagChoices.length > 12 && (
                <button type="button" onClick={() => setAllTags((v) => !v)} className="text-[13px] font-semibold text-primary hover:underline">
                  {allTags ? 'Fewer' : `+${tagChoices.length - 12} more`}
                </button>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-navy/30">Module Type</span>
            <FilterPill label="All" active={moduleType === 'All'} onClick={() => setModuleType('All')} />
            {allModuleTypes.map((t) => (
              <FilterPill key={t} label={MODULE_TYPE_CONFIG[t].label} active={moduleType === t} onClick={() => setModuleType(t)} />
            ))}
          </div>
        </div>

        {bundleResults.length + studioResults.length + results.length > 0 ? (
          <Grid cols={3} className="mt-10">
            {bundleResults.map(({ bundle, items }, i) => (
              <motion.div
                key={bundle.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 6) * 0.06, duration: 0.5 }}
              >
                <BundleCard bundle={bundle} items={items} />
              </motion.div>
            ))}
            {studioResults.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 6) * 0.06, duration: 0.5 }}
              >
                <StudioWorkspaceCard product={product} />
              </motion.div>
            ))}
            {results.map((sys, i) => (
              <motion.div
                key={sys.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 6) * 0.06, duration: 0.5 }}
              >
                <BusinessSystemCard system={sys} />
              </motion.div>
            ))}
          </Grid>
        ) : (
          <div className="mt-16">
            <EmptyState title="No systems match your search." description="Try a different keyword, industry, or module type." />
          </div>
        )}
      </div>
    </section>
  )
}
