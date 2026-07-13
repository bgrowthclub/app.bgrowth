import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import Button from '../../components/ui/Button'
import ProductListPanel from '../components/ProductListPanel'
import PublishDialog from '../components/PublishDialog'
import GeneralTab from '../components/tabs/GeneralTab'
import ContentSourceTab from '../components/tabs/ContentSourceTab'
import PricingTab from '../components/tabs/PricingTab'
import ImagesTab from '../components/tabs/ImagesTab'
import WebsiteTab from '../components/tabs/WebsiteTab'
import PublishingTab from '../components/tabs/PublishingTab'
import { productAdminService } from '../../modules/commerce/services/ProductAdminService'
import { createEmptyProductDraft } from '../lib/emptyProduct'
import type { Product } from '../../modules/commerce/types/product'

type TabId = 'general' | 'source' | 'pricing' | 'images' | 'website' | 'publishing'

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'source', label: 'Content Source' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'images', label: 'Images' },
  { id: 'website', label: 'Website' },
  { id: 'publishing', label: 'Publishing' },
]

// The Product Engine — a Product Management module, not a Product Builder.
// It imports an existing Content Source (by id, read-only — see
// lib/contentSources/ and ContentSourceTab) and manages everything about
// selling it: pricing, images, SEO, categories, visibility, related
// products, and publishing state. Every read/write here goes through
// ProductAdminService, never through mock/mockProducts.ts directly.
export default function ProductEnginePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [dirty, setDirty] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)

  async function refresh() {
    const all = await productAdminService.getAll()
    setProducts(all)
    return all
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setDraft(null)
      return
    }
    const match = products.find((p) => p.id === selectedId)
    if (match) setDraft(match)
  }, [selectedId, products])

  function handleSelect(id: string) {
    setSelectedId(id)
    setActiveTab('general')
    setDirty(false)
  }

  function handleNew() {
    const fresh = createEmptyProductDraft()
    setProducts((prev) => [fresh, ...prev])
    setSelectedId(fresh.id)
    setActiveTab('general')
    setDirty(false)
  }

  function handleChange(patch: Partial<Product>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
    setDirty(true)
  }

  async function handleSave() {
    if (!draft) return
    const saved = await productAdminService.save(draft)
    await refresh()
    setSelectedId(saved.id)
    setDirty(false)
  }

  async function handlePublishClick() {
    if (draft) await productAdminService.save(draft)
    setPublishOpen(true)
  }

  async function handlePublishComplete() {
    if (!selectedId) return
    await productAdminService.publish(selectedId)
    await refresh()
    setDirty(false)
  }

  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow">BGrowth Studio</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-navy md:text-3xl">Product Engine</h1>
        <p className="mt-2 max-w-xl text-[14px] text-navy/55">
          Import an existing Content Source and manage everything about selling it — pricing, images, SEO, and
          publishing. Source content itself is never edited here.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
        <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
          <ProductListPanel products={products} selectedId={selectedId} onSelect={handleSelect} onNew={handleNew} />
        </div>

        <div className="rounded-xl3 border border-navy/[0.06] bg-white shadow-softer">
          {!draft ? (
            <div className="flex h-96 items-center justify-center p-10 text-center">
              <p className="text-[14px] text-navy/40">Select a product on the left, or create a new one.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between border-b border-navy/[0.06] px-6 py-4">
                <div className="flex gap-1 overflow-x-auto">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                        activeTab === tab.id ? 'bg-bg-soft text-primary' : 'text-navy/50 hover:text-navy'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={handleSave}
                  variant="secondary"
                  icon={<Save size={14} />}
                  className="!px-4 !py-2 !text-[12.5px]"
                >
                  {dirty ? 'Save Changes' : 'Saved'}
                </Button>
              </div>

              <div className="p-6">
                {activeTab === 'general' && <GeneralTab product={draft} onChange={handleChange} />}
                {activeTab === 'source' && <ContentSourceTab product={draft} onChange={handleChange} />}
                {activeTab === 'pricing' && <PricingTab product={draft} onChange={handleChange} />}
                {activeTab === 'images' && <ImagesTab product={draft} onChange={handleChange} />}
                {activeTab === 'website' && <WebsiteTab product={draft} onChange={handleChange} allProducts={products} />}
                {activeTab === 'publishing' && <PublishingTab product={draft} onPublish={handlePublishClick} />}
              </div>
            </div>
          )}
        </div>
      </div>

      <PublishDialog open={publishOpen} onClose={() => setPublishOpen(false)} onComplete={handlePublishComplete} />
    </div>
  )
}
