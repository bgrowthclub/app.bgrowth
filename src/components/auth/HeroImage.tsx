interface Props {
  src: string
  alt?: string
}

// Full-bleed background artwork for the Authentication System. Deliberately
// dumb — it only ever renders whatever `src` it's given. Swapping the actual
// photograph (see src/assets/auth/) never requires touching AuthLayout or
// any page: change the import, not the component.
export default function HeroImage({ src, alt = '' }: Props) {
  return (
    <div className="absolute inset-0">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  )
}
