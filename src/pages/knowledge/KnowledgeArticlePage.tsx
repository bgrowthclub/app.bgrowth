import { useEffect, useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { Calendar, Clock } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import PageContainer from '../../components/layout/PageContainer'
import SectionContainer from '../../components/layout/SectionContainer'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import MemberBanner from '../../components/ui/MemberBanner'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'
import Grid from '../../components/layout/Grid'
import TableOfContents from '../../components/knowledge/TableOfContents'
import ArticleCallout from '../../components/knowledge/ArticleCallout'
import ArticleShareBar from '../../components/knowledge/ArticleShareBar'
import PrevNextArticleNav from '../../components/knowledge/PrevNextArticleNav'
import KnowledgeArticleCard from '../../components/knowledge/KnowledgeArticleCard'
import RelatedProductsBySlug from '../../components/knowledge/RelatedProductsBySlug'
import { KNOWLEDGE_TYPE_ICONS } from '../../components/knowledge/knowledgeTypeIcons'
import { extractHeadings, slugifyHeading } from '../../lib/articleToc'
import { knowledgeService } from '../../modules/knowledge/services/KnowledgeService'
import type { KnowledgeArticle } from '../../modules/knowledge/types/article'
import type { KnowledgeCategory } from '../../modules/knowledge/types/category'
import type { KnowledgeAuthor } from '../../modules/knowledge/types/author'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'

function authorInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function KnowledgeArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<KnowledgeArticle | null | undefined>(undefined)
  const [category, setCategory] = useState<KnowledgeCategory | undefined>(undefined)
  const [author, setAuthor] = useState<KnowledgeAuthor | undefined>(undefined)
  const [related, setRelated] = useState<KnowledgeArticleIndexEntry[]>([])
  const [prev, setPrev] = useState<KnowledgeArticleIndexEntry | undefined>(undefined)
  const [next, setNext] = useState<KnowledgeArticleIndexEntry | undefined>(undefined)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setArticle(undefined)
    window.scrollTo({ top: 0 })

    knowledgeService.getArticleBySlug(slug).then(async (found) => {
      if (cancelled) return
      if (!found) {
        setArticle(null)
        return
      }
      setArticle(found)

      const [foundCategory, foundAuthor, relatedArticles, index] = await Promise.all([
        knowledgeService.getCategoryBySlug(found.categorySlug),
        knowledgeService.getAuthorById(found.authorId),
        knowledgeService.getRelatedArticles(found.slug),
        knowledgeService.listArticles(),
      ])
      if (cancelled) return
      setCategory(foundCategory)
      setAuthor(foundAuthor)
      setRelated(relatedArticles)

      const ordered = [...index].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
      const currentIndex = ordered.findIndex((entry) => entry.slug === found.slug)
      setPrev(currentIndex > 0 ? ordered[currentIndex - 1] : undefined)
      setNext(currentIndex >= 0 && currentIndex < ordered.length - 1 ? ordered[currentIndex + 1] : undefined)
    })

    return () => {
      cancelled = true
    }
  }, [slug])

  if (article === null) return <Navigate to="/knowledge" replace />
  if (article === undefined) return null

  const Icon = KNOWLEDGE_TYPE_ICONS[article.type]
  const headings = extractHeadings(article.body)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://bgrowth.club/knowledge/article/${article.slug}`

  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO title={article.title} description={article.excerpt} path={`/knowledge/article/${article.slug}`} />

      <PageContainer width="narrow">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{article.type}</Badge>
          {category && (
            <Link to={`/knowledge/category/${category.slug}`} className="text-[12.5px] font-semibold text-primary hover:underline">
              {category.name}
            </Link>
          )}
        </div>

        <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-navy md:text-4xl">
          {article.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-navy/55">{article.excerpt}</p>

        <div className="mt-6 flex flex-wrap items-center gap-5">
          {author && (
            <div className="flex items-center gap-2.5">
              <Avatar size="sm" label={authorInitials(author.name)} />
              <div>
                <p className="text-[13px] font-semibold text-navy">{author.name}</p>
                {author.title && <p className="text-[11.5px] text-navy/40">{author.title}</p>}
              </div>
            </div>
          )}
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-navy/45">
            <Calendar size={13} />
            {formatDate(article.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-navy/45">
            <Clock size={13} />
            {article.readingTimeMinutes} min read
          </span>
        </div>

        {/* Featured image — no stock photography; a brand-gradient panel
            with the content type's icon, same visual language as every
            other Knowledge card. */}
        <div className="mt-8 flex h-56 items-center justify-center rounded-xl3 bg-grad-primary shadow-glow sm:h-72">
          <Icon size={64} strokeWidth={1.5} className="text-white/90" />
        </div>
      </PageContainer>

      <PageContainer width="narrow" className="mt-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <article className="min-w-0 space-y-5">
            {article.body.map((block, i) =>
              block.kind === 'heading' ? (
                <h2
                  key={i}
                  id={slugifyHeading(block.text, i)}
                  className="!mt-10 scroll-mt-28 font-display text-xl font-bold text-navy first:!mt-0"
                >
                  {block.text}
                </h2>
              ) : (
                <p key={i} className="text-[15px] leading-relaxed text-navy/65">
                  {block.text}
                </p>
              ),
            )}

            {article.calloutCards && article.calloutCards.length > 0 && (
              <div className="!mt-8 space-y-4">
                {article.calloutCards.map((callout, i) => (
                  <ArticleCallout key={i} {...callout} />
                ))}
              </div>
            )}
          </article>

          <aside className="no-print space-y-5 lg:sticky lg:top-28">
            <TableOfContents headings={headings} />
          </aside>
        </div>
      </PageContainer>

      <SectionContainer width="narrow">
        <div className="space-y-16">
          {related.length > 0 && (
            <div>
              <SectionHeader eyebrow="Keep Learning" title="Related Resources" className="mb-8" />
              <Grid cols={3}>
                {related.map((entry) => (
                  <KnowledgeArticleCard key={entry.id} article={entry} categoryName={category?.name} />
                ))}
              </Grid>
            </div>
          )}

          {article.relatedProductSlugs && article.relatedProductSlugs.length > 0 && (
            <RelatedProductsBySlug productSlugs={article.relatedProductSlugs} />
          )}

          <div className="flex items-center justify-between border-t border-navy/[0.06] pt-8">
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-navy/35">Share this</p>
            <ArticleShareBar title={article.title} url={shareUrl} />
          </div>

          <PrevNextArticleNav prev={prev} next={next} />
        </div>
      </SectionContainer>

      <SectionContainer background="soft" width="narrow">
        <MemberBanner
          eyebrow="Newsletter"
          title="Get new Knowledge first."
          description="One email a month — new articles, guides, and free resources as they publish."
          footnote="No spam, unsubscribe anytime."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!email) return
              setSubscribed(true)
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-3.5 text-sm text-navy placeholder:text-navy/30 focus:border-primary/30"
            />
            <Button type="submit" className="shrink-0">
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </Button>
          </form>
        </MemberBanner>
      </SectionContainer>
    </div>
  )
}
