import { formatValue } from "@/lib/format"

const PREP: Record<string, string> = {
  Brasil: "no Brasil",
  Norte: "na Região Norte",
  Nordeste: "na Região Nordeste",
  Sudeste: "na Região Sudeste",
  Sul: "na Região Sul",
  "Centro-Oeste": "na Região Centro-Oeste",
  Acre: "no Acre",
  Alagoas: "em Alagoas",
  Amapá: "no Amapá",
  Amazonas: "no Amazonas",
  Bahia: "na Bahia",
  Ceará: "no Ceará",
  "Distrito Federal": "no Distrito Federal",
  "Espírito Santo": "no Espírito Santo",
  Goiás: "em Goiás",
  Maranhão: "no Maranhão",
  "Mato Grosso": "em Mato Grosso",
  "Mato Grosso do Sul": "em Mato Grosso do Sul",
  "Minas Gerais": "em Minas Gerais",
  Pará: "no Pará",
  Paraíba: "na Paraíba",
  Paraná: "no Paraná",
  Pernambuco: "em Pernambuco",
  Piauí: "no Piauí",
  "Rio de Janeiro": "no Rio de Janeiro",
  "Rio Grande do Norte": "no Rio Grande do Norte",
  "Rio Grande do Sul": "no Rio Grande do Sul",
  Rondônia: "em Rondônia",
  Roraima: "em Roraima",
  "Santa Catarina": "em Santa Catarina",
  "São Paulo": "em São Paulo",
  Sergipe: "em Sergipe",
  Tocantins: "no Tocantins",
}

export function plural(count: number, singular: string, pluralForm: string) {
  const value = formatValue(count, { key: "n", kind: "count" })
  return `${value} ${count === 1 ? singular : pluralForm}`
}

export function preposicaoTerritorio(nome: string) {
  return PREP[nome] ?? `em ${nome}`
}

const MID_NAME: Record<string, string> = {
  População: "a população",
  "Filhos por mulher": "o número de filhos por mulher",
}

export function metricName(label: string) {
  if (MID_NAME[label]) return MID_NAME[label]
  if (!label) return label
  return label.charAt(0).toLowerCase() + label.slice(1)
}

export function stableHash(text: string) {
  let hash = 0
  for (const char of text) hash = (hash * 33 + char.charCodeAt(0)) >>> 0
  return hash
}
