import { describe, expect, it } from "vitest"
import { ageKpis, toPyramidChart } from "@/features/datasets/derive"
import type { PyramidRow } from "@/features/datasets/api"

const rows: PyramidRow[] = [
  { faixa: 0, homens: 30, mulheres: 20 },
  { faixa: 10, homens: 10, mulheres: 12 },
]

describe("pirâmide", () => {
  it("coloca homens em valores negativos e mantém o módulo", () => {
    const chart = toPyramidChart(rows, [{ id: "comparacao", rows: [{ faixa: 0, homens: 5, mulheres: 4 }] }])
    expect(chart[0]?.homens).toBe(-30)
    expect(chart[0]?.mulheres).toBe(20)
    expect(chart[0]?.homens_comparacao).toBe(-5)
    expect(chart[1]?.homens).toBe(-10)
    const total = ageKpis(rows, "Ambos").populacao
    expect(total).toBe(72)
  })
})
