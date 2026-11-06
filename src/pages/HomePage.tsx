import SEO from '../components/seo/SEO'
import { seoPage } from '../data/seoPages'
import HomeHero from '../components/sections/HomeHero'
import HomeSteps from '../components/sections/HomeSteps'
import HomePillars from '../components/sections/HomePillars'
import AboutStory from '../components/sections/AboutStory'
import HomeClose from '../components/sections/HomeClose'

// The Home page, rebuilt 05/11/2026 from the design the owner approved:
// the hero, the five steps, and the three pillars (Learn & Build, Market,
// Operate) with every product inside the pillar it belongs to.
//
// Hero, LifeWorlds, StartHere and Knowledge are no longer on this page.
// Their files are kept (CLAUDE.md §12) — Life Worlds still has its own page
// at /workspaces, and the texts of the retired sections stay editable in
// Admin → Site so nothing written there is lost.
export default function HomePage() {
  return (
    <>
      <SEO title={seoPage('/').title} description={seoPage('/').description} path="/" />
      <HomeHero />
      <HomeSteps />
      <HomePillars />
      <AboutStory />
      <HomeClose />
    </>
  )
}
