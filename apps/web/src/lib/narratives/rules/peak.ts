import { preposicaoTerritorio } from "@/lib/narratives/grammar"
import { namedSeries } from "@/lib/narratives/series"
import { windowed } from "@/lib/narratives/rules/trend"
import { renderTemplate } from "@/lib/narratives/templates"
import type { Insight, NarrativeContext } from "@/lib/narratives/types"

export function peak(ctx: NarrativeContext): Insight | null {
  const named = namedSeries(ctx)
  const series = windowed(ctx.data.series, ctx.zoom)
  if (!named || !series?.length) return null
  const top = series.reduce((best, point) => (point.valor > best.valor ? point : best))
  const onde = preposicaoTerritorio(ctx.territorio.nome)
  return {
    type: "peak",
    relevance: 0.8,
    text: renderTemplate("peak", ctx, {
      serie: named.label,
      onde,
      ondeCap: onde.charAt(0).toUpperCase() + onde.slice(1),
      ano: String(top.ano),
    }),
    highlight: { chartId: ctx.chartId ?? "", x: top.ano },
  }
}
