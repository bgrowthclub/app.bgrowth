// The single PDF engine shared with the Portal and Studio (same html2pdf.js
// options) — "Download PDF" captures the off-screen DocumentPrintSummary.
// html2pdf.js is loaded only when a member actually downloads.
//
// The printable element's parent (.printable-summary-container, 0×0
// off-screen so html2canvas can still rasterize it) is temporarily laid
// out at 800px for the capture, then restored.
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
  pdfOptions?: { pagebreakMode?: string[]; margin?: [number, number, number, number] },
): Promise<void> {
  const { default: html2pdf } = await import('html2pdf.js')
  const target = element.parentElement ?? element
  const saved = target.getAttribute('style') ?? ''

  Object.assign(target.style, {
    position: 'absolute',
    top: '0px',
    left: '-9999px',
    width: '800px',
    height: 'auto',
    overflow: 'visible',
    zIndex: '99999',
    opacity: '1',
    visibility: 'visible',
  })

  const options = {
    margin: pdfOptions?.margin ?? ([10, 12, 10, 12] as [number, number, number, number]),
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, windowWidth: 824 },
    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' as const },
    pagebreak: { mode: pdfOptions?.pagebreakMode ?? ['avoid-all', 'css', 'legacy'] },
  }

  try {
    await html2pdf().set(options).from(element).save()
  } finally {
    target.setAttribute('style', saved)
  }
}
