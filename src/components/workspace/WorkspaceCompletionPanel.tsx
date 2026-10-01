import { CheckCircle2 } from 'lucide-react'
import Button from '../ui/Button'
import { SMALL_BUTTON } from './styles'

interface Props {
  workspaceName: string
  saved: boolean
  back: { to: string; label: string }
  onReviewSections: () => void
}

// Shown after the last step's "Finish Workspace".
export default function WorkspaceCompletionPanel({ workspaceName, saved, back, onReviewSections }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl3 border border-workspace-200 bg-workspace-50 p-8 text-center">
      <CheckCircle2 className="h-10 w-10 text-workspace-500" />
      <h2 className="font-display text-xl font-bold text-navy">Workspace completed</h2>
      <p className="max-w-md text-sm text-navy/55">
        {saved ? 'Your progress has been saved. ' : ''}You&rsquo;ve been through every section of {workspaceName}.
        Head back to {back.label}, or keep reviewing any section below.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button to={back.to} className={SMALL_BUTTON}>
          Back to {back.label}
        </Button>
        <Button type="button" variant="secondary" onClick={onReviewSections} className={SMALL_BUTTON}>
          Review Sections
        </Button>
      </div>
    </div>
  )
}
