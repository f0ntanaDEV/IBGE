import { renderTemplate } from "@/lib/narratives/templates"
import type { Insight, NarrativeContext } from "@/lib/narratives/types"

export function vsBrazil(ctx: NarrativeContext): Insight | null {
  const series = ctx.data.series
  const brazil = ctx.data.brazilValue
  if (!series?.length || brazil == null || ctx.territorio.cod === 0) return null
  const current = series.find((point) => point.ano === ctx.ano) ?? series[series.length - 1]
  const lado = current.valor >= brazil ? "acima" : "abaixo"
  return { type: "vsBrazil", relevance: 0.6, text: renderTemplate("vsBrazil", ctx, { lado, ondeCap: ctx.territorio.nome }) }
}
