import {
  Lightbulb,
  Megaphone,
  Briefcase,
  PiggyBank,
  CalendarCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Bot,
  Stamp,
  Calculator,
  Receipt,
  Home,
  Compass,
  Laptop,
  Rocket,
  LineChart,
  FileCheck2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import type { KnowledgeArticle, ArticleCategory, FreeResource, FeaturedGuide } from '../types/knowledge'

export const FEATURED_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'article-validate-business-idea',
    slug: 'validate-a-business-idea-before-you-spend-a-dollar',
    title: 'How to Validate a Business Idea Before You Spend a Dollar',
    description: 'A simple framework for testing real demand before you commit time or money.',
    category: 'Business',
    readTime: '7 min read',
    icon: Lightbulb,
  },
  {
    id: 'article-local-marketing-playbook',
    slug: 'local-marketing-playbook-for-service-businesses',
    title: 'The Local Marketing Playbook for Service Businesses',
    description: 'Where to actually spend your first marketing dollars — and where not to.',
    category: 'Marketing',
    readTime: '9 min read',
    icon: Megaphone,
  },
  {
    id: 'article-change-careers',
    slug: 'change-careers-without-starting-over',
    title: 'How to Change Careers Without Starting Over',
    description: 'A practical roadmap for pivoting industries using the experience you already have.',
    category: 'Career',
    readTime: '8 min read',
    icon: Briefcase,
  },
  {
    id: 'article-budget-that-survives',
    slug: 'budget-that-survives-real-life',
    title: 'Building a Budget That Actually Survives Contact With Real Life',
    description: 'A framework for personal finance that holds up past the first tough month.',
    category: 'Finance',
    readTime: '6 min read',
    icon: PiggyBank,
  },
  {
    id: 'article-weekly-planning-system',
    slug: 'weekly-planning-system-for-small-teams',
    title: 'The Weekly Planning System That Keeps Small Teams on Track',
    description: 'A lightweight planning rhythm that takes 30 minutes and actually gets used.',
    category: 'Productivity',
    readTime: '5 min read',
    icon: CalendarCheck,
  },
  {
    id: 'article-ai-for-small-business',
    slug: 'where-ai-actually-helps-a-small-business-owner',
    title: 'Where AI Actually Helps a Small Business Owner Today',
    description: 'A clear-eyed look at which AI tools are worth adopting now — and which aren’t ready yet.',
    category: 'Artificial Intelligence',
    readTime: '10 min read',
    icon: Sparkles,
  },
]

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  { id: 'cat-business', name: 'Business', icon: Briefcase, articleCount: 42 },
  { id: 'cat-marketing', name: 'Marketing', icon: Megaphone, articleCount: 28 },
  { id: 'cat-career', name: 'Career', icon: TrendingUp, articleCount: 24 },
  { id: 'cat-finance', name: 'Finance', icon: Wallet, articleCount: 31 },
  { id: 'cat-productivity', name: 'Productivity', icon: CalendarCheck, articleCount: 19 },
  { id: 'cat-ai', name: 'Artificial Intelligence', icon: Bot, articleCount: 16 },
  { id: 'cat-notary', name: 'Notary', icon: Stamp, articleCount: 22 },
  { id: 'cat-bookkeeping', name: 'Bookkeeping', icon: Calculator, articleCount: 18 },
  { id: 'cat-taxes', name: 'Taxes', icon: Receipt, articleCount: 14 },
  { id: 'cat-real-estate', name: 'Real Estate', icon: Home, articleCount: 20 },
  { id: 'cat-personal-growth', name: 'Personal Growth', icon: Compass, articleCount: 27 },
  { id: 'cat-freelancing', name: 'Freelancing', icon: Laptop, articleCount: 23 },
]

export const FREE_RESOURCES: FreeResource[] = [
  { id: 'resource-launch-checklist', title: 'New Business Launch Checklist', type: 'Checklist' },
  { id: 'resource-finance-guide', title: 'Personal Finance Starter Guide', type: 'Guide' },
  { id: 'resource-productivity-worksheet', title: 'Weekly Productivity Worksheet', type: 'Worksheet' },
  { id: 'resource-proposal-template', title: 'Client Proposal Template', type: 'Template' },
  { id: 'resource-tax-prep-pdf', title: 'Small Business Tax Prep Guide', type: 'PDF' },
  { id: 'resource-career-checklist', title: 'Career Change Readiness Checklist', type: 'Checklist' },
]

export const FREE_RESOURCE_ICONS: Record<FreeResource['type'], typeof FileCheck2> = {
  Checklist: FileCheck2,
  Guide: ClipboardList,
  Worksheet: FileSpreadsheet,
  Template: FileText,
  PDF: FileText,
}

export const FEATURED_GUIDES: FeaturedGuide[] = [
  {
    id: 'guide-start-a-service-business',
    slug: 'the-complete-guide-to-starting-a-service-business',
    title: 'The Complete Guide to Starting a Service Business',
    description:
      'Everything to know before you register your first business — validated demand, startup costs, legal structure, and your first 90 days.',
    readTime: '15 min read',
    icon: Rocket,
  },
  {
    id: 'guide-financial-freedom',
    slug: 'the-bgrowth-guide-to-personal-financial-freedom',
    title: 'The BGrowth Guide to Personal Financial Freedom',
    description: 'A step-by-step path from your first budget to building real, long-term wealth.',
    readTime: '18 min read',
    icon: LineChart,
  },
  {
    id: 'guide-career-change-playbook',
    slug: 'the-modern-career-change-playbook',
    title: 'The Modern Career Change Playbook',
    description: 'How to move into a new industry, role, or income level without spending years figuring it out alone.',
    readTime: '12 min read',
    icon: Compass,
  },
]
