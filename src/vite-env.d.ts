/// <reference types="vite/client" />

declare module '*.png' {
  const src: string
  export default src
}
declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}
// html2pdf.js ships no type declarations; only modules/workspace/lib/pdf.ts
// imports it.
declare module 'html2pdf.js' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2pdf: any
  export default html2pdf
}
