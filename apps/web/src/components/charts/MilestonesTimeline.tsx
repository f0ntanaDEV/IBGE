import { useState } from "react"
import { HeldTip, TipList } from "@/components/ui/chart"
import { calendarYear } from "@/features/datasets/derive"

export type Milestone = { id: string; ano: number | null; label: string }

export function MilestonesTimeline({
  items,
  summary,
  onSelectYear,
}: {
  items: Milestone[]
  summary: string
  onSelectYear?: (ano: number) => void
}) {
  const visible = items.filter((item): item is Milestone & { ano: number } => item.ano != null).sort((a, b) => a.ano - b.ano)
  const [tip, setTip] = useState<{ label: string; ano: number; x: number; y: number } | null>(null)
  return (
    <ol aria-label={summary} className="flex flex-col gap-4 border-l border-border pl-4">
      {visible.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className="text-left"
            onClick={() => onSelectYear?.(item.ano)}
            onPointerMove={(event) => setTip({ label: item.label, ano: item.ano, x: event.clientX, y: event.clientY })}
            onPointerLeave={() => setTip(null)}
          >
            <span className="block text-sm tabular-nums text-muted-foreground">{item.ano}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        </li>
      ))}
      <HeldTip open={tip != null} x={tip?.x ?? 0} y={tip?.y ?? 0} title={tip ? String(tip.ano) : undefined}>
        {tip ? <TipList rows={[{ key: "marco", label: tip.label, value: String(tip.ano), suffix: tip.ano > calendarYear() ? " (projeção)" : "" }]} /> : null}
      </HeldTip>
    </ol>
  )
}
