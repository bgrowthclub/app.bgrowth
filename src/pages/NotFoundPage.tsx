import SEO from '../components/seo/SEO'
import Button from '../components/ui/Button'

// The catch-all for any URL that doesn't match a real route (see App.tsx's
// path="*"). Deliberately static — no motion, no illustration — so it
// never depends on data that might itself be missing.
export default function NotFoundPage() {
  return (
    <div className="pb-28 pt-32 md:pt-40">
      <SEO
        title="Page Not Found"
        description="The page you're looking for may have moved or no longer exists."
        path="/404"
      />
      <div className="container-px mx-auto max-w-narrow text-center">
        <p className="font-display text-6xl font-bold tracking-tight text-primary md:text-7xl">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-navy md:text-3xl">
          We couldn't find that page.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-navy/55">
          The page may have moved or no longer exists.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button to="/">Go Home</Button>
          <Button to="/systems" variant="secondary">
            Browse Workspaces
          </Button>
        </div>
      </div>
    </div>
  )
}
