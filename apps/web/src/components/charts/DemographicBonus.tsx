import { StatText } from "@/components/common/StatText"
import { ProjectionLine, type LinePoint } from "@/features/datasets/components/ProjectionLine"
import { bonusStatText } from "@/features/datasets/statisticalCopy"

type Series = { key: string; label: string; format: "decimal" | "number" | "years" }

export function DemographicBonus({
  data,
  series,
  window,
  turning,
  summary,
}: {
  data: LinePoint[]
  series: Series[]
  window: { x1: number; x2: number } | null
  turning: number | null
  summary: string
}) {
  const text = bonusStatText(data, window, turning)
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="min-h-0 flex-1">
        <ProjectionLine data={data} series={series} variant="line" summary={summary} band={window ?? undefined} markYear={turning ?? undefined} />
      </div>
      <StatText text={text} />
    </div>
  )
}
