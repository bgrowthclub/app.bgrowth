import { Link } from 'react-router-dom'

interface Props {
  prompt: string
  linkLabel: string
  linkTo: string
}

// Shared bottom prompt ("Don't have an account? Create Account", "Already
// have an account? Sign In", …) reused across every Authentication System
// page instead of being rebuilt per form.
export default function AuthFooterPrompt({ prompt, linkLabel, linkTo }: Props) {
  return (
    <p className="mt-8 text-center text-[13.5px] text-navy/55">
      {prompt}{' '}
      <Link to={linkTo} className="font-semibold text-primary hover:underline">
        {linkLabel}
      </Link>
    </p>
  )
}
