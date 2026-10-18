import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { fadeUp, viewportOnce } from '../../lib/motion'
import { usePageTexts } from '../../lib/usePageTexts'

export default function AboutStory() {
  const t = usePageTexts()
  return (
    <section id="about" className="section-py relative bg-bg-soft">
      <div className="container-px mx-auto max-w-narrow">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <Card padding="lg" className="text-center">
            <p className="eyebrow">{t.text('home.story.eyebrow')}</p>
            <p className="mt-5 text-[19px] font-medium leading-relaxed text-navy sm:text-[21px]">
              {t.text('home.story.lead')}
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-navy/55">
              {t.text('home.story.body')}
            </p>
            <div className="mt-8 flex justify-center">
              <Button to="/about" variant="secondary" icon={<ArrowRight size={16} />}>
                {t.text('home.story.button')}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
