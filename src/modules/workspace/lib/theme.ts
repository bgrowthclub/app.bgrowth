// Each Studio Workspace carries its own accent (content.brand.primaryColor).
// This turns that one hex into the 50–900 scale behind the `workspace-*`
// Tailwind colors (see tokens.css / tailwind.config.js), scoped to the
// viewer's root element so it never leaks into the rest of the site.
// Same algorithm as the Portal's src/lib/workspaceTheme.ts.

interface Rgb {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.slice(0, 6)
  const num = parseInt(full, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function mix(a: Rgb, b: Rgb, ratio: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * ratio),
    g: Math.round(a.g + (b.g - a.g) * ratio),
    b: Math.round(a.b + (b.b - a.b) * ratio),
  }
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 }
const BLACK: Rgb = { r: 0, g: 0, b: 0 }

const SHADE_RATIOS: Record<number, number> = {
  50: 0.92,
  100: 0.83,
  200: 0.66,
  300: 0.48,
  400: 0.26,
  500: 0,
  600: -0.14,
  700: -0.28,
  800: -0.42,
  900: -0.56,
}

export function applyWorkspaceTheme(baseHex: string, target: HTMLElement): void {
  if (!/^#[0-9a-fA-F]{3,8}$/.test(baseHex)) return
  const base = hexToRgb(baseHex)
  for (const [shade, ratio] of Object.entries(SHADE_RATIOS)) {
    const target_ = ratio >= 0 ? WHITE : BLACK
    const c = ratio === 0 ? base : mix(base, target_, Math.abs(ratio))
    target.style.setProperty(`--color-workspace-${shade}`, `${c.r} ${c.g} ${c.b}`)
  }
}
