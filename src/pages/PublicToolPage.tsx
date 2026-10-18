import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { LinkIcon } from 'lucide-react'
import SEO from '../components/seo/SEO'
import Button from '../components/ui/Button'

const STUDIO_URL = 'https://studio.bgrowth.app'

type Kind = 'template' | 'calc' | 'planner'

// The links shared on Etsy, Pinterest, e-mail… (Sprint 120):
// bgrowth.app/t/<code> (a template), /t/calc/<id>, /t/planner/<id>?owner=.
// The tool itself still runs in BGrowth Studio, shown here in a frame, so
// the address people see and share is always bgrowth.app. Open to everyone
// (no account needed); the Studio tells this page whether the link exists,
// and an unknown one gets this site's own "Link not found" page. The old
// studio.bgrowth.app/?template= links keep working.
export default function PublicToolPage({ kind }: { kind: Kind }) {
  const { code = '' } = useParams<{ code: string }>()
  const [params] = useSearchParams()
  const [state, setState] = useState<'loading' | 'ready' | 'not-found'>('loading')

  const valid = /^[A-Za-z0-9_-]{1,120}$/.test(code)
  const query = new URLSearchParams({ [kind]: code })
  if (kind === 'planner' && params.get('owner')) query.set('owner', params.get('owner') as string)
  const src = `${STUDIO_URL}/?${query.toString()}`

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== STUDIO_URL) return
      const data = event.data as { source?: string; status?: string } | null
      if (data?.source !== 'bgrowth-studio') return
      if (data.status === 'ready' || data.status === 'not-found') setState(data.status)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!valid || state === 'not-found') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <SEO title="Link not found" description="This link isn’t available." path={`/t/${code}`} />
        <span className="grid h-14 w-14 place-items-center rounded-full bg-bg-soft text-primary">
          <LinkIcon size={24} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold text-navy">Link not found</h1>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-navy/55">
          This link may be wrong, or what it pointed to is no longer available. Check the address, or explore what BGrowth has to offer.
        </p>
        <div className="mt-6">
          <Button to="/">Go to BGrowth</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[100dvh] w-full">
      <SEO title="BGrowth" description="A free tool by BGrowth." path={`/t/${code}`} />
      {state === 'loading' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <iframe src={src} title="BGrowth tool" className="h-full w-full border-0" allow="clipboard-write" />
    </div>
  )
}
