import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { KPI_RULES } from "@/content/kpi-rules"
import { METRICAS, metricById } from "@/content/metricas"
import { PAGE_COPY, PERSONAS } from "@/content/pages"
import { useMetricCatalog } from "@/features/datasets/hooks"

function uniqueMetrics<T extends { id: string; nome: string }>(rows: T[]) {
  const seen = new Set<string>()
  return rows.filter((item) => {
    if (seen.has(item.nome)) return false
    seen.add(item.nome)
    return true
  })
}

export function AboutPage() {
  const metrics = useMetricCatalog()
  const rows = uniqueMetrics(metrics.data?.length ? metrics.data : METRICAS)
  return (
    <div className="page-stack">
      <PageHeader title="Como ler este painel" lead="Quem usa o painel, o que cada página responde, como ler o status e de onde vêm os números." />
      <section className="grid gap-3 md:grid-cols-3">
        {PERSONAS.map((item) => (
          <article key={item.title} className="rounded-lg border border-border p-4">
            <h2 className="text-sm font-medium">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
          </article>
        ))}
      </section>
      <section className="overflow-hidden rounded-lg border border-border">
        <h2 className="border-b border-border px-4 py-3 text-sm font-medium">O que cada página responde</h2>
        <ul>
          {PAGE_COPY.map((item) => (
            <li key={item.id} className="border-b border-border px-4 py-3 last:border-b-0">
              <Link to={item.to} className="text-sm font-medium underline">
                {item.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{item.question}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="overflow-hidden rounded-lg border border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">Como ler o status</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Os limites são parâmetros do painel, ajustáveis e documentados. Não são metas oficiais do IBGE nem uma classificação oficial.
          </p>
        </div>
        <ul>
          {KPI_RULES.map((rule) => (
            <li key={rule.id} className="grid gap-1 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[14rem_1fr]">
              <p className="text-sm font-medium">{metricById(rule.metricId)?.nome ?? rule.id}</p>
              <div className="text-sm">
                <p>{rule.thresholdsText}</p>
                <p className="mt-1 text-muted-foreground">{rule.action}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium">Fonte e limites</h2>
        <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
          <li>Projeções da População do IBGE, Revisão 2024, divulgada em 22/08/2024. Os números só mudam quando o IBGE publica uma nova revisão. As notícias da Agência IBGE são consultadas a cada 6 horas.</li>
          <li>Os valores até 2070 são projeções, não medições.</li>
          <li>O grupo 90 anos ou mais junta todas as idades acima.</li>
          <li>O saldo migratório é estimado.</li>
        </ul>
      </section>
      <section className="overflow-hidden rounded-lg border border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">Dicionário de métricas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Fonte comum: IBGE, Projeções da População, Revisão 2024.</p>
        </div>
        <dl>
          {rows.map((item) => (
            <div key={item.id} className="grid gap-1 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[16rem_1fr]">
              <dt className="text-sm font-medium">
                {item.nome}
                {item.sigla ? <span className="font-normal text-muted-foreground"> ({item.sigla})</span> : null}
              </dt>
              <dd className="text-sm text-muted-foreground">
                {item.definicao}
                {item.unidade ? ` Unidade: ${item.unidade}.` : ""}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
