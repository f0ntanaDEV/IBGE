import { useSearchParams } from "react-router-dom"
import { CountUp } from "@/motion/CountUp"
import { Reveal } from "@/motion/useMotion"
import { CharFade } from "@/motion/WordReveal"
import { formatValue } from "@/lib/format"
import type { Insight } from "@/lib/narratives/types"

export function NarrativeText({ insight }: { insight: Insight }) {
  const [, setParams] = useSearchParams()
  const parts = insight.text.split(/(\d[\d.\u00a0\u202f]*)/g)
  return (
    <p className="text-sm">
      {parts.map((part, index) =>
        /\d/.test(part) ? (
          <NarrativeNumber key={index} text={part} />
        ) : (
          <CharFade key={index} text={part} />
        ),
      )}
      {insight.highlight ? (
        <button
          type="button"
          className="ml-2 text-xs underline"
          onClick={() =>
            setParams(
              (current) => {
                const next = new URLSearchParams(current)
                next.set("destaque", String(insight.highlight?.x))
                return next
              },
              { replace: true },
            )
          }
        >
          mostrar no gráfico
        </button>
      ) : null}
    </p>
  )
}

function NarrativeNumber({ text }: { text: string }) {
  const value = Number(text.replace(/\./g, "").replace(",", "."))
  const plain = /^[\d.\s]+$/.test(text) && Number.isFinite(value)
  if (!plain) {
    return <strong className="font-medium">{text}</strong>
  }
  const kind = Number.isInteger(value) && value >= 1900 && value <= 2100 ? "year" : Number.isInteger(value) ? "count" : "raw"
  const metric = { key: "narrativa", kind } as const
  return (
    <strong className="font-medium tabular-nums">
      {kind === "year" ? formatValue(value, metric) : <CountUp value={value} metric={metric} />}
    </strong>
  )
}

export function ObservationsCard({ insights }: { insights: Insight[] }) {
  if (!insights.length) return null
  return (
    <Reveal>
    <section aria-label="Observações finais" className="rounded-lg border border-border p-4">
      <CharFade as="h2" className="text-base font-medium" text="Observações finais" />
      <div className="mt-2 grid gap-2">
        {insights.map((insight) => (
          <div key={`${insight.type}-${insight.text}`}>
            <NarrativeText insight={insight} />
          </div>
        ))}
      </div>
    </section>
    </Reveal>
  )
}
