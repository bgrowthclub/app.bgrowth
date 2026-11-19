import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import catalogHero from '../assets/catalog-hero.webp'
import SEO from '../components/seo/SEO'
import { seoPage } from '../data/seoPages'
import { motion } from 'framer-motion'
import SearchToolbar from '../components/ui/SearchToolbar'
import { recordCatalogSearch } from '../lib/searchStats'
import { CheckCircle2, Gift, X, Zap } from 'lucide-react'
import FilterSelect from '../components/ui/FilterSelect'
import ViewToggle from '../components/ui/ViewToggle'
import type { CardView } from '../components/ui/ViewToggle'
import BusinessSystemCard from '../components/systems/BusinessSystemCard'
import CatalogProductCard from '../components/systems/CatalogProductCard'
import Pagination from '../components/ui/Pagination'
import BundleCard from '../components/systems/BundleCard'
import { MODULE_TYPE_CONFIG } from '../components/systems/ModuleBadge'
import EmptyState from '../components/ui/EmptyState'
import Grid from '../components/layout/Grid'
import { loadBundleProducts, loadPublishedSystemProducts, loadStudioWorkspaceProducts, systemForCard } from '../lib/publishedCatalog'
import type { Product } from '../modules/commerce/types/product'
import { GROWTH_CATEGORIES } from '../types/growth'
import { useProductTags } from '../lib/useProductTags'
import { studioPortalId } from '../modules/commerce/store/studioProductRepository'
import { studioProductNoun } from '../modules/workspace/lib/productNoun'
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
// A buyer sees four kinds; a PDF and a Kit are both a download to them.
const KINDS = ['Workspace', 'Course', 'Calculator', 'Download'] as const

function kindOf(product: Product): string {
  const noun = studioProductNoun(product)
  return noun === 'PDF' || noun === 'Kit' ? 'Download' : noun
}

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
  const [sort, setSort] = useState('featured')
  const [view, setView] = useState<CardView>('grid')
  // "Free" chip (19/11/2026, the owner's design) and 9 per page.
  const [freeOnly, setFreeOnly] = useState(searchParams.get('free') === '1')
  const [page, setPage] = useState(1)

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
  // What kind of thing: a course, a calculator, a download or a Workspace
  // (31/10/2026). A PDF and a Kit are both "Downloads" to a buyer.
  // Também vem da URL (06/11/2026): a Home liga para o catálogo já
  // filtrado — /systems?type=course — e sem isto o link caía no catálogo
  // inteiro, sem filtro nenhum.
  const [kind, setKind] = useState(() => {
    const given = (searchParams.get('type') ?? '').toLowerCase()
    return KINDS.find((k) => k.toLowerCase() === given) ?? 'All'
  })
  // Bundles of those Workspaces (Portal migration 0041) — listed first.
  const [bundles, setBundles] = useState<Product[]>([])
  // The Studio products have arrived — only then is "no results" true.
  const [catalogLoaded, setCatalogLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadPublishedSystemProducts().then((pairs) => {
      if (!cancelled) setPublishedSystems(pairs)
    })
    loadStudioWorkspaceProducts()
      .then((products) => {
        if (!cancelled) setStudioProducts(products)
      })
      .finally(() => {
        if (!cancelled) setCatalogLoaded(true)
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

  // The Area and Industry filters carried the category's own icon while
  // they were pills (Admin → Catalog → Categories). A dropdown option can't
  // hold one, so lookIcon/useCategoryLooks went with them (07/11/2026); the
  // icons still appear on the cards themselves. useCategoryLooks and
  // categoryLook are untouched and used elsewhere.

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
        (kind === 'All' || kindOf(p) === kind) &&
        (!freeOnly || p.basePrice === 0) &&
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
  }, [studioProducts, query, category, area, moduleType, sort, tag, productTags, kind, freeOnly])

  // Same filters as the Workspaces; each bundle with the Workspaces it includes.
  const bundleResults = useMemo(() => {
    // A bundle mixes kinds, so filtering by one kind hides it.
    if (moduleType !== 'All' || kind !== 'All') return []
    const byId = new Map(studioProducts.map((p) => [p.id, p]))
    return bundles
      .filter(
        (b) =>
          (area === 'All' || b.category === area) &&
          (category === 'All' || b.industry === category) &&
          (!freeOnly || b.basePrice === 0) &&
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
  }, [bundles, studioProducts, query, category, area, moduleType, tag, productTags, kind, freeOnly])

  const results = useMemo(() => {
    let list = publishedList.filter((s) => {
      if (tag !== 'All') return false
      if (freeOnly && s.price !== 0) return false
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
  }, [publishedList, query, category, area, moduleType, sort, tag, freeOnly])

  // Records what was searched (Product Discovery data, Portal migration 0052)
  // once the visitor stops typing — counted against the whole catalog, not
  // the current filters, so "no results" means we really don't have it.
  useEffect(() => {
    const q = query.trim()
    if (!catalogLoaded || q.length < 3) return
    const timer = window.setTimeout(() => {
      const found =
        studioProducts.filter((p) => matchesSearch(q, `${p.title} ${p.description} ${tagsOf(p.id).join(' ')}`)).length +
        bundles.filter((b) => matchesSearch(q, `${b.title} ${b.description} ${tagsOf(b.id).join(' ')}`)).length +
        publishedList.filter((s) => matchesSearch(q, `${s.title} ${s.shortDescription}`)).length
      recordCatalogSearch(q, found)
    }, 1500)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, catalogLoaded])

  const updateParams = (nextArea: string, nextCategory: string, nextTag = tag, nextKind = kind, nextFree = freeOnly) => {
    setPage(1)
    const params: Record<string, string> = {}
    if (nextFree) params.free = '1'
    if (nextArea !== 'All') params.area = nextArea
    if (nextCategory !== 'All') params.category = nextCategory
    if (nextTag !== 'All') params.tag = nextTag
    if (nextKind !== 'All') params.type = nextKind.toLowerCase()
    setSearchParams(params)
  }

  const handleKind = (k: string) => {
    setKind(k)
    updateParams(area, category, tag, k)
  }

  const handleFree = (on: boolean) => {
    setFreeOnly(on)
    updateParams(area, category, tag, kind, on)
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

  // What is filtered right now, shown back as clearable chips — a dropdown
  // hides its options, so without this the page never says why it is
  // showing three products instead of thirty.
  const activeFilters: { label: string; clear: () => void }[] = []
  if (area !== 'All') {
    activeFilters.push({ label: areas.find((g) => g.id === area)?.label ?? area, clear: () => handleArea('All') })
  }
  if (category !== 'All') activeFilters.push({ label: category, clear: () => handleCategory('All') })
  if (kind !== 'All') activeFilters.push({ label: kind === 'Download' ? 'Downloads' : `${kind}s`, clear: () => handleKind('All') })
  if (tag !== 'All') activeFilters.push({ label: tag, clear: () => handleTag('All') })
  if (freeOnly) activeFilters.push({ label: 'Free', clear: () => handleFree(false) })
  if (moduleType !== 'All') {
    activeFilters.push({ label: MODULE_TYPE_CONFIG[moduleType].label, clear: () => setModuleType('All') })
  }

  const clearFilters = () => {
    setArea('All')
    setCategory('All')
    setKind('All')
    setTag('All')
    setModuleType('All')
    setFreeOnly(false)
    setPage(1)
    setSearchParams({})
  }

  // The result cards, built once and laid out either way below — the
  // list view must not fork this into a second copy of the same three
  // maps (07/11/2026).
  const allCards = [
    ...bundleResults.map(({ bundle, items }) => ({ key: bundle.id, node: <BundleCard bundle={bundle} items={items} /> })),
    ...studioResults.map((product) => ({ key: product.id, node: <CatalogProductCard product={product} /> })),
    ...results.map((sys) => ({ key: sys.slug, node: <BusinessSystemCard system={sys} /> })),
  ]
  const PAGE_SIZE = 9
  const pageCount = Math.max(1, Math.ceil(allCards.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const shownCards = allCards.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  // The result cards, built once and laid out either way below — the
  // list view must not fork this into a second copy (07/11/2026).
  const resultCards = (
    <>
      {shownCards.map(({ key, node }, i) => (
        <motion.div key={key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 6) * 0.06, duration: 0.5 }}>
          {node}
        </motion.div>
      ))}
    </>
  )
  // Chip counts: the whole catalog of each kind, so a chip never says 0
  // because of another filter.
  const kindCount = (k: string) => studioProducts.filter((p) => kindOf(p) === k).length
  const freeCount = studioProducts.filter((p) => p.basePrice === 0).length + bundles.filter((b) => b.basePrice === 0).length
  const totalCount = studioProducts.length + bundles.length + publishedList.length
  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors ${
      active ? 'bg-primary text-white shadow-softer' : 'border border-navy/10 bg-white text-navy/65 hover:border-primary/25 hover:text-navy'
    }`

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.06] via-bg to-bg pt-28 pb-24 md:pt-32">
      <SEO title={seoPage('/systems').title} description={seoPage('/systems').description} path="/systems" />
      <div className="container-px relative mx-auto max-w-page">
        {/* The header band from the owner's design (07/11/2026): the same
            tinted top the Home and Academy pages use, with her own render
            beside the title. The illustration is decorative — alt="" and a
            mask that fades its straight edges into the page, exactly as the
            Home hero does, so it reads as part of the page. */}
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)]">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-primary">
              Business Systems™ catalog
            </p>
            <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-navy md:text-[44px]">
              Find the system built for <span className="text-primary">your business.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-navy/60">
              Explore interactive Workspaces, courses, calculators and downloads to start, organize and grow with confidence.
            </p>
            {/* Only what is true: the count is the catalog's own. */}
            {catalogLoaded && totalCount > 0 && (
              <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-navy/60">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500" aria-hidden /> <strong className="text-navy">{totalCount}</strong> ready to use
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap size={15} className="text-primary" aria-hidden /> Instant access
                </span>
                {freeCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Gift size={15} className="text-rose-500" aria-hidden /> <strong className="text-navy">{freeCount}</strong> free
                  </span>
                )}
              </p>
            )}
          </div>

          <img
            src={catalogHero}
            alt=""
            width={810}
            height={454}
            className="hidden w-full lg:block [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent),linear-gradient(to_top,transparent,black_12%,black_94%,transparent)] [mask-composite:intersect] [-webkit-mask-composite:source-in]"
          />
        </div>

        <div className="mt-10 rounded-[22px] border border-navy/[0.07] bg-white p-4 shadow-softer sm:p-5">
          <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <SearchToolbar
              query={query}
              onQueryChange={(v) => {
                setQuery(v)
                setPage(1)
              }}
              sortValue={sort}
              onSortChange={setSort}
              sortOptions={SORT_OPTIONS}
            />
          </div>
          {/* Cards or list, the same control the member area has
              (07/11/2026). On a phone the toggle is hidden: the grid is one
              column there anyway, so the two views would look identical. */}
          <ViewToggle value={view} onChange={setView} className="hidden sm:flex" />
        </div>

        {/* The filters as dropdowns (07/11/2026, the owner's decision, which
            knowingly departs from her design's pill rows). Five rows of
            pills took 200px before the first product, and both Area and
            Industry grow on their own — eight Growth Categories are planned
            and an industry arrives with every new Workspace. The dropdowns
            hide the options, so what IS filtered is shown back as the chips
            below, each clearable. */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {areas.length > 1 && (
            <FilterSelect
              label="Area"
              value={area}
              onChange={handleArea}
              options={[{ value: 'All', label: 'All areas' }, ...areas.map((g) => ({ value: g.id, label: g.label }))]}
            />
          )}
          {industries.length > 1 && (
            <FilterSelect
              label="Industry"
              value={category}
              onChange={handleCategory}
              options={industries.map((c) => ({ value: c, label: c === 'All' ? 'All industries' : c }))}
            />
          )}
          {tagChoices.length > 0 && (
            <FilterSelect
              label="Tag"
              value={tag}
              onChange={handleTag}
              options={[{ value: 'All', label: 'All tags' }, ...tagChoices.map((t) => ({ value: t, label: t }))]}
            />
          )}
          {allModuleTypes.length > 0 && (
            <FilterSelect
              label="Module Type"
              value={moduleType}
              onChange={(v) => setModuleType(v as ModuleType | 'All')}
              options={[
                { value: 'All', label: 'All module types' },
                ...allModuleTypes.map((t) => ({ value: t, label: MODULE_TYPE_CONFIG[t].label })),
              ]}
            />
          )}
        </div>

        {/* Type as chips with counts, and "Free" (19/11/2026, the owner's
            design) — the Type dropdown became these. */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-navy/[0.06] pt-4">
          <button type="button" onClick={() => handleKind('All')} className={chip(kind === 'All')}>
            All ({totalCount})
          </button>
          {KINDS.filter((k) => kindCount(k) > 0).map((k) => (
            <button key={k} type="button" onClick={() => handleKind(k)} className={chip(kind === k)}>
              {k === 'Download' ? 'Downloads' : `${k}s`} ({kindCount(k)})
            </button>
          ))}
          {freeCount > 0 && (
            <button type="button" onClick={() => handleFree(!freeOnly)} className={chip(freeOnly)}>
              <Gift size={14} aria-hidden /> Free ({freeCount})
            </button>
          )}
        </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeFilters.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={f.clear}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.08] py-1.5 pl-3.5 pr-2.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                {f.label}
                <X size={13} aria-hidden />
                <span className="sr-only">Remove this filter</span>
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-1 text-[13px] font-semibold text-navy/45 transition-colors hover:text-navy"
            >
              Clear all
            </button>
          </div>
        )}

        {allCards.length > 0 ? (
          view === 'grid' ? (
            <Grid cols={3} className="mt-10">
              {resultCards}
            </Grid>
          ) : (
            <div className="mt-10 max-w-2xl space-y-5">{resultCards}</div>
          )
        ) : (
          <div className="mt-16">
            <EmptyState title="No systems match your search." description="Try a different keyword, industry, or module type." />
          </div>
        )}

        {allCards.length > 0 && (
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-navy/[0.07] pt-5 text-[13.5px] text-navy/55 sm:flex-row">
            <p>
              Showing <strong className="text-navy">{shownCards.length}</strong> of <strong className="text-navy">{allCards.length}</strong>
            </p>
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onChange={(n) => {
                setPage(n)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
