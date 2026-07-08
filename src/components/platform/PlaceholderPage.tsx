import SEO from '../seo/SEO'

interface Props {
  title: string
  description: string
  path: string
}

// Shared shell for every Platform Shell placeholder route — one component
// instead of duplicating the same title/description/notice markup across
// eight page files.
export default function PlaceholderPage({ title, description, path }: Props) {
  return (
    <>
      <SEO title={title} description={description} path={path} />
      <p className="eyebrow">BGrowth Platform</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-navy/55">{description}</p>

      <div className="mt-10 rounded-xl3 border border-dashed border-navy/15 bg-bg-soft p-10 text-center">
        <p className="text-[14px] font-medium text-navy/50">
          This page will be implemented in a future milestone.
        </p>
      </div>
    </>
  )
}
