import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

// Shared wordmark for the top of the Authentication Container — now that
// the Brand Panel no longer carries any text (see HeroImage), this is the
// only place the BGrowth mark appears on an auth page.
export default function AuthLogo() {
  return (
    <Link to="/" className="flex w-fit items-center gap-2">
      <img src={logo} alt="BGrowth" className="h-7 w-7 object-contain" />
      <span className="font-display text-[14px] font-bold uppercase tracking-wide text-navy">BGrowth</span>
    </Link>
  )
}
