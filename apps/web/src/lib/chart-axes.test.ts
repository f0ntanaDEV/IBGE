import { describe, expect, it } from "vitest"
import { decadeDomain, decadeTicks, formatAxis, labelSide, niceDomain, niceTicks, YEAR_TICKS } from "@/lib/chart-axes"

const population = [174_700_000, 214_200_000, 220_400_000, 199_200_000]

describe("eixos", () => {
  it("guarda a população dentro de um domínio com folga e ticks redondos", () => {
    const domain = niceDomain(population)
    expect(domain[0]).toBeLessThanOrEqual(population[0])
    expect(domain[1]).toBeGreaterThanOrEqual(Math.max(...population))
    const ticks = niceTicks(domain)
    expect(ticks[0]).toBeGreaterThanOrEqual(domain[0])
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(domain[1])
    expect(ticks.length).toBeLessThanOrEqual(8)
    for (const tick of ticks) expect(tick % 10_000_000).toBe(0)
  })

  it("arredonda a esperança de vida em passos de 10", () => {
    expect(decadeDomain([69.4, 76.2, 81.8])).toEqual([60, 90])
    expect(decadeTicks([60, 90])).toEqual([60, 70, 80, 90])
  })

  it("limita o eixo X a décadas", () => {
    expect(YEAR_TICKS).toEqual([2000, 2010, 2020, 2030, 2040, 2050, 2060, 2070])
    expect(YEAR_TICKS).not.toContain(2001)
  })

  it("formata o eixo em compacto e vira o rótulo perto da borda", () => {
    expect(formatAxis(225_000_000, { key: "populacao", kind: "count" })).toMatch(/225 mi/)
    expect(formatAxis(220_400_000, { key: "populacao", kind: "count" }, 1)).toMatch(/220,4 mi/)
    expect(labelSide(2041, [2000, 2070])).toBe("left")
    expect(labelSide(2000, [2000, 2070])).toBe("right")
  })
})