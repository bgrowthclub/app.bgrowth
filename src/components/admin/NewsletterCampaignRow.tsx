import { ChevronRight, Megaphone, Mail } from 'lucide-react'
import type { AdminNewsletterCampaignSummary } from '../../modules/admin/types'
import { formatDate, pillClass } from './styles'

interface Props {
  campaign: AdminNewsletterCampaignSummary
  areaLabels: Record<string, string>
  onOpen: () => void
}

const STATUS = {
  draft: { label: 'Draft', tone: 'gray' },
  sending: { label: 'Sending', tone: 'amber' },
  sent: { label: 'Sent', tone: 'green' },
} as const

// One e-mail in Admin → Newsletter's list.
export default function NewsletterCampaignRow({ campaign, areaLabels, onOpen }: Props) {
  const status = STATUS[campaign.status]
  const Icon = campaign.kind === 'launch' ? Megaphone : Mail
  const audience =
    campaign.audience_areas.length === 0 ? 'All subscribers' : campaign.audience_areas.map((a) => areaLabels[a] ?? a).join(', ')
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-bg-soft/60"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bg-soft text-primary">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-[14px] font-semibold text-navy">{campaign.subject || 'Untitled e-mail'}</span>
        <span className="mt-0.5 block text-[12.5px] text-navy/45">
          {audience} ·{' '}
          {campaign.status === 'sent'
            ? `${campaign.sent_count} sent on ${formatDate(campaign.sent_at)}`
            : `edited ${formatDate(campaign.updated_at)}`}
        </span>
      </span>
      <span className={pillClass(status.tone)}>{status.label}</span>
      <ChevronRight size={16} className="shrink-0 text-navy/30" />
    </button>
  )
}
