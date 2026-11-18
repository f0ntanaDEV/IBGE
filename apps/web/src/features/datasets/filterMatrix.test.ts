import { describe, expect, it } from "vitest"
import { dashboards } from "@/features/datasets/dashboards.config"
import { defaultsFor } from "@/features/datasets/filterMatrix"

describe("matriz de filtros", () => {
  it("cada gráfico declara território, ano e sexo", () => {
    for (const page of dashboards) {
      for (const chart of page.charts) {
        expect(chart.filters.territorio).toMatch(/filtra|destaca|nao_se_aplica/)
        expect(chart.filters.ano).toMatch(/filtra|destaca|nao_se_aplica/)
        expect(chart.filters.sexo).toMatch(/filtra|destaca|nao_se_aplica/)
      }
    }
  })

  it("segue o padrão do tipo", () => {
    expect(defaultsFor("line")).toEqual({ territorio: "filtra", ano: "filtra", sexo: "filtra" })
    expect(defaultsFor("ranking").territorio).toBe("destaca")
    expect(defaultsFor("diverging").sexo).toBe("nao_se_aplica")
    const slope = dashboards.find((page) => page.id === "ds3")?.charts.find((chart) => chart.kind === "slope")
    expect(slope?.filters).toEqual({ territorio: "destaca", ano: "filtra", sexo: "nao_se_aplica" })
  })
})
