import { ArrowRight, Download } from 'lucide-react'
import { videoEmbed } from '../../modules/find/memberPageService'
import { linkify } from '../../lib/autolink'
import { slugifyHeading } from '../../lib/articleToc'
import type { KnowledgeBodyBlock } from '../../modules/knowledge/types/article'

// An article's body, block by block. Headings, paragraphs, quotes, images,
// videos and dividers, plus — since 30/10/2026 — the link card, the file,
// the code and the questions the Studio could already write and the hub used
// to drop in silence. Paragraph line breaks are kept, so lists written as
// "• item" lines read as lists, and an address inside a text becomes a link
// (lib/autolink) without the text ever being treated as markup.
export default function ArticleBody({ body }: { body: KnowledgeBodyBlock[] }) {
  return (
    <>
      {body.map((block, i) => {
        if (block.kind === 'heading') {
          const Tag = block.level === 3 ? 'h3' : 'h2'
          return (
            <Tag
              key={i}
              id={slugifyHeading(block.text, i)}
              className={`scroll-mt-28 font-display font-bold text-navy first:!mt-0 ${
                block.level === 3 ? '!mt-7 text-[17px]' : '!mt-10 text-xl'
              }`}
            >
              {block.text}
            </Tag>
          )
        }
        if (block.kind === 'quote') {
          return (
            <blockquote key={i} className="whitespace-pre-line border-l-4 border-primary/30 pl-4 text-[15px] italic leading-relaxed text-navy/70">
              {linkify(block.text)}
            </blockquote>
          )
        }
        // A card with a link, written in the Studio as a "CTA".
        if (block.kind === 'cta' && block.url) {
          return (
            <div key={i} className="!my-8 rounded-xl2 border border-primary/20 bg-primary/[0.04] p-5 md:p-6">
              {block.title && <p className="font-display text-[17px] font-bold text-navy">{block.title}</p>}
              {block.text && <p className="mt-1.5 whitespace-pre-line text-[14.5px] leading-relaxed text-navy/65">{block.text}</p>}
              <a
                href={block.url}
                {...(block.url.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white no-underline transition-colors hover:bg-primary/90"
              >
                {block.label?.trim() || 'Open'} <ArrowRight size={15} aria-hidden />
              </a>
            </div>
          )
        }
        if (block.kind === 'download' && block.url) {
          return (
            <a
              key={i}
              href={block.url}
              target="_blank"
              rel="noopener noreferrer"
              className="!my-6 flex items-center gap-3 rounded-xl2 border border-navy/[0.08] bg-bg-soft px-4 py-3.5 no-underline transition-colors hover:border-primary/30"
            >
              <Download size={18} className="shrink-0 text-primary" aria-hidden />
              <span className="min-w-0">
                <span className="block text-[14.5px] font-semibold text-navy">{block.title}</span>
                {block.label?.trim() && <span className="mt-0.5 block text-[12.5px] text-navy/50">{block.label}</span>}
              </span>
            </a>
          )
        }
        if (block.kind === 'code') {
          return (
            <pre key={i} className="!my-6 overflow-x-auto rounded-xl2 bg-navy px-4 py-3.5 text-[12.5px] leading-relaxed text-white/90">
              <code>{block.text}</code>
            </pre>
          )
        }
        if (block.kind === 'faq' && block.items?.length) {
          return (
            <div key={i} className="!my-8 space-y-2">
              {block.items.map((item, j) => (
                <details key={j} className="rounded-xl2 border border-navy/[0.08] bg-white px-4 py-3">
                  <summary className="cursor-pointer list-none text-[15px] font-semibold text-navy marker:content-none">{item.q}</summary>
                  {item.a && <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-navy/65">{linkify(item.a)}</p>}
                </details>
              ))}
            </div>
          )
        }
        if (block.kind === 'image' && block.url) {
          return (
            <figure key={i}>
              <img src={block.url} alt={block.text} loading="lazy" className="w-full rounded-xl2 border border-navy/[0.06]" />
              {block.text && <figcaption className="mt-2 text-center text-[12.5px] text-navy/45">{block.text}</figcaption>}
            </figure>
          )
        }
        if (block.kind === 'video' && block.url) {
          const video = videoEmbed(block.url)
          return video ? (
            <div key={i} className={`mx-auto overflow-hidden rounded-xl2 bg-navy ${video.vertical ? 'aspect-[9/16] max-h-[560px] max-w-[315px]' : 'aspect-video w-full'}`}>
              <iframe
                src={video.src}
                title="Video"
                className="h-full w-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <p key={i}>
              <a href={block.url} target="_blank" rel="noreferrer" className="text-[15px] font-semibold text-primary hover:underline">
                Watch the video
              </a>
            </p>
          )
        }
        if (block.kind === 'divider') return <hr key={i} className="border-navy/[0.08]" />
        return (
          <p key={i} className="whitespace-pre-line text-[15px] leading-relaxed text-navy/65">
            {linkify(block.text)}
          </p>
        )
      })}
    </>
  )
}
