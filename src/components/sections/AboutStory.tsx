import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { fadeUp, viewportOnce } from '../../lib/motion'

export default function AboutStory() {
  return (
    <section id="about" className="section-py relative bg-bg-soft">
      <div className="container-px mx-auto max-w-narrow">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <Card padding="lg" className="text-center">
            <p className="eyebrow">Why BGrowth exists</p>
            <p className="mt-5 text-[19px] font-medium leading-relaxed text-navy sm:text-[21px]">
              Life doesn&rsquo;t always give us ideal circumstances. Growth rarely happens all at
              once — it happens one decision, one lesson, and one step at a time.
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-navy/55">
              BGrowth exists because we believe meaningful progress should be accessible to
              everyone. Whether you&rsquo;re starting over, chasing a dream, or building something
              bigger than yourself, every journey begins by deciding to move forward.
            </p>
            <div className="mt-8 flex justify-center">
              <Button to="/about" variant="secondary" icon={<ArrowRight size={16} />}>
                Read Our Story
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
