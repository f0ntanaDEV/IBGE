import { useState } from "react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ApiError, processDataset, uploadDataset, type QualityReport, type UploadResult } from "@/features/datasets/api"
import { queryClient } from "@/lib/queryClient"
import { formatBy } from "@/lib/format"

const STEPS = ["Upload", "Tratamento", "Validação", "Nova base", "MySQL"]

type UploadDialogProps = {
  datasetId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function missingColumns(error: unknown) {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== "object") return []
  const columns = (error.details as { missing_columns?: unknown }).missing_columns
  return Array.isArray(columns) ? columns.map(String) : []
}

export function UploadDialog({ datasetId, open, onOpenChange }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<UploadResult | null>(null)
  const [report, setReport] = useState<QualityReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(-1)
  const [failed, setFailed] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [strategy, setStrategy] = useState("flag")
  const [method, setMethod] = useState("iqr_delta")
  const [threshold, setThreshold] = useState("0.6")
  const [confirmOpen, setConfirmOpen] = useState(false)

  function reset() {
    setFile(null)
    setPreview(null)
    setReport(null)
    setError(null)
    setStep(-1)
    setFailed(null)
  }

  async function validateFile(next: File) {
    setFile(next)
    setError(null)
    setReport(null)
    setFailed(null)
    setBusy(true)
    try {
      const result = await uploadDataset(datasetId, next)
      setPreview(result)
      setStep(0)
    } catch (caught) {
      setPreview(null)
      setStep(0)
      setFailed(0)
      const columns = missingColumns(caught)
      setError(columns.length ? `Colunas obrigatórias ausentes: ${columns.join(", ")}` : caught instanceof Error ? caught.message : "Falha no upload")
    } finally {
      setBusy(false)
    }
  }

  async function run(confirm: boolean) {
    setConfirmOpen(false)
    setBusy(true)
    setError(null)
    setFailed(null)
    setStep(1)
    const thresholdValue = Number(threshold)
    try {
      const result = await processDataset(datasetId, {
        source: "upload",
        confirm,
        cleaning: {
          outlier_strategy: strategy,
          outlier_method: method,
          null_threshold: Number.isFinite(thresholdValue) ? thresholdValue : undefined,
        },
      })
      setReport(result)
      setStep(STEPS.length - 1)
      await queryClient.invalidateQueries({ queryKey: ["dataset", datasetId] })
      await queryClient.invalidateQueries({ queryKey: ["quality", datasetId] })
      await queryClient.invalidateQueries({ queryKey: ["datasets"] })
      toast.success("Base atualizada")
    } catch (caught) {
      setFailed(1)
      setError(caught instanceof Error ? caught.message : "Falha no processamento")
    } finally {
      setBusy(false)
    }
  }

  function requestProcess() {
    if (!preview) return
    if (strategy === "cap" || strategy === "remove") {
      setConfirmOpen(true)
      return
    }
    void run(false)
  }

  const headers = preview ? Object.keys(preview.preview[0] ?? {}).slice(0, 6) : []

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogTitle className="text-base font-medium">Enviar arquivo</DialogTitle>
        <DialogDescription className="mb-3 text-sm text-muted-foreground">Arquivo .csv ou .xlsx com as colunas obrigatórias do dataset.</DialogDescription>
          <ol className="flex flex-wrap gap-2 text-xs" aria-label="Etapas do processamento">
            {STEPS.map((label, index) => {
              const state = failed === index ? "falha" : index < step || (report && index <= step) ? "concluída" : index === step ? "atual" : "pendente"
              return (
                <li key={label} aria-current={index === step ? "step" : undefined}>
                  {label}: {state}
                </li>
              )
            })}
          </ol>
          <label className="grid gap-2 rounded-lg border border-dashed border-border p-4 text-sm">
            Solte o arquivo ou escolha do computador
            <input
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => {
                const next = event.target.files?.[0]
                if (next) void validateFile(next)
              }}
            />
          </label>
          {file ? <p className="text-xs text-muted-foreground">{file.name}</p> : null}
          {error ? (
            <p role="alert" className="text-sm">
              {error}
            </p>
          ) : null}
          {preview ? (
            <div className="overflow-x-auto">
              <p className="mb-2 text-sm">Prévia de {preview.preview.length} linhas</p>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {headers.map((header) => (
                      <th key={header} className="border-b border-border px-2 py-1 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, index) => (
                    <tr key={index}>
                      {headers.map((header) => (
                        <td key={header} className="px-2 py-1">
                          {String(row[header] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <details className="text-sm">
            <summary>Opções avançadas</summary>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <label className="grid gap-1">
                Método
                <select className="h-9 rounded-md border border-border bg-background px-2" value={method} onChange={(event) => setMethod(event.target.value)}>
                  <option value="iqr_delta">IQR da variação</option>
                </select>
              </label>
              <label className="grid gap-1">
                Estratégia de outliers
                <select className="h-9 rounded-md border border-border bg-background px-2" value={strategy} onChange={(event) => setStrategy(event.target.value)}>
                  <option value="flag">Sinalizar (flag)</option>
                  <option value="cap">Limitar (cap)</option>
                  <option value="remove">Remover</option>
                </select>
              </label>
              <label className="grid gap-1">
                Limite de nulos
                <input className="h-9 rounded-md border border-border bg-background px-2" value={threshold} onChange={(event) => setThreshold(event.target.value)} inputMode="decimal" />
              </label>
            </div>
          </details>
          {report ? (
            <div className="rounded-md border border-border p-3 text-sm">
              <p>
                Linhas: {formatBy("integer", report.rows_before ?? 0)} → {formatBy("integer", report.rows_after ?? 0)}
              </p>
              <ul>
                {(report.validations ?? []).map((item) => (
                  <li key={item.rule}>
                    {item.rule}: {item.ok ? "ok" : "falha"}
                    {item.max_diff != null ? ` (diferença ${formatBy("decimal", item.max_diff)})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={requestProcess} disabled={!preview || busy}>
              {busy ? "Processando" : "Processar"}
            </Button>
          </div>
      </DialogContent>
    </Dialog>
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogTitle className="text-base font-medium">Alterar valores publicados?</AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-muted-foreground">
          As estratégias cap e remove mudam ou descartam números da projeção. A opção padrão apenas sinaliza o outlier, sem alterar o valor.
        </AlertDialogDescription>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void run(true)}>Confirmar alteração</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
