import { Package } from 'lucide-react'
import type { Product } from '../../modules/commerce/types/product'

interface Props {
  bundle: Product
  // The Workspaces it includes — their covers make the picture when the
  // bundle has no cover of its own.
  items: Product[]
  className?: string
  imgClassName?: string
}

// A bundle's picture: its own cover when the team uploaded one, otherwise
// the covers of up to four of its Workspaces side by side.
export default function BundleCover({ bundle, items, className = '', imgClassName = '' }: Props) {
  const own = bundle.assets.thumbnail
  const covers = items.map((i) => i.assets.thumbnail).filter((url): url is string => Boolean(url)).slice(0, 4)

  if (own) {
    return (
      <div className={`overflow-hidden bg-bg-soft ${className}`}>
        <img src={own} alt="" loading="lazy" className={`h-full w-full object-cover ${imgClassName}`} />
      </div>
    )
  }

  if (covers.length === 0) {
    return (
      <div className={`grid place-items-center bg-grad-primary text-white ${className}`}>
        <Package size={40} strokeWidth={1.6} />
      </div>
    )
  }

  // 1 → full, 2 → halves, 3 → one tall + two, 4 → 2×2.
  const grid = covers.length === 1 ? 'grid-cols-1 grid-rows-1' : covers.length === 2 ? 'grid-cols-2 grid-rows-1' : 'grid-cols-2 grid-rows-2'
  return (
    <div className={`grid gap-0.5 overflow-hidden bg-white ${grid} ${className}`}>
      {covers.map((url, i) => (
        <img
          key={url + i}
          src={url}
          alt=""
          loading="lazy"
          className={`h-full min-h-0 w-full object-cover ${covers.length === 3 && i === 0 ? 'row-span-2' : ''} ${imgClassName}`}
        />
      ))}
    </div>
  )
}
