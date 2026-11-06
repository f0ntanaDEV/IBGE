import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { AgeYearHeatmap, axisLayout, cellAt, mixSequential, paintMatrix, referenceYear } from "@/components/charts/AgeYearHeatmap"

describe("AgeYearHeatmap", () => {
  it("marca o ano corrente e pinta um pixel por célula", () => {
    expect(referenceYear([2000, 2026, 2070], 2026)).toBe(2026)
    expect(referenceYear([2000, 2024], 2026)).toBe(2024)
    expect(cellAt(0, 99, 100, 100)?.idade).toBe(0)
    const years = [2000, 2001]
    const ages = [0, 1]
    const data = new Uint8ClampedArray(years.length * ages.length * 4)
    paintMatrix(data, years.length, years, ages, new Map([["0:2000", 10], ["1:2001", 40]]), 10, 40, ["hsl(215 16% 88%)", "hsl(215 24% 32%)"])
    expect(data[(1 * years.length) * 4 + 3]).toBe(255)
    expect(mixSequential(["hsl(215 16% 88%)", "hsl(215 24% 32%)"], 0)[0]).toBeGreaterThan(150)
  })

  it("coloca os ticks nas margens e omite a idade 90", () => {
    const layout = axisLayout(640, 280)
    for (const tick of layout.years) {
      expect(tick.y).toBeGreaterThan(layout.plot.y + layout.plot.h)
      expect(tick.y).toBeLessThanOrEqual(280)
      expect(tick.x).toBeGreaterThanOrEqual(0)
      expect(tick.x).toBeLessThanOrEqual(640)
    }
    expect(layout.years[0]?.anchor).toBe("start")
    expect(layout.years[0]?.x).toBe(layout.plot.x)
    expect(layout.years.at(-1)?.anchor).toBe("end")
    expect(layout.years.at(-1)?.x).toBe(layout.plot.x + layout.plot.w)
    for (const tick of layout.ages) {
      expect(tick.x).toBeLessThan(layout.plot.x)
      expect(tick.y).toBeGreaterThanOrEqual(layout.plot.y)
      expect(tick.y).toBeLessThanOrEqual(layout.plot.y + layout.plot.h)
      expect(tick.age).toBeLessThan(90)
    }
    expect(layout.ages.some((tick) => tick.age === 90)).toBe(false)
  })

  it("expõe o resumo e a nota do grupo aberto", () => {
    render(<AgeYearHeatmap cells={[{ idade: 0, ano: 2024, valor: 10 }, { idade: 90, ano: 2024, valor: 99 }]} summary="Onda etária" />)
    expect(screen.getByRole("img", { name: "Onda etária" })).toBeInTheDocument()
    expect(screen.getByText("Idade")).toBeInTheDocument()
    expect(screen.getByText("Pessoas por idade")).toBeInTheDocument()
    expect(screen.getByText(/grupo aberto/)).toBeInTheDocument()
    expect(document.querySelector("[data-age='90']")).toBeNull()
    expect(document.querySelector("[data-year='2000']")).toHaveAttribute("text-anchor", "start")
    expect(document.querySelector("[data-year='2070']")).toHaveAttribute("text-anchor", "end")
  })
})