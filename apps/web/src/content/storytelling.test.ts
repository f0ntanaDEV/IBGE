import { describe, expect, it } from "vitest"
import { STORYTELLING } from "@/content/storytelling"
import { dashboards } from "@/features/datasets/dashboards.config"

const PAGES = ["overview", "ds1", "ds2", "ds3", "ds4", "ds5", "quality"]

describe("storytelling", () => {
  it("cada página tem os dois textos com até 300 caracteres", () => {
    for (const page of PAGES) {
      expect(STORYTELLING[page].tecnico.length).toBeLessThanOrEqual(300)
      expect(STORYTELLING[page].simples.length).toBeLessThanOrEqual(300)
      expect(STORYTELLING[page].tecnico).not.toBe(STORYTELLING[page].simples)
    }
  })
})

describe("ajuda dos gráficos", () => {
  it("todo gráfico tem o que mostra e como ler", () => {
    for (const page of dashboards) {
      for (const chart of page.charts) {
        expect(chart.help.oQueMostra.length).toBeGreaterThan(10)
        expect(chart.help.comoLer.length).toBeGreaterThan(10)
      }
    }
  })
})
