import { PageHeader } from "@/components/common/PageHeader"
import { NOVIDADES } from "@/content/novidades"
import { formatDate } from "@/lib/format"

export function NovidadesPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Novidades"
        lead="O que mudou no painel, na data em que cada alteração foi registrada nas especificações."
      />
      {NOVIDADES.map((group) => (
        <section key={group.date} className="overflow-hidden rounded-lg border border-border">
          <h2 className="border-b border-border px-4 py-3 text-sm font-medium">
            <time dateTime={group.date}>{formatDate(group.date)}</time>
          </h2>
          <ul>
            {group.items.map((item) => (
              <li key={`${group.date}-${item.area}-${item.text}`} className="grid gap-1 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[9rem_1fr]">
                <p className="text-sm text-muted-foreground">{item.area}</p>
                <p className="text-sm">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
