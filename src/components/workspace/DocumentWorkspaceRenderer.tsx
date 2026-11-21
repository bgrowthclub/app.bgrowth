import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Printer, Download, RotateCcw, ChevronDown, Lightbulb } from 'lucide-react'
import type { WorkspaceContent, WorkspaceData } from '../../modules/workspace/types/content'
import { applyWorkspaceTheme } from '../../modules/workspace/lib/theme'
import { downloadElementAsPdf } from '../../modules/workspace/lib/pdf'
import { useWorkspaceProgress } from '../../modules/workspace/hooks/useWorkspaceProgress'
import Popover from '../platform/Popover'
import WorkspaceStepList from './WorkspaceStepList'
import WorkspaceStepCard from './WorkspaceStepCard'
import WorkspaceSectionFields from './WorkspaceSectionFields'
import WorkspaceGlanceCard from './WorkspaceGlanceCard'
import WorkspaceSaveBar from './WorkspaceSaveBar'
import WorkspaceCompletionPanel from './WorkspaceCompletionPanel'
import DocumentPrintSummary from './DocumentPrintSummary'
import { CARD } from './styles'

interface Props {
  content: WorkspaceContent
  initialData?: WorkspaceData
  // Present only when a saved record is open — without one, answers live
  // on this screen only (the viewer page offers "New Record" to save).
  onSave?: (data: WorkspaceData) => Promise<void>
  instanceLabel?: string
  /** When the open record was last saved (its updated_at). */
  savedAt?: string
  // Where the completion panel's "Back to …" goes.
  back: { to: string; label: string }
}

interface MenuItem {
  label: string
  description: string
  onSelect: () => void
}

function ActionMenu({ icon, label, items }: { icon: React.ReactNode; label: string; items: MenuItem[] }) {
  return (
    <Popover
      align="right"
      panelClassName="w-64 p-1.5"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-navy shadow-softer transition-colors hover:border-primary/20"
        >
          {icon}
          {label}
          <ChevronDown className="h-3.5 w-3.5 text-navy/40" />
        </button>
      )}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onSelect}
          className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left hover:bg-bg-soft"
        >
          <span className="text-[13px] font-semibold text-navy">{item.label}</span>
          <span className="text-[12px] text-navy/45">{item.description}</span>
        </button>
      ))}
    </Popover>
  )
}

// Document V1 — the Studio Workspace runtime, ported from the Portal
// (features/workspace-viewer/document-v1/DocumentWorkspaceRenderer.tsx):
// same progress rules, save points, and the same print/PDF document. On
// screen (21/11/2026, the owner's design) it is one step at a time: the steps
// on the left (a "Step n of m" button on a phone), the open step in the
// middle, "At a glance" and the Workspace's Pro tip on the right, and a save
// bar fixed at the bottom. The accent comes from the Workspace's brand color.
export default function DocumentWorkspaceRenderer({ content, initialData, onSave, instanceLabel, savedAt, back }: Props) {
  const [data, setData] = useState<WorkspaceData>(initialData ?? {})
  const [activeId, setActiveId] = useState(content.sections[0]?.id ?? '')
  const [hasReachedEnd, setHasReachedEnd] = useState(false)
  const [saving, setSaving] = useState<'none' | 'save' | 'continue'>('none')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(savedAt ?? null)
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialData ?? {}))
  const [stepsOpen, setStepsOpen] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  // True only while a blank print/PDF is being captured — the document
  // renders `{}` instead of `data` for that moment.
  const [isBlankPrintPending, setIsBlankPrintPending] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const printableRef = useRef<HTMLDivElement>(null)
  const stepTopRef = useRef<HTMLDivElement>(null)

  const progress = useWorkspaceProgress(content, data)
  const dirty = useMemo(() => JSON.stringify(data) !== savedSnapshot, [data, savedSnapshot])
  const total = content.sections.length
  const activeIndex = Math.max(0, content.sections.findIndex((s) => s.id === activeId))
  const active = content.sections[activeIndex]
  const proTip = content.footer?.proTip?.trim()

  useEffect(() => {
    if (rootRef.current) applyWorkspaceTheme(content.brand.primaryColor, rootRef.current)
  }, [content.brand.primaryColor])

  function toTop() {
    requestAnimationFrame(() => {
      const el = stepTopRef.current
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function open(id: string) {
    setActiveId(id)
    setHasReachedEnd(false)
    setStepsOpen(false)
    toTop()
  }

  function handleSectionValueChange(sectionId: string, value: WorkspaceData[string]) {
    setData((prev) => ({ ...prev, [sectionId]: value }))
  }

  async function save(kind: 'save' | 'continue'): Promise<boolean> {
    if (!onSave) return true
    setSaving(kind)
    setSaveError(null)
    try {
      await onSave(data)
      setSavedSnapshot(JSON.stringify(data))
      setLastSaved(new Date().toISOString())
      return true
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Couldn’t save. Please try again.')
      return false
    } finally {
      setSaving('none')
    }
  }

  async function handleContinue() {
    if (!(await save('continue'))) return
    const next = content.sections[activeIndex + 1]
    if (next) open(next.id)
    else {
      setHasReachedEnd(true)
      toTop()
    }
  }

  function handleReset() {
    if (!window.confirm('Reset this Workspace? Any unsaved changes will be cleared.')) return
    setData(initialData ?? {})
  }

  function handlePrintBlank() {
    flushSync(() => setIsBlankPrintPending(true))
    const revert = () => {
      setIsBlankPrintPending(false)
      window.removeEventListener('afterprint', revert)
    }
    window.addEventListener('afterprint', revert)
    window.print()
  }

  // Same html2pdf options as the Portal's Document V1 (pagebreak css+legacy,
  // 5/10mm margins) so the downloaded PDF paginates like a real print.
  async function downloadPdf(suffix: string) {
    if (!printableRef.current) return
    setIsGeneratingPdf(true)
    try {
      // Plain ASCII file name — some browsers drop names with symbols (e.g. "—").
      const safe = (text: string) => text.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      const base = `${safe(content.brand.name) || 'Workspace'}-${safe(instanceLabel ?? '') || 'Workspace'}`
      await downloadElementAsPdf(printableRef.current, `${base}${suffix}.pdf`, {
        pagebreakMode: ['css', 'legacy'],
        margin: [5, 10, 5, 10],
      })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  async function handleDownloadBlankPdf() {
    flushSync(() => setIsBlankPrintPending(true))
    try {
      await downloadPdf('-Blank')
    } finally {
      setIsBlankPrintPending(false)
    }
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
      <div className="no-print flex flex-col gap-6">
        <div className={`${CARD} flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center`}>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <p className="shrink-0 text-[13.5px] font-semibold text-navy">
              Step {activeIndex + 1} of {total} <span className="text-navy/30">·</span> {progress.percent}% complete
            </p>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-navy/[0.08]">
              <div className="h-full rounded-full bg-workspace-500 transition-all duration-300" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActionMenu
              icon={<Download className="h-4 w-4" />}
              label={isGeneratingPdf ? 'Preparing…' : 'Export PDF'}
              items={[
                { label: 'Download PDF', description: 'Includes your current answers', onSelect: () => void downloadPdf('') },
                { label: 'Download blank PDF', description: 'An empty copy to fill by hand', onSelect: () => void handleDownloadBlankPdf() },
              ]}
            />
            <ActionMenu
              icon={<Printer className="h-4 w-4" />}
              label="Print"
              items={[
                { label: 'Print filled', description: 'Prints your current answers', onSelect: () => window.print() },
                { label: 'Print blank', description: 'An empty copy to fill by hand', onSelect: handlePrintBlank },
              ]}
            />
            <button
              type="button"
              onClick={handleReset}
              title="Reset — clear the answers you haven’t saved"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-navy/50 transition-colors hover:bg-bg-soft hover:text-navy"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">Reset</span>
            </button>
          </div>
        </div>

        <div ref={stepTopRef} className="scroll-mt-24">
          {/* Phone and tablet: the steps behind one button. */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setStepsOpen((v) => !v)}
              aria-expanded={stepsOpen}
              className={`${CARD} flex w-full items-center gap-3 px-4 py-3.5 text-left`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-workspace-500 text-[12px] font-bold text-white">{activeIndex + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11.5px] font-bold uppercase tracking-wide text-workspace-600">
                  Step {activeIndex + 1} of {total}
                </span>
                <span className="block truncate text-[14px] font-semibold text-navy">{active?.title}</span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-navy/40 transition-transform ${stepsOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {stepsOpen && (
              <div className={`${CARD} mt-2 p-2`}>
                <WorkspaceStepList sections={content.sections} progress={progress.sections} activeId={activeId} onSelect={open} />
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-6 lg:mt-0 lg:grid-cols-[232px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)_272px]">
            <aside className="hidden space-y-5 lg:block">
              <div className={`${CARD} p-2`}>
                <WorkspaceStepList sections={content.sections} progress={progress.sections} activeId={activeId} onSelect={open} />
              </div>
              <div className={`${CARD} flex items-center gap-4 p-4`}>
                <span className="relative grid h-16 w-16 shrink-0 place-items-center">
                  <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3.2" className="text-navy/[0.07]" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      className="text-workspace-500 transition-all duration-500"
                      strokeDasharray={`${(progress.percent / 100) * 97.4} 97.4`}
                    />
                  </svg>
                  <span className="text-[14px] font-bold text-navy">{progress.percent}%</span>
                </span>
                <span className="text-[12.5px] leading-snug text-navy/55">
                  <span className="block font-semibold text-navy/75">Workspace progress</span>
                  Step {activeIndex + 1} of {total}
                </span>
              </div>
            </aside>

            <div className="min-w-0">
              {hasReachedEnd ? (
                <WorkspaceCompletionPanel
                  workspaceName={content.brand.name}
                  saved={Boolean(onSave)}
                  back={back}
                  onReviewSections={() => open(content.sections[0]?.id ?? '')}
                />
              ) : (
                active && (
                  <WorkspaceStepCard
                    number={activeIndex + 1}
                    totalSteps={total}
                    title={active.title}
                    description={active.description}
                    whyItMatters={active.whyItMatters}
                    tip={active.tip}
                  >
                    <WorkspaceSectionFields section={active} data={data} onSectionValueChange={handleSectionValueChange} />
                  </WorkspaceStepCard>
                )
              )}
            </div>

            <aside className="space-y-5 lg:col-start-2 xl:col-start-auto">
              <WorkspaceGlanceCard content={content} data={data} />
              {proTip && (
                <section className={`${CARD} p-5`}>
                  <h2 className="flex items-center gap-2 text-[14.5px] font-bold text-navy">
                    <Lightbulb className="h-[18px] w-[18px] text-workspace-500" aria-hidden />
                    Pro tip
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-navy/65">{proTip}</p>
                </section>
              )}
            </aside>
          </div>
        </div>

        {!hasReachedEnd && (
          <WorkspaceSaveBar
            canSave={Boolean(onSave)}
            dirty={dirty}
            savedAt={lastSaved}
            saving={saving}
            error={saveError}
            isLast={activeIndex === total - 1}
            onSave={() => void save('save')}
            onContinue={() => void handleContinue()}
          />
        )}
      </div>

      <div className="printable-summary-container">
        <DocumentPrintSummary
          ref={printableRef}
          content={content}
          data={isBlankPrintPending ? {} : data}
          percent={isBlankPrintPending ? 0 : progress.percent}
          instanceLabel={instanceLabel}
        />
      </div>
    </div>
  )
}
