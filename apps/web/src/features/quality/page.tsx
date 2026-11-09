import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { datasetNav } from "@/app/navigation"
import { EmptyState } from "@/components/common/EmptyState"
import { FactsCard } from "@/features/facts/FactsCard"
import { PageHeader } from "@/components/common/PageHeader"
import { useFacts, useQualityReport } from "@/features/datasets/hooks"
import { processDataset } from "@/features/datasets/api"
import { formatValue } from "@/lib/format"
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

function TechnicalQuality() {
  const [datasetId, setDatasetId] = useState("ds1")
  const [source, setSource] = useState<"original" | "sujo">("original")
  const report = useQualityReport(datasetId, source)
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
  const body = report.data
  return (
    <div className="page-stack">
      <PageHeader title="Qualidade de dados" description="Linhas, nulos, duplicatas, outliers e validações de cada base." />
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
      {seeding || process.isPending ? <p className="text-sm">Processando bases…</p> : null}
      {report.isLoading ? <p className="text-sm text-muted-foreground">Carregando relatórios…</p> : null}
      {!report.isLoading && !body ? (
        <EmptyState
          title="Sem relatório"
          description="Ainda não há execução para esta base."
          action={
            <button type="button" className="text-sm underline" onClick={() => process.mutate()}>
              Processar bases agora
            </button>
          }
        />
      ) : null}
      {body ? (
        <section className="dashboard-grid" aria-label="Antes e depois">
          <article data-card className="rounded-lg border border-border p-4 text-sm">
            <h2 className="font-medium">Linhas</h2>
            <p>
              {formatValue(body.rows_in, { key: "linhas", kind: "count" })} antes · {formatValue(body.rows_out, { key: "linhas", kind: "count" })} depois
            </p>
          </article>
          <article data-card className="rounded-lg border border-border p-4 text-sm">
            <h2 className="font-medium">Nulos estruturais</h2>
            <p>{formatValue(Object.values(body.nulls.structural).reduce((sum, value) => sum + value, 0), { key: "nulos", kind: "count" })}</p>
          </article>
          <article data-card className="rounded-lg border border-border p-4 text-sm">
            <h2 className="font-medium">Duplicatas</h2>
            <p>
              {formatValue(body.duplicates.exact, { key: "dup", kind: "count" })} exatas · {formatValue(body.duplicates.by_key, { key: "dup", kind: "count" })} por chave
            </p>
          </article>
          <article data-card className="rounded-lg border border-border p-4 text-sm">
            <h2 className="font-medium">Outliers</h2>
            <p>{formatValue(Object.values(body.outliers.by_column).reduce((sum, value) => sum + value, 0), { key: "out", kind: "count" })}</p>
          </article>
        </section>
      ) : null}
      {body ? (
        <section className="rounded-lg border border-border p-4 text-sm" aria-label="Validações">
          <h2 className="font-medium">Validações</h2>
          <ul className="mt-2 grid gap-1">
            {body.validations.map((item) => (
              <li key={item.rule}>
                {item.ok ? "ok" : "falha"} · {item.rule}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <FactsCard facts={facts.data} factsCod={facts.factsCod} territoryCod={facts.territoryCod} loading={facts.isLoading} />
    </div>
  )
}
