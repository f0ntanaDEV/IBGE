import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { KPI_RULES, STATUS_LABEL } from "@/content/kpi-rules"
import { METRICAS } from "@/content/metricas"
import { PAGE_COPY, PERSONAS } from "@/content/pages"
import { useMetricCatalog } from "@/features/datasets/hooks"

export function AboutPage() {
  const metrics = useMetricCatalog()
  const rows = metrics.data?.length ? metrics.data : METRICAS
  return (
    <div className="page-stack">
      <PageHeader title="Como ler este painel" lead="Quem usa, o que cada página responde e como ler o status." />
      <section className="grid gap-3">
        <h2 className="text-base font-medium">Para quem é</h2>
        {PERSONAS.map((item) => (
          <p key={item.title}>
            <span className="font-medium">{item.title}.</span> {item.text}
          </p>
        ))}
      </section>
      <section>
        <h2 className="text-base font-medium">Perguntas que o painel responde</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 font-medium">Página</th>
              <th className="py-1 font-medium">Pergunta central</th>
            </tr>
          </thead>
          <tbody>
            {PAGE_COPY.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="py-2">
                  <Link to={item.to} className="underline">
                    {item.title}
                  </Link>
                </td>
                <td className="py-2">{item.question}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="grid gap-2">
        <h2 className="text-base font-medium">Como ler o status</h2>
        <p>Os limites são parâmetros do painel, ajustáveis e documentados. Não são metas oficiais do IBGE.</p>
        <ul className="grid gap-2 text-sm">
          {KPI_RULES.map((rule) => (
            <li key={rule.id}>
              <span className="font-medium">{rule.thresholdsText}</span> {STATUS_LABEL.good}, {STATUS_LABEL.warn} e {STATUS_LABEL.bad}. {rule.action}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-base font-medium">De onde vêm os dados e quando são atualizados</h2>
        <p className="mt-2 text-sm">
          Projeções da População do IBGE, Revisão 2024, divulgada em 22/08/2024. Os números não mudam todo dia: só quando o IBGE publica uma nova revisão. As notícias da Agência IBGE são consultadas a cada 6 horas.
        </p>
      </section>
      <section>
        <h2 className="text-base font-medium">Dicionário de métricas</h2>
        <ul className="mt-2 grid gap-3 text-sm">
          {rows.map((item) => (
            <li key={item.id}>
              <span className="font-medium">{item.nome}</span>
              {item.sigla ? ` (${item.sigla})` : ""}. {item.definicao} Unidade: {item.unidade || "índice"}. Fonte: {item.fonte}.
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-base font-medium">Limitações</h2>
        <p className="mt-2 text-sm">
          Os valores até 2070 são projeções, não medições. O grupo 90 anos ou mais junta todas as idades acima. O saldo migratório é estimado. O status dos indicadores é uma leitura do painel, não uma classificação oficial.
        </p>
      </section>
    </div>
  )
}
