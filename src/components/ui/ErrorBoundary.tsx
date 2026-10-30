import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

// Until 30/10/2026 this site had no error boundary: one failing component
// anywhere left the person staring at a blank white page, with nothing to
// report and nothing to click. React unmounts the whole tree when a render
// throws, so a boundary is the only thing that keeps a page on screen.
//
// It shows what went wrong — the message included, because the person
// reading it is usually the one who will tell us about it — and offers the
// two ways out: try again (a re-render, which fixes a one-off) and reload.
interface Props {
  children: ReactNode
  /** Where it sits, for the message: "the editor", "this page". */
  area?: string
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The browser console is where this is actually read, so keep it whole.
    console.error('[BGrowth] render error', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const area = this.props.area ?? 'this page'
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-navy">Something went wrong in {area}.</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-navy/60">
          Nothing you had saved before is lost. Try again — if it keeps happening, send us this message through Support and we&rsquo;ll fix it.
        </p>
        <p className="mt-5 break-words rounded-xl2 bg-bg-soft px-4 py-3 text-left font-mono text-[12.5px] leading-relaxed text-navy/60">
          {error.message || String(error)}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-navy/10 bg-white px-5 py-2.5 text-[14px] font-semibold text-navy transition-colors hover:border-primary/30"
          >
            Reload the page
          </button>
        </div>
      </div>
    )
  }
}
