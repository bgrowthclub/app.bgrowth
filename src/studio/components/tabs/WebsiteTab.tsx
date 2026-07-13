import { Plus, X } from 'lucide-react'
import Field from '../ui/Field'
import { inputClass, textareaClass } from '../ui/formStyles'
import type { Product, ProductBenefit, ProductFaqItem } from '../../../modules/commerce/types/product'

interface Props {
  product: Product
  onChange: (patch: Partial<Product>) => void
  allProducts: Product[]
}

function ListSectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12.5px] font-semibold text-navy/70">{title}</span>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-primary-accent"
      >
        <Plus size={13} />
        Add
      </button>
    </div>
  )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove"
      className="shrink-0 rounded-lg p-1.5 text-navy/30 hover:bg-bg-soft hover:text-navy/60"
    >
      <X size={14} />
    </button>
  )
}

export default function WebsiteTab({ product, onChange, allProducts }: Props) {
  const benefits = product.benefits
  const included = product.whatsIncluded ?? []
  const faq = product.faq ?? []
  const relatedIds = product.relatedProductIds ?? []

  function updateBenefit(index: number, patch: Partial<ProductBenefit>) {
    onChange({ benefits: benefits.map((b, i) => (i === index ? { ...b, ...patch } : b)) })
  }
  function addBenefit() {
    onChange({ benefits: [...benefits, { title: '', description: '' }] })
  }
  function removeBenefit(index: number) {
    onChange({ benefits: benefits.filter((_, i) => i !== index) })
  }

  function updateFaq(index: number, patch: Partial<ProductFaqItem>) {
    onChange({ faq: faq.map((f, i) => (i === index ? { ...f, ...patch } : f)) })
  }
  function addFaq() {
    onChange({ faq: [...faq, { question: '', answer: '' }] })
  }
  function removeFaq(index: number) {
    onChange({ faq: faq.filter((_, i) => i !== index) })
  }

  function toggleRelated(id: string) {
    onChange({
      relatedProductIds: relatedIds.includes(id) ? relatedIds.filter((r) => r !== id) : [...relatedIds, id],
    })
  }

  return (
    <div className="max-w-2xl space-y-10">
      <div className="space-y-4">
        <p className="eyebrow">Hero</p>
        <Field label="Headline">
          <input
            className={inputClass}
            value={product.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>
        <Field label="Subheadline">
          <input
            className={inputClass}
            value={product.subtitle ?? ''}
            onChange={(e) => onChange({ subtitle: e.target.value })}
          />
        </Field>
      </div>

      <div className="space-y-3">
        <ListSectionHeader title="Benefits" onAdd={addBenefit} />
        {benefits.map((benefit, i) => (
          <div key={i} className="flex items-start gap-2 rounded-xl border border-navy/[0.06] bg-white p-3">
            <div className="flex-1 space-y-2">
              <input
                className={inputClass}
                value={benefit.title}
                onChange={(e) => updateBenefit(i, { title: e.target.value })}
                placeholder="Benefit title"
              />
              <input
                className={inputClass}
                value={benefit.description}
                onChange={(e) => updateBenefit(i, { description: e.target.value })}
                placeholder="Benefit description"
              />
            </div>
            <RemoveButton onClick={() => removeBenefit(i)} />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <ListSectionHeader title="What's Included" onAdd={() => onChange({ whatsIncluded: [...included, ''] })} />
        {included.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={inputClass}
              value={item}
              onChange={(e) => onChange({ whatsIncluded: included.map((v, vi) => (vi === i ? e.target.value : v)) })}
            />
            <RemoveButton onClick={() => onChange({ whatsIncluded: included.filter((_, vi) => vi !== i) })} />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <ListSectionHeader title="FAQ" onAdd={addFaq} />
        {faq.map((item, i) => (
          <div key={i} className="flex items-start gap-2 rounded-xl border border-navy/[0.06] bg-white p-3">
            <div className="flex-1 space-y-2">
              <input
                className={inputClass}
                value={item.question}
                onChange={(e) => updateFaq(i, { question: e.target.value })}
                placeholder="Question"
              />
              <textarea
                className={textareaClass}
                rows={2}
                value={item.answer}
                onChange={(e) => updateFaq(i, { answer: e.target.value })}
                placeholder="Answer"
              />
            </div>
            <RemoveButton onClick={() => removeFaq(i)} />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-[12.5px] font-semibold text-navy/70">Related Products</p>
        <div className="flex flex-wrap gap-2">
          {allProducts
            .filter((p) => p.id !== product.id)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleRelated(p.id)}
                className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  relatedIds.includes(p.id)
                    ? 'border-primary/20 bg-bg-soft text-primary'
                    : 'border-navy/10 bg-white text-navy/60 hover:border-primary/20'
                }`}
              >
                {p.title}
              </button>
            ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className="eyebrow">SEO</p>
        <Field label="Meta Title">
          <input
            className={inputClass}
            value={product.seo?.metaTitle ?? ''}
            onChange={(e) => onChange({ seo: { ...product.seo, metaTitle: e.target.value } })}
          />
        </Field>
        <Field label="Meta Description">
          <textarea
            className={textareaClass}
            rows={2}
            value={product.seo?.metaDescription ?? ''}
            onChange={(e) => onChange({ seo: { ...product.seo, metaDescription: e.target.value } })}
          />
        </Field>
        <Field label="Keywords" hint="Comma-separated">
          <input
            className={inputClass}
            value={(product.seo?.keywords ?? []).join(', ')}
            onChange={(e) =>
              onChange({
                seo: {
                  ...product.seo,
                  keywords: e.target.value
                    .split(',')
                    .map((k) => k.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </Field>
      </div>
    </div>
  )
}
