import { describe, expect, it } from "vitest"
import { dashboards } from "@/features/datasets/dashboards.config"
import { boardSpans, packRows } from "@/features/datasets/board"

function spanOf(chart: { span?: number }) {
  return chart.span ?? 6
}

describe("boardSpans", () => {
  it("completa cada linha de 12 colunas", () => {
    expect(boardSpans([6, 12, 12])).toEqual([12, 12, 12])
    expect(boardSpans([6, 6, 12])).toEqual([6, 6, 12])
    expect(packRows([8, 4, 6, 6])).toEqual([8, 4, 6, 6])
    expect(packRows([4])).toEqual([12])
    expect(packRows([4, 4])).toEqual([6, 6])
    for (const spec of dashboards) {
      const spans = packRows(spec.charts.map(spanOf))
      expect(spans.reduce((total, span) => total + span, 0) % 12).toBe(0)
      let used = 0
      let row: number[] = []
      for (const span of spans) {
        row.push(span)
        used += span
        expect(used).toBeLessThanOrEqual(12)
        if (used === 12) {
          expect(row).not.toEqual([4])
          row = []
          used = 0
        }
      }
    }
  })
})
