import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { FilterChipsBar } from "@/features/datasets/components/FilterChipsBar"

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="url">{location.search}</p>
}

function renderChips(search: string, applies: ("territorio" | "ano" | "sexo")[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/datasets/ds1${search}`]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <FilterChipsBar applies={applies} />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("FilterChipsBar", () => {
  it("mostra o nome do território e volta aos padrões", async () => {
    const user = userEvent.setup()
    renderChips("?cod=29&ano=2041&sexo=Mulheres", ["territorio", "ano", "sexo"])
    await user.click(screen.getByRole("button", { name: "Bahia (BA) ×" }))
    await user.click(screen.getByRole("button", { name: "2041 ×" }))
    await user.click(screen.getByRole("button", { name: "Mulheres ×" }))
    const search = screen.getByTestId("url").textContent ?? ""
    expect(search).toContain("cod=0")
    expect(search).toContain("sexo=Ambos")
    expect(search).not.toContain("2041")
    expect(screen.queryByRole("button", { name: /Bahia/ })).not.toBeInTheDocument()
  })

  it("marca o sexo que a página não usa", () => {
    renderChips("?cod=2&sexo=Homens", ["territorio", "ano"])
    expect(screen.getByRole("button", { name: "Região Nordeste ×" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Homens · não se aplica nesta página ×" })).toBeInTheDocument()
  })
})
