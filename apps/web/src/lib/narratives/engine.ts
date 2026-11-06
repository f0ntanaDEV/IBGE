import { biggestChange } from "@/lib/narratives/rules/biggestChange"
import { crossing } from "@/lib/narratives/rules/crossing"
import { peak } from "@/lib/narratives/rules/peak"
import { projection } from "@/lib/narratives/rules/projection"
import { rank } from "@/lib/narratives/rules/rank"
import { sexGap } from "@/lib/narratives/rules/sexGap"
import { threshold } from "@/lib/narratives/rules/threshold"
import { trend } from "@/lib/narratives/rules/trend"
import { vsBrazil } from "@/lib/narratives/rules/vsBrazil"
import type { Insight, NarrativeContext } from "@/lib/narratives/types"

const RULES = [trend, peak, crossing, rank, vsBrazil, biggestChange, threshold, sexGap, projection]

export function buildNarratives(ctx: NarrativeContext): Insight[] {
  const priority = ctx.narrativePriority ?? []
  return RULES.map((rule) => rule(ctx))
    .filter((item): item is Insight => item != null)
    .sort((a, b) => {
      const left = priority.indexOf(a.type)
      const right = priority.indexOf(b.type)
      if (left !== -1 || right !== -1) {
        if (left === -1) return 1
        if (right === -1) return -1
        if (left !== right) return left - right
      }
      return b.relevance - a.relevance || a.type.localeCompare(b.type)
    })
}

export function finalObservations(insights: Insight[]) {
  const counts = new Map<string, number>()
  const picked: Insight[] = []
  for (const item of insights) {
    const used = counts.get(item.type) ?? 0
    if (used >= 2) continue
    counts.set(item.type, used + 1)
    picked.push(item)
    if (picked.length === 5) break
  }
  return picked.slice(0, 5)
}
