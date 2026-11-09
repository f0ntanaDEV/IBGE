import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { KpiCard } from "@/components/common/KpiCard"
import { FilterBar } from "@/features/datasets/components/FilterBar"
import { useDashboardFilters, useFacts, useSummary, useTerritories, useDatasetNews } from "@/features/datasets/hooks"
import { formatValue } from "@/lib/format"
import type { FactItem } from "@/features/datasets/api"

const COPY: Record<string, { title: string; what: string; daily: string }> = {
  overview: {
    title: "Visão geral",
    what: "Esta página mostra o tamanho da população, quanto tempo as pessoas vivem e quantos filhos nascem, em média.",
    daily: "Esses números ajudam a planejar escolas, hospitais e aposentadorias com antecedência.",
  },
  ds1: {
    title: "População por idade",
    what: "Esta página mostra quantas pessoas há em cada idade, de 0 a 90 anos ou mais.",
    daily: "Serve para estimar vagas em escolas, postos de saúde e benefícios por idade.",
  },
  ds2: {
    title: "Grupos quinquenais",
    what: "Esta página junta a população em faixas de cinco anos.",
    daily: "As faixas mostram quais idades estão crescendo e quais estão diminuindo.",
  },
  ds3: {
    title: "Grupos etários",
    what: "Esta página compara crianças, adultos e idosos.",
    daily: "A comparação indica se há mais gente em idade de trabalhar ou mais gente que precisa de cuidado.",
  },
  ds4: {
    title: "Indicadores",
    what: "Esta página reúne os principais números da população, como vida, filhos e mortalidade.",
    daily: "Os indicadores resumem a situação de hoje e a tendência até 2070.",
  },
  ds5: {
    title: "Tábuas de mortalidade",
    what: "Esta página mostra a chance de sobreviver e os anos de vida que restam em cada idade.",
    daily: "Esses números entram no cálculo de aposentadorias e de seguros.",
  },
  quality: {
    title: "Qualidade de dados",
    what: "Esta página explica o que foi conferido antes de mostrar os números.",
    daily: "O tratamento deixa claro o que veio da fonte e o que foi ajustado.",
  },
}

function factSentence(facts: FactItem[] | undefined) {
  if (!facts?.length) return "Os fatos aparecem quando a base termina de carregar."
  return facts
    .slice(0, 4)
    .map((fact) => `${fact.label}: ${typeof fact.value === "string" ? fact.value : formatValue(fact.value, { key: fact.id, kind: fact.kind }, "simple")}.`)
    .join(" ")
}

export function SimplePage({ pageId }: { pageId: string }) {
  const filters = useDashboardFilters()
  const territories = useTerritories()
  const summaryId = pageId === "overview" || pageId === "quality" ? "ds4" : pageId
  const summary = useSummary(summaryId, { ano: filters.ano, cod: filters.cod })
  const facts = useFacts(pageId === "overview" ? "overview" : pageId)
  const news = useDatasetNews(summaryId)
  const copy = COPY[pageId] ?? COPY.overview
  const kpis = (summary.data?.kpis ?? []).slice(0, 4)
  const place = territories.data?.find((item) => item.cod === filters.cod)?.local ?? "Brasil"
  const series = summary.data?.series ?? []
  const at = (year: number) => series.find((point) => point.ano === year)?.valor
  const today = kpis
    .map((item) => `${item.label}: ${formatValue(item.value, { key: item.id, kind: item.unidade === "proporção" ? "percent" : item.unidade === "anos" ? "years" : item.unidade === "por mil" ? "permil" : "count" }, "simple")}.`)
    .join(" ")
  const sections = [
    { id: "o-que", title: "O que esta página mostra", text: copy.what },
    { id: "hoje", title: "Como está hoje", text: `${place} em ${filters.ano}. ${today}` },
    { id: "ano-2000", title: "Como era em 2000", text: `Em 2000 o indicador principal era ${formatValue(at(2000) ?? null, { key: "serie", kind: "count" }, "simple")}.` },
    { id: "ano-2070", title: "Para onde vamos (2070)", text: `Em 2070 a projeção chega a ${formatValue(at(2070) ?? null, { key: "serie", kind: "count" }, "simple")}.` },
    { id: "territorios", title: "Comparando territórios", text: filters.cod === 0 ? "O Brasil reúne as cinco regiões." : `${place} é comparado com o Brasil nos fatos e nos indicadores.` },
    { id: "fatos", title: "Fatos em destaque", text: factSentence(facts.data) },
    { id: "dia", title: "O que isso significa no dia a dia", text: copy.daily },
  ]
  return (
    <div className="page-stack">
      <PageHeader title={copy.title} description={`${place}, ${filters.ano}. Projeções da população, revisão 2024.`} />
      <FilterBar
        territories={territories.data ?? []}
        filters={["territorio", "ano"]}
        cod={filters.cod}
        ano={filters.ano}
        sexo="Ambos"
        onCod={filters.setCod}
        onAno={filters.setAno}
        onSexo={() => undefined}
      />
      <section className="dashboard-grid" aria-label="Indicadores">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} metricKey={kpi.id} label={kpi.label} value={kpi.value} format={kpi.unidade === "proporção" ? "percent" : kpi.unidade === "anos" ? "years" : "integer"} loading={summary.isLoading} />
        ))}
      </section>
      <section data-card className="rounded-lg border border-border p-4" aria-label="Entenda os dados">
        <h2 className="text-base font-medium">Entenda os dados</h2>
        <nav className="mt-3 flex flex-wrap gap-3 text-sm xl:hidden" aria-label="Categorias">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="underline">
              {section.title}
            </a>
          ))}
        </nav>
        <div className="mt-4 xl:grid xl:grid-cols-12 xl:gap-6">
          <nav className="hidden xl:col-span-3 xl:block" aria-label="Categorias">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="mb-2 block text-sm underline">
                {section.title}
              </a>
            ))}
          </nav>
          <div className="xl:col-span-9">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="mb-6 max-w-[72ch]">
                <h3 className="text-sm font-medium">{section.title}</h3>
                <p className="mt-2 text-sm leading-6">{section.text}</p>
              </section>
            ))}
            <section id="noticias" className="max-w-[72ch]">
              <h3 className="text-sm font-medium">Notícias do IBGE</h3>
              <ul className="mt-2 grid gap-2 text-sm">
                {(news.data?.items ?? []).slice(0, 3).map((item) => (
                  <li key={String(item.id ?? item.link)}>
                    <a href={item.link ?? "https://agenciadenoticias.ibge.gov.br/"} className="underline" target="_blank" rel="noreferrer">
                      {item.titulo}
                    </a>
                    {item.data_publicacao ? <span className="text-muted-foreground"> · {item.data_publicacao}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </section>
      <p className="text-sm">
        <Link to="/insights" className="underline">
          Ver perguntas da página Insights
        </Link>
      </p>
    </div>
  )
}
