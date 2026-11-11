import { describe, expect, it } from "vitest"
import { buildNarratives, finalObservations } from "@/lib/narratives/engine"
import { plural, preposicaoTerritorio } from "@/lib/narratives/grammar"
import type { NarrativeContext } from "@/lib/narratives/types"

function ctx(data: NarrativeContext["data"], extra: Partial<NarrativeContext> = {}): NarrativeContext {
  return {
    datasetId: "ds4",
    chartId: "e0",
    territorio: { cod: 31, nome: "Minas Gerais", nivel: "uf" },
    ano: 2024,
    sexo: "Ambos",
    selection: {},
    series: [{ key: "e0", label: "Esperança de vida" }],
    data,
    ...extra,
  }
}

describe("narrativas", () => {
  it("concorda número e usa a preposição do território", () => {
    expect(plural(1, "UF", "UFs")).toBe("1 UF")
    expect(plural(3, "UF", "UFs")).toBe("3 UFs")
    expect(preposicaoTerritorio("Acre")).toBe("no Acre")
    expect(preposicaoTerritorio("Minas Gerais")).toBe("em Minas Gerais")
    expect(preposicaoTerritorio("Bahia")).toBe("na Bahia")
    expect(preposicaoTerritorio("Distrito Federal")).toBe("no Distrito Federal")
    expect(preposicaoTerritorio("Brasil")).toBe("no Brasil")
    expect(preposicaoTerritorio("Norte")).toBe("na Região Norte")
  })

  it("cobre cada regra e prioriza as observações finais", () => {
    const insights = buildNarratives(
      ctx({
        series: [
          { ano: 2000, valor: 70 },
          { ano: 2024, valor: 78 },
          { ano: 2030, valor: 76 },
        ],
        seriesB: [
          { ano: 2000, valor: 72 },
          { ano: 2024, valor: 74 },
        ],
        rank: [
          { cod: 35, valor: 78 },
          { cod: 31, valor: 76 },
        ],
        brazilValue: 75,
        change: { anoA: 2000, anoB: 2024, delta: 6 },
        threshold: { value: 1.5, limiar: 2.1, since: 2004 },
        sex: { h: 73, m: 79 },
        projectionFrom: 2026,
      }),
    )
    const types = insights.map((item) => item.type)
    expect(types).toEqual(expect.arrayContaining(["trend", "peak", "crossing", "rank", "vsBrazil", "biggestChange", "threshold", "sexGap", "projection"]))
    const repeated = [...insights, ...insights.map((item) => ({ ...item, relevance: item.relevance - 0.01 }))]
    const finals = finalObservations(repeated)
    expect(finals.length).toBeLessThanOrEqual(5)
    expect(finals.filter((item) => item.type === "trend").length).toBeLessThanOrEqual(2)
    expect(buildNarratives(ctx({}))).toEqual([])
    const edge = buildNarratives(
      ctx({
        series: [
          { ano: 2000, valor: 2.32 },
          { ano: 2010, valor: 1.8 },
          { ano: 2026, valor: 1.51 },
        ],
      }),
    )
    expect(edge.some((item) => item.type === "peak")).toBe(false)
    expect(edge.find((item) => item.type === "trend")?.text.charAt(0)).toBe(edge.find((item) => item.type === "trend")?.text.charAt(0).toUpperCase())
  })

  it("não fala de pico sem série e prioriza o cruzamento", () => {
    const many = buildNarratives(
      ctx(
        {
          series: [
            { ano: 2000, valor: 30 },
            { ano: 2029, valor: 18 },
          ],
          seriesB: [
            { ano: 2000, valor: 10 },
            { ano: 2029, valor: 20 },
          ],
        },
        {
          series: [
            { key: "jovem", label: "0 a 14 anos" },
            { key: "idoso", label: "60 anos ou mais" },
          ],
          narrativePriority: ["crossing", "trend"],
        },
      ),
    )
    expect(many.some((item) => item.type === "peak")).toBe(false)
    expect(many[0]?.type).toBe("crossing")
    const one = buildNarratives(
      ctx(
        {
          series: [
            { ano: 2000, valor: 10 },
            { ano: 2010, valor: 30 },
            { ano: 2020, valor: 18 },
          ],
        },
        { series: [{ key: "jovem", label: "0 a 14 anos" }] },
      ),
    )
    expect(one.find((item) => item.type === "peak")?.text).toMatch(/0 a 14 anos/)
    expect(one.find((item) => item.type === "peak")?.text).not.toMatch(/ponto mais alto no Brasil/)
  })
})
