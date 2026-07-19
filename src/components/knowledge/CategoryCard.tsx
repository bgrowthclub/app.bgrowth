import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { ArticleCategory } from '../../types/knowledge'

export default function CategoryCard({ category, index = 0 }: { category: ArticleCategory; index?: number }) {
  const Icon = category.icon
  return (
    <motion.a
      href="#"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.04, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="group flex flex-col gap-4 rounded-xl2 border border-navy/[0.06] bg-white p-5 shadow-softer transition-all duration-300 hover:border-primary/20 hover:shadow-soft"
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-bg-soft text-primary transition-colors duration-300 group-hover:bg-grad-primary group-hover:text-white">
        <Icon size={20} strokeWidth={2} aria-hidden="true" />
      </div>
      <div>
        <p className="font-display text-[15px] font-semibold text-navy">{category.name}</p>
        <p className="mt-1 text-[13px] text-navy/45">
          {category.articleCount} article{category.articleCount === 1 ? '' : 's'}
        </p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-[12px] font-semibold text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        Browse
        <ArrowRight size={12} aria-hidden="true" />
      </span>
    </motion.a>
  )
}
