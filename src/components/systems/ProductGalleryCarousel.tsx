import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { videoEmbed } from '../../modules/find/memberPageService'
import type { ProductGallery } from '../../modules/workspace/types/portal'

interface Props {
  gallery: ProductGallery
  title: string
}

type Slide = { kind: 'image'; url: string } | { kind: 'video'; url: string; file: boolean }

// The product page gallery (Studio → publish screens, Portal migration
// 0050): the video first, then the images; arrows and thumbnails to move
// between them. A video link that isn't YouTube/TikTok/Instagram is skipped.
export default function ProductGalleryCarousel({ gallery, title }: Props) {
  const slides: Slide[] = []
  if (gallery.video) {
    if (gallery.video.kind === 'file') slides.push({ kind: 'video', url: gallery.video.url, file: true })
    else if (videoEmbed(gallery.video.url)) slides.push({ kind: 'video', url: gallery.video.url, file: false })
  }
  for (const url of gallery.images) slides.push({ kind: 'image', url })
  const [index, setIndex] = useState(0)
  if (!slides.length) return null
  const current = slides[Math.min(index, slides.length - 1)]
  const go = (step: number) => setIndex((i) => (i + step + slides.length) % slides.length)
  const embed = current.kind === 'video' && !current.file ? videoEmbed(current.url) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="overflow-hidden rounded-xl3 border border-navy/[0.06] bg-white p-2 shadow-glow"
    >
      <div className="relative overflow-hidden rounded-xl bg-bg-soft">
        {current.kind === 'image' && <img src={current.url} alt={`${title} — picture ${index + 1}`} className="h-72 w-full object-contain md:h-80" />}
        {current.kind === 'video' && current.file && (
          <video src={current.url} controls playsInline preload="metadata" className="h-72 w-full bg-navy md:h-80" />
        )}
        {embed && (
          <div className={`mx-auto bg-navy ${embed.vertical ? 'aspect-[9/16] h-72 md:h-80' : 'aspect-video w-full'}`}>
            <iframe
              src={embed.src}
              title={`${title} — video`}
              className="h-full w-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy shadow-soft hover:bg-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy shadow-soft hover:bg-white"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
      {slides.length > 1 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {slides.map((slide, i) => (
            <button
              key={`${slide.kind}-${slide.url}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={slide.kind === 'video' ? 'Video' : `Picture ${i + 1}`}
              aria-current={i === index}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {slide.kind === 'image' ? (
                <img src={slide.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-navy text-white">
                  <Play size={18} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
