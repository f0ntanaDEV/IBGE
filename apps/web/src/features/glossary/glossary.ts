import type { MetricKind } from "@/lib/format"

export type GlossaryEntry = {
  key: string
  kind: MetricKind
  rotuloTecnico: string
  explicacao: string
  unidade?: string
}

export const glossary: GlossaryEntry[] = [
  {
    key: "populacao",
    kind: "count",
    rotuloTecnico: "População total",
    explicacao: "Soma de todas as pessoas do lugar e do ano escolhidos.",
  },
  {
    key: "pop_t",
    kind: "count",
    rotuloTecnico: "População",
    explicacao: "Total de pessoas na projeção para o ano em destaque.",
  },
  {
    key: "p_0_14",
    kind: "percent",
    rotuloTecnico: "0–14 anos",
    explicacao: "De cada cem pessoas, quantas têm até 14 anos.",
  },
  {
    key: "p_0_14_t",
    kind: "percent",
    rotuloTecnico: "0–14 anos",
    explicacao: "De cada cem pessoas, quantas têm até 14 anos.",
  },
  {
    key: "p_60",
    kind: "percent",
    rotuloTecnico: "60 anos ou mais",
    explicacao: "De cada cem pessoas, quantas têm 60 anos ou mais.",
  },
  {
    key: "p_60_mais_t",
    kind: "percent",
    rotuloTecnico: "60 anos ou mais",
    explicacao: "De cada cem pessoas, quantas têm 60 anos ou mais.",
  },
  {
    key: "p_15_64_t",
    kind: "percent",
    rotuloTecnico: "15–64 anos",
    explicacao: "De cada cem pessoas, quantas têm de 15 a 64 anos.",
  },
  {
    key: "p_65_mais_t",
    kind: "percent",
    rotuloTecnico: "65 anos ou mais",
    explicacao: "De cada cem pessoas, quantas já passaram dos 65 anos.",
  },
  {
    key: "p_80_mais_t",
    kind: "percent",
    rotuloTecnico: "80 anos ou mais",
    explicacao: "De cada cem pessoas, quantas têm 80 anos ou mais.",
  },
  {
    key: "idade_mediana",
    kind: "years",
    rotuloTecnico: "Idade mediana",
    explicacao: "Metade das pessoas tem menos do que essa idade. A outra metade tem mais.",
  },
  {
    key: "id_med",
    kind: "years",
    rotuloTecnico: "Idade mediana",
    explicacao: "Metade das pessoas tem menos do que essa idade. A outra metade tem mais.",
  },
  {
    key: "maior_grupo",
    kind: "raw",
    rotuloTecnico: "Maior grupo etário",
    explicacao: "É o grupo de idade que reúne o maior número de pessoas.",
  },
  {
    key: "pop_0_4",
    kind: "count",
    rotuloTecnico: "População 0–4",
    explicacao: "Quantas crianças ainda não completaram 5 anos.",
  },
  {
    key: "pop_80",
    kind: "count",
    rotuloTecnico: "População 80+",
    explicacao: "Quantas pessoas já chegaram aos 80 anos.",
  },
  {
    key: "razao_80_0_4",
    kind: "rate",
    rotuloTecnico: "Razão 80+/0–4",
    explicacao: "Quantas pessoas de 80 anos ou mais existem para cada criança de até 4 anos.",
    unidade: "para cada criança",
  },
  {
    key: "e0",
    kind: "years",
    rotuloTecnico: "Esperança de vida ao nascer",
    explicacao: "É a idade média que um bebê nascido neste ano deve alcançar.",
  },
  {
    key: "e0_t",
    kind: "years",
    rotuloTecnico: "Esperança de vida ao nascer",
    explicacao: "É a idade média que um bebê nascido neste ano deve alcançar.",
  },
  {
    key: "e0_h",
    kind: "years",
    rotuloTecnico: "Esperança de vida, homens",
    explicacao: "Idade média que um menino nascido neste ano deve alcançar.",
  },
  {
    key: "e0_m",
    kind: "years",
    rotuloTecnico: "Esperança de vida, mulheres",
    explicacao: "Idade média que uma menina nascida neste ano deve alcançar.",
  },
  {
    key: "ex",
    kind: "years",
    rotuloTecnico: "Esperança de vida por idade",
    explicacao: "Quantos anos, em média, ainda faltam para quem já chegou a essa idade.",
  },
  {
    key: "e60",
    kind: "years",
    rotuloTecnico: "Esperança de vida aos 60",
    explicacao: "Quantos anos, em média, ainda vive quem acaba de completar 60.",
  },
  {
    key: "tft",
    kind: "rate",
    rotuloTecnico: "Taxa de fecundidade total",
    explicacao: "Número médio de filhos que cada mulher teria ao longo da vida.",
    unidade: "filho por mulher",
  },
  {
    key: "tmi_t",
    kind: "permil",
    rotuloTecnico: "Taxa de mortalidade infantil",
    explicacao: "De cada mil bebês nascidos vivos, quantos morrem antes de completar um ano.",
  },
  {
    key: "tbn",
    kind: "rate",
    rotuloTecnico: "Taxa bruta de natalidade",
    explicacao: "Quantos nascimentos acontecem para cada mil pessoas no ano.",
    unidade: "a cada mil",
  },
  {
    key: "tbm",
    kind: "rate",
    rotuloTecnico: "Taxa bruta de mortalidade",
    explicacao: "Quantas mortes acontecem para cada mil pessoas no ano.",
    unidade: "a cada mil",
  },
  {
    key: "ie60",
    kind: "index",
    rotuloTecnico: "Índice de envelhecimento",
    explicacao: "Quantas pessoas de 60 anos ou mais existem para cada cem crianças de até 14.",
  },
  {
    key: "nmx",
    kind: "permil",
    rotuloTecnico: "Mortalidade no primeiro ano",
    explicacao: "Óbitos no primeiro ano de vida para cada mil bebês, pela taxa central da tábua. A sigla nmx, sozinha, não diz esse número.",
  },
  {
    key: "nqx",
    kind: "rate",
    rotuloTecnico: "Probabilidade de morte",
    explicacao: "Chance de uma pessoa morrer antes de completar a idade seguinte.",
  },
  {
    key: "nqx_0",
    kind: "rate",
    rotuloTecnico: "Probabilidade de morte na idade 0",
    explicacao: "Chance de um recém-nascido morrer antes de completar um ano.",
  },
  {
    key: "lx",
    kind: "count",
    rotuloTecnico: "Sobreviventes",
    explicacao: "De cada cem bebês, quantos ainda estão vivos nessa idade.",
  },
  {
    key: "lx_80",
    kind: "count",
    rotuloTecnico: "Sobreviventes aos 80",
    explicacao: "De cada cem bebês, quantos chegam aos 80 anos.",
  },
  {
    key: "jovem",
    kind: "percent",
    rotuloTecnico: "0–14",
    explicacao: "Parcela da população com até 14 anos.",
  },
  {
    key: "ativa",
    kind: "percent",
    rotuloTecnico: "15–59",
    explicacao: "Parcela da população de 15 a 59 anos.",
  },
  {
    key: "idosa",
    kind: "percent",
    rotuloTecnico: "60+",
    explicacao: "Parcela da população com 60 anos ou mais.",
  },
  {
    key: "ano_cruzamento",
    kind: "year",
    rotuloTecnico: "Ano do cruzamento",
    explicacao: "Primeiro ano em que a parcela de idosos fica maior que a de crianças.",
  },
]

const byKey = new Map(glossary.map((entry) => [entry.key, entry]))

export function glossaryByKey(key: string) {
  return byKey.get(key)
}

export function unidadeKpi(key: string, value: number | null): string | null {
  if (/^(e0|e0_t|e0_h|e0_m|e60|ex|idade_mediana|id_med)$/.test(key)) return "anos"
  if (key === "tft") return value != null && Math.abs(value) < 2 ? "filho por mulher" : "filhos por mulher"
  if (key === "ie60") return "por 100 jovens"
  if (key === "tmi" || key === "tmi_t" || key === "nqx_0") return null
  if (key === "tbn" || key === "tbm") return "‰"
  if (key === "razao_80_0_4") return "por criança"
  return null
}
