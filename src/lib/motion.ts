// Shared animation variants. Import instead of redefining fadeUp/stagger
// objects inline in every section — keeps timing and easing consistent
// with the "very subtle animations" rule in the design brief.

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: 'easeOut' },
  }),
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: (i: number = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
}

// Standard viewport settings for scroll-triggered reveals — animate once,
// slightly before the element is fully in view.
export const viewportOnce = { once: true, margin: '-60px' } as const

// Gentle float used for small ambient elements (e.g. hero device mockups).
// Kept intentionally slow and low-amplitude per "minimal animations."
export const floatY = {
  animate: { y: [0, -10, 0] },
  transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
}
