import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

interface Props {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
  footnote?: string
}

export default function MemberBanner({ eyebrow, title, description, children, footnote }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className="glass-card relative overflow-hidden px-8 py-14 text-center md:px-16 md:py-20"
    >
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[520px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(16,97,236,0.16), rgba(255,255,255,0) 70%)' }}
      />
      <div className="badge mx-auto">
        <Users size={14} strokeWidth={2.5} />
        {eyebrow}
      </div>
      <h2 className="mx-auto mt-5 max-w-xl font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-navy/55">{description}</p>

      {children && <div className="mx-auto mt-8 max-w-md">{children}</div>}
      {footnote && <p className="mt-5 text-[12.5px] text-navy/35">{footnote}</p>}
    </motion.div>
  )
}
