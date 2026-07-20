import SEO from '../components/seo/SEO'
import AuthLayout from '../components/layout/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import AuthHeader from '../components/auth/AuthHeader'
import AuthFooterPrompt from '../components/auth/AuthFooterPrompt'
import AuthTrustNote from '../components/auth/AuthTrustNote'
import LoginForm from '../components/auth/LoginForm'
import loginHero from '../assets/auth/login-hero.svg'

export default function LoginPage() {
  return (
    <AuthLayout heroImageSrc={loginHero}>
      <SEO title="Sign In" description="Sign in to your BGrowth account." path="/login" />
      <AuthLogo />
      <div className="mt-8">
        <AuthHeader
          title={
            <>
              Build beyond
              <br />
              what <span className="text-primary">matters.</span>
            </>
          }
          subtitle="Sign in to your workspace and move your business forward."
        />
        <LoginForm />
        <AuthFooterPrompt prompt="Don’t have an account?" linkLabel="Create Account" linkTo="/register" />
        <AuthTrustNote>Your data is secure with enterprise-grade protection.</AuthTrustNote>
      </div>
    </AuthLayout>
  )
}
