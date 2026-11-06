import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { BrazilMap } from "@/components/charts/BrazilMap"
import { classOf, quantileBreaks } from "@/lib/quantiles"

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

describe("BrazilMap", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => mesh }))
  })

  it("separa cinco classes por quantis", () => {
    const edges = quantileBreaks([1, 2, 3, 4, 5])
    expect(edges).toHaveLength(4)
    expect(classOf(1, edges)).toBe(0)
    expect(classOf(5, edges)).toBe(4)
  })

  it("desenha uma UF por caminho e ativa pelo teclado", async () => {
    const onSelect = vi.fn()
    render(
      <MemoryRouter>
      <BrazilMap
        summary="Mapa"
        metric={{ key: "e0_t", kind: "years" }}
        items={[
          { cod: 11, sigla: "RO", local: "Rondônia", valor: 70 },
          { cod: 31, sigla: "MG", local: "Minas Gerais", valor: 76 },
        ]}
        onSelect={onSelect}
      />
      </MemoryRouter>,
    )
    const acre = await screen.findByRole("button", { name: /Rondônia/ })
    expect(screen.getAllByRole("button")).toHaveLength(2)
    acre.focus()
    await userEvent.keyboard("{Enter}")
    expect(onSelect).toHaveBeenCalledWith(11, false)
  })
})
