import { useEffect, useState } from 'react'
import { PlayCircle, X } from 'lucide-react'
import { videoEmbed } from '../../modules/find/memberPageService'
import type { ProductGallery } from '../../modules/workspace/types/portal'

// "Watch video" on a product page (16/11/2026, the owner's choice): the
// product's video leaves the photo gallery at the top and opens from this
// button, in a window over the page — the photos stay the first thing seen.
// Draws nothing for a link that isn't YouTube/TikTok/Instagram.
export default function ProductVideoButton({ video, title }: { video: NonNullable<ProductGallery['video']>; title: string }) {
  const [open, setOpen] = useState(false)
  const embed = video.kind === 'link' ? videoEmbed(video.url) : null

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (video.kind === 'link' && !embed) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14.5px] font-semibold text-primary shadow-softer hover:bg-bg-soft"
      >
        <PlayCircle size={18} /> Watch video
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`${title} — video`}>
          <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close video"
              title="Close video"
              className="absolute -top-11 right-0 grid h-9 w-9 place-items-center rounded-full bg-white text-navy shadow-soft"
            >
              <X size={18} />
            </button>
            {embed ? (
              <div className={`mx-auto overflow-hidden rounded-xl bg-navy ${embed.vertical ? 'aspect-[9/16] max-h-[80vh]' : 'aspect-video w-full'}`}>
                <iframe
                  src={embed.src}
                  title={`${title} — video`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <video src={video.url} controls autoPlay playsInline className="mx-auto max-h-[80vh] w-full rounded-xl bg-navy" />
            )}
          </div>
        </div>
      )}
    </>
  )
}
