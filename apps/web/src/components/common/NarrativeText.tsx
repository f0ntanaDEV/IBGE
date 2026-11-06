import { useSearchParams } from "react-router-dom"
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
          <span key={index}>{part}</span>
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
  return (
    <strong className="font-medium tabular-nums">
      {formatValue(value, { key: "narrativa", kind: Number.isInteger(value) ? "count" : "raw" })}
    </strong>
  )
}

export function ObservationsCard({ insights }: { insights: Insight[] }) {
  if (!insights.length) return null
  return (
    <section aria-label="Observações finais" className="rounded-lg border border-border p-4">
      <h2 className="text-base font-medium">Observações finais</h2>
      <div className="mt-2 grid gap-2">
        {insights.map((insight) => (
          <div key={`${insight.type}-${insight.text}`}>
            <NarrativeText insight={insight} />
          </div>
        ))}
      </div>
    </section>
  )
}
