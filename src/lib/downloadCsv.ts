// Saves rows as a .csv the browser downloads (16/11/2026). A byte-order mark
// first, so Excel reads accents right; values with a comma, quote or line
// break are quoted. Used by the Admin "Download CSV" buttons.
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const csv = '﻿' + rows.map((r) => r.map((v) => esc(v == null ? '' : String(v))).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
