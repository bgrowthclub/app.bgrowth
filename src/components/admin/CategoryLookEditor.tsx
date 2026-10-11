import { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import Button from '../ui/Button'
import { CATEGORY_COLOR_CHOICES, CATEGORY_ICON_CHOICES, DEFAULT_CATEGORY_LOOK, categoryLook } from '../systems/categoryIcons'
import { adminService } from '../../modules/admin/adminService'
import { shrinkImage } from '../../lib/shrinkImage'
import { LINK_BUTTON, SMALL_BUTTON } from './styles'
import type { AdminCategory } from '../../modules/admin/types'

export interface CategoryLookPatch {
  icon: string
  color: string
  coverImageUrl: string
}

interface Props {
  category: AdminCategory
  busy: boolean
  onSave: (patch: CategoryLookPatch) => Promise<boolean>
  onClose: () => void
}

// The look of one area or category: icon, color and an optional cover
// image (Portal migration 0047). Opens under the category in Admin →
// Catalog → Categories.
export default function CategoryLookEditor({ category, busy, onSave, onClose }: Props) {
  const [icon, setIcon] = useState(category.icon ?? DEFAULT_CATEGORY_LOOK.icon)
  const [color, setColor] = useState(category.color ?? DEFAULT_CATEGORY_LOOK.color)
  const [cover, setCover] = useState(category.cover_image_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { Icon, color: tone } = categoryLook({ icon, color })

  async function upload(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      setCover(await adminService.uploadCategoryCover(await shrinkImage(file, 1600)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t upload the image.')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (await onSave({ icon, color, coverImageUrl: cover })) onClose()
  }

  return (
    <div className="mt-2 space-y-4 rounded-xl border border-navy/[0.08] bg-bg-soft p-4">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${tone.soft}`}>
          <Icon size={14} /> {category.name}
        </span>
        <span className="text-[12px] text-navy/40">preview</span>
      </div>

      <div>
        <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-navy/40">Icon</p>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
          {Object.entries(CATEGORY_ICON_CHOICES).map(([key, choice]) => {
            const ChoiceIcon = choice.icon
            return (
              <button
                key={key}
                type="button"
                title={choice.label}
                aria-label={choice.label}
                aria-pressed={icon === key}
                onClick={() => setIcon(key)}
                className={`grid h-9 place-items-center rounded-lg border transition-colors ${
                  icon === key ? 'border-primary bg-white text-primary' : 'border-transparent text-navy/50 hover:bg-white'
                }`}
              >
                <ChoiceIcon size={16} />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-navy/40">Color</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_COLOR_CHOICES).map(([key, choice]) => (
            <button
              key={key}
              type="button"
              title={choice.label}
              aria-label={choice.label}
              aria-pressed={color === key}
              onClick={() => setColor(key)}
              className={`h-7 w-7 rounded-full ${choice.dot} ring-offset-2 transition ${color === key ? 'ring-2 ring-navy/60' : ''}`}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-navy/40">
          Cover image <span className="font-normal normal-case text-navy/35">(optional — for its page later)</span>
        </p>
        {cover ? (
          <div className="flex items-center gap-3">
            <img src={cover} alt="" className="h-14 w-24 rounded-lg object-cover" />
            <button type="button" onClick={() => setCover('')} className={`${LINK_BUTTON} inline-flex items-center gap-1 text-red-500 hover:bg-red-50`}>
              <X size={14} /> Remove
            </button>
          </div>
        ) : (
          <label className={`${LINK_BUTTON} inline-flex cursor-pointer items-center gap-1.5 bg-white text-primary hover:bg-white/70`}>
            <ImagePlus size={15} /> {uploading ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => void upload(e.target.files?.[0])} />
          </label>
        )}
      </div>

      {error && <p className="text-[13px] text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" disabled={busy || uploading} onClick={() => void save()} className={SMALL_BUTTON}>
          Save look
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className={SMALL_BUTTON}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
