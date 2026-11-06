import { preposicaoTerritorio } from "@/lib/narratives/grammar"
import { namedSeries } from "@/lib/narratives/series"
import { renderTemplate } from "@/lib/narratives/templates"
import type { Insight, NarrativeContext, SeriesPoint } from "@/lib/narratives/types"
import { formatValue } from "@/lib/format"

export function trend(ctx: NarrativeContext): Insight | null {
  const named = namedSeries(ctx)
  const series = windowed(ctx.data.series, ctx.zoom)
  if (!named || !series || series.length < 2 || series[0].valor === 0) return null
  const ratio = series[series.length - 1].valor / series[0].valor - 1
  const verbo = Math.abs(ratio) < 0.01 ? "fica estável" : ratio > 0 ? "cresce" : "cai"
  const pct = formatValue(Math.abs(ratio), { key: "variacao", kind: "percent" })
  const onde = preposicaoTerritorio(ctx.territorio.nome)
  return {
    type: "trend",
    relevance: 0.7,
    text: renderTemplate("trend", ctx, { serie: named.label, onde, ondeCap: capitalize(onde), verbo, pct }),
    highlight: { chartId: ctx.chartId ?? "", x: series[series.length - 1].ano },
  }
}

export function windowed(series: SeriesPoint[] | undefined, zoom?: [number, number]) {
  if (!series?.length) return null
  const [start, end] = zoom ?? [series[0].ano, series[series.length - 1].ano]
  const scoped = series.filter((point) => point.ano >= start && point.ano <= end)
  return scoped.length ? scoped : series
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
