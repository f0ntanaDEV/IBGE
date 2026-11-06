import { type ReactElement } from "react"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { KpiCard } from "@/components/common/KpiCard"
import { unidadeKpi } from "@/features/glossary/glossary"

function renderCard(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe("KpiCard", () => {
  it("mostra valor, unidade curta e variação em três linhas", () => {
    renderCard(<KpiCard label="Esperança de vida" metricKey="e0" value={77.03} format="years" delta={5.1} />)
    expect(screen.getByText("Esperança de vida")).toBeInTheDocument()
    expect(screen.getByText("77,03")).toBeInTheDocument()
    expect(screen.getByText("anos")).toBeInTheDocument()
    expect(screen.getByText("↑ 5,1% em 10 anos")).toBeInTheDocument()
    expect(screen.queryByText("Variação em relação a 10 anos antes")).not.toBeInTheDocument()
  })

  it("usa a unidade do índice de envelhecimento e o singular da fecundidade", () => {
    expect(unidadeKpi("ie60", 89.06)).toBe("por 100 jovens")
    expect(unidadeKpi("tft", 1.51)).toBe("filho por mulher")
    expect(unidadeKpi("tft", 2.1)).toBe("filhos por mulher")
    expect(unidadeKpi("pop_t", 1000)).toBeNull()
    renderCard(<KpiCard label="Índice de envelhecimento" metricKey="ie60" value={89.06} format="decimal" />)
    expect(screen.getByText("89,06")).toBeInTheDocument()
    expect(screen.getByText("por 100 jovens")).toBeInTheDocument()
  })

  it("mostra traço sem valor e skeleton ao carregar", () => {
    const { rerender } = renderCard(<KpiCard label="Taxa" value={null} format="percent" />)
    expect(screen.getByText("—")).toBeInTheDocument()
    rerender(
      <MemoryRouter>
        <KpiCard label="Taxa" value={0.125} format="percent" loading />
      </MemoryRouter>,
    )
    expect(screen.getByRole("status", { name: "Taxa" })).toHaveAttribute("aria-busy", "true")
  })
})