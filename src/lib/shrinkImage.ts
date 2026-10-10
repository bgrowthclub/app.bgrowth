// Shrinks an image in the browser before upload (newsletter images, bundle
// covers): pages and e-mails load faster and the request stays well under
// the server's size limit. Returns a JPEG data URL — not WebP, which some
// e-mail apps (older Outlook) don't show.
export async function shrinkImage(file: File, maxWidth = 1200): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}
