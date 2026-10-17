import SEO from '../components/seo/SEO'
import { seoPage } from '../data/seoPages'
import Hero from '../components/sections/Hero'
import LifeWorlds from '../components/sections/LifeWorlds'
import StartHere from '../components/sections/StartHere'
import Knowledge from '../components/sections/Knowledge'
import AboutStory from '../components/sections/AboutStory'

export default function HomePage() {
  return (
    <>
      <SEO title={seoPage('/').title} description={seoPage('/').description} path="/" />
      <Hero />
      <LifeWorlds />
      <StartHere />
      <Knowledge />
      <AboutStory />
    </>
  )
}
