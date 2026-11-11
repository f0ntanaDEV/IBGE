import type { NewsItem } from "@/features/datasets/api"

const TERMS: Record<string, string[]> = {
  overview: ["população", "projeção", "crescer"],
  ds1: ["idade", "pirâmide", "população"],
  ds2: ["idade", "faixa", "envelhecimento"],
  ds3: ["idosos", "crianças", "envelhecimento"],
  ds4: ["fecundidade", "esperança", "mortalidade"],
  ds5: ["mortalidade", "esperança", "tábua"],
  quality: ["projeção", "população", "censo"],
}

const SLUG: Record<string, string> = {
  "41056": "populacao-do-pais-vai-parar-de-crescer-em-2041",
  "41111": "populacao-estimada-do-pais-chega-a-212-6-milhoes-de-habitantes-em-2024",
  "38186": "censo-2022-numero-de-pessoas-com-65-anos-ou-mais-de-idade-cresceu-57-4-em-12-anos",
  "34438": "populacao-cresce-mas-numero-de-pessoas-com-menos-de-30-anos-cai-5-4-de-2012-a-2021",
  "24036": "idosos-indicam-caminhos-para-uma-melhor-idade",
}

function news(id: string, titulo: string, introducao: string, data: string): NewsItem {
  return {
    id: `curated-${id}`,
    titulo,
    introducao,
    data_publicacao: data,
    link: `https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/${id}-${SLUG[id]}`,
  }
}

export const CURATED: Record<string, NewsItem[]> = {
  overview: [
    news("41056", "População do país vai parar de crescer em 2041", "Projeções da População, Revisão 2024: o máximo é 2041.", "22/08/2024 10h00"),
    news("41111", "População estimada do país chega a 212,6 milhões de habitantes em 2024", "Estimativa de 1º de julho de 2024 com base nas projeções.", "29/08/2024 10h00"),
    news("38186", "Censo 2022: número de pessoas com 65 anos ou mais de idade cresceu 57,4% em 12 anos", "A estrutura por idade ficou mais velha entre 2010 e 2022.", "27/10/2023 10h00"),
  ],
  ds1: [
    news("38186", "Censo 2022: número de pessoas com 65 anos ou mais de idade cresceu 57,4% em 12 anos", "A pirâmide etária perdeu a base larga e a idade mediana chegou a 35 anos.", "27/10/2023 10h00"),
    news("34438", "População cresce, mas número de pessoas com menos de 30 anos cai 5,4% de 2012 a 2021", "A pirâmide mostra menos jovens e mais idosos.", "22/07/2022 10h00"),
    news("41056", "População do país vai parar de crescer em 2041", "A projeção descreve a população por idade até 2070.", "22/08/2024 10h00"),
  ],
  ds2: [
    news("38186", "Censo 2022: número de pessoas com 65 anos ou mais de idade cresceu 57,4% em 12 anos", "Os grupos de idade mais velhos cresceram e os de crianças encolheram.", "27/10/2023 10h00"),
    news("34438", "População cresce, mas número de pessoas com menos de 30 anos cai 5,4% de 2012 a 2021", "Faixas mais jovens perderam participação.", "22/07/2022 10h00"),
    news("41056", "População do país vai parar de crescer em 2041", "A projeção muda o peso de cada faixa etária até 2070.", "22/08/2024 10h00"),
  ],
  ds3: [
    news("41056", "População do país vai parar de crescer em 2041", "A parcela de idosos de 60 anos ou mais sobe de 8,7% para 15,6% até 2023 e segue em alta.", "22/08/2024 10h00"),
    news("38186", "Censo 2022: número de pessoas com 65 anos ou mais de idade cresceu 57,4% em 12 anos", "Crianças até 14 anos recuaram e idosos avançaram.", "27/10/2023 10h00"),
    news("34438", "População cresce, mas número de pessoas com menos de 30 anos cai 5,4% de 2012 a 2021", "O grupo de 60 anos ou mais passou de 11,3% para 14,7%.", "22/07/2022 10h00"),
  ],
  ds4: [
    news("41056", "População do país vai parar de crescer em 2041", "Fecundidade, esperança de vida e mortalidade infantil na Revisão 2024.", "22/08/2024 10h00"),
    news("38186", "Censo 2022: número de pessoas com 65 anos ou mais de idade cresceu 57,4% em 12 anos", "O índice de envelhecimento chegou a 55,2 idosos de 65+ para cada 100 crianças.", "27/10/2023 10h00"),
    news("24036", "Idosos indicam caminhos para uma melhor idade", "A queda da fecundidade e as tábuas de mortalidade explicam o envelhecimento.", "19/04/2019 10h00"),
  ],
  ds5: [
    news("41056", "População do país vai parar de crescer em 2041", "A esperança de vida ao nascer e a mortalidade infantil entram na projeção.", "22/08/2024 10h00"),
    news("24036", "Idosos indicam caminhos para uma melhor idade", "As tábuas completas de mortalidade medem a expectativa de vida.", "19/04/2019 10h00"),
    news("38186", "Censo 2022: número de pessoas com 65 anos ou mais de idade cresceu 57,4% em 12 anos", "Mais gente chega às idades avançadas.", "27/10/2023 10h00"),
  ],
}

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

export function relevance(pageId: string, item: NewsItem) {
  const blob = fold(`${item.titulo ?? ""} ${item.introducao ?? ""}`)
  return (TERMS[pageId] ?? []).filter((term) => blob.includes(fold(term))).length
}

export function selectNews(pageId: string, items: NewsItem[]) {
  const relevant = items.filter((item) => relevance(pageId, item) >= 1 && !String(item.id ?? "").startsWith("curated-"))
  const seen = new Set(relevant.map((item) => String(item.link ?? item.id)))
  const filled = [...relevant]
  for (const extra of CURATED[pageId] ?? []) {
    if (filled.length >= 3) break
    const key = String(extra.link)
    if (seen.has(key)) continue
    seen.add(key)
    filled.push(extra)
  }
  return filled.slice(0, 3)
}
