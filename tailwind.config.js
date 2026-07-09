/** @type {import('tailwindcss').Config} */
// Values here are pulled from src/styles/tokens.css via CSS custom properties,
// so the token file stays the single source of truth — update a value once,
// there, and both Tailwind utilities and hand-written CSS pick it up.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        navy: 'rgb(var(--color-navy-rgb) / <alpha-value>)',
        accent: 'rgb(var(--color-primary-accent-rgb) / <alpha-value>)',
        bg: 'var(--color-bg)',
        'bg-soft': 'rgb(var(--color-bg-soft-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      borderRadius: {
        xl2: 'var(--radius-lg)',
        xl3: 'var(--radius-2xl)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        softer: 'var(--shadow-softer)',
        glow: 'var(--shadow-glow)',
      },
      maxWidth: {
        page: 'var(--container-page)',
        narrow: 'var(--container-narrow)',
      },
      backgroundImage: {
        'grad-primary': 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-accent) 100%)',
        'grad-navy': 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-primary) 100%)',
        'grad-radial-soft': 'radial-gradient(circle at 50% 0%, rgba(47,128,255,.10), rgba(255,255,255,0) 60%)',
      },
    },
  },
  plugins: [],
}
