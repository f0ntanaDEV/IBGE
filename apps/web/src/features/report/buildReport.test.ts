import { describe, expect, it } from "vitest"
import { buildReport } from "@/features/report/buildReport"

const input = {
  pageTitle: "Indicadores",
  question: "Como vivem os brasileiros?",
  filters: "Bahia · 2026 · Ambos",
  generatedAt: "18/11/2026",
  revision: "2024",
  url: "/datasets/ds4",
  headline: "A esperança de vida sobe.",
  story: "Vive-se mais.",
  simple: false,
  kpis: [{ label: "Esperança", value: "76 anos", status: "Atenção", reference: "Brasil", action: "Ampliar a atenção primária." }],
  charts: [
    {
      id: "vida",
      title: "Esperança de vida ao nascer",
      description: "Anos médios",
      help: "Leia a linha.",
      filtersLabel: "Bahia · 2026",
      table: { columns: ["Ano", "Valor"], rows: [["2026", "76"]] },
    },
  ],
  facts: ["O pico já passou."],
  context: ["Censo 2022."],
  news: [{ title: "Projeções", date: "01/11/2024", url: "https://ibge.gov.br" }],
}

describe("buildReport", () => {
  it("ordena as seções, numera o sumário e guarda os anexos", () => {
    const report = buildReport(input)
    expect(report.sections.map((item) => item.id)).toEqual(["capa", "sumario", "resumo", "kpis", "vida", "fatos", "noticias", "anexos", "fonte"])
    expect(report.summary.find((item) => item.title === "Resumo")?.page).toBe(3)
    expect(report.charts[0]?.table.rows).toEqual([["2026", "76"]])
  })

  it("no modo simples avisa que os gráficos ficam de fora", () => {
    const report = buildReport({ ...input, simple: true })
    expect(report.sections.some((item) => item.id === "vida")).toBe(false)
    expect(report.note).toMatch(/modo Técnico/)
  })
})
