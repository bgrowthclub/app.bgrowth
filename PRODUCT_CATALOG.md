# BGrowth Product Catalog

This is the master catalog of everything BGrowth offers — every Growth
Category, every collection, and the flagship products inside each one. It
sits alongside VISION.md (why BGrowth exists), ARCHITECTURE.md (how it's
built), and CLAUDE.md (how we build it): this document answers **what
BGrowth actually sells and offers**, category by category.

This is a business/product document, not a technical one — it does not
describe code. For how every category maps onto the same technical
Runtime and Workspace, see ARCHITECTURE.md.

---

## The Growth System Framework

Every product BGrowth offers — regardless of category — is a **Growth
System™**. A Growth System is not a course and not a static download. It
is software a person works *through*, in the same seven stages, every
time:

1. **Discover** — understand what this Growth System is, who it's for,
   and what changes once it's done. This is the "should I start this"
   stage — a prospective member evaluates the system before committing.
2. **Learn** — the concepts, context, and background needed before acting
   — enough to act with confidence, not a full course to sit through
   first.
3. **Plan** — turn the goal into a concrete, sequenced plan — the specific
   decisions, numbers, and choices this person's situation requires.
4. **Take Action** — do the actual work, step by step, in order — the
   repeatable workflow at the center of the system.
5. **Track Progress** — see what's done, what's outstanding, and what's
   next, so the system can be picked up and put down without losing the
   thread.
6. **Grow** — what comes after this system is finished — the next system,
   the deeper skill, the adjacent goal it unlocks.
7. **Resources** — templates, guides, calculators, and reference material
   that support the system without being the system itself.

This seven-stage framework is a **permanent BGrowth standard**. Every
Growth System, in every category — a business launch, a job search, a
language habit, a budget, a wellness goal, a family event — is authored
against these same seven stages. A new category never earns a new
framework; it reuses this one.

## Category & Product Naming

- **Growth System™** is the universal term for anything built on this
  framework, in any category.
- **Business System™** is the established, category-specific name for a
  Growth System inside **Business & Entrepreneurship** — this name
  predates the broader Growth System concept and keeps its existing brand
  equity; it is not being retired. Other categories don't need their own
  category-specific umbrella term unless one earns the same recognition —
  by default, a system in any other category is simply referred to as a
  Growth System™ (e.g. "Resume Builder™, a Growth System in Careers &
  Professions").
- Every individual product keeps its own trademarked name — *Start Your
  Notary Business™*, *Resume Builder™*, *Budget Planner™* — per CLAUDE.md's
  naming conventions.
- **Collections** are curatorial groupings *within* a category (e.g.
  Business & Entrepreneurship's "Launch Collection"). A single Growth
  System can belong to more than one collection — collections are tags,
  not exclusive folders.

---

## Category 1 — 💼 Business & Entrepreneurship

**Purpose:** Help people start, run, grow, and scale businesses.

**Status:** Live — this is the only category with real catalog data and
Growth Systems built today (`src/data/systems.ts`).

**Collections:**

- **Launch Collection** — first-time launch, start-to-finish sequences.
- **Home Services** — businesses that work in and around homes and
  properties (cleaning, notary, landscaping, handyman, and similar).
- **Professional Services** — licensed or specialized service work.
- **Online Businesses** — not yet represented in the current catalog; a
  priority gap for catalog expansion (see Recommendations).
- **Business Essentials** — foundational, cross-industry operating
  disciplines (equipment, bookkeeping) any business needs regardless of
  industry.

**Today's flagship systems** (a system can sit in more than one
collection):

| Growth System | Collection(s) |
|---|---|
| Start Your Notary Business™ | Launch Collection, Professional Services |
| Notary Equipment System™ | Business Essentials |
| Daily Notary Operations™ | Professional Services |
| Notary Signing Agent System™ | Professional Services |
| Cleaning Business Launch™ | Launch Collection, Home Services |
| Bookkeeping Operations™ | Business Essentials, Professional Services |

## Category 2 — 💼 Careers & Professions

**Purpose:** Help people qualify for jobs, build careers, and grow
professionally.

**Status:** Planned — no catalog data exists yet. See ARCHITECTURE.md for
how this category reuses the existing Runtime unchanged.

**Example Growth Systems:**

- Resume Builder™
- Interview Success™
- Administrative Assistant Career™
- Medical Receptionist Career™
- Customer Service Professional™
- Project Coordinator™
- Leadership™
- Communication™
- Time Management™ *(also relevant to Productivity — see the tagging note
  in Recommendations)*

## Category 3 — 🌍 Languages

**Purpose:** Help people communicate confidently.

**Status:** Planned — no catalog data exists yet.

**Example Growth Systems:**

- English for Beginners™
- English Conversation™
- Business English™
- English for Healthcare™
- English for Hospitality™
- English Interview Preparation™

Future support for additional languages beyond English is expected as this
category matures.

## Category 4 — 💰 Personal Finance

**Purpose:** Help people organize, protect, and grow their finances.

**Status:** Planned — no catalog data exists yet.

**Example Growth Systems:**

- Budget Planner™
- Debt-Free System™
- Emergency Fund™
- Investing Basics™
- Retirement Planning™
- Credit Builder™

## Category 5 — 🎯 Productivity

**Purpose:** Help people become more productive.

**Status:** Planned — no catalog data exists yet.

**Example Growth Systems:**

- Goal Achievement™
- Habit Builder™
- Focus System™
- Time Management™ *(shared with Careers & Professions — see
  Recommendations)*
- Digital Organization™

## Category 6 — 🎓 Education

**Purpose:** Support learning and academic success.

**Status:** Planned — no catalog data exists yet.

**Example Growth Systems:**

- Study Planner™
- College Success™
- Exam Preparation™
- Research Skills™

## Category 7 — ❤️ Health & Wellness

**Purpose:** Support healthy habits and long-term wellbeing.

**Status:** Planned — no catalog data exists yet.

**Example Growth Systems:**

- Weight Loss Journey™
- Meal Planning™
- Fitness Planner™
- Healthy Habits™
- Walking Challenge™

## Category 8 — 🏡 Family & Lifestyle

**Purpose:** Help people organize important moments and everyday life.

**Status:** Planned — no catalog data exists yet.

**Example Growth Systems:**

- Home Organization™
- Moving Planner™
- Wedding Planner™
- Family Budget™
- Travel Planner™

---

## Status Summary

| # | Category | Status | Collections defined | Flagship systems today |
|---|---|---|---|---|
| 1 | 💼 Business & Entrepreneurship | **Live** | 5 | 6 |
| 2 | 💼 Careers & Professions | Planned | — | 0 |
| 3 | 🌍 Languages | Planned | — | 0 |
| 4 | 💰 Personal Finance | Planned | — | 0 |
| 5 | 🎯 Productivity | Planned | — | 0 |
| 6 | 🎓 Education | Planned | — | 0 |
| 7 | ❤️ Health & Wellness | Planned | — | 0 |
| 8 | 🏡 Family & Lifestyle | Planned | — | 0 |

Adding a system to any "Planned" category is a **data change, not a code
change** — see ARCHITECTURE.md on how every category reuses the same
Runtime and Workspace. Do not build a new page, component, or Runtime
variant to launch a new category.
