// Abstract, text-free hero visual for the Auth Brand Panel — an orbit of
// connected nodes around a central core. No charts, no dashboard chrome, no
// icons: just geometry and light, representing a connected system of
// opportunity radiating from one center. Shared as-is across every
// Authentication System page; purely decorative.
export default function AuthIllustration() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <svg viewBox="0 0 480 480" fill="none" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="auth-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2F80FF" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#1061EC" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#1061EC" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="auth-line-1" x1="240" y1="240" x2="110" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1061EC" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1061EC" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auth-line-2" x1="240" y1="240" x2="372" y2="176" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1061EC" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1061EC" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auth-line-3" x1="240" y1="240" x2="176" y2="378" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1061EC" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1061EC" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auth-line-4" x1="240" y1="240" x2="352" y2="346" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2F80FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2F80FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* orbit rings */}
        <circle cx="240" cy="240" r="196" stroke="#0A1B4D" strokeOpacity="0.05" />
        <circle cx="240" cy="240" r="140" stroke="#0A1B4D" strokeOpacity="0.07" />

        {/* connecting lines, core to each node */}
        <path d="M240 240 L110 140" stroke="url(#auth-line-1)" strokeWidth="1.5" />
        <path d="M240 240 L372 176" stroke="url(#auth-line-2)" strokeWidth="1.5" />
        <path d="M240 240 L176 378" stroke="url(#auth-line-3)" strokeWidth="1.5" />
        <path d="M240 240 Q 310 300 352 346" stroke="url(#auth-line-4)" strokeWidth="1.5" fill="none" />

        {/* nodes */}
        <circle cx="110" cy="140" r="5" fill="#1061EC" fillOpacity="0.35" />
        <circle cx="372" cy="176" r="7" fill="#1061EC" fillOpacity="0.55" />
        <circle cx="176" cy="378" r="4.5" fill="#1061EC" fillOpacity="0.3" />
        <circle cx="352" cy="346" r="9" fill="#2F80FF" fillOpacity="0.85" />

        {/* core */}
        <circle cx="240" cy="240" r="58" fill="url(#auth-core-glow)" />
        <circle cx="240" cy="240" r="58" stroke="#1061EC" strokeOpacity="0.2" />
        <circle cx="240" cy="240" r="14" fill="#0A1B4D" />
      </svg>
    </div>
  )
}
