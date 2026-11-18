export type LabelBox = { id: string; x: number; y: number; width: number; height: number }

function hits(a: LabelBox, b: LabelBox) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

/** Desce rótulos de referência até que nenhum encoste no outro. */
export function placeReferenceLabels(labels: LabelBox[]) {
  const placed: LabelBox[] = []
  for (const label of labels) {
    let next = { ...label }
    let guard = 0
    while (placed.some((other) => hits(next, other)) && guard < 40) {
      next = { ...next, y: next.y + 4 }
      guard += 1
    }
    placed.push(next)
  }
  return placed
}
