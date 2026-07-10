import type { JourneyStage } from '../../../types/journey'

export const researchStage: JourneyStage = {
  id: 'research',
  name: 'Research',
  description: 'Understand local demand and competition before choosing a niche.',
  objects: [
    {
      id: 'cleaning-local-market-demand',
      title: 'Cleaning Local Market Demand',
      shape: 'Process',
      problem: 'Know if there is real local demand before investing further.',
      summary: 'A repeatable process for checking local demand signals before committing to a service area.',
      learningUnits: [
        { id: 'search-demand', title: 'Search demand check', detail: 'Check local search volume for "cleaning service near me" and model-specific terms.' },
        { id: 'household-density', title: 'Household/business density', detail: 'Cross-reference target neighborhoods or business districts against income and density data.' },
        { id: 'population-growth', title: 'Population and housing growth', detail: 'Growing areas signal rising demand for recurring services over the next few years.' },
        { id: 'existing-supply', title: 'Existing supply check', detail: 'Count active competitors already serving the area to gauge saturation.' },
      ],
      outputFormats: ['Workspace', 'Article'],
      leadsTo: 'cleaning-competitor-landscape',
    },
    {
      id: 'cleaning-competitor-landscape',
      title: 'Cleaning Competitor Landscape',
      shape: 'Reference',
      problem: 'Understand what competitors charge and offer before setting your own pricing.',
      summary: 'Defines what to capture about each competitor so pricing and positioning decisions are evidence-based.',
      learningUnits: [
        { id: 'pricing-structure', title: 'Pricing structure', detail: 'Log whether each competitor charges per-hour, per-job, or per-square-foot.' },
        { id: 'service-scope', title: 'Service scope', detail: 'Note what is included vs. offered as an add-on (inside fridge, windows, laundry).' },
        { id: 'review-signal', title: 'Review signal', detail: 'Review count and average rating indicate real demand and satisfaction level.' },
        { id: 'response-speed', title: 'Response speed', detail: 'How fast a competitor responds to a quote request is a hidden competitive edge to beat.' },
      ],
      outputFormats: ['Workspace', 'Marketplace'],
      leadsTo: 'cleaning-niche-selection',
    },
    {
      id: 'cleaning-niche-selection',
      title: 'Cleaning Business Niche Selection',
      shape: 'Decision',
      problem: 'Choose one clear niche instead of trying to serve everyone.',
      summary: 'Weighs the four core niches against the demand and competitor research to recommend one starting focus.',
      learningUnits: [
        { id: 'recurring-residential', title: 'Recurring residential', detail: 'Best for stable, predictable income with a smaller crew.' },
        { id: 'airbnb-turnover', title: 'Airbnb/short-term rental turnover', detail: 'Higher frequency, tighter deadlines, premium pricing per turn.' },
        { id: 'commercial-contracts', title: 'Commercial contracts', detail: 'Larger, steadier accounts but longer sales cycles and stricter compliance.' },
        { id: 'move-in-move-out', title: 'Move-in/move-out', detail: 'One-time higher-ticket jobs, good for filling schedule gaps.' },
        {
          id: 'decision-rule',
          title: 'Decision rule',
          detail: 'Pick the niche where local demand is strong, competition is thin, and required capital matches current readiness.',
        },
      ],
      outputFormats: ['Workspace', 'AI Coaching'],
      leadsTo: 'cleaning-business-plan-outline',
    },
  ],
}
