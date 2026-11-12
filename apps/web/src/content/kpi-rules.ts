import { metricById } from "@/content/metricas"

export type Status = "good" | "warn" | "bad"

type Band = { gt?: number; gte?: number; lt?: number; lte?: number }

export type KpiRule = {
  id: string
  metricId: string
  basis: "value" | "yoy_pct" | "vs_brazil" | "delta10_pp" | "delta10_rel" | "pct_rows"
  good: Band
  warn: Band
  action: string
  thresholdsText: string
}

export const KPI_RULES: KpiRule[] = [
  { id: "crescimento_anual", metricId: "pop_t", basis: "yoy_pct", good: { gt: 0.5 }, warn: { gte: 0, lte: 0.5 }, action: "Revisar projetos de expansão de infraestrutura e priorizar adaptação e manutenção da rede existente.", thresholdsText: "Favorável acima de 0,5% ao ano; Atenção de 0% a 0,5%; Crítico abaixo de 0%." },
  { id: "esperanca_vida", metricId: "e0_t", basis: "vs_brazil", good: { gte: 0 }, warn: { gte: -1, lt: 0 }, action: "Priorizar atenção primária, saneamento e prevenção de mortes evitáveis no território.", thresholdsText: "Favorável igual ou acima do Brasil (ou do ano anterior); Atenção até 1 ano abaixo; Crítico mais de 1 ano abaixo." },
  { id: "filhos_por_mulher", metricId: "tft", basis: "value", good: { gte: 2.1 }, warn: { gte: 1.6, lt: 2.1 }, action: "Planejar para menos nascimentos, com rede escolar e conciliação entre trabalho e família.", thresholdsText: "Favorável a partir de 2,1; Atenção de 1,6 a 2,1; Crítico abaixo de 1,6." },
  { id: "envelhecimento", metricId: "ie60", basis: "value", good: { lt: 50 }, warn: { gte: 50, lte: 100 }, action: "Ampliar cuidados de longa duração, geriatria e acessibilidade urbana.", thresholdsText: "Favorável abaixo de 50; Atenção de 50 a 100; Crítico acima de 100." },
  { id: "mortalidade_infantil", metricId: "tmi_t", basis: "value", good: { lte: 10 }, warn: { gt: 10, lte: 15 }, action: "Reforçar pré-natal, parto seguro, vacinação e leitos neonatais.", thresholdsText: "Favorável até 10 por mil; Atenção de 10 a 15; Crítico acima de 15." },
  { id: "idosos_populacao", metricId: "p_60", basis: "value", good: { lt: 10 }, warn: { gte: 10, lte: 20 }, action: "Dimensionar saúde, previdência e cuidado para uma população mais velha.", thresholdsText: "Favorável abaixo de 10%; Atenção de 10% a 20%; Crítico acima de 20%." },
  { id: "criancas_10_anos", metricId: "p_0_14", basis: "delta10_pp", good: { gte: 0 }, warn: { gte: -3, lt: 0 }, action: "Reavaliar a oferta de creches e escolas e redirecionar a capacidade ociosa.", thresholdsText: "Favorável variação de 10 anos igual ou acima de 0 p.p.; Atenção de −3 a 0 p.p.; Crítico abaixo de −3 p.p." },
  { id: "dependencia", metricId: "rdt65", basis: "value", good: { lte: 45 }, warn: { gt: 45, lte: 55 }, action: "Aproveitar a janela restante para elevar produtividade, escolaridade e formalização.", thresholdsText: "Favorável até 45; Atenção de 45 a 55; Crítico acima de 55." },
  { id: "maior_grupo", metricId: "maior_grupo", basis: "value", good: { lt: 30 }, warn: { gte: 30, lt: 45 }, action: "Rever a oferta de serviços. O maior grupo já está na vida adulta e a demanda deixa de ser a de crianças.", thresholdsText: "Favorável se o maior grupo começa antes dos 30 anos; Atenção de 30 a 44; Crítico a partir de 45." },
  { id: "pop_0_4", metricId: "pop_0_4", basis: "delta10_rel", good: { gte: 0 }, warn: { gte: -15, lt: 0 }, action: "Readequar creches e a primeira etapa do ensino à queda do grupo de 0 a 4 anos.", thresholdsText: "Favorável variação de 10 anos igual ou acima de 0%; Atenção de −15% a 0%; Crítico abaixo de −15%." },
  { id: "pop_80", metricId: "pop_80", basis: "delta10_rel", good: { lt: 20 }, warn: { gte: 20, lte: 40 }, action: "Ampliar cuidado de longa duração, geriatria e moradia acessível para o grupo de 80 anos ou mais.", thresholdsText: "Favorável crescimento em 10 anos abaixo de 20%; Atenção de 20% a 40%; Crítico acima de 40%." },
  { id: "razao_80_0_4", metricId: "razao_80_0_4", basis: "value", good: { lt: 0.5 }, warn: { gte: 0.5, lte: 1 }, action: "Planejar cuidado de longa duração. Já há muitas pessoas de 80 anos ou mais para cada criança de 0 a 4.", thresholdsText: "Favorável abaixo de 0,5; Atenção de 0,5 a 1; Crítico acima de 1." },
  { id: "idade_ativa", metricId: "p_15_64_t", basis: "value", good: { gte: 65 }, warn: { gte: 60, lt: 65 }, action: "Aproveitar a parcela ainda alta em idade ativa para elevar produtividade, escolaridade e formalização.", thresholdsText: "Favorável a partir de 65%; Atenção de 60% a 65%; Crítico abaixo de 60%." },
  { id: "idosos_65", metricId: "p_65_mais_t", basis: "value", good: { lt: 10 }, warn: { gte: 10, lte: 20 }, action: "Dimensionar saúde, previdência e cuidado para uma população com mais pessoas de 65 anos ou mais.", thresholdsText: "Favorável abaixo de 10%; Atenção de 10% a 20%; Crítico acima de 20%." },
  { id: "idosos_80", metricId: "p_80_mais_t", basis: "value", good: { lt: 3 }, warn: { gte: 3, lte: 6 }, action: "Ampliar cuidados de longa duração e a rede de apoio a quem tem 80 anos ou mais.", thresholdsText: "Favorável abaixo de 3%; Atenção de 3% a 6%; Crítico acima de 6%." },
  { id: "idade_mediana", metricId: "id_med", basis: "value", good: { lt: 30 }, warn: { gte: 30, lte: 40 }, action: "Antecipar a mudança da demanda, de serviços para jovens para serviços para adultos e idosos.", thresholdsText: "Favorável abaixo de 30 anos; Atenção de 30 a 40; Crítico acima de 40." },
  { id: "risco_1_ano", metricId: "nqx_0", basis: "value", good: { lte: 10 }, warn: { gt: 10, lte: 15 }, action: "Reforçar pré-natal, parto seguro, vacinação e leitos neonatais.", thresholdsText: "Favorável até 10 por mil; Atenção de 10 a 15; Crítico acima de 15." },
  { id: "chegam_80", metricId: "lx_80", basis: "value", good: { gte: 55 }, warn: { gte: 45, lt: 55 }, action: "Reduzir a mortalidade adulta evitável, sobretudo masculina, por violência, acidentes e doenças crônicas.", thresholdsText: "Favorável a partir de 55 de cada 100; Atenção de 45 a 55; Crítico abaixo de 45." },
  { id: "vida_60", metricId: "e60", basis: "value", good: { gte: 22 }, warn: { gte: 20, lt: 22 }, action: "Fortalecer o cuidado de doenças crônicas e o envelhecimento ativo.", thresholdsText: "Favorável a partir de 22 anos; Atenção de 20 a 22; Crítico abaixo de 20." },
  { id: "validacoes", metricId: "validacoes", basis: "pct_rows", good: { gte: 100 }, warn: { gte: 95, lt: 100 }, action: "Não publicar análises até investigar as regras com falha na página de Qualidade.", thresholdsText: "Favorável com 100% das regras aprovadas; Atenção de 95% a 100%; Crítico abaixo de 95%." },
  { id: "atipicos", metricId: "atipicos", basis: "pct_rows", good: { lt: 0.5 }, warn: { gte: 0.5, lte: 2 }, action: "Revisar a regra de detecção ou a carga. Atípicos em dados oficiais costumam indicar falso positivo.", thresholdsText: "Favorável abaixo de 0,5% das linhas; Atenção de 0,5% a 2%; Crítico acima de 2%." },
]

const byRule = new Map(KPI_RULES.map((item) => [item.id, item]))

function holds(band: Band, value: number) {
  if (band.gt != null && !(value > band.gt)) return false
  if (band.gte != null && !(value >= band.gte)) return false
  if (band.lt != null && !(value < band.lt)) return false
  if (band.lte != null && !(value <= band.lte)) return false
  return true
}

export function ruleForMetric(metricId: string) {
  const metric = metricById(metricId)
  if (!metric) return undefined
  return byRule.get(metric.regra)
}

export function evaluate(ruleId: string, ctx: { value: number; brazil?: number; prev?: number; yoyPct?: number; delta10Pp?: number; delta10Rel?: number }): { status: Status; basis: number } {
  const rule = byRule.get(ruleId)
  if (!rule) return { status: "warn", basis: ctx.value }
  let basis = ctx.value
  if (rule.basis === "yoy_pct") basis = ctx.yoyPct ?? ctx.value
  if (rule.basis === "vs_brazil") basis = ctx.brazil == null ? ctx.value - (ctx.prev ?? ctx.value) : ctx.value - ctx.brazil
  if (rule.basis === "delta10_pp") basis = ctx.delta10Pp ?? ctx.value
  if (rule.basis === "delta10_rel") basis = ctx.delta10Rel ?? ctx.value
  const status: Status = holds(rule.good, basis) ? "good" : holds(rule.warn, basis) ? "warn" : "bad"
  return { status, basis }
}

export const STATUS_LABEL: Record<Status, string> = {
  good: "Favorável",
  warn: "Atenção",
  bad: "Crítico",
}
