// CSV seguro: aspas em todas as células (vírgula/aspas no valor não quebram
// colunas) e neutralização de fórmula. Um valor como "=HYPERLINK(...)" vindo da
// API viraria fórmula ao abrir no Excel (CSV/formula injection, OWASP).
const FORMULA_START = /^[=+\-@\t\r]/

export function csvCell(value) {
  if (typeof value === 'number') return `"${value}"`
  let text = value === null || value === undefined ? '' : String(value)
  if (FORMULA_START.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}
