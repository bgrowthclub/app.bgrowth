import type { Journey } from '../../types/journey'

// Stages Prepare, Launch, Operate, and Grow are still to come — see
// getJourneyAssetCount(startACleaningBusinessJourney) for current progress.
export const startACleaningBusinessJourney: Journey = {
  id: 'journey-cleaning-business',
  slug: 'start-a-cleaning-business',
  goal: 'Start a Cleaning Business',
  title: 'Cleaning Business Launch Journey™',
  industry: 'Cleaning',
  status: 'in-progress',
  stages: [
    {
      id: 'discover',
      name: 'Discover',
      description: 'Understand the opportunity and find the right cleaning business model.',
      assets: [
        {
          id: 'cleaning-opportunity-guide',
          title: 'Cleaning Business Opportunity Guide™',
          kind: 'Guide',
          problem: 'Understand whether the cleaning industry is a real opportunity and which business models exist.',
          summary:
            'Explains market demand, income potential, and the main business models — residential, commercial, Airbnb turnover, deep clean, and move-out cleaning.',
          outputFormats: ['Article', 'Website Page'],
          leadsTo: 'cleaning-model-finder',
        },
        {
          id: 'cleaning-model-finder',
          title: 'Cleaning Business Model Finder™',
          kind: 'Assessment',
          problem: 'Decide which cleaning business model fits your skills, schedule, and goals.',
          summary: 'A short guided assessment that matches answers about time, capital, and preferences to the best-fit business model.',
          outputFormats: ['Workspace', 'AI Coaching'],
          leadsTo: 'cleaning-income-potential-calculator',
        },
        {
          id: 'cleaning-income-potential-calculator',
          title: 'Cleaning Business Income Potential Calculator™',
          kind: 'Planner',
          problem: 'Estimate realistic income before committing time or money.',
          summary: 'Projects monthly income from hours available, job rate, and client volume so the opportunity is sized honestly.',
          outputFormats: ['Workspace', 'Marketplace'],
          leadsTo: 'cleaning-readiness-assessment',
        },
      ],
    },
    {
      id: 'assess',
      name: 'Assess',
      description: 'Confirm personal readiness and true startup costs before committing.',
      assets: [
        {
          id: 'cleaning-readiness-assessment',
          title: 'Cleaning Business Readiness Assessment™',
          kind: 'Assessment',
          problem: 'Know if you are personally ready — time, physical demands, savings — before you start.',
          summary: 'Scores readiness across time availability, physical capacity, and financial runway, with a plain next step for each gap.',
          outputFormats: ['Workspace', 'AI Coaching'],
          leadsTo: 'cleaning-startup-cost-estimator',
        },
        {
          id: 'cleaning-startup-cost-estimator',
          title: 'Cleaning Business Startup Cost Estimator™',
          kind: 'Planner',
          problem: 'Know the real cash needed to start, not a guess.',
          summary: 'Itemizes every realistic startup cost — supplies, insurance, licensing, marketing — into one total.',
          outputFormats: ['Workspace', 'Marketplace'],
          leadsTo: 'cleaning-legal-structure-guide',
        },
        {
          id: 'cleaning-legal-structure-guide',
          title: 'Cleaning Business Legal Structure Guide™',
          kind: 'Guide',
          problem: 'Choose the right legal structure and know what licensing actually applies.',
          summary: 'Compares sole proprietorship, LLC, and licensing/bonding requirements in plain language.',
          outputFormats: ['Article', 'Academy'],
          leadsTo: 'cleaning-risk-insurance-checklist',
        },
        {
          id: 'cleaning-risk-insurance-checklist',
          title: 'Cleaning Business Risk & Insurance Checklist™',
          kind: 'Checklist',
          problem: 'Avoid operating uninsured or unbonded and exposed to liability.',
          summary: 'Confirms general liability insurance, bonding, and waiver paperwork are in place before the first job.',
          outputFormats: ['Workspace', 'Marketplace'],
          leadsTo: 'cleaning-market-research-planner',
        },
      ],
    },
    {
      id: 'research',
      name: 'Research',
      description: 'Understand local demand and competition before choosing a niche.',
      assets: [
        {
          id: 'cleaning-market-research-planner',
          title: 'Cleaning Market Research Planner™',
          kind: 'Planner',
          problem: 'Know if there is real local demand before investing further.',
          summary: 'Guides research into local demand signals — neighborhood income, housing density, and search volume.',
          outputFormats: ['Workspace'],
          leadsTo: 'cleaning-competitor-analysis-toolkit',
        },
        {
          id: 'cleaning-competitor-analysis-toolkit',
          title: 'Cleaning Competitor Analysis Toolkit™',
          kind: 'Toolkit',
          problem: 'Understand what competitors charge and offer before setting your own pricing.',
          summary: 'Structured worksheet for logging competitor pricing, services, and review scores side by side.',
          outputFormats: ['Workspace', 'Marketplace'],
          leadsTo: 'cleaning-niche-selector',
        },
        {
          id: 'cleaning-niche-selector',
          title: 'Cleaning Business Niche Selector™',
          kind: 'Assessment',
          problem: 'Choose one clear niche instead of trying to serve everyone.',
          summary:
            'Weighs recurring residential, Airbnb turnover, commercial contracts, and move-out cleaning against your research to recommend one starting niche.',
          outputFormats: ['Workspace', 'AI Coaching'],
        },
      ],
    },
  ],
}
