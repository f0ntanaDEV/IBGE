export type FilterReaction = "filtra" | "destaca" | "nao_se_aplica"

export type ChartFilters = { territorio: FilterReaction; ano: FilterReaction; sexo: FilterReaction }

const HIGHLIGHT = new Set(["ranking", "map", "slope", "scatter", "diverging"])

/** Reação padrão de cada tipo de gráfico aos três filtros. */
export function defaultsFor(kind: string): ChartFilters {
  if (kind === "scatter" || kind === "diverging") return { territorio: "destaca", ano: "filtra", sexo: "nao_se_aplica" }
  if (HIGHLIGHT.has(kind)) return { territorio: "destaca", ano: "filtra", sexo: "filtra" }
  return { territorio: "filtra", ano: "filtra", sexo: "filtra" }
}

export function reactionsFor(kind: string, pageFilters: readonly string[], sexMetric: boolean): ChartFilters {
  const base = defaultsFor(kind)
  if (kind === "scatter" || kind === "diverging") return base
  if (HIGHLIGHT.has(kind)) return { ...base, sexo: sexMetric ? "filtra" : "nao_se_aplica" }
  if (!pageFilters.includes("sexo")) return { ...base, sexo: "nao_se_aplica" }
  return base
}

export function marksYear(kind: string) {
  return kind === "line" || kind === "area" || kind === "area100" || kind === "bonus" || kind === "milestones" || kind === "heatmap"
}

export function filterFoot(filters: ChartFilters, labels: { territorio: string; ano: string; sexo: string }) {
  return (["territorio", "ano", "sexo"] as const).map((key) => ({
    key,
    text: !filters[key] || filters[key] === "nao_se_aplica" ? (key === "sexo" ? "não usa sexo" : labels[key]) : labels[key],
    applies: filters[key] !== "nao_se_aplica",
  }))
}
