import { useMemo, useState } from "react"
import { datasetNav } from "@/app/navigation"
import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"
import { QualityBadge } from "@/components/common/QualityBadge"
import type { QualityReport } from "@/features/datasets/api"
import { useRuns } from "@/features/datasets/hooks"
import { formatBy } from "@/lib/format"

function unwrap(item: QualityReport & { report_json?: QualityReport | null; started_at?: string }) {
  if (item.report_json && typeof item.report_json === "object") {
    return { ...item.report_json, source: item.report_json.source ?? item.source }
  }
  return item
}

function latest(runs: QualityReport[] | undefined, source: string) {
  const raw = runs ?? []
  const matching = raw.map((item) => unwrap(item as QualityReport & { report_json?: QualityReport | null; started_at?: string })).filter((item) => (item.source ?? "original") === source)
  if (!matching.length) return undefined
  const fromMysql = raw.some((item) => "started_at" in item || "report_json" in item)
  return fromMysql ? matching[0] : matching[matching.length - 1]
}

function entries(record: Record<string, number> | undefined) {
  return Object.entries(record ?? {}).filter(([, value]) => value)
}

export function QualityPage() {
  const [datasetId, setDatasetId] = useState("ds1")
  const [source, setSource] = useState<"original" | "sujo">("original")
  const runs = useRuns(datasetId, source)
  const report = useMemo(() => latest(runs.data, source), [runs.data, source])
  const structural = new Set(Object.keys(report?.structural_nulls ?? {}))

  return (
    <div className="page-stack">
      <PageHeader title="Qualidade de dados" description="Compare a base original com a base de demonstração depois do tratamento." />
      <div className="flex flex-wrap gap-3">
        <label className="grid gap-1 text-sm">
          Dataset
          <select className="h-9 rounded-md border border-border bg-background px-2" value={datasetId} onChange={(event) => setDatasetId(event.target.value)}>
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
      {runs.isLoading ? <p className="text-sm text-muted-foreground">Carregando relatórios…</p> : null}
      {runs.isError ? <p role="alert" className="text-sm">Não foi possível ler o histórico.</p> : null}
      {!runs.isLoading && !report ? (
        <EmptyState title="Sem relatório" description={`Ainda não há execução da base ${source === "sujo" ? "de demonstração" : "original"} para este dataset.`} />
      ) : null}
      {report ? (
        <>
          <section className="dashboard-grid" aria-label="Antes e depois">
            <article data-card className="h-full min-h-[7rem] rounded-lg border border-border p-4 text-sm">
              <h2 className="font-medium">Linhas</h2>
              <p>
                {formatBy("integer", report.rows_before ?? 0)} antes · {formatBy("integer", report.rows_after ?? 0)} depois
              </p>
            </article>
            <article data-card className="h-full min-h-[7rem] rounded-lg border border-border p-4 text-sm">
              <h2 className="font-medium">Nulos estruturais</h2>
              <CountList items={entries(report.structural_nulls)} empty="Nenhum nulo estrutural." />
            </article>
            <article data-card className="h-full min-h-[7rem] rounded-lg border border-border p-4 text-sm">
              <h2 className="font-medium">Outros nulos depois do tratamento</h2>
              <CountList items={entries(report.nulls_after).filter(([key]) => !structural.has(key))} empty="Nenhum nulo restante." />
            </article>
            <article data-card className="h-full min-h-[7rem] rounded-lg border border-border p-4 text-sm">
              <h2 className="font-medium">Duplicatas removidas</h2>
              <CountList items={entries(report.duplicates_removed)} empty="Nenhuma duplicata removida." />
            </article>
          </section>
          <section className="rounded-lg border border-border p-4 text-sm" aria-label="Outliers">
            <h2 className="font-medium">Outliers por motivo</h2>
            {Object.keys(report.outliers ?? {}).length === 0 ? <p className="text-muted-foreground">Nenhum outlier registrado.</p> : null}
            {Object.entries(report.outliers ?? {}).map(([column, reasons]) => (
              <div key={column} className="mt-2">
                <p>{column}</p>
                <CountList items={Object.entries(reasons)} empty="Sem motivos." />
              </div>
            ))}
          </section>
          <section className="rounded-lg border border-border p-4" aria-label="Validações">
            <h2 className="text-sm font-medium">Validações de consistência</h2>
            <ul className="mt-2 grid gap-2">
              {(report.validations ?? []).map((item) => (
                <li key={item.rule} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>{item.rule}</span>
                  <span className="flex items-center gap-2">
                    <QualityBadge status={item.ok ? "consistent" : "relevant"} />
                    <span>{item.ok ? "ok" : "falha"}</span>
                    {item.max_diff != null ? <span className="text-muted-foreground">maior diferença {formatBy("decimal", item.max_diff)}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
      <section aria-label="Histórico de execuções">
        <h2 className="text-sm font-medium">Histórico</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2">Base</th>
                <th>Linhas finais</th>
                <th>Duração</th>
              </tr>
            </thead>
            <tbody>
              {(runs.data ?? []).map((item, index) => (
                <tr key={`${item.source}-${index}`} className="border-b border-border">
                  <td className="py-2">{item.source ?? "—"}</td>
                  <td>{formatBy("integer", item.rows_after ?? 0)}</td>
                  <td>{item.duration_s == null ? "—" : `${formatBy("decimal", item.duration_s)} s`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function CountList({ items, empty }: { items: [string, number][]; empty: string }) {
  if (!items.length) return <p className="text-muted-foreground">{empty}</p>
  return (
    <ul>
      {items.map(([key, value]) => (
        <li key={key}>
          {key}: {formatBy("integer", value)}
        </li>
      ))}
    </ul>
  )
}
