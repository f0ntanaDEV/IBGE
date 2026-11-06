export function placeLabels(items: { cod: number; y: number }[]) {
  if (items.length === 0) return []
  const gap = 1 / items.length
  const sorted = [...items].sort((a, b) => a.y - b.y)
  let cursor = 0
  const placed = sorted.map((item) => {
    const y = Math.max(item.y, cursor)
    cursor = y + gap
    return { cod: item.cod, y }
  })
  const end = placed[placed.length - 1]?.y ?? 0
  if (end <= 1) return placed
  return placed.map((item, index) => ({ cod: item.cod, y: index * gap }))
}
