import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { KpiCard } from "@/components/common/KpiCard"
import { Card } from "@/components/ui/card"
import { FilterBar } from "@/features/datasets/components/FilterBar"
import { useDashboardFilters, useFacts, useSummary, useTerritories, useDatasetNews } from "@/features/datasets/hooks"
import { formatValue, type MetricKind, type NumberFormat } from "@/lib/format"
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

function metricKind(unidade: string): MetricKind {
  if (unidade === "proporção") return "percent"
  if (unidade === "anos") return "years"
  if (unidade === "por mil") return "permil"
  return "count"
}

function kpiFormat(unidade: string): NumberFormat {
  if (unidade === "proporção") return "percent"
  if (unidade === "anos") return "years"
  return "integer"
}

function factText(fact: FactItem) {
  if (typeof fact.value === "string") return fact.value
  return formatValue(fact.value, { key: fact.id, kind: fact.kind }, "simple")
}

function SectionCard({ id, title, wide, children }: { id: string; title: string; wide?: boolean; children: ReactNode }) {
  return (
    <Card id={id} className={`flex h-full flex-col p-4 ${wide ? "md:col-span-2" : ""}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-3 text-sm leading-6 [&_p]:max-w-[72ch]">{children}</div>
    </Card>
  )
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
  const value2000 = formatValue(at(2000) ?? null, { key: "serie", kind: "count" }, "simple")
  const value2070 = formatValue(at(2070) ?? null, { key: "serie", kind: "count" }, "simple")
  const shownFacts = (facts.data ?? []).slice(0, 4)
  const sections = [
    { id: "o-que", title: "O que esta página mostra" },
    { id: "hoje", title: "Como está hoje" },
    { id: "ano-2000", title: "Como era em 2000" },
    { id: "ano-2070", title: "Para onde vamos (2070)" },
    { id: "territorios", title: "Comparando territórios" },
    { id: "fatos", title: "Fatos em destaque" },
    { id: "dia", title: "O que isso significa no dia a dia" },
    { id: "noticias", title: "Notícias do IBGE" },
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
          <KpiCard key={kpi.id} metricKey={kpi.id} label={kpi.label} value={kpi.value} format={kpiFormat(kpi.unidade)} loading={summary.isLoading} />
        ))}
      </section>
      <section className="grid gap-4" aria-label="Entenda os dados">
        <h2 className="text-base font-medium">Entenda os dados</h2>
        <Card className="p-4">
          <nav className="flex flex-wrap gap-2" aria-label="Categorias">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="rounded-md border border-border px-3 py-1.5 text-sm">
                {section.title}
              </a>
            ))}
          </nav>
        </Card>
        <div className="grid items-stretch gap-4 md:grid-cols-2">
          <SectionCard id="o-que" title="O que esta página mostra">
            <p>{copy.what}</p>
          </SectionCard>
          <SectionCard id="dia" title="O que isso significa no dia a dia">
            <p>{copy.daily}</p>
          </SectionCard>
          <SectionCard id="hoje" title="Como está hoje" wide>
            <p>
              {place} em {filters.ano}.
            </p>
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {kpis.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-4 py-2">
                  <span>{item.label}</span>
                  <span className="shrink-0 font-medium tabular-nums">{formatValue(item.value, { key: item.id, kind: metricKind(item.unidade) }, "simple")}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard id="ano-2000" title="Como era em 2000">
            <p className="text-2xl font-semibold tabular-nums">{value2000}</p>
            <p className="mt-2 text-muted-foreground">Indicador principal no início da série.</p>
          </SectionCard>
          <SectionCard id="ano-2070" title="Para onde vamos (2070)">
            <p className="text-2xl font-semibold tabular-nums">{value2070}</p>
            <p className="mt-2 text-muted-foreground">Projeção no fim da série.</p>
          </SectionCard>
          <SectionCard id="territorios" title="Comparando territórios" wide>
            <p>{filters.cod === 0 ? "O Brasil reúne as cinco regiões." : `${place} é comparado com o Brasil nos fatos e nos indicadores.`}</p>
          </SectionCard>
          <SectionCard id="fatos" title="Fatos em destaque" wide>
            {shownFacts.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {shownFacts.map((fact) => (
                  <li key={fact.id} className="rounded-md border border-border p-3">
                    <p className="text-muted-foreground">{fact.label}</p>
                    <p className="mt-1 font-medium tabular-nums">{factText(fact)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Os fatos aparecem quando a base termina de carregar.</p>
            )}
          </SectionCard>
          <SectionCard id="noticias" title="Notícias do IBGE" wide>
            <ul className="grid gap-2">
              {(news.data?.items ?? []).slice(0, 3).map((item) => (
                <li key={String(item.id ?? item.link)} className="rounded-md border border-border px-3 py-2">
                  <a href={item.link ?? "https://agenciadenoticias.ibge.gov.br/"} className="underline" target="_blank" rel="noreferrer">
                    {item.titulo}
                  </a>
                  {item.data_publicacao ? <p className="text-muted-foreground">{item.data_publicacao}</p> : null}
                </li>
              ))}
            </ul>
          </SectionCard>
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
