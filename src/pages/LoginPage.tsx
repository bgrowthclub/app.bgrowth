import SEO from '../components/seo/SEO'
import AuthLayout from '../components/layout/AuthLayout'
import AuthHeader from '../components/auth/AuthHeader'
import AuthFooterPrompt from '../components/auth/AuthFooterPrompt'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthLayout
      headline={
        <>
          Your Growth,
          <br />
          <span className="bg-grad-primary bg-clip-text text-transparent">Continued.</span>
        </>
      }
      subtitle="Everything you’ve built — your systems, resources and progress — is exactly where you left it."
    >
      <SEO title="Sign In" description="Sign in to your BGrowth account." path="/login" />
      <AuthHeader title="Sign In" subtitle="Access your BGrowth account." />
      <LoginForm />
      <AuthFooterPrompt prompt="Don’t have an account?" linkLabel="Create Account" linkTo="/register" />
    </AuthLayout>
  )
}
