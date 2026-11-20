import { SERVICE_LINK_RE } from '../../modules/find/memberPageService'
import type { MemberPageLink } from '../../modules/find/types'

type Kind = '' | 'website' | 'whatsapp' | 'phone' | 'email' | 'contact'

const PREFIX: Record<Exclude<Kind, ''>, string> = {
  website: 'https://',
  whatsapp: 'whatsapp:',
  phone: 'tel:',
  email: 'mailto:',
  contact: 'contact:',
}

function kindOf(value: string): Kind {
  if (!value) return ''
  if (value.startsWith('whatsapp:')) return 'whatsapp'
  if (value.startsWith('tel:')) return 'phone'
  if (value.startsWith('mailto:')) return 'email'
  if (value.startsWith('contact:')) return 'contact'
  return 'website'
}

// "Where does the button go?" for one service (19/11/2026, the owner's
// choice): a website, a WhatsApp chat (opened with a message naming the
// service), a phone call, an e-mail, or one of the page's own contact
// buttons. Everything is kept in the service's `url` — see
// serviceButtonProps() in modules/find/memberPageService.ts.
export default function ServiceLinkField({
  value,
  onChange,
  contacts,
  labelOf,
  inputClass,
}: {
  value: string
  onChange: (next: string) => void
  /** The page's contact buttons that have an address. */
  contacts: MemberPageLink[]
  labelOf: (link: MemberPageLink) => string
  inputClass: string
}) {
  const v = value.trim()
  const kind = kindOf(v)
  const rest = kind ? v.slice(kind === 'website' ? 0 : PREFIX[kind].length) : ''
  const complete = !v || SERVICE_LINK_RE.test(v)

  const choose = (next: Kind) => {
    if (next === kind) return
    if (!next) return onChange('')
    if (next === 'contact') return onChange(contacts[0] ? `contact:${contacts[0].type}` : 'contact:')
    onChange(PREFIX[next])
  }

  return (
    <div className="space-y-2">
      <select value={kind} onChange={(e) => choose(e.target.value as Kind)} className={inputClass} aria-label="Where the button goes">
        <option value="">Button: none</option>
        <option value="whatsapp">Button opens WhatsApp</option>
        <option value="phone">Button calls a phone number</option>
        <option value="email">Button opens an e-mail</option>
        <option value="website">Button opens a website or booking page</option>
        {contacts.length > 0 && <option value="contact">Button uses one of my contact buttons</option>}
      </select>

      {kind === 'whatsapp' && (
        <input
          value={rest}
          onChange={(e) => onChange(`whatsapp:${e.target.value.replace(/\D/g, '')}`)}
          inputMode="tel"
          className={inputClass}
          placeholder="WhatsApp number with country code (e.g. 15551234567)"
          aria-label="WhatsApp number"
        />
      )}
      {kind === 'phone' && (
        <input
          value={rest}
          onChange={(e) => onChange(`tel:${e.target.value.replace(/[^\d+]/g, '')}`)}
          inputMode="tel"
          className={inputClass}
          placeholder="Phone number with country code (e.g. +15551234567)"
          aria-label="Phone number"
        />
      )}
      {kind === 'email' && (
        <input
          value={rest}
          onChange={(e) => onChange(`mailto:${e.target.value.trim()}`)}
          type="email"
          className={inputClass}
          placeholder="E-mail address"
          aria-label="E-mail address"
        />
      )}
      {kind === 'website' && (
        <input value={rest} onChange={(e) => onChange(e.target.value)} className={inputClass} placeholder="https://…" aria-label="Website address" />
      )}
      {kind === 'contact' && (
        <select value={rest} onChange={(e) => onChange(`contact:${e.target.value}`)} className={inputClass} aria-label="Which contact button">
          {contacts.map((c) => (
            <option key={c.type + c.url} value={c.type}>
              {labelOf(c)}
            </option>
          ))}
        </select>
      )}

      {kind === 'whatsapp' && (
        <p className="text-[12px] text-navy/45">It opens with a message naming this service, ready to send.</p>
      )}
      {!complete && (
        <p className="text-[12.5px] text-red-500">
          {kind === 'website' ? 'Use a full address starting with https://' : 'Finish this — the button only shows once it is complete.'}
        </p>
      )}
    </div>
  )
}
