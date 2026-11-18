import { ProjectionLine, type LinePoint } from "@/features/datasets/components/ProjectionLine"
import { zonesFor } from "@/lib/zones"

type Series = { key: string; label: string; format: "decimal" | "number" | "years" }

export function DemographicBonus({
  data,
  series,
  turning,
  summary,
}: {
  data: LinePoint[]
  series: Series[]
  turning: number | null
  summary: string
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <p className="text-sm text-muted-foreground">A razão de dependência mede 0–14 e 65+ para cada 100 pessoas de 15–64.</p>
      <div className="min-h-0 flex-1">
        <ProjectionLine data={data} series={series} variant="line" summary={summary} markYear={turning ?? undefined} zones={zonesFor("rdt65")} />
      </div>
    </div>
  )
}
