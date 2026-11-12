import { useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useLocation, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { datasetNav } from "@/app/navigation"
import { EmptyState } from "@/components/common/EmptyState"
import { FactsCard } from "@/features/facts/FactsCard"
import { PageHeader } from "@/components/common/PageHeader"
import { UpdateLine } from "@/components/common/UpdateLine"
import { pageCopy } from "@/content/pages"
import { CountUp } from "@/motion/CountUp"
import { CharFade } from "@/motion/WordReveal"
import { Reveal } from "@/motion/useMotion"
import { formatDateTime } from "@/lib/format"
import { useFacts, useQualityReport, useRuns } from "@/features/datasets/hooks"
import { processDataset, type PublishedQuality } from "@/features/datasets/api"
import { chartId, focusChart } from "@/lib/chartId"
import { queryClient } from "@/lib/queryClient"
import { fetchHealth } from "@/lib/api"
import { useMode } from "@/stores/preferences"
import { SimplePage } from "@/features/simple/SimplePage"

export function QualityPage() {
  const mode = useMode()
  if (mode === "simple") return <SimpleQuality />
  return <TechnicalQuality />
}

function SimpleQuality() {
  return <SimplePage pageId="quality" />
}

function sum(values: Record<string, number> | undefined) {
  return Object.values(values ?? {}).reduce((total, value) => total + value, 0)
}

type CompareRow = { label: string; inserted: number; detected: number; fixed: number; loose: boolean }

function compareRows(report: PublishedQuality): CompareRow[] {
  const manifest = report.manifest
  return [
    { label: "Nulos", inserted: sum(manifest?.nulls_injected), detected: report.nulls.total_imputed, fixed: report.nulls.total_imputed, loose: false },
    { label: "Duplicatas exatas", inserted: manifest?.exact_duplicates ?? 0, detected: report.duplicates.exact, fixed: report.duplicates.exact, loose: false },
    { label: "Duplicatas por chave", inserted: manifest?.key_duplicates ?? 0, detected: report.duplicates.by_key, fixed: report.duplicates.by_key, loose: false },
    { label: "Outliers", inserted: sum(manifest?.outliers.columns), detected: sum(report.outliers.by_column), fixed: sum(report.outliers.by_column), loose: true },
    { label: "Espaços extras", inserted: manifest?.whitespace_cells ?? 0, detected: report.whitespace_cells ?? 0, fixed: report.whitespace_cells ?? 0, loose: false },
    { label: "Ids recuperáveis", inserted: manifest?.recoverable_ids ?? 0, detected: report.ids_recovered ?? 0, fixed: report.ids_recovered ?? 0, loose: false },
  ]
}

function seal(row: CompareRow) {
  if (row.loose) return row.inserted === 0 ? (row.detected === 0 ? "ok" : "atenção") : row.detected >= row.inserted * 0.9 ? "ok" : "atenção"
  return row.detected === row.inserted ? "ok" : "atenção"
}

function TechnicalQuality() {
  const [params, setParams] = useSearchParams()
  const source = params.get("source") === "sujo" ? "sujo" : "original"
  const datasetId = params.get("dataset") || "ds1"
  const original = useQualityReport(datasetId, "original")
  const dirty = useQualityReport(datasetId, "sujo")
  const report = source === "sujo" ? dirty : original
  const runs = useRuns(datasetId, source)
  const facts = useFacts("quality")
  const health = useQuery({ queryKey: ["health"], queryFn: fetchHealth })
  const seeding = Boolean((health.data as { seeding?: boolean } | undefined)?.seeding)
  const process = useMutation({
    mutationFn: () => processDataset(datasetId, { source, confirm: true }),
    onSuccess: async () => {
      toast.success("Processamento concluído")
      await queryClient.invalidateQueries({ queryKey: ["quality-report", datasetId] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash.startsWith("#chart-")) return
    focusChart(decodeURIComponent(hash.slice("#chart-".length)))
  }, [hash])

  function setSource(next: "original" | "sujo") {
    const updated = new URLSearchParams(params)
    if (next === "sujo") updated.set("source", "sujo")
    else updated.delete("source")
    setParams(updated, { replace: true })
  }

  function setDataset(next: string) {
    const updated = new URLSearchParams(params)
    updated.set("dataset", next)
    setParams(updated, { replace: true })
  }

  const body = report.data
  const rows = body?.manifest ? compareRows(body) : []
  const title = source === "sujo" ? "Qualidade de dados · Base de demonstração" : "Qualidade de dados"
  return (
    <div className="page-stack">
      <PageHeader title={title} lead={pageCopy("quality")?.question} audience={pageCopy("quality")?.audience} meta={<UpdateLine processedAt={body?.finished_at} />} />
      <div className="flex flex-wrap gap-3">
        <label className="grid gap-1 text-sm">
          Dataset
          <select className="h-9 rounded-md border border-border bg-background px-2" value={datasetId} onChange={(event) => setDataset(event.target.value)}>
            {datasetNav.map((item) => (
              <option key={item.to} value={item.to.split("/").pop()}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2" role="group" aria-label="Base">
          <button type="button" className="h-9 rounded-md border border-border px-3 text-sm" aria-pressed={source === "original"} onClick={() => setSource("original")}>
            Base original
          </button>
          <button type="button" className="h-9 rounded-md border border-border px-3 text-sm" aria-pressed={source === "sujo"} onClick={() => setSource("sujo")}>
            Base de demonstração (suja)
          </button>
        </div>
      </div>
      {seeding || process.isPending ? <p className="text-sm">Processando bases…</p> : null}
      {report.isLoading ? <p className="text-sm text-muted-foreground">Carregando relatórios…</p> : null}
      {!report.isLoading && !body ? (
        <EmptyState
          title="Sem relatório"
          description="Ainda não há execução para esta base."
          action={
            <button type="button" className="text-sm underline" onClick={() => process.mutate()}>
              {source === "sujo" ? "Processar base de demonstração" : "Processar bases agora"}
            </button>
          }
        />
      ) : null}
      {body ? (
        <section className="dashboard-grid" aria-label="Indicadores da fonte">
          <Metric label="Linhas antes" value={body.rows_in} />
          <Metric label="Linhas depois" value={body.rows_out} />
          <Metric label="Nulos imputados" value={body.nulls.total_imputed} />
          <Metric label="Duplicatas removidas" value={body.duplicates.exact + body.duplicates.by_key} />
        </section>
      ) : null}
      <div className="chart-board">
        <section data-chart-id={chartId("Original × Demonstração")} tabIndex={-1} className="span-8 rounded-lg border border-border p-4 text-sm">
          <h2 className="font-medium">Base original × Base de demonstração</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <SourceColumn title="Base original" report={original.data} />
            <SourceColumn title="Base de demonstração" report={dirty.data} />
          </div>
        </section>
        <section data-chart-id={chartId("Validações")} tabIndex={-1} className="span-4 rounded-lg border border-border p-4 text-sm">
          <h2 className="font-medium">Validações</h2>
          <p className="mt-2">{body?.validation_summary?.text ?? "Sem validações"}</p>
          <ul className="mt-2 grid gap-1">
            {(body?.validations ?? []).map((item) => (
              <li key={item.rule}>
                {item.ok ? "ok" : "falha"} · {item.rule}
                {item.motivo ? ` · ${item.motivo}` : ""}
              </li>
            ))}
          </ul>
        </section>
        {source === "sujo" && rows.length ? (
          <section data-chart-id={chartId("Inserido · Detectado · Corrigido")} tabIndex={-1} className="span-12 rounded-lg border border-border p-4 text-sm">
            <h2 className="font-medium">Inserido · Detectado · Corrigido</h2>
            <table className="mt-3 w-full text-left">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="py-1 font-medium">Problema</th>
                  <th className="py-1 font-medium">Inserido</th>
                  <th className="py-1 font-medium">Detectado</th>
                  <th className="py-1 font-medium">Corrigido/Sinalizado</th>
                  <th className="py-1 font-medium">Selo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const status = seal(row)
                  return (
                    <tr key={row.label} className="border-t border-border">
                      <td className="py-2">{row.label}</td>
                      <td className="tabular-nums"><Stat value={row.inserted} name={`${row.label}-in`} /></td>
                      <td className="tabular-nums"><Stat value={row.detected} name={`${row.label}-det`} /></td>
                      <td className="tabular-nums"><Stat value={row.fixed} name={`${row.label}-fix`} /></td>
                      <td>
                        <span data-seal={status}>
                          {status === "ok" ? "ok" : "atenção"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        ) : null}
        <section data-chart-id={chartId("Nulos por coluna")} tabIndex={-1} className="span-6 rounded-lg border border-border p-4 text-sm">
          <h2 className="font-medium">Nulos por coluna</h2>
          <ul className="mt-2 grid max-h-64 gap-1 overflow-y-auto">
            {Object.entries(body?.nulls.by_column ?? {}).map(([column, counts]) => (
              <li key={column}>
                {column}: <Stat value={counts.before} name={`${column}-antes`} /> antes · <Stat value={counts.after} name={`${column}-depois`} /> depois
              </li>
            ))}
          </ul>
        </section>
        <section data-chart-id={chartId("Histórico de execuções")} tabIndex={-1} className="span-6 rounded-lg border border-border p-4 text-sm">
          <h2 className="font-medium">Histórico de execuções</h2>
          <ul className="mt-2 grid gap-1">
            {(runs.data ?? []).slice(0, 6).map((item, index) => (
              <li key={`${item.source ?? source}-${index}`}>
                {item.finished_at ? formatDateTime(item.finished_at) : "—"} · {item.source ?? source} · {item.status ?? "success"} ·{" "}
                {item.rows_out ? <Stat value={item.rows_out} name={`linhas-${index}`} /> : "—"} linhas
              </li>
            ))}
          </ul>
        </section>
      </div>
      <FactsCard facts={facts.data} factsCod={facts.factsCod} territoryCod={facts.territoryCod} loading={facts.isLoading} />
    </div>
  )
}

function Stat({ value, name }: { value: number; name: string }) {
  return <CountUp value={value} metric={{ key: name, kind: "count" }} />
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Reveal>
      <article data-card className="rounded-lg border border-border p-4 text-sm">
        <CharFade as="h2" className="font-medium" text={label} />
        <p>
          <CountUp value={value} metric={{ key: label, kind: "count" }} />
        </p>
      </article>
    </Reveal>
  )
}

function SourceColumn({ title, report }: { title: string; report?: PublishedQuality | null }) {
  if (!report) return <p className="text-muted-foreground">{title}: execução ainda não registrada.</p>
  return (
    <div>
      <h3 className="font-medium">{title}</h3>
      <p>Linhas: <Stat value={report.rows_in} name={`${title}-in`} /> → <Stat value={report.rows_out} name={`${title}-out`} /></p>
      <p>Nulos imputados: <Stat value={report.nulls.total_imputed} name={`${title}-nulos`} /></p>
      <p>
        Duplicatas: <Stat value={report.duplicates.exact} name={`${title}-exatas`} /> exatas · <Stat value={report.duplicates.by_key} name={`${title}-chave`} /> por chave
      </p>
      <p>Outliers: <Stat value={sum(report.outliers.by_column)} name={`${title}-outliers`} /></p>
    </div>
  )
}
