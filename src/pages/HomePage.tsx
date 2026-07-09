import Hero from '../components/sections/Hero'
import LifeWorlds from '../components/sections/LifeWorlds'
import FeaturedJourneys from '../components/sections/FeaturedJourneys'
import Knowledge from '../components/sections/Knowledge'
import AboutStory from '../components/sections/AboutStory'

export default function HomePage() {
  return (
    <>
      <Hero />
      <LifeWorlds />
      <FeaturedJourneys />
      <Knowledge />
      <AboutStory />
    </>
  )
}
