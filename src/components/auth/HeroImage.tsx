import authHero from '../../assets/auth/auth-hero.webp'

// Shared full-bleed artwork for the entire Authentication System — Login,
// Register, Forgot Password, Reset Password, and Verify Email all render
// this exact same image via this one component, not a per-page src prop.
// Refreshing the Authentication System's artwork later means replacing
// src/assets/auth/auth-hero.webp only — every auth page updates at once,
// with no layout or component changes.
export default function HeroImage() {
  return (
    <div className="absolute inset-0">
      <img src={authHero} alt="" className="h-full w-full object-cover" />
    </div>
  )
}
