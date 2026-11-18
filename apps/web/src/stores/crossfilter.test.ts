import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useCrossFilter, useEffectiveFilters } from "@/stores/crossfilter"

describe("crossfilter", () => {
  it("alterna, acumula e limpa a faixa em menos de 200 ms", () => {
    useCrossFilter.getState().clear()
    const start = performance.now()
    useCrossFilter.getState().toggle("0-4", { multi: false, source: "heatmap" })
    useCrossFilter.getState().toggle("5-9", { multi: true, source: "heatmap" })
    useCrossFilter.getState().toggle("0-4", { multi: true, source: "heatmap" })
    expect(performance.now() - start).toBeLessThan(200)
    expect(useCrossFilter.getState().selection.faixa).toEqual(["5-9"])
    expect(useCrossFilter.getState().sourceChartId).toBe("heatmap")
    useCrossFilter.getState().clear()
    expect(useCrossFilter.getState().selection).toEqual({})
  })

  it("não sobrepõe território, ano nem sexo", () => {
    useCrossFilter.getState().clear()
    useCrossFilter.getState().toggle("60-64", { multi: false, source: "heatmap" })
    const { result } = renderHook(() => useEffectiveFilters({ ano: 2026, cod: 29, sexo: "Mulheres" }))
    expect(result.current.ano).toBe(2026)
    expect(result.current.cod).toBe(29)
    expect(result.current.sexo).toBe("Mulheres")
    expect(result.current.selection.faixa).toEqual(["60-64"])
    useCrossFilter.getState().clear()
  })
})
