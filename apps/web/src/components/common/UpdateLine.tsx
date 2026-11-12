import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDateTime } from "@/lib/format"

export function UpdateLine({
  processedAt,
  latestRevision,
}: {
  processedAt?: string | null
  latestRevision?: string | null
}) {
  const age = processedAt ? Date.now() - new Date(processedAt).getTime() : 0
  const stale = Boolean(processedAt) && age > 30 * 24 * 60 * 60 * 1000
  const newer = Boolean(latestRevision && latestRevision !== "2024")
  return (
    <p className="flex flex-wrap items-center gap-1">
      <span>
        Dados: Projeções da População do IBGE, Revisão 2024 (divulgada em 22/08/2024) · Atualização: a cada nova revisão do IBGE · Processado em{" "}
        {processedAt ? `${formatDateTime(processedAt)} (horário de Brasília)` : "—"}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex size-5 items-center justify-center rounded-full border border-border text-[11px]" aria-label="Sobre a atualização dos dados">
            i
          </button>
        </TooltipTrigger>
        <TooltipContent>Projeções não mudam diariamente; os números só mudam quando o IBGE publica uma nova revisão.</TooltipContent>
      </Tooltip>
      {stale && newer ? <span className="rounded-md border border-border px-2 py-0.5 text-xs">Revisão nova disponível</span> : null}
    </p>
  )
}

export function NewsUpdateLine({ updatedAt }: { updatedAt?: string | null }) {
  const clock = updatedAt ? formatDateTime(updatedAt).split(" ").slice(-1)[0] : "—"
  return <p>Notícias atualizadas a cada 6 h · última atualização {clock}</p>
}
