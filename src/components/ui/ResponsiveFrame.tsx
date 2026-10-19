import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  // The width the content is laid out at (e.g. 1280 desktop, 390 phone):
  // inside the frame, media queries see this width, not the window's.
  width: number
  children: ReactNode
  className?: string
  // Fixed height of the scaled frame; otherwise it follows the content.
  maxHeight?: number
}

// Shows its children as they look at a given screen width, scaled down to
// fit the space available — an iframe that receives the site's own styles,
// so responsive layouts (md:, lg:) behave as on that device. Used for page
// previews (desktop and phone side by side).
export default function ResponsiveFrame({ width, children, className = '', maxHeight }: Props) {
  const outer = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(600)

  // Copy the site's stylesheets into the frame once it exists.
  useEffect(() => {
    const doc = frame.current?.contentDocument
    if (!doc) return
    doc.open()
    doc.write('<!doctype html><html><head></head><body></body></html>')
    doc.close()
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => doc.head.appendChild(node.cloneNode(true)))
    doc.documentElement.className = document.documentElement.className
    doc.body.style.margin = '0'
    setBody(doc.body)
  }, [])

  // Scale to the available width.
  useLayoutEffect(() => {
    const el = outer.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / width))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  // Follow the content's height.
  useEffect(() => {
    if (!body) return
    const update = () => setHeight(Math.max(200, body.scrollHeight))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(body)
    return () => ro.disconnect()
  }, [body])

  const shown = maxHeight ? Math.min(maxHeight, height * scale) : height * scale

  return (
    <div ref={outer} className={`relative w-full overflow-hidden ${className}`} style={{ height: shown }}>
      <iframe
        ref={frame}
        title="Preview"
        className="absolute left-0 top-0 origin-top-left border-0"
        style={{ width, height, transform: `scale(${scale})` }}
      />
      {body && createPortal(children, body)}
    </div>
  )
}
