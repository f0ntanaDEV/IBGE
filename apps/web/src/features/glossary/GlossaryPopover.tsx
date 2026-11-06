import { CircleHelp } from "lucide-react"
import { type RefObject } from "react"
import { CardPopover } from "@/components/common/CardPopover"
import { glossaryByKey } from "@/features/glossary/glossary"

export function GlossaryPopover({ metricKey, cardRef }: { metricKey: string; cardRef: RefObject<HTMLElement | null> }) {
  const entry = glossaryByKey(metricKey)
  if (!entry) return null
  return (
    <CardPopover
      cardRef={cardRef}
      title={entry.rotuloTecnico}
      trigger={
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label={`O que significa: ${entry.rotuloTecnico}`}
        >
          <CircleHelp className="size-4" aria-hidden />
        </button>
      }
    >
      <p>{entry.explicacao}</p>
    </CardPopover>
  )
}
