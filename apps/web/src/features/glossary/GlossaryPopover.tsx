import { CircleHelp } from "lucide-react"
import { useRef, useState, type RefObject } from "react"
import { CardPopover } from "@/components/common/CardPopover"
import { ruleForMetric } from "@/content/kpi-rules"
import { metricById } from "@/content/metricas"
import { glossaryByKey } from "@/features/glossary/glossary"

export function GlossaryPopover({
  metricKey,
  cardRef,
  hover = false,
}: {
  metricKey: string
  cardRef: RefObject<HTMLElement | null>
  hover?: boolean
}) {
  const entry = glossaryByKey(metricKey)
  const metric = metricById(metricKey)
  const rule = ruleForMetric(metricKey)
  const title = metric?.nome ?? entry?.rotuloTecnico
  const [open, setOpen] = useState(false)
  const pointerInside = useRef(false)
  const show = () => {
    pointerInside.current = true
    setOpen(true)
  }
  const hide = () => {
    pointerInside.current = false
    setOpen(false)
  }
  if (!title) return null
  return (
    <CardPopover
      cardRef={cardRef}
      hover={hover}
      title={metric?.sigla ? `${title} (${metric.sigla})` : title}
      open={hover ? open : undefined}
      onOpenChange={hover ? (next) => {
        if (!next && pointerInside.current) return
        setOpen(next)
      } : undefined}
      trigger={
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label={`O que significa: ${title}`}
          onMouseEnter={hover ? show : undefined}
          onMouseLeave={hover ? hide : undefined}
          onFocus={hover ? show : undefined}
          onBlur={hover ? () => {
            if (!pointerInside.current) hide()
          } : undefined}
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
