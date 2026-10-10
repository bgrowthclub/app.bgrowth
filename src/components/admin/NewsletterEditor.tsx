import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Undo2, Redo2 } from 'lucide-react'
import { adminService } from '../../modules/admin/adminService'
import { shrinkImage } from '../../lib/shrinkImage'

interface Props {
  value: string
  onChange: (html: string) => void
  readOnly?: boolean
}

const TOOL =
  'grid h-9 w-9 place-items-center rounded-lg text-navy/60 transition-colors hover:bg-bg-soft hover:text-navy disabled:opacity-30 aria-pressed:bg-primary/10 aria-pressed:text-primary'

// The body of a newsletter e-mail: headings, bold/italic, lists, quotes,
// links and images. Writes plain HTML; api/admin.ts adds the e-mail styles.
export default function NewsletterEditor({ value, onChange, readOnly }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } }),
      Image.configure({ inline: false }),
    ],
    content: value,
    editable: !readOnly,
    immediatelyRender: true,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class:
          'newsletter-body min-h-[320px] px-5 py-4 outline-none text-[15px] leading-relaxed text-navy/80 [&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-navy [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-bold [&_h3]:text-navy [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-xl [&_blockquote]:border-l-[3px] [&_blockquote]:border-primary [&_blockquote]:pl-3',
      },
    },
  })

  // A different draft loaded into the same editor.
  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  useEffect(() => {
    editor?.setEditable(!readOnly)
  }, [editor, readOnly])

  if (!editor) return null

  async function addImage(file: File) {
    setUploading(true)
    setError(null)
    try {
      const url = await adminService.uploadNewsletterImage(await shrinkImage(file))
      editor!.chain().focus().setImage({ src: url, alt: '' }).run()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t upload the image.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function setLink() {
    const previous = editor!.getAttributes('link').href as string | undefined
    const url = window.prompt('Link address (https://…). Leave empty to remove the link.', previous ?? 'https://')
    if (url === null) return
    if (!url.trim() || url.trim() === 'https://') {
      editor!.chain().focus().unsetLink().run()
      return
    }
    editor!.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  const tools = [
    { label: 'Heading', icon: Heading2, active: editor.isActive('heading', { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Subheading', icon: Heading3, active: editor.isActive('heading', { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Bold', icon: Bold, active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', icon: Italic, active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Bulleted list', icon: List, active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Numbered list', icon: ListOrdered, active: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'Quote', icon: Quote, active: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: 'Link', icon: Link2, active: editor.isActive('link'), run: setLink },
  ]

  return (
    <div className="overflow-hidden rounded-xl2 border border-navy/10 bg-white">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 border-b border-navy/[0.06] bg-bg-soft/60 px-2 py-1.5">
          {tools.map(({ label, icon: Icon, active, run }) => (
            <button key={label} type="button" title={label} aria-label={label} aria-pressed={active} onClick={run} className={TOOL}>
              <Icon size={17} />
            </button>
          ))}
          <button
            type="button"
            title="Add image"
            aria-label="Add image"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className={TOOL}
          >
            <ImagePlus size={17} />
          </button>
          <span className="mx-1 h-5 w-px bg-navy/10" />
          <button type="button" title="Undo" aria-label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={TOOL}>
            <Undo2 size={17} />
          </button>
          <button type="button" title="Redo" aria-label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={TOOL}>
            <Redo2 size={17} />
          </button>
          {uploading && <span className="ml-2 text-[12px] text-navy/50">Uploading image…</span>}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void addImage(file)
            }}
          />
        </div>
      )}
      <EditorContent editor={editor} />
      {error && <p className="border-t border-navy/[0.06] px-5 py-2 text-[13px] text-red-500">{error}</p>}
    </div>
  )
}
