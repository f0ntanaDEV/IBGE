export type ReportChart = {
  id: string
  title: string
  description: string
  help: string
  filtersLabel: string
  narrative?: string
  table: { columns: string[]; rows: string[][] }
}

export type ReportInput = {
  pageTitle: string
  question: string
  filters: string
  generatedAt: string
  revision: string
  url: string
  headline: string
  story: string
  simple: boolean
  kpis: { label: string; value: string; status: string; reference: string; action: string }[]
  charts: ReportChart[]
  facts: string[]
  context: string[]
  news: { title: string; date: string; url: string }[]
}

export type ReportSection = { id: string; title: string }

/** Monta a ordem das seções. O sumário reserva a página 2. */
export function buildReport(input: ReportInput) {
  const sections: ReportSection[] = [
    { id: "capa", title: "Capa" },
    { id: "sumario", title: "Sumário" },
    { id: "resumo", title: "Resumo" },
    { id: "kpis", title: "Indicadores" },
  ]
  if (!input.simple) {
    for (const chart of input.charts) sections.push({ id: chart.id, title: chart.title })
    sections.push({ id: "fatos", title: "Fatos e contexto" }, { id: "noticias", title: "Notícias do IBGE" })
  }
  sections.push({ id: "anexos", title: "Anexos" }, { id: "fonte", title: "Fonte e metodologia" })
  const pages = new Map<string, number>()
  let page = 1
  for (const section of sections) {
    pages.set(section.id, section.id === "sumario" ? 2 : page)
    if (section.id !== "sumario") page += 1
    if (page === 2) page = 3
  }
  return {
    ...input,
    sections,
    summary: sections.filter((item) => item.id !== "capa" && item.id !== "sumario").map((item) => ({ title: item.title, page: pages.get(item.id) ?? 3 })),
    note: input.simple ? "Gere no modo Técnico para incluir os gráficos" : "",
  }
}
