import { describe, expect, it } from "vitest"
import { placeLabels } from "@/components/charts/labelPlace"

describe("placeLabels", () => {
  it("afasta rótulos que cairiam no mesmo ponto", () => {
    const placed = placeLabels([
      { cod: 1, y: 0.5 },
      { cod: 2, y: 0.5 },
      { cod: 3, y: 0.5 },
    ])
    const tops = placed.map((item) => item.y)
    expect(new Set(tops).size).toBe(3)
    expect(tops[1] - tops[0]).toBeGreaterThan(0.2)
  })
})
