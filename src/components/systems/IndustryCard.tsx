import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

const MotionLink = motion(Link)

interface Props {
  icon: LucideIcon
  name: string
  description: string
  to: string
  index?: number
}

export default function IndustryCard({ icon: Icon, name, description, to, index = 0 }: Props) {
  return (
    <MotionLink
      to={to}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="group flex flex-col gap-4 rounded-xl2 border border-navy/[0.06] bg-white p-5 shadow-softer transition-all duration-300 hover:border-primary/20 hover:shadow-soft"
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-bg-soft text-primary transition-colors duration-300 group-hover:bg-grad-primary group-hover:text-white">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div>
        <p className="font-display text-[15px] font-semibold text-navy">{name}</p>
        <p className="mt-1 text-[13px] text-navy/45">{description}</p>
      </div>
    </MotionLink>
  )
}
