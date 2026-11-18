import { describe, expect, it } from "vitest"
import { placeReferenceLabels } from "@/lib/labelPlace"

describe("placeReferenceLabels", () => {
  it("separa Covid-19 e Projeção quando começam no mesmo ponto", () => {
    const placed = placeReferenceLabels([
      { id: "covid", x: 120, y: 8, width: 56, height: 14 },
      { id: "projecao", x: 140, y: 8, width: 72, height: 14 },
    ])
    const covid = placed.find((item) => item.id === "covid")
    const projecao = placed.find((item) => item.id === "projecao")
    expect(covid && projecao).toBeTruthy()
    expect(projecao!.y).toBeGreaterThan(covid!.y)
    const overlap = covid!.y < projecao!.y + projecao!.height && projecao!.y < covid!.y + covid!.height
    expect(overlap).toBe(false)
  })
})
