export function quantileBreaks(values: number[], classes = 5) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)
  if (sorted.length === 0) return []
  const edges: number[] = []
  for (let step = 1; step < classes; step += 1) {
    const position = ((sorted.length - 1) * step) / classes
    const lower = Math.floor(position)
    const upper = Math.ceil(position)
    const weight = position - lower
    edges.push(sorted[lower] * (1 - weight) + sorted[upper] * weight)
  }
  return edges
}

export function classOf(value: number, edges: number[]) {
  let index = 0
  for (const edge of edges) {
    if (value > edge) index += 1
  }
  return index
}
