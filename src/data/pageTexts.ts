// The editable texts of the Home, About and Coming Soon pages: each field's
// built-in text, grouped as Admin → Site → Page texts shows them. A saved
// version lives in portal.site_content key "page-texts" ({ fieldId: text })
// and is read through lib/usePageTexts.ts; a field left out shows the text
// below.

export type PageTextKind = 'line' | 'paragraph' | 'list'

export interface PageTextField {
  id: string
  label: string
  kind: PageTextKind
  default: string | string[]
}

export interface PageTextBlock {
  page: 'Home' | 'About' | 'Coming soon'
  title: string
  fields: PageTextField[]
}

const line = (id: string, label: string, text: string): PageTextField => ({ id, label, kind: 'line', default: text })
const para = (id: string, label: string, text: string): PageTextField => ({ id, label, kind: 'paragraph', default: text })
const list = (id: string, label: string, items: string[]): PageTextField => ({ id, label, kind: 'list', default: items })

export const PAGE_TEXT_BLOCKS: PageTextBlock[] = [
  {
    page: 'Home',
    title: 'Top of the page',
    fields: [
      line('home.hero.title1', 'Title — first line', 'What do you want'),
      line('home.hero.title2', 'Title — second line', 'to achieve'),
      line('home.hero.highlight', 'Title — highlighted word (blue)', 'next?'),
      para('home.hero.subtitle', 'Sentence under the title', 'Discover the right solutions, knowledge and guidance to move forward, one goal at a time.'),
      line('home.hero.examplesLead', 'Start of the rotating line', 'I want to'),
      list('home.hero.examples', 'Rotating examples (one per line)', [
        'become a Mobile Notary.',
        'start a cleaning business.',
        'improve my finances.',
        'build better habits.',
        'learn English.',
        'lose weight.',
      ]),
      line('home.hero.searchPlaceholder', 'Text inside the search field', 'Search your next goal…'),
      list('home.hero.goals', 'Popular goals under the search (one per line)', [
        'Become a Mobile Notary',
        'Start a Cleaning Business',
        'Improve My Finances',
        'Build Better Habits',
        'Learn English',
        'Lose Weight',
        'Become a Tax Preparer',
        'Start a Pressure Washing Business',
      ]),
    ],
  },
  {
    page: 'Home',
    title: 'Life Worlds',
    fields: [
      line('home.worlds.badge', 'Label', 'Life Worlds'),
      line('home.worlds.title', 'Title', 'What do you want to achieve next?'),
      para('home.worlds.description', 'Sentence', 'Choose an interactive workspace designed to help you organize, learn, plan and accomplish meaningful goals.'),
    ],
  },
  {
    page: 'Home',
    title: 'Start Here',
    fields: [
      line('home.start.eyebrow', 'Label', 'Start Here'),
      line('home.start.title', 'Title', 'Start with one goal.'),
      para('home.start.description', 'Sentence', 'Explore some of the most popular BGrowth Workspaces designed to help you take action and achieve meaningful results.'),
    ],
  },
  {
    page: 'Home',
    title: 'Knowledge',
    fields: [
      line('home.knowledge.eyebrow', 'Label', 'Knowledge'),
      line('home.knowledge.title', 'Title', 'Knowledge should be accessible to everyone.'),
      para(
        'home.knowledge.description',
        'Sentence',
        'Every meaningful journey begins by learning something new. Explore practical knowledge designed to help you move forward with confidence.',
      ),
    ],
  },
  {
    page: 'Home',
    title: 'Why BGrowth exists',
    fields: [
      line('home.story.eyebrow', 'Label', 'Why BGrowth exists'),
      para(
        'home.story.lead',
        'First paragraph (large)',
        'Life doesn’t always give us ideal circumstances. Growth rarely happens all at once — it happens one decision, one lesson, and one step at a time.',
      ),
      para(
        'home.story.body',
        'Second paragraph',
        'BGrowth exists because we believe meaningful progress should be accessible to everyone. Whether you’re starting over, chasing a dream, or building something bigger than yourself, every journey begins by deciding to move forward.',
      ),
      line('home.story.button', 'Button', 'Read Our Story'),
    ],
  },
  {
    page: 'About',
    title: 'Top of the page',
    fields: [
      line('about.hero.eyebrow', 'Label', 'About BGrowth'),
      line('about.hero.title', 'Title', 'We build outcomes, not content.'),
      para(
        'about.hero.text',
        'Sentence',
        'BGrowth exists to help people turn ambition into action — with tools they actually work from, not lessons they watch once.',
      ),
    ],
  },
  {
    page: 'About',
    title: 'Our Mission',
    fields: [
      line('about.mission.eyebrow', 'Label', 'Our Mission'),
      line('about.mission.title', 'Title', 'Turn ambition into action, in every area of life.'),
      para(
        'about.mission.text',
        'Paragraph',
        'Most people who want to grow — in their business, their career, their finances, or their life — aren’t short on effort. They’re short on structure. BGrowth exists to give them that structure inside Workspace™: clear, guided systems that replace guesswork with a repeatable process.',
      ),
    ],
  },
  {
    page: 'About',
    title: 'Why BGrowth Exists',
    fields: [
      line('about.why.eyebrow', 'Label', 'Why BGrowth Exists'),
      line('about.why.title', 'Title', 'Advice is everywhere. Structure isn’t.'),
      para(
        'about.why.text',
        'Sentence',
        "Anyone can find advice about reaching a goal. What's missing is a system that turns that advice into action — the actual steps, ready to work through in the order that fits you.",
      ),
    ],
  },
  {
    page: 'About',
    title: 'The Method (3 steps)',
    fields: [
      line('about.method.eyebrow', 'Label', 'The Method'),
      line('about.method.title', 'Title', 'The Growth System Method'),
      line('about.method.step1.title', 'Step 1 — name', 'Choose'),
      para('about.method.step1.text', 'Step 1 — text', 'Pick the Workspace built for what you actually want to achieve.'),
      line('about.method.step2.title', 'Step 2 — name', 'Follow'),
      para('about.method.step2.text', 'Step 2 — text', 'Work through Planners™, Workflows™, and Toolkits™ in the order that fits your work.'),
      line('about.method.step3.title', 'Step 3 — name', 'Repeat'),
      para('about.method.step3.text', 'Step 3 — text', 'Reuse the same system every time you need it — it never changes on you.'),
    ],
  },
  {
    page: 'About',
    title: 'How It Works',
    fields: [
      line('about.how.eyebrow', 'Label', 'How It Works'),
      line('about.how.title', 'Title', 'Software you work from, not a document you read.'),
      para(
        'about.how.text',
        'Sentence',
        'Every Workspace runs right in your browser. Complete it online, print it, or save a copy — nothing about it feels like a downloaded PDF.',
      ),
    ],
  },
  {
    page: 'About',
    title: 'Our Vision',
    fields: [
      line('about.vision.eyebrow', 'Label', 'Our Vision'),
      line('about.vision.title', 'Title', 'Every meaningful goal, systemized.'),
      para(
        'about.vision.text',
        'Paragraph',
        'We’re building toward a Workspace for every meaningful goal — starting a business, growing a career, mastering your finances, building better habits, learning something new, and everything after. Choose what you want to achieve, and the Workspace built for it should already be waiting.',
      ),
    ],
  },
  {
    page: 'About',
    title: 'Systems, Not Courses (3 cards)',
    fields: [
      line('about.systems.eyebrow', 'Label', 'Systems, Not Courses'),
      line('about.systems.title', 'Title', 'Why we don’t build courses'),
      line('about.systems.card1.title', 'Card 1 — title', 'Courses teach. Systems do.'),
      para('about.systems.card1.text', 'Card 1 — text', 'A course explains a concept once. A system is something you open and work from every single time.'),
      line('about.systems.card2.title', 'Card 2 — title', 'No 6 hours of video required'),
      para('about.systems.card2.text', 'Card 2 — text', 'You don’t have to watch anything to get started — you just start filling it out.'),
      line('about.systems.card3.title', 'Card 3 — title', 'Built for repetition'),
      para(
        'about.systems.card3.text',
        'Card 3 — text',
        'Meaningful progress is repetitive work. Our systems are built to be reused, not watched once and forgotten.',
      ),
    ],
  },
  {
    page: 'About',
    title: 'Closing call to action',
    fields: [
      line('about.cta.title', 'Title', 'Ready to achieve something new?'),
      para('about.cta.text', 'Sentence', 'Explore interactive Workspaces built for what you want to achieve.'),
      line('about.cta.button', 'Button', 'Explore Workspaces'),
    ],
  },
  {
    page: 'Coming soon',
    title: 'Coming soon page',
    fields: [
      line('soon.eyebrow', 'Label', 'Coming soon'),
      line('soon.title', 'Title', 'BGrowth is almost here.'),
      para(
        'soon.text',
        'Sentence',
        'Interactive Workspaces™, ready-to-use documents and tools to help you organize, learn and grow. Leave your e-mail and we’ll let you know the day we open.',
      ),
      line('soon.button', 'Button', 'Notify me'),
    ],
  },
]

export const PAGE_TEXT_DEFAULTS: Record<string, string | string[]> = Object.fromEntries(
  PAGE_TEXT_BLOCKS.flatMap((b) => b.fields.map((f) => [f.id, f.default])),
)

export type PageTexts = Record<string, string | string[]>
