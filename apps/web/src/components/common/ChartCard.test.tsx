import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { ChartCard } from "@/components/common/ChartCard"
import { TooltipProvider } from "@/components/ui/tooltip"

describe("ChartCard", () => {
  it("oferece exportar imagem no lugar do menu", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<ChartCard title="Esperança de vida"><p>Série</p></ChartCard>} />
          </Routes>
        </TooltipProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText("Série")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Exportar imagem" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Mais opções" })).not.toBeInTheDocument()
    expect(screen.queryByText("Ver como tabela")).not.toBeInTheDocument()
  })
})
