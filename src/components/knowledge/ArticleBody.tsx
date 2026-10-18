import { videoEmbed } from '../../modules/find/memberPageService'
import { slugifyHeading } from '../../lib/articleToc'
import type { KnowledgeBodyBlock } from '../../modules/knowledge/types/article'

// An article's body, block by block (headings, paragraphs, quotes, images,
// videos, dividers). Paragraph line breaks are kept, so lists written as
// "• item" lines read as lists.
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
              {block.text}
            </blockquote>
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
            {block.text}
          </p>
        )
      })}
    </>
  )
}
