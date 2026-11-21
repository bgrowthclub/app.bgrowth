import { useEffect, useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { Calendar, Clock, Mail } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import TableOfContents from '../../components/knowledge/TableOfContents'
import ArticleCallout from '../../components/knowledge/ArticleCallout'
import ArticleBody from '../../components/knowledge/ArticleBody'
import ArticleMembersGate from '../../components/knowledge/ArticleMembersGate'
import ArticleShareBar from '../../components/knowledge/ArticleShareBar'
import PrevNextArticleNav from '../../components/knowledge/PrevNextArticleNav'
import RelatedProductsBySlug from '../../components/knowledge/RelatedProductsBySlug'
import { KNOWLEDGE_TYPE_ICONS } from '../../components/knowledge/knowledgeTypeIcons'
import { knowledgeCategoryLook } from '../../components/knowledge/knowledgeCategoryIcons'
import KnowledgeSearchCard from '../../components/knowledge/KnowledgeSearchCard'
import { extractHeadings } from '../../lib/articleToc'
import { knowledgeService } from '../../modules/knowledge/services/KnowledgeService'
import type { KnowledgeArticle } from '../../modules/knowledge/types/article'
import type { KnowledgeCategory } from '../../modules/knowledge/types/category'
import type { KnowledgeAuthor } from '../../modules/knowledge/types/author'
import type { KnowledgeArticleIndexEntry } from '../../modules/knowledge/types/article'
import { useNewsletterSignup } from '../../modules/newsletter/useNewsletterSignup'
import SignupInterests from '../../components/newsletter/SignupInterests'

function authorInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(iso: string): string {
  // A date-only value ("2026-05-20") is a calendar day, not UTC midnight.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function KnowledgeArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<KnowledgeArticle | null | undefined>(undefined)
  const [category, setCategory] = useState<KnowledgeCategory | undefined>(undefined)
  const [author, setAuthor] = useState<KnowledgeAuthor | undefined>(undefined)
  const [related, setRelated] = useState<KnowledgeArticleIndexEntry[]>([])
  const [prev, setPrev] = useState<KnowledgeArticleIndexEntry | undefined>(undefined)
  const [next, setNext] = useState<KnowledgeArticleIndexEntry | undefined>(undefined)
  const signup = useNewsletterSignup('knowledge-article')

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
  // While it loads, hold the screen so the footer doesn't jump up under the menu.
  if (article === undefined) return <div className="min-h-screen" aria-busy="true" />

  const Icon = KNOWLEDGE_TYPE_ICONS[article.type]
  const headings = extractHeadings(article.body)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://bgrowth.app/knowledge/article/${article.slug}`

  const tone = knowledgeCategoryLook(article.categorySlug).tone

  const newsletter = (
    <section className="rounded-[24px] border border-navy/[0.07] bg-white p-5 shadow-softer sm:p-6">
      <div className="flex items-start gap-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-primary">
          <Mail size={20} aria-hidden />
        </span>
        <div>
          <p className="font-display text-[16px] font-bold text-navy">Keep learning, keep growing</p>
          <p className="mt-1 text-[13px] leading-relaxed text-navy/55">New articles, guides and free resources in your inbox.</p>
        </div>
      </div>
      <form onSubmit={signup.submit} className="mt-4 space-y-2.5">
        <input
          type="email"
          required
          value={signup.email}
          onChange={(e) => signup.setEmail(e.target.value)}
          aria-label="E-mail address"
          placeholder="Enter your email"
          className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/35 focus:border-primary/40 focus:outline-none"
        />
        <button type="submit" className="w-full rounded-xl bg-primary px-4 py-3 text-[14px] font-semibold text-white shadow-softer transition-opacity hover:opacity-95">
          {signup.state === 'sending' ? 'Sending…' : signup.done ? 'Subscribed' : 'Subscribe'}
        </button>
      </form>
      {signup.message && (
        <p role="status" className={`mt-2.5 text-[12.5px] ${signup.state === 'error' ? 'text-red-500' : 'text-navy/60'}`}>
          {signup.message}
        </p>
      )}
      {signup.token && <SignupInterests token={signup.token} />}
      <p className="mt-3 text-center text-[12px] text-navy/40">No spam. Unsubscribe anytime.</p>
    </section>
  )

  return (
    <div className="pb-24 pt-28 md:pt-36">
      <SEO title={article.title} description={article.excerpt} path={`/knowledge/article/${article.slug}`} ogImage={article.coverImage} />
      <ReadingProgress />

      <div className="container-px mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/knowledge/search?type=${encodeURIComponent(article.type)}`}
                className="rounded-full bg-blue-50 px-3 py-1 text-[12.5px] font-semibold text-primary hover:bg-blue-100"
              >
                {article.type === 'Article' ? 'Articles' : article.type}
              </Link>
              {category && (
                <Link to={`/knowledge/category/${category.slug}`} className={`rounded-full px-3 py-1 text-[12.5px] font-semibold hover:opacity-80 ${tone}`}>
                  {category.name}
                </Link>
              )}
              {article.language === 'pt' && <span className="rounded-full bg-bg-soft px-3 py-1 text-[12.5px] font-semibold text-navy/60">Português</span>}
            </div>

            <h1 className="mt-5 font-display text-[30px] font-bold leading-[1.12] tracking-tight text-navy sm:text-[40px] xl:text-[46px]">{article.title}</h1>
            {article.excerpt && <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-navy/55 sm:text-[17.5px]">{article.excerpt}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              {author && (
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-[14px] font-bold text-white">{authorInitials(author.name)}</span>
                  <div>
                    <p className="text-[14px] font-semibold text-navy">{author.name}</p>
                    {author.title && <p className="text-[11.5px] text-navy/40">{author.title}</p>}
                  </div>
                </div>
              )}
              <span className="inline-flex items-center gap-1.5 text-[13.5px] text-navy/50">
                <Calendar size={15} aria-hidden />
                {formatDate(article.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13.5px] text-navy/50">
                <Clock size={15} aria-hidden />
                {article.readingTimeMinutes} min read
              </span>
            </div>

            {article.coverImage ? (
              <img src={article.coverImage} alt="" className="mt-8 aspect-[16/9] w-full rounded-[24px] object-cover shadow-soft" />
            ) : (
              <div className="mt-8 flex h-56 items-center justify-center rounded-[24px] bg-grad-primary shadow-soft sm:h-72">
                <Icon size={64} strokeWidth={1.5} className="text-white/90" />
              </div>
            )}

            <article className="mt-10 min-w-0 max-w-3xl space-y-5 text-[16.5px]">
              <ArticleBody body={article.body} />
              {article.locked && <ArticleMembersGate path={`/knowledge/article/${article.slug}`} planName={article.access === 'plan' ? article.requiredPlan?.name : undefined} />}

              {article.calloutCards && article.calloutCards.length > 0 && (
                <div className="!mt-8 space-y-4">
                  {article.calloutCards.map((callout, i) => (
                    <ArticleCallout key={i} {...callout} />
                  ))}
                </div>
              )}
            </article>

            <div className="mt-12 flex max-w-3xl flex-wrap items-center justify-between gap-3 border-t border-navy/[0.06] pt-8">
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-navy/35">Share this</p>
              <ArticleShareBar title={article.title} url={shareUrl} />
            </div>
          </div>

          <aside className="no-print space-y-5 self-start lg:sticky lg:top-28">
            <div className="hidden lg:block">
              <TableOfContents headings={headings} />
            </div>
            {newsletter}
          </aside>
        </div>

        <div className="mt-16 space-y-16">
          {related.length > 0 && (
            <div>
              <h2 className="font-display text-[24px] font-bold text-navy">Keep learning</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((entry) => (
                  <KnowledgeSearchCard key={entry.id} article={entry} categoryName={entry.categorySlug === category?.slug ? category?.name : undefined} />
                ))}
              </div>
            </div>
          )}

          {article.relatedProductSlugs && article.relatedProductSlugs.length > 0 && (
            <RelatedProductsBySlug productSlugs={article.relatedProductSlugs} />
          )}

          <PrevNextArticleNav prev={prev} next={next} />
        </div>
      </div>
    </div>
  )
}

// The bar across the top of the screen (21/11/2026, the owner's design): how
// much of the page has been scrolled, as it really is.
function ReadingProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setPct(max > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / max) * 100))) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 bg-transparent" role="progressbar" aria-label="Reading progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${pct}%` }} />
    </div>
  )
}
