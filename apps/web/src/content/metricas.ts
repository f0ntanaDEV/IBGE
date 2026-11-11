import type { MetricKind } from "@/lib/format"

export type Variacao = "relativa" | "pontos" | "absoluta"

export type CatalogMetric = {
  id: string
  nome: string
  sigla: string
  definicao: string
  formula: string
  unidade: string
  casas: number
  variacao: Variacao
  fonte: string
  regra: string
  kind: MetricKind
}

export const METRICAS: CatalogMetric[] = [
  { id: "pop_t", nome: "População", sigla: "", definicao: "Número de pessoas na projeção do território e do ano.", formula: "pop_t da tabela de indicadores", unidade: "pessoas", casas: 0, variacao: "relativa", fonte: "IBGE, Projeções da População, Revisão 2024 (tabela 4)", regra: "crescimento_anual", kind: "count" },
  { id: "populacao", nome: "População", sigla: "", definicao: "Soma das pessoas do lugar, do ano e do sexo escolhidos.", formula: "soma da população por idade", unidade: "pessoas", casas: 0, variacao: "relativa", fonte: "IBGE, Projeções da População, Revisão 2024", regra: "crescimento_anual", kind: "count" },
  { id: "e0_t", nome: "Esperança de vida ao nascer", sigla: "e0", definicao: "Número médio de anos que um recém-nascido viveria, mantidas as taxas de mortalidade do ano.", formula: "ex na idade 0 da tábua de mortalidade", unidade: "anos", casas: 2, variacao: "absoluta", fonte: "IBGE, Projeções da População, Revisão 2024 (tabela 4)", regra: "esperanca_vida", kind: "years" },
  { id: "e0", nome: "Esperança de vida ao nascer", sigla: "e0", definicao: "Número médio de anos que um recém-nascido viveria, mantidas as taxas de mortalidade do ano.", formula: "ex na idade 0", unidade: "anos", casas: 2, variacao: "absoluta", fonte: "IBGE, Projeções da População, Revisão 2024 (tábua)", regra: "esperanca_vida", kind: "years" },
  { id: "e60", nome: "Vida restante aos 60", sigla: "e60", definicao: "Anos que uma pessoa de 60 anos ainda viveria, em média, com a mortalidade do ano.", formula: "ex na idade 60", unidade: "anos", casas: 2, variacao: "absoluta", fonte: "IBGE, Projeções da População, Revisão 2024 (tábua)", regra: "vida_60", kind: "years" },
  { id: "tft", nome: "Filhos por mulher", sigla: "TFT", definicao: "Número médio de filhos que uma mulher teria ao longo da vida, com a fecundidade do ano.", formula: "taxa de fecundidade total", unidade: "filhos por mulher", casas: 2, variacao: "absoluta", fonte: "IBGE, Projeções da População, Revisão 2024", regra: "filhos_por_mulher", kind: "rate" },
  { id: "tmi_t", nome: "Mortalidade infantil", sigla: "TMI", definicao: "Óbitos de menores de 1 ano para cada mil nascidos vivos.", formula: "óbitos infantis / nascidos vivos × 1000", unidade: "por mil", casas: 2, variacao: "absoluta", fonte: "IBGE, Projeções da População, Revisão 2024", regra: "mortalidade_infantil", kind: "permil" },
  { id: "ie60", nome: "Idosos para cada 100 crianças", sigla: "IE60", definicao: "Pessoas de 60 anos ou mais para cada 100 pessoas de 0 a 14 anos.", formula: "população 60+ / população 0–14 × 100", unidade: "", casas: 2, variacao: "absoluta", fonte: "IBGE, Projeções da População, Revisão 2024", regra: "envelhecimento", kind: "rate" },
  { id: "id_med", nome: "Idade mediana", sigla: "", definicao: "Idade que divide a população em duas metades.", formula: "idade mediana da projeção", unidade: "anos", casas: 1, variacao: "absoluta", fonte: "IBGE, Projeções da População, Revisão 2024", regra: "idade_mediana", kind: "years" },
  { id: "idade_mediana", nome: "Idade mediana", sigla: "", definicao: "Idade que divide a população em duas metades.", formula: "idade mediana calculada na pirâmide", unidade: "anos", casas: 1, variacao: "absoluta", fonte: "IBGE, Projeções da População, Revisão 2024", regra: "idade_mediana", kind: "years" },
  { id: "rdt65", nome: "Razão de dependência", sigla: "RDT65", definicao: "Pessoas de 0–14 e de 65+ para cada 100 pessoas de 15–64 anos.", formula: "(0–14 + 65+) / 15–64 × 100", unidade: "", casas: 1, variacao: "absoluta", fonte: "IBGE, Projeções da População, Revisão 2024", regra: "dependencia", kind: "rate" },
  { id: "nqx_0", nome: "Risco de morrer antes de 1 ano", sigla: "nqx", definicao: "Probabilidade de morrer antes de completar 1 ano, em óbitos por mil nascidos.", formula: "nqx na idade 0 × 1000", unidade: "por mil", casas: 2, variacao: "absoluta", fonte: "IBGE, Projeções da População, Revisão 2024 (tábua)", regra: "risco_1_ano", kind: "permil" },
  { id: "lx_80", nome: "Chegam aos 80 (de cada 100)", sigla: "lx", definicao: "De cada 100 nascidos da tábua, quantos chegam aos 80 anos.", formula: "lx na idade 80 / 1000", unidade: "de cada 100", casas: 1, variacao: "absoluta", fonte: "IBGE, Projeções da População, Revisão 2024 (tábua)", regra: "chegam_80", kind: "rate" },
  { id: "p_0_14", nome: "Crianças (0–14) na população", sigla: "", definicao: "Parcela da população com até 14 anos.", formula: "população 0–14 / população total", unidade: "", casas: 1, variacao: "pontos", fonte: "IBGE, Projeções da População, Revisão 2024", regra: "criancas_10_anos", kind: "percent" },
  { id: "p_0_14_t", nome: "Crianças (0–14) na população", sigla: "", definicao: "Parcela da população com até 14 anos.", formula: "população 0–14 / população total", unidade: "", casas: 1, variacao: "pontos", fonte: "IBGE, Projeções da População, Revisão 2024", regra: "criancas_10_anos", kind: "percent" },
  { id: "p_60", nome: "Idosos (60+) na população", sigla: "", definicao: "Parcela da população com 60 anos ou mais.", formula: "população 60+ / população total", unidade: "", casas: 1, variacao: "pontos", fonte: "IBGE, Projeções da População, Revisão 2024", regra: "idosos_populacao", kind: "percent" },
  { id: "p_60_mais_t", nome: "Idosos (60+) na população", sigla: "", definicao: "Parcela da população com 60 anos ou mais.", formula: "população 60+ / população total", unidade: "", casas: 1, variacao: "pontos", fonte: "IBGE, Projeções da População, Revisão 2024", regra: "idosos_populacao", kind: "percent" },
]

const byId = new Map(METRICAS.map((item) => [item.id, item]))

export function metricById(id: string) {
  return byId.get(id)
}

export function metricLabel(id: string, withSigla = false) {
  const metric = metricById(id)
  if (!metric) return id
  if (withSigla && metric.sigla) return `${metric.nome} (${metric.sigla})`
  return metric.nome
}
