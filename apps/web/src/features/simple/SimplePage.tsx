import type { ReactNode } from "react"
import { Reveal } from "@/motion/useMotion"
import { Link } from "react-router-dom"
import { Headline } from "@/components/common/Headline"
import { PageHeader } from "@/components/common/PageHeader"
import { UpdateLine } from "@/components/common/UpdateLine"
import { pageCopy } from "@/content/pages"
import { selectNews } from "@/content/news-curated"
import { KpiCard } from "@/components/common/KpiCard"
import { Card } from "@/components/ui/card"
import { FilterBar } from "@/features/datasets/components/FilterBar"
import { useContext, useDashboardFilters, useFacts, useSummary, useTerritories, useDatasetNews } from "@/features/datasets/hooks"
import { formatValue, type MetricKind, type NumberFormat } from "@/lib/format"
import { CountUp } from "@/motion/CountUp"
import { FactList, visibleFacts } from "@/features/facts/FactsCard"
import { useMotionApi } from "@/motion/MotionProvider"
import { useMotionFilters, usePageReady } from "@/motion/usePageReady"
import { WordReveal } from "@/motion/WordReveal"

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

function RelatedNews({ item }: { item?: { titulo?: string | null; link?: string | null } }) {
  if (!item?.titulo) return null
  return (
    <p className="mt-3">
      <a href={item.link ?? "https://agenciadenoticias.ibge.gov.br/"} className="underline" target="_blank" rel="noreferrer">
        <WordReveal as="span" text={item.titulo} />
      </a>
    </p>
  )
}

function SectionCard({ id, title, wide, children }: { id: string; title: string; wide?: boolean; children: ReactNode }) {
  const { enabled } = useMotionApi()
  return (
    <Reveal className={wide ? "h-full md:col-span-2" : "h-full"}>
    <Card id={id} className={`flex h-full flex-col p-4 ${enabled ? "" : wide ? "md:col-span-2" : ""}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-3 text-sm leading-6 [&_p]:max-w-[72ch]">{children}</div>
    </Card>
    </Reveal>
  )
}

export function SimplePage({ pageId }: { pageId: string }) {
  const filters = useDashboardFilters()
  const territories = useTerritories()
  const summaryId = pageId === "overview" || pageId === "quality" ? "ds4" : pageId
  const summary = useSummary(summaryId, { ano: filters.ano, cod: filters.cod })
  const context = useContext(pageId === "quality" ? "overview" : pageId, filters, pageId !== "quality")
  const facts = useFacts(pageId === "overview" ? "overview" : pageId)
  const news = useDatasetNews(summaryId)
  const copy = COPY[pageId] ?? COPY.overview
  const kpis = (summary.data?.kpis ?? []).slice(0, 4)
  const place = territories.data?.find((item) => item.cod === filters.cod)?.local ?? "Brasil"
  const series = summary.data?.series ?? []
  const at = (year: number) => series.find((point) => point.ano === year)?.valor
  const raw2000 = at(2000)
  const raw2070 = at(2070)
  const shownFacts = visibleFacts(facts.data)
  usePageReady(summary.isSuccess || summary.isError)
  useMotionFilters(`${filters.cod}|${filters.ano}`)
  const related = news.data?.items ?? []
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
      <PageHeader title={copy.title} lead={pageCopy(pageId)?.question} audience={pageCopy(pageId)?.audience} meta={<UpdateLine />} />
      <FilterBar
        territories={filters.territories}
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
        <Headline pageId={pageId} input={{ cod: filters.cod, place, ano: filters.ano, pop: kpis.find((item) => item.id === "pop_t")?.value ?? null }} />
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
            <WordReveal text={copy.what} />
            <RelatedNews item={related[0]} />
          </SectionCard>
          <SectionCard id="dia" title="O que isso significa no dia a dia">
            <WordReveal text={copy.daily} />
            <RelatedNews item={related[1] ?? related[0]} />
          </SectionCard>
          <SectionCard id="hoje" title="Como está hoje" wide>
            <WordReveal text={`${place} em ${filters.ano}.`} />
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {context.data?.length
                ? context.data.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between gap-4 py-2">
                      <span>{item.label}</span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {typeof item.value === "string" ? (
                          item.value
                        ) : item.kind === "year" ? (
                          formatValue(item.value, { key: item.id, kind: "year" }, "simple")
                        ) : (
                          <CountUp value={item.value} metric={{ key: item.id, kind: item.kind === "ratio" ? "rate" : item.kind }} />
                        )}
                      </span>
                    </li>
                  ))
                : kpis.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between gap-4 py-2">
                      <span>{item.label}</span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {item.value == null ? "—" : <CountUp value={item.value} metric={{ key: item.id, kind: metricKind(item.unidade) }} />}
                      </span>
                    </li>
                  ))}
            </ul>
            <RelatedNews item={related[2] ?? related[0]} />
          </SectionCard>
          <SectionCard id="ano-2000" title="Como era em 2000">
            <p className="text-2xl font-semibold tabular-nums">{raw2000 == null ? "—" : <CountUp value={raw2000} metric={{ key: "serie", kind: "count" }} />}</p>
            <WordReveal className="mt-2 text-muted-foreground" text="Indicador principal no início da série." />
            <RelatedNews item={related[3] ?? related[0]} />
          </SectionCard>
          <SectionCard id="ano-2070" title="Para onde vamos (2070)">
            <p className="text-2xl font-semibold tabular-nums">{raw2070 == null ? "—" : <CountUp value={raw2070} metric={{ key: "serie", kind: "count" }} />}</p>
            <WordReveal className="mt-2 text-muted-foreground" text="Projeção no fim da série." />
            <RelatedNews item={related[4] ?? related[1] ?? related[0]} />
          </SectionCard>
          <SectionCard id="territorios" title="Comparando territórios" wide>
            <WordReveal text={filters.cod === 0 ? "O Brasil reúne as cinco regiões." : `${place} é comparado com o Brasil nos fatos e nos indicadores.`} />
            <RelatedNews item={related[5] ?? related[2] ?? related[0]} />
          </SectionCard>
          <SectionCard id="fatos" title="Fatos em destaque" wide>
            {shownFacts.length ? (
              <FactList facts={shownFacts} />
            ) : (
              <WordReveal text="Os fatos aparecem quando a base termina de carregar." />
            )}
            <RelatedNews item={related[6] ?? related[0]} />
          </SectionCard>
          <SectionCard id="noticias" title="Notícias do IBGE" wide>
            <ul className="grid gap-2">
              {selectNews(pageId === "quality" ? "overview" : pageId, news.data?.items ?? []).map((item) => (
                <li key={String(item.id ?? item.link)} className="rounded-md border border-border px-3 py-2">
                  <a href={item.link ?? "https://agenciadenoticias.ibge.gov.br/"} className="underline" target="_blank" rel="noreferrer">
                    <WordReveal as="span" text={item.titulo ?? ""} />
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
