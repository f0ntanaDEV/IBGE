import { STATUS_LABEL, type Status } from "@/content/kpi-rules"
import { EndFade } from "@/motion/CountUp"
import { Reveal } from "@/motion/useMotion"

export type ActionItem = { id: string; label: string; action: string; status: Status }

export function ActionStrip({ items }: { items: ActionItem[] }) {
  const ranked = [...items].filter((item) => item.status !== "good").sort((a, b) => (a.status === b.status ? 0 : a.status === "bad" ? -1 : 1))
  const shown = ranked.slice(0, 3)
  return (
    <Reveal fade={false}>
    <EndFade>
    <section aria-label="O que fazer" className="rounded-lg border border-border px-4 py-3 text-sm">
      <h2 className="font-medium">O que fazer</h2>
      {shown.length === 0 ? (
        <p className="mt-1 text-muted-foreground">Nenhum indicador pede ação neste território e ano.</p>
      ) : (
        <ul className="mt-2 grid gap-2">
          {shown.map((item) => (
            <li key={item.id} className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">{STATUS_LABEL[item.status]}.</span>
              <span>{item.action}</span>
              <button type="button" className="underline" onClick={() => document.querySelector<HTMLButtonElement>(`[data-kpi="${item.id}"] button`)?.click()}>
                Ver regra
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
    </EndFade>
    </Reveal>
  )
}
