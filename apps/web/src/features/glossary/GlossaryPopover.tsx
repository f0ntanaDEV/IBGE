import { CircleHelp } from "lucide-react"
import { type RefObject } from "react"
import { CardPopover } from "@/components/common/CardPopover"
import { ruleForMetric } from "@/content/kpi-rules"
import { metricById } from "@/content/metricas"
import { glossaryByKey } from "@/features/glossary/glossary"

export function GlossaryPopover({ metricKey, cardRef }: { metricKey: string; cardRef: RefObject<HTMLElement | null> }) {
  const entry = glossaryByKey(metricKey)
  const metric = metricById(metricKey)
  const rule = ruleForMetric(metricKey)
  const title = metric?.nome ?? entry?.rotuloTecnico
  if (!title) return null
  return (
    <CardPopover
      cardRef={cardRef}
      title={metric?.sigla ? `${title} (${metric.sigla})` : title}
      trigger={
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label={`O que significa: ${title}`}
        >
          <CircleHelp className="size-4" aria-hidden />
        </button>
      }
    >
      <p>{metric?.definicao ?? entry?.explicacao}</p>
      {rule ? <p className="mt-2">Status: {rule.thresholdsText} Estes limites são parâmetros do painel, não metas oficiais.</p> : null}
      {rule ? <p className="mt-2">O que fazer: {rule.action}</p> : null}
    </CardPopover>
  )
}
