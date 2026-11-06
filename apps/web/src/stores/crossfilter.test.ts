import { describe, expect, it } from "vitest"
import { useCrossFilter } from "@/stores/crossfilter"

describe("crossfilter", () => {
  it("alterna, acumula e limpa em menos de 200 ms", () => {
    useCrossFilter.getState().clear()
    const start = performance.now()
    useCrossFilter.getState().toggle("uf", 31, { multi: false, source: "map" })
    useCrossFilter.getState().toggle("uf", 33, { multi: true, source: "map" })
    useCrossFilter.getState().toggle("uf", 31, { multi: true, source: "map" })
    expect(performance.now() - start).toBeLessThan(200)
    expect(useCrossFilter.getState().selection.uf).toEqual([33])
    expect(useCrossFilter.getState().sourceChartId).toBe("map")
    useCrossFilter.getState().clear()
    expect(useCrossFilter.getState().selection).toEqual({})
  })
})
