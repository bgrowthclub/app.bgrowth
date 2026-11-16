import { unzipSync, strFromU8 } from 'fflate'
import { IMPORTED_BLOCK_TYPES, IMPORTED_LOOKS, MODEL_ID } from './importedModels'
import type { ImportedPageModel } from './importedModels'
import { MEMBER_PAGE_TEMPLATES } from './memberPageTemplates'

// Reads a "page package" (.zip) in the browser — contract v1 in the Plano
// BGrowth Pages doc (15/11/2026):
//
//   manifest.json                 { bgrowthPackage: 1, models: [{id, file}], assets: [...] }
//   models/<id>/model.json        the model; photos as "assets/<name>"
//   models/<id>/assets/<photos>
//
// Nothing is uploaded here: this only says what is in the package and what is
// wrong with it, so the Admin can show it before anything is saved. The
// server checks the model again (api/admin.ts cleanImportedModel).

export const PACKAGE_VERSION = 1
const PHOTO = /\.(jpe?g|png|webp)$/i
const MAX_PHOTO = 1024 * 1024
const MAX_PHOTOS = 12
const SINGLE = ['hero', 'contact', 'highlights', 'services', 'about', 'products', 'signup']
const COLORS = ['blue', 'teal', 'green', 'purple', 'rose', 'orange', 'navy']

export interface PackagePhoto {
  name: string // the file name inside assets/
  bytes: Uint8Array
  type: string
  url: string // a local preview (object URL) until it is uploaded
}

export interface PackageModel {
  // The model with photo paths still relative ("assets/cover.jpg").
  model: Omit<ImportedPageModel, 'status'>
  photos: PackagePhoto[]
  errors: string[]
  warnings: string[]
}

export interface ReadPackage {
  models: PackageModel[]
  errors: string[] // problems with the package as a whole
}

const mime = (name: string) => (/\.png$/i.test(name) ? 'image/png' : /\.webp$/i.test(name) ? 'image/webp' : 'image/jpeg')

export async function readModelPackage(file: File): Promise<ReadPackage> {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(new Uint8Array(await file.arrayBuffer()))
  } catch {
    return { models: [], errors: ['This file is not a valid .zip.'] }
  }
  // Some tools wrap everything in one folder: find manifest.json wherever it is.
  const manifestPath = Object.keys(files).find((p) => /(^|\/)manifest\.json$/.test(p) && !p.startsWith('__MACOSX'))
  if (!manifestPath) return { models: [], errors: ['manifest.json is missing.'] }
  const root = manifestPath.slice(0, -'manifest.json'.length)
  const json = (path: string): any => {
    const bytes = files[root + path]
    if (!bytes) return undefined
    try {
      return JSON.parse(strFromU8(bytes))
    } catch {
      return null
    }
  }
  const manifest = json('manifest.json')
  if (!manifest) return { models: [], errors: ['manifest.json is not valid JSON.'] }
  const errors: string[] = []
  if (manifest.bgrowthPackage !== PACKAGE_VERSION) errors.push(`Package version ${String(manifest.bgrowthPackage)} — this site reads version ${PACKAGE_VERSION}.`)
  const entries: { id: string; file: string }[] = Array.isArray(manifest.models) ? manifest.models : []
  if (!entries.length) errors.push('manifest.json lists no models.')
  const builtIn = new Set(MEMBER_PAGE_TEMPLATES.map((t) => t.id))
  const listed = new Set<string>((Array.isArray(manifest.assets) ? manifest.assets : []).map((a: any) => String(a?.file ?? '')))

  const models = entries.map((entry): PackageModel => {
    const errs: string[] = []
    const warns: string[] = []
    const raw = json(String(entry?.file ?? ''))
    const id = String(entry?.id ?? raw?.id ?? '')
    if (raw === undefined) errs.push(`${entry?.file} is missing.`)
    if (raw === null) errs.push(`${entry?.file} is not valid JSON.`)
    const m = raw ?? {}
    if (!MODEL_ID.test(id)) errs.push(`Id “${id}”: use lowercase letters, numbers and hyphens.`)
    if (m.id && m.id !== id) errs.push(`The manifest says “${id}” but model.json says “${m.id}”.`)
    if (builtIn.has(id)) errs.push(`“${id}” is a built-in model — choose another id.`)
    if (!IMPORTED_LOOKS.includes(m.look)) errs.push(`Unknown look “${m.look}”.`)
    if (!COLORS.includes(m.color)) errs.push(`Unknown color “${m.color}”.`)
    if (!m.name?.en && !m.name?.pt) errs.push('The model has no name.')
    const blocks = Array.isArray(m.blocks) ? m.blocks : []
    if (blocks.length < 2) errs.push('A model needs at least 2 sections.')
    const seen = new Set<string>()
    for (const b of blocks) {
      if (!IMPORTED_BLOCK_TYPES.includes(b?.type)) errs.push(`Unknown section “${b?.type}”.`)
      else if (SINGLE.includes(b.type) && seen.has(b.type)) errs.push(`Section “${b.type}” appears twice.`)
      seen.add(b?.type)
    }
    if (m.example?.highlights?.length && !seen.has('highlights')) warns.push('Featured items are in the example, but the model has no “highlights” section — they won’t show.')
    if (m.images?.gallery?.length && !seen.has('gallery')) warns.push('Gallery photos are listed, but the model has no “gallery” section.')

    // Every "assets/…" the model names, and every photo in its folder.
    const dir = String(entry?.file ?? '').replace(/model\.json$/, '')
    const refs = new Set<string>()
    const walk = (v: unknown) => {
      if (typeof v === 'string' && v.startsWith('assets/')) refs.add(v.slice('assets/'.length))
      else if (Array.isArray(v)) v.forEach(walk)
      else if (v && typeof v === 'object') Object.values(v).forEach(walk)
    }
    walk(m)
    const inFolder = Object.keys(files).filter((p) => p.startsWith(root + dir + 'assets/') && PHOTO.test(p))
    const photos: PackagePhoto[] = []
    for (const path of inFolder) {
      const name = path.slice((root + dir + 'assets/').length)
      if (!refs.has(name)) warns.push(`${name} is in the package but not used — it won’t be uploaded.`)
      else {
        const bytes = files[path]
        if (bytes.length > MAX_PHOTO) errs.push(`${name} is ${Math.round(bytes.length / 1024)} KB (1 MB max).`)
        if (!listed.has(dir + 'assets/' + name)) warns.push(`${name} is not listed in manifest.json.`)
        const type = mime(name)
        photos.push({ name, bytes, type, url: URL.createObjectURL(new Blob([bytes as BlobPart], { type })) })
      }
    }
    for (const r of refs) if (!photos.some((p) => p.name === r)) errs.push(`assets/${r} is named in model.json but is not in the package.`)
    if (photos.length > MAX_PHOTOS) errs.push(`${photos.length} photos — ${MAX_PHOTOS} at most.`)

    // Photo paths of the example's services and featured items move to
    // `images` (the showcase); the example itself keeps texts only.
    const ex = m.example ?? {}
    const model: PackageModel['model'] = {
      id,
      look: m.look,
      color: m.color,
      categories: Array.isArray(m.categories) ? m.categories.filter((c: unknown) => typeof c === 'string') : [],
      name: m.name ?? { en: id, pt: id },
      description: m.description ?? { en: '', pt: '' },
      blocks,
      example: {
        ...ex,
        services: (ex.services ?? []).map(({ image: _i, ...rest }: any) => rest),
        highlights: (ex.highlights ?? []).map(({ image: _i, ...rest }: any) => rest),
      },
      images: {
        ...(m.images ?? {}),
        services: (ex.services ?? []).map((s: any) => s?.image ?? null),
        highlights: (ex.highlights ?? []).map((h: any) => h?.image ?? null),
      },
    }
    return { model, photos, errors: errs, warnings: warns }
  })
  return { models, errors }
}

/** The model with each "assets/<name>" replaced (local previews or uploaded URLs). */
export function withPhotoUrls<T>(model: T, urlOf: (name: string) => string | undefined): T {
  const swap = (v: unknown): unknown => {
    if (typeof v === 'string' && v.startsWith('assets/')) return urlOf(v.slice('assets/'.length)) ?? null
    if (Array.isArray(v)) return v.map(swap)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]))
    return v
  }
  return swap(model) as T
}

/** A photo as a data URL, for the upload. */
export function photoDataUrl(photo: PackagePhoto): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(new Blob([photo.bytes as BlobPart], { type: photo.type }))
  })
}
