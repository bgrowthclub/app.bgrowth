// BGrowth Support Center — shapes shared by the member side
// (supportService) and the team side (Admin → Support).

export interface SupportHours {
  timezone: string // IANA, e.g. "America/Los_Angeles"
  days: number[] // 0 = Sunday … 6 = Saturday
  start: string // "HH:MM"
  end: string // "HH:MM"
}

export interface SupportConversationSummary {
  id: string
  subject: string
  status: 'open' | 'closed'
  last_sender: 'customer' | 'staff'
  last_message_at: string
  created_at: string
  // Member side only: the team replied since the member last looked.
  unread?: boolean
}

export interface SupportMessage {
  id: string
  sender: 'customer' | 'staff'
  author_name: string | null
  body: string
  created_at: string
}

export interface SupportState {
  hours: SupportHours
  online: boolean
  conversations: SupportConversationSummary[]
}

export interface SupportThread {
  conversation: SupportConversationSummary
  messages: SupportMessage[]
}
