import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../ui/Button'
import SearchBar from '../ui/SearchBar'
import { fadeUp } from '../../lib/motion'

// Rotating examples — purely presentational copy for the Hero's "what do
// you want to achieve next?" prompt. Not tied to any Growth Category data
// model; if that ever needs to change, it's a one-line array edit here.
const EXAMPLES = [
  'start a business.',
  'become a Mobile Notary.',
  'improve my finances.',
  'learn English.',
  'lose weight.',
]

const ROTATE_MS = 2800

export default function Hero() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [exampleIndex, setExampleIndex] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setExampleIndex((i) => (i + 1) % EXAMPLES.length)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/systems')
  }

  return (
    <section className="relative isolate overflow-hidden bg-grad-orbit pb-28 pt-40 md:pb-36 md:pt-52">
      <div className="bg-stars pointer-events-none absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />

      <div className="container-px relative mx-auto max-w-3xl text-center">
        <motion.div
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="show"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-white/70 backdrop-blur-sm"
        >
          GO BEYOND.
        </motion.div>

        <motion.h1
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="mt-7 font-display text-[34px] font-bold leading-[1.15] tracking-tight text-white sm:text-[46px] lg:text-[54px]"
        >
          What do you want to achieve next?
        </motion.h1>

        <motion.div
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
          className="mt-5 flex h-7 items-center justify-center text-[15px] text-white/55 sm:text-[17px]"
        >
          <span className="mr-1.5">I want to</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={exampleIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="font-semibold text-white"
            >
              {EXAMPLES[exampleIndex]}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <motion.form
          onSubmit={handleSearch}
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="show"
          className="mx-auto mt-9 max-w-lg"
        >
          <SearchBar value={query} onChange={setQuery} placeholder="Search for your next Journey…" />
        </motion.form>

        <motion.div
          variants={fadeUp}
          custom={4}
          initial="hidden"
          animate="show"
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button to="/register">Start Your Journey</Button>
          <Button
            href="#life-worlds"
            variant="secondary"
            className="!border-white/15 !bg-white/5 !text-white hover:!border-white/30"
          >
            Explore Life Worlds
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
