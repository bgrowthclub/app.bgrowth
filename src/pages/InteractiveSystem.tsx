import { useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { Printer, FileDown, RotateCcw, BookOpen, Handshake, Sparkles, X, PanelRight } from 'lucide-react'
import SystemSectionBlock, { FieldValues } from '../components/systems/SystemSectionBlock'
import ModuleBadge from '../components/systems/ModuleBadge'
import ResourceCard from '../components/systems/ResourceCard'
import { getSystemBySlug } from '../data/systems'

export default function InteractiveSystem() {
  const { slug } = useParams<{ slug: string }>()
  const system = slug ? getSystemBySlug(slug) : undefined

  // Values are scoped per-component so switching modules never bleeds one
  // module's field values into another. Nothing here persists anywhere —
  // it's plain React state for the current browser session only.
  const [valuesByComponent, setValuesByComponent] = useState<Record<string, FieldValues>>({})
  const [activeIndex, setActiveIndex] = useState(0)
  const [resourcesOpen, setResourcesOpen] = useState(false)

  if (!system) return <Navigate to="/systems" replace />

  const activeComponent = system.components[activeIndex]
  const activeValues = valuesByComponent[activeComponent.id] ?? {}

  const handleFieldChange = (fieldId: string, value: string | boolean) => {
    setValuesByComponent((prev) => ({
      ...prev,
      [activeComponent.id]: { ...(prev[activeComponent.id] ?? {}), [fieldId]: value },
    }))
  }

  const handleRestart = () => {
    if (window.confirm('Restart this module? Nothing is saved, so anything you\u2019ve entered will be cleared.')) {
      setValuesByComponent((prev) => ({ ...prev, [activeComponent.id]: {} }))
    }
  }

  // There is no backend and nothing is stored — "Save PDF" uses the browser's
  // native print dialog, where the person chooses "Save as PDF" as the destination.
  const handlePrintOrSave = () => window.print()

  return (
    <div className="pb-24 pt-24 md:pt-28">
      {/* Sticky header + module navigation */}
      <div className="no-print sticky top-[64px] z-40 border-b border-navy/[0.06] bg-white/90 backdrop-blur-xl">
        <div className="container-px mx-auto max-w-4xl py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link to={`/product/${system.slug}`} className="text-[12.5px] font-semibold text-primary">
                ← {system.name}
              </Link>
              {system.components.length > 1 && (
                <p className="mt-0.5 text-[11px] text-navy/35">
                  Module {activeIndex + 1} of {system.components.length}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setResourcesOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-navy/10 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-navy/70 hover:border-primary/20"
              >
                <PanelRight size={14} />
                Resources
              </button>
              <button
                onClick={handlePrintOrSave}
                className="inline-flex items-center gap-1.5 rounded-xl border border-navy/10 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-navy/70 hover:border-primary/20"
              >
                <Printer size={14} />
                Print
              </button>
              <button
                onClick={handlePrintOrSave}
                className="inline-flex items-center gap-1.5 rounded-xl bg-grad-primary px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-softer"
              >
                <FileDown size={14} />
                Save PDF
              </button>
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-1.5 rounded-xl border border-navy/10 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-navy/50 hover:border-red-200 hover:text-red-500"
              >
                <RotateCcw size={14} />
                Restart
              </button>
            </div>
          </div>

          {/* Module navigation — only shown when a system bundles more than one component */}
          {system.components.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {system.components.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setActiveIndex(i)}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                    i === activeIndex
                      ? 'bg-grad-primary text-white shadow-softer'
                      : 'border border-navy/10 bg-white text-navy/55 hover:border-primary/20'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container-px mx-auto max-w-4xl pt-10">
        <div className="mb-2 print:mb-6 print:block">
          <p className="eyebrow">{system.category}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-navy md:text-3xl">
              {activeComponent.name}
            </h1>
            <ModuleBadge type={activeComponent.type} className="no-print" />
          </div>
          <p className="mt-1.5 text-[13px] text-navy/40">Part of {system.name}</p>
        </div>

        <div className="mt-8 space-y-5">
          {activeComponent.content.map((section, i) => (
            <SystemSectionBlock
              key={section.id}
              section={section}
              index={i}
              values={activeValues}
              onFieldChange={handleFieldChange}
            />
          ))}
        </div>

        {/* Follow-up actions — no history, no database, purely navigational */}
        <div className="no-print mt-10 grid gap-3 sm:grid-cols-3">
          <Link
            to={`/product/${system.slug}#resources`}
            className="flex items-center justify-center gap-2 rounded-xl border border-navy/10 bg-white px-4 py-3.5 text-[13px] font-semibold text-navy/70 shadow-softer hover:border-primary/20"
          >
            <BookOpen size={15} />
            Resources
          </Link>
          <a
            href="#"
            className="flex items-center justify-center gap-2 rounded-xl border border-navy/10 bg-white px-4 py-3.5 text-[13px] font-semibold text-navy/70 shadow-softer hover:border-primary/20"
          >
            <Handshake size={15} />
            Affiliate Partners
          </a>
          <Link
            to="/systems"
            className="flex items-center justify-center gap-2 rounded-xl border border-navy/10 bg-white px-4 py-3.5 text-[13px] font-semibold text-navy/70 shadow-softer hover:border-primary/20"
          >
            <Sparkles size={15} />
            Recommended Systems
          </Link>
        </div>
      </div>

      {/* Resources panel */}
      {resourcesOpen && (
        <div className="no-print fixed inset-0 z-50 flex justify-end bg-navy/20 backdrop-blur-sm" onClick={() => setResourcesOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-sm overflow-y-auto bg-white p-6 shadow-glow"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-navy">Resources™</h2>
              <button
                onClick={() => setResourcesOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-navy/40 hover:bg-bg-soft hover:text-navy"
                aria-label="Close resources panel"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-1.5 text-[13px] text-navy/45">Reference material for {system.name}.</p>
            <div className="mt-6 space-y-3">
              {system.resources.map((r) => (
                <ResourceCard key={r.title} resource={r} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
