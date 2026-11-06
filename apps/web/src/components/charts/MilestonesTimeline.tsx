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
  return (
    <ol aria-label={summary} className="flex flex-col gap-4 border-l border-border pl-4">
      {visible.map((item) => (
        <li key={item.id}>
          <button type="button" className="text-left" onClick={() => onSelectYear?.(item.ano)}>
            <span className="block text-sm tabular-nums text-muted-foreground">{item.ano}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}
