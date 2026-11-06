const WIDTHS = new Set([4, 6, 8, 12])

function normalizeRow(row: number[]) {
  const sum = row.reduce((total, span) => total + span, 0)
  if (sum === 12) return row
  if (row.length === 2 && row.every((span) => span === 4)) return [6, 6]
  if (row.length === 1) return [12]
  const next = [...row]
  next[next.length - 1] += 12 - sum
  return next
}

export function packRows(spans: number[]) {
  const rows: number[][] = []
  let row: number[] = []
  let used = 0
  for (const raw of spans) {
    const span = WIDTHS.has(raw) ? raw : 6
    if (used + span > 12) {
      rows.push(normalizeRow(row))
      row = []
      used = 0
    }
    row.push(span)
    used += span
    if (used === 12) {
      rows.push(row)
      row = []
      used = 0
    }
  }
  if (row.length) rows.push(normalizeRow(row))
  for (const item of rows) {
    if (item.length === 1 && item[0] === 4) {
      throw new Error("packRows: linha com um único item de span 4")
    }
  }
  return rows.flat()
}

export function boardSpans(spans: number[]) {
  return packRows(spans)
}
