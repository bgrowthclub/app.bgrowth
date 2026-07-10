import type { JourneyStage } from '../../../types/journey'

export const assessStage: JourneyStage = {
  id: 'assess',
  name: 'Assess',
  description: 'Confirm personal readiness and true startup costs before committing.',
  objects: [
    {
      id: 'cleaning-readiness',
      title: 'Cleaning Business Readiness',
      shape: 'Decision',
      problem: 'Know if you are personally ready — time, physical demands, savings — before you start.',
      summary: 'Scores readiness across time, physical capacity, and financial runway, with a next step attached to each gap.',
      learningUnits: [
        { id: 'time-readiness', title: 'Time readiness', detail: 'At least 10-15 open hours/week to start without quitting a primary income source.' },
        { id: 'financial-runway', title: 'Financial runway', detail: '1-3 months of personal expenses covered before revenue is reliable.' },
        { id: 'physical-readiness', title: 'Physical readiness', detail: 'Comfortable with repetitive physical work for 3-6 hour stretches.' },
        { id: 'gap-to-action', title: 'Gap-to-action mapping', detail: 'Each unmet dimension maps to a specific fix — e.g. low runway means starting part-time first.' },
      ],
      outputFormats: ['Workspace', 'AI Coaching'],
      leadsTo: 'cleaning-startup-costs',
    },
    {
      id: 'cleaning-startup-costs',
      title: 'Cleaning Startup Costs',
      shape: 'Data',
      problem: 'Know the real cash needed to start, not a guess.',
      summary: 'Itemizes every realistic startup cost into one total, by category.',
      learningUnits: [
        { id: 'supplies-equipment', title: 'Supplies & equipment', detail: '$150-400: vacuum, mop system, chemicals, caddy, microfiber cloths.' },
        { id: 'insurance-bonding', title: 'Insurance & bonding', detail: '$300-600/year: general liability insurance plus a surety bond.' },
        { id: 'licensing-registration', title: 'Licensing & registration', detail: '$50-300 depending on state/city business license and entity filing.' },
        { id: 'marketing-launch', title: 'Marketing launch spend', detail: '$100-300: Google Business Profile setup, basic website or listing, initial ads.' },
        { id: 'typical-total', title: 'Typical total range', detail: '$600-1,600 to launch a solo residential operation.' },
      ],
      outputFormats: ['Workspace', 'Marketplace', 'Article'],
      leadsTo: 'cleaning-legal-structure',
    },
    {
      id: 'cleaning-legal-structure',
      title: 'Cleaning Business Legal Structure',
      shape: 'Reference',
      problem: 'Choose the right legal structure and know what licensing actually applies.',
      summary: 'Compares sole proprietorship and LLC, and clarifies when licensing or bonding is required.',
      learningUnits: [
        { id: 'sole-prop', title: 'Sole proprietorship', detail: 'Fastest, cheapest to start; no liability separation between business and personal assets.' },
        { id: 'llc', title: 'LLC', detail: 'Costs more and requires state filing; separates personal liability from business debts/claims.' },
        { id: 'when-to-upgrade', title: 'When to upgrade', detail: 'Move to an LLC once hiring employees or entering commercial contracts that require it.' },
        {
          id: 'licensing-varies',
          title: 'Licensing varies by locality',
          detail: 'Most areas only require a general business license; some cities add a cleaning/janitorial permit.',
        },
      ],
      outputFormats: ['Article', 'Academy', 'AI Coaching'],
      leadsTo: 'cleaning-risk-insurance',
    },
    {
      id: 'cleaning-risk-insurance',
      title: 'Cleaning Risk & Insurance',
      shape: 'Reference',
      problem: 'Avoid operating uninsured or unbonded and exposed to liability.',
      summary: 'Defines the minimum coverage a cleaning business needs before taking paying clients.',
      learningUnits: [
        { id: 'general-liability', title: 'General liability insurance', detail: 'Covers property damage or injury claims during a job — the non-negotiable minimum.' },
        { id: 'bonding', title: 'Bonding', detail: 'Protects clients against theft claims; often required by commercial and property-management clients.' },
        { id: 'client-waivers', title: 'Client waivers', detail: 'A signed service agreement limits disputes over pre-existing damage.' },
        { id: 'workers-comp', title: "Workers' comp threshold", detail: 'Required in most states as soon as the first employee (not subcontractor) is hired.' },
      ],
      outputFormats: ['Workspace', 'Marketplace', 'Article'],
      leadsTo: 'cleaning-local-market-demand',
    },
  ],
}
