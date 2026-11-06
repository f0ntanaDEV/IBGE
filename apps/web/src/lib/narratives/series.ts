import type { NarrativeContext, SeriesMeta } from "@/lib/narratives/types"

export function namedSeries(ctx: NarrativeContext): SeriesMeta | null {
  const list = ctx.series ?? []
  if (ctx.seriesKey) return list.find((item) => item.key === ctx.seriesKey) ?? null
  return list.length === 1 ? list[0] : null
}
