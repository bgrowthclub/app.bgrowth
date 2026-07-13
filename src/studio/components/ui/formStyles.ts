// Shared classNames for the Product Engine's form controls — kept in one
// place so every tab's inputs/selects/textareas stay visually consistent
// without repeating the same className string six times.
export const inputClass =
  'mt-1.5 w-full rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 text-[13.5px] text-navy placeholder:text-navy/30 focus:border-primary/30 focus:outline-none'

export const textareaClass = `${inputClass} resize-y`

export const selectClass = `${inputClass} appearance-none`
