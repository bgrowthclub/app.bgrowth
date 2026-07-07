/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1061EC',
        navy: '#071A52',
        accent: '#2F80FF',
        bg: '#FFFFFF',
        'bg-soft': '#F7FAFF',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl2: '24px',
        xl3: '32px',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(16,97,236,.08)',
        softer: '0 4px 16px rgba(16,97,236,.06)',
        glow: '0 0 0 1px rgba(16,97,236,.08), 0 20px 60px -10px rgba(16,97,236,.18)',
      },
      backgroundImage: {
        'grad-primary': 'linear-gradient(135deg, #1061EC 0%, #2F80FF 100%)',
        'grad-navy': 'linear-gradient(135deg, #071A52 0%, #1061EC 100%)',
        'grad-radial-soft': 'radial-gradient(circle at 50% 0%, rgba(47,128,255,.10), rgba(255,255,255,0) 60%)',
      },
    },
  },
  plugins: [],
}
