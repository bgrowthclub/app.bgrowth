import { useState } from 'react'
import { Link2, Linkedin, Mail, Twitter, Check } from 'lucide-react'

interface Props {
  title: string
  url: string
}

// Share links only — no analytics, no backend. Each opens the relevant
// share intent in a new tab; "Copy Link" uses the Clipboard API with a
// short local "Copied" confirmation, same pattern as any static site.
export default function ArticleShareBar({ title, url }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const links = [
    { label: 'Share on X', icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { label: 'Share on LinkedIn', icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: 'Share by Email', icon: Mail, href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
  ]

  return (
    <div className="no-print flex items-center gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className="grid h-9 w-9 place-items-center rounded-full border border-navy/10 bg-white text-navy/50 shadow-softer transition-colors hover:border-primary/20 hover:text-navy"
        >
          <link.icon size={15} />
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy link"
        className="grid h-9 w-9 place-items-center rounded-full border border-navy/10 bg-white text-navy/50 shadow-softer transition-colors hover:border-primary/20 hover:text-navy"
      >
        {copied ? <Check size={15} className="text-primary" /> : <Link2 size={15} />}
      </button>
    </div>
  )
}
