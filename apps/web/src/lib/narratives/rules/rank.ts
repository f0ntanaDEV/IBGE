import { plural } from "@/lib/narratives/grammar"
import { renderTemplate } from "@/lib/narratives/templates"
import type { Insight, NarrativeContext } from "@/lib/narratives/types"

export function rank(ctx: NarrativeContext): Insight | null {
  const rows = ctx.data.rank
  if (!rows?.length) return null
  const ordered = [...rows].sort((a, b) => b.valor - a.valor)
  const index = ordered.findIndex((row) => row.cod === ctx.territorio.cod)
  if (index < 0) return null
  return {
    type: "rank",
    relevance: 0.75,
    text: renderTemplate("rank", ctx, {
      posicao: `${index + 1}ª`,
      ondeRank: "posição",
      n: plural(ordered.length, "UF", "UFs"),
    }),
  }
}
