export type PageCopy = {
  id: string
  title: string
  to: string
  question: string
  audience: string
  persona: "gestor" | "analista" | "cidadao"
}

export const PAGE_COPY: PageCopy[] = [
  { id: "overview", title: "Visão Geral", to: "/", question: "A população brasileira ainda vai crescer? Até quando?", audience: "Gestor público", persona: "gestor" },
  { id: "ds1", title: "População por idade", to: "/datasets/ds1", question: "Como a distribuição por idade está mudando e onde estará a demanda por serviços?", audience: "Analista", persona: "analista" },
  { id: "ds2", title: "Grupos quinquenais", to: "/datasets/ds2", question: "Quais faixas etárias crescem e quais encolhem?", audience: "Analista", persona: "analista" },
  { id: "ds3", title: "Grupos etários", to: "/datasets/ds3", question: "Quando haverá mais idosos do que crianças e quanto tempo resta de bônus demográfico?", audience: "Gestor público", persona: "gestor" },
  { id: "ds4", title: "Indicadores", to: "/datasets/ds4", question: "Em que ritmo estamos vivendo mais e tendo menos filhos, e onde?", audience: "Analista", persona: "analista" },
  { id: "ds5", title: "Tábuas de mortalidade", to: "/datasets/ds5", question: "Quantos chegam a cada idade e onde há mortes evitáveis?", audience: "Analista", persona: "analista" },
  { id: "quality", title: "Qualidade de dados", to: "/qualidade", question: "Os números exibidos são confiáveis?", audience: "Analista", persona: "analista" },
]

export function pageCopy(id: string) {
  return PAGE_COPY.find((item) => item.id === id)
}

export const PERSONAS = [
  { title: "Gestor público ou executivo", text: "Decide planejamento de saúde, educação, previdência e infraestrutura. Lê o topo das páginas e o modo Simples." },
  { title: "Analista ou pesquisador", text: "Compara territórios e séries. Usa o modo Técnico, os detalhamentos e os dados para download." },
  { title: "Estudante ou cidadão", text: "Quer entender a mudança demográfica. Usa o modo Simples e os Insights." },
]
