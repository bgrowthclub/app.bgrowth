import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Printer, Download, RotateCcw, ChevronDown } from 'lucide-react'
import type { WorkspaceContent, WorkspaceData } from '../../modules/workspace/types/content'
import { applyWorkspaceTheme } from '../../modules/workspace/lib/theme'
import { downloadElementAsPdf } from '../../modules/workspace/lib/pdf'
import { useWorkspaceProgress } from '../../modules/workspace/hooks/useWorkspaceProgress'
import Popover from '../platform/Popover'
import Button from '../ui/Button'
import WorkspaceAccordion from './WorkspaceAccordion'
import WorkspaceCompletionPanel from './WorkspaceCompletionPanel'
import DocumentPrintSummary from './DocumentPrintSummary'
import { CARD, SMALL_BUTTON, WORKSPACE_BUTTON } from './styles'

interface Props {
  content: WorkspaceContent
  initialData?: WorkspaceData
  // Present only when a saved record is open — without one, answers live
  // on this screen only (the viewer page offers "New Record" to save).
  onSave?: (data: WorkspaceData) => Promise<void>
  instanceLabel?: string
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-[13px] font-semibold text-navy shadow-softer transition-colors hover:border-primary/20 sm:w-auto"
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
// same step-by-step fill flow, progress rules, save points, and the same
// print/PDF document. On screen it uses this site's look (tokens); the
// accent comes from the Workspace's own brand color.
export default function DocumentWorkspaceRenderer({ content, initialData, onSave, instanceLabel, back }: Props) {
  const [data, setData] = useState<WorkspaceData>(initialData ?? {})
  const [activeId, setActiveId] = useState(content.sections[0]?.id ?? '')
  const [hasReachedEnd, setHasReachedEnd] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSectionSaving, setIsSectionSaving] = useState(false)
  const [sectionSaveError, setSectionSaveError] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  // True only while a blank print/PDF is being captured — the document
  // renders `{}` instead of `data` for that moment.
  const [isBlankPrintPending, setIsBlankPrintPending] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const printableRef = useRef<HTMLDivElement>(null)
  const activeSectionRef = useRef<HTMLDivElement>(null)
  const completionRef = useRef<HTMLDivElement>(null)

  const progress = useWorkspaceProgress(content, data)

  useEffect(() => {
    if (rootRef.current) applyWorkspaceTheme(content.brand.primaryColor, rootRef.current)
  }, [content.brand.primaryColor])

  useEffect(() => {
    if (!hasReachedEnd) return
    requestAnimationFrame(() => completionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [hasReachedEnd])

  function handleSectionValueChange(sectionId: string, value: WorkspaceData[string]) {
    setData((prev) => ({ ...prev, [sectionId]: value }))
  }

  function advance(sectionId: string) {
    const index = content.sections.findIndex((s) => s.id === sectionId)
    const next = content.sections[index + 1]
    if (next) {
      setActiveId(next.id)
      requestAnimationFrame(() => activeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } else {
      setHasReachedEnd(true)
    }
  }

  async function handleContinue(sectionId: string) {
    setSectionSaveError(null)
    if (!onSave) return advance(sectionId)
    setIsSectionSaving(true)
    try {
      await onSave(data)
      advance(sectionId)
    } catch (err) {
      setSectionSaveError(err instanceof Error ? err.message : 'Couldn’t save your progress. Please try again.')
    } finally {
      setIsSectionSaving(false)
    }
  }

  async function handleSave() {
    if (!onSave) return
    setIsSaving(true)
    setJustSaved(false)
    setSaveError(null)
    try {
      await onSave(data)
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Couldn’t save. Please try again.')
    } finally {
      setIsSaving(false)
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
    <div ref={rootRef} className="flex flex-col gap-8">
      <div className="no-print flex flex-col gap-8">
        <div className={`${CARD} flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-workspace-600">{content.brand.companyLabel}</p>
            <h2 className="mt-1 font-display text-xl font-bold text-navy">{content.brand.name}</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-3">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-navy/10">
                <div
                  className="h-full rounded-full bg-workspace-500 transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-navy/75">{progress.percent}%</span>
            </div>
            {onSave && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`${SMALL_BUTTON} ${WORKSPACE_BUTTON} w-full sm:w-auto`}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
                {justSaved && <span className="text-xs font-medium text-emerald-600">Saved ✓</span>}
                {saveError && <span className="text-xs font-medium text-red-500">{saveError}</span>}
              </div>
            )}
            <ActionMenu
              icon={<Printer className="h-4 w-4" />}
              label="Print"
              items={[
                { label: 'Print filled', description: 'Prints your current answers', onSelect: () => window.print() },
                { label: 'Print blank', description: 'An empty copy to fill by hand', onSelect: handlePrintBlank },
              ]}
            />
            <ActionMenu
              icon={<Download className="h-4 w-4" />}
              label={isGeneratingPdf ? 'Preparing…' : 'PDF'}
              items={[
                { label: 'Download PDF', description: 'Includes your current answers', onSelect: () => void downloadPdf('') },
                { label: 'Download blank PDF', description: 'An empty copy to fill by hand', onSelect: () => void handleDownloadBlankPdf() },
              ]}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              icon={<RotateCcw className="h-4 w-4" />}
              className={`${SMALL_BUTTON} w-full sm:w-auto`}
            >
              Reset
            </Button>
          </div>
        </div>

        {hasReachedEnd && (
          <div ref={completionRef} className="scroll-mt-24">
            <WorkspaceCompletionPanel
              workspaceName={content.brand.name}
              saved={Boolean(onSave)}
              back={back}
              onReviewSections={() => setHasReachedEnd(false)}
            />
          </div>
        )}

        <WorkspaceAccordion
          content={content}
          data={data}
          activeId={activeId}
          onSelect={setActiveId}
          onContinue={handleContinue}
          onSectionValueChange={handleSectionValueChange}
          progressBySection={progress.sections}
          isContinueSaving={isSectionSaving}
          continueError={sectionSaveError}
          activeSectionRef={activeSectionRef}
        />
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
