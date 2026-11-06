import { describe, expect, it } from "vitest"
import { bonusStatText, factsStatText } from "@/features/datasets/statisticalCopy"

function sentences(text: string) {
  return text.split(/(?<=\.)\s+/).filter(Boolean)
}

function expectBrief(text: string) {
  const parts = sentences(text)
  expect(parts.length).toBeGreaterThanOrEqual(3)
  expect(parts.length).toBeLessThanOrEqual(5)
  expect(text.length).toBeGreaterThanOrEqual(125)
  expect(text.length).toBeLessThanOrEqual(220)
}

describe("texto estatístico", () => {
  it("resume o bônus em 3 a 5 frases", () => {
    const text = bonusStatText(
      [
        { ano: 2000, rdt65: 56.1 },
        { ano: 2017, rdt65: 44.4 },
        { ano: 2070, rdt65: 75.4 },
      ],
      { x1: 2008, x2: 2031 },
      2017,
    )
    expectBrief(text)
    expect(text).toContain("44,4")
    expect(text).toContain("2017")
  })

  it("resume os fatos de cada recorte em 3 a 5 frases", () => {
    expectBrief(
      factsStatText([
        { id: "pico_populacional", value: 2041, detail: { populacao: 220300000 } },
      ]),
    )
    expectBrief(factsStatText([{ id: "idosos_superam_jovens", value: 2030 }]))
    expectBrief(
      factsStatText([
        { id: "fecundidade_abaixo_reposicao", value: 1.57, detail: { ano: 2026, reposicao: 2.1 } },
        { id: "esperanca_vida", value: 76.4, detail: { ano: 2026 } },
      ]),
    )
    expectBrief(
      factsStatText([
        { id: "pico_populacional", value: 2041, detail: { populacao: 220300000 } },
        { id: "idosos_superam_jovens", value: 2030 },
        { id: "fecundidade_abaixo_reposicao", value: 1.57, detail: { ano: 2026, reposicao: 2.1 } },
        { id: "esperanca_vida", value: 76.4, detail: { ano: 2026 } },
      ]),
    )
  })
})
