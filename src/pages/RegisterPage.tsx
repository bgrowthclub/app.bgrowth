import SEO from '../components/seo/SEO'
import AuthLayout from '../components/layout/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import AuthHeader from '../components/auth/AuthHeader'
import AuthFooterPrompt from '../components/auth/AuthFooterPrompt'
import AuthTrustNote from '../components/auth/AuthTrustNote'
import RegisterForm from '../components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthLayout>
      <SEO title="Create Account" description="Create your BGrowth account." path="/register" />
      <AuthLogo />
      <div className="mt-8">
        <AuthHeader
          title={
            <>
              Build what <span className="text-primary">matters.</span>
            </>
          }
          subtitle="Create your account and start building with BGrowth."
        />
        <RegisterForm />
        <AuthFooterPrompt prompt="Already have an account?" linkLabel="Sign In" linkTo="/login" />
        <AuthTrustNote>Your data is secure with enterprise-grade protection.</AuthTrustNote>
      </div>
    </AuthLayout>
  )
}
