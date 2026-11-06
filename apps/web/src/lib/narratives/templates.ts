import { stableHash } from "@/lib/narratives/grammar"
import type { NarrativeContext } from "@/lib/narratives/types"

const TEMPLATES: Record<string, string[]> = {
  trend: ["{onde}, {serie} {verbo} {pct} no período.", "Entre os anos observados {onde}, {serie} {verbo} {pct}."],
  peak: ["{serie} foi máxima em {ano} {onde}.", "{ondeCap}, {serie} chega ao pico em {ano}."],
  crossing: ["As séries se cruzam em {ano}.", "O cruzamento {onde} acontece em {ano}."],
  rank: ["É a {posicao} {ondeRank} entre {n}.", "No ranking, fica na {posicao} posição entre {n}."],
  vsBrazil: ["O valor está {lado} da média nacional.", "{ondeCap} fica {lado} do Brasil."],
  biggestChange: ["A maior variação entre {anoA} e {anoB} é de {delta}.", "De {anoA} para {anoB}, a maior mudança é {delta}."],
  threshold: ["Está abaixo de {limiar} desde {desde}.", "O indicador permanece abaixo de {limiar} desde {desde}."],
  sexGap: ["A diferença entre os sexos é de {gap}.", "{maior} {gap} a mais."],
  projection: ["A partir de {desde} os valores são projeções.", "Os anos desde {desde} ainda são projeção."],
}

export function renderTemplate(rule: string, ctx: NarrativeContext, slots: Record<string, string>) {
  const options = TEMPLATES[rule] ?? []
  const seed = stableHash(`${ctx.datasetId}|${ctx.chartId ?? ""}|${rule}|${ctx.territorio.cod}|${ctx.ano}`)
  const chosen = options[seed % Math.max(options.length, 1)] ?? ""
  return chosen.replace(/\{(\w+)\}/g, (_, key: string) => slots[key] ?? "")
}
