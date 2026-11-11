import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { FilterBar } from "@/features/datasets/components/FilterBar"
import { useDashboardFilters } from "@/features/datasets/hooks"
import type { Territory } from "@/features/datasets/api"

const territories: Territory[] = [
  { cod: 0, sigla: "BR", local: "Brasil", nivel: "brasil", regiao_cod: null },
  { cod: 3, sigla: "SE", local: "Sudeste", nivel: "regiao", regiao_cod: null },
  { cod: 33, sigla: "RJ", local: "Rio de Janeiro", nivel: "uf", regiao_cod: 3 },
]

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="url">{location.search}</p>
}

function Harness() {
  const filters = useDashboardFilters()
  return (
    <>
      <FilterBar
        territories={territories}
        filters={["territorio", "ano", "sexo"]}
        cod={filters.cod}
        ano={filters.ano}
        sexo={filters.sexo}
        onCod={filters.setCod}
        onAno={filters.setAno}
        onSexo={filters.setSexo}
      />
      <LocationProbe />
    </>
  )
}

describe("FilterBar", () => {
  it("grava território, ano e sexo na URL", async () => {
    const user = userEvent.setup()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/datasets/ds1"]}>
          <Routes>
            <Route path="*" element={<Harness />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await user.selectOptions(screen.getByLabelText("Território"), "33")
    await user.selectOptions(screen.getByLabelText("Ano"), "2041")
    await user.selectOptions(screen.getByLabelText("Sexo"), "Mulheres")
    const search = screen.getByTestId("url").textContent ?? ""
    expect(search).toContain("cod=33")
    expect(search).toContain("ano=2041")
    expect(search).toContain("sexo=Mulheres")
  })
})
