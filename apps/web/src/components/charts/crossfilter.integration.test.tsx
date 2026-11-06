import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { BrazilMap } from "@/components/charts/BrazilMap"
import { buildNarratives } from "@/lib/narratives/engine"
import { useCrossFilter } from "@/stores/crossfilter"

const mesh = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { cod: 11, sigla: "RO" },
      geometry: { type: "Polygon", coordinates: [[[-64, -8], [-60, -8], [-60, -13], [-64, -13], [-64, -8]]] },
    },
    {
      type: "Feature",
      properties: { cod: 31, sigla: "MG" },
      geometry: { type: "Polygon", coordinates: [[[-46, -14], [-42, -14], [-42, -22], [-46, -22], [-46, -14]]] },
    },
  ],
}

const VALUES: Record<number, number> = { 11: 70, 31: 76 }

function Host() {
  const selection = useCrossFilter((state) => state.selection)
  const toggle = useCrossFilter((state) => state.toggle)
  const [cod, setCod] = useState(11)
  const active = selection.uf?.[0] ?? cod
  const text = buildNarratives({
    datasetId: "ds4",
    territorio: { cod: active, nome: active === 31 ? "Minas Gerais" : "Rondônia", nivel: "uf" },
    ano: 2024,
    sexo: "Ambos",
    selection,
    series: [{ key: "e0", label: "Esperança de vida" }],
    data: {
      series: [
        { ano: 2000, valor: VALUES[active] - 4 },
        { ano: 2024, valor: VALUES[active] },
      ],
    },
  })[0]?.text
  return (
    <>
      <p>Indicador {VALUES[active]}</p>
      <p>{text}</p>
      <BrazilMap
        summary="Mapa"
        metric={{ key: "e0_t", kind: "years" }}
        selected={selection.uf}
        items={[
          { cod: 11, sigla: "RO", local: "Rondônia", valor: 70 },
          { cod: 31, sigla: "MG", local: "Minas Gerais", valor: 76 },
        ]}
        onSelect={(value, multi) => {
          toggle("uf", value, { multi, source: "map" })
          setCod(value)
        }}
      />
    </>
  )
}

describe("filtro cruzado no mapa", () => {
  beforeEach(() => {
    useCrossFilter.getState().clear()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => mesh }))
  })

  it("o clique muda o indicador e a narrativa", async () => {
    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>,
    )
    expect(await screen.findByText("Indicador 70")).toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: /Minas Gerais/ }))
    expect(screen.getByText("Indicador 76")).toBeInTheDocument()
    expect(screen.getAllByText(/Minas Gerais/).length).toBeGreaterThan(0)
  })
})
