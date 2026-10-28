import { Link } from 'react-router-dom'
import { ArrowRight, Download, ExternalLink } from 'lucide-react'
import { videoEmbed } from '../../modules/find/memberPageService'
import type { CourseBlock } from '../../modules/academy/types'

// One lesson's content. Every block is something the ecosystem already has:
// text, an image, a video played by its own host (BGrowth stores none), a
// file from the Studio's Library, an outside link, or a product this lesson
// hands the student. A block never carries a Growth System's content — it
// points at it (CLAUDE.md §8).
export default function CourseLessonBody({ blocks }: { blocks: CourseBlock[] }) {
  if (!blocks.length) return <p className="text-[14px] text-navy/45">This lesson has no content yet.</p>
  return (
    <div className="space-y-5">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  )
}

const BOX = 'flex items-start gap-3 rounded-xl2 border border-navy/[0.08] bg-bg-soft px-4 py-3.5'

function Block({ block }: { block: CourseBlock }) {
  switch (block.type) {
    case 'text':
      return <p className="whitespace-pre-line text-[15.5px] leading-relaxed text-navy/80">{block.body}</p>

    case 'image':
      return (
        <figure>
          <img src={block.url} alt={block.alt ?? ''} loading="lazy" className="w-full rounded-xl2 border border-navy/[0.06]" />
          {block.caption && <figcaption className="mt-2 text-[12.5px] text-navy/45">{block.caption}</figcaption>}
        </figure>
      )

    case 'video': {
      const embed = videoEmbed(block.url)
      if (!embed)
        return (
          <a href={block.url} target="_blank" rel="noopener noreferrer" className={`${BOX} hover:border-primary/30`}>
            <ExternalLink size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <span className="text-[14.5px] font-semibold text-navy">{block.title || 'Watch the video'}</span>
          </a>
        )
      return (
        <div className={`overflow-hidden rounded-xl2 bg-navy ${embed.vertical ? 'aspect-[9/16] max-h-[520px] max-w-[300px]' : 'aspect-video w-full'}`}>
          <iframe
            src={embed.src}
            title={block.title || 'Video'}
            className="h-full w-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )
    }

    case 'file':
      return (
        <a href={block.url} target="_blank" rel="noopener noreferrer" className={`${BOX} hover:border-primary/30`}>
          <Download size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0">
            <span className="block text-[14.5px] font-semibold text-navy">{block.label || 'Download the file'}</span>
            {block.note && <span className="mt-0.5 block text-[13px] text-navy/55">{block.note}</span>}
          </span>
        </a>
      )

    case 'link':
      return (
        <a href={block.url} target="_blank" rel="noopener noreferrer" className={`${BOX} hover:border-primary/30`}>
          <ExternalLink size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0">
            <span className="block text-[14.5px] font-semibold text-navy">{block.label || block.url}</span>
            {block.note && <span className="mt-0.5 block text-[13px] text-navy/55">{block.note}</span>}
          </span>
        </a>
      )

    case 'product':
      // The handoff the VISION calls for: a course teaches the decision and
      // hands over the Growth System that does the work.
      return (
        <Link to={`/product/${block.slug}`} className={`${BOX} border-primary/20 !bg-primary/[0.04] hover:border-primary/40`}>
          <ArrowRight size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0">
            <span className="block text-[14.5px] font-semibold text-navy">{block.label || 'Open this in your Workspace'}</span>
            {block.note && <span className="mt-0.5 block text-[13px] text-navy/55">{block.note}</span>}
          </span>
        </Link>
      )

    default:
      return null
  }
}
