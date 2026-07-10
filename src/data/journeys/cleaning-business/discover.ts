import type { JourneyStage } from '../../../types/journey'

export const discoverStage: JourneyStage = {
  id: 'discover',
  name: 'Discover',
  description: 'Understand the opportunity and find the right cleaning business model.',
  objects: [
    {
      id: 'cleaning-opportunity',
      title: 'Cleaning Business Opportunity',
      shape: 'Concept',
      problem: 'Understand whether the cleaning industry is a real opportunity and which business models exist.',
      summary: 'Frames the market size, income range, and the core business models before any commitment is made.',
      learningUnits: [
        { id: 'recurring-demand', title: 'Recurring demand', detail: 'Homes and offices need cleaning weekly or biweekly, creating predictable repeat revenue.' },
        { id: 'low-barrier', title: 'Low barrier to entry', detail: 'Can start with minimal equipment and no formal education requirement.' },
        {
          id: 'five-models',
          title: 'Five core business models',
          detail: 'Residential recurring, commercial contracts, Airbnb/short-term rental turnover, deep clean/one-time, move-in/move-out.',
        },
        { id: 'income-range', title: 'Typical income range', detail: 'Solo operators often earn $25-$50/hour equivalent; owners with crews scale beyond hourly limits.' },
      ],
      outputFormats: ['Article', 'Website Page', 'Academy'],
      leadsTo: 'cleaning-business-model-fit',
    },
    {
      id: 'cleaning-business-model-fit',
      title: 'Cleaning Business Model Fit',
      shape: 'Decision',
      problem: 'Decide which cleaning business model fits your skills, schedule, and goals.',
      summary: 'Matches personal constraints — time, capital, physical tolerance, client preference — to the best-fit business model.',
      learningUnits: [
        { id: 'time-availability', title: 'Time availability', detail: 'Part-time favors recurring residential; full-time can support commercial contracts.' },
        { id: 'starting-capital', title: 'Starting capital', detail: 'Airbnb turnover and commercial need more supplies/equipment upfront than residential.' },
        { id: 'physical-tolerance', title: 'Physical tolerance', detail: 'Deep clean and move-out work is more physically demanding than standard recurring visits.' },
        { id: 'client-preference', title: 'Client relationship preference', detail: 'Residential means direct client relationships; commercial means fewer, larger accounts.' },
      ],
      outputFormats: ['Workspace', 'AI Coaching', 'Academy'],
      leadsTo: 'cleaning-income-potential',
    },
    {
      id: 'cleaning-income-potential',
      title: 'Cleaning Income Potential',
      shape: 'Data',
      problem: 'Estimate realistic income before committing time or money.',
      summary: 'Projects monthly income from hours available, job rate, and client volume, by business model.',
      learningUnits: [
        { id: 'core-formula', title: 'Core formula', detail: 'Monthly income = jobs per week × average job price × 4.3 weeks.' },
        {
          id: 'rate-benchmarks',
          title: 'Rate benchmarks by model',
          detail: 'Residential recurring: $100-160/visit. Airbnb turnover: $60-120/turn. Commercial: often $0.10-0.20/sq ft.',
        },
        { id: 'capacity-ceiling', title: 'Capacity ceiling', detail: 'A solo operator tops out near 15-20 jobs/week before quality or hours suffer — hiring is the next lever.' },
      ],
      outputFormats: ['Workspace', 'Marketplace', 'Article'],
      leadsTo: 'cleaning-readiness',
    },
  ],
}
