import { useEffect } from "react"
import { calendarYear } from "@/features/datasets/derive"
import { useDashboardFilters } from "@/features/datasets/hooks"
import { formatAgeBand } from "@/lib/format"
import { useCrossFilter } from "@/stores/crossfilter"

type FilterKey = "territorio" | "ano" | "sexo"

function note(text: string, applies: boolean) {
  return applies ? text : `${text} · não se aplica nesta página`
}

export function FilterChipsBar({ applies }: { applies: FilterKey[] }) {
  const filters = useDashboardFilters()
  const selection = useCrossFilter((state) => state.selection)
  const clear = useCrossFilter((state) => state.clear)
  const toggle = useCrossFilter((state) => state.toggle)
  const place = filters.territories.find((item) => item.cod === filters.cod)
  const chips: { id: string; text: string; clear: () => void }[] = []
  if (filters.cod !== 0 && place) {
    const name = place.nivel === "regiao" ? `Região ${place.local}` : place.nivel === "uf" ? `${place.local} (${place.sigla})` : place.local
    chips.push({ id: "territorio", text: note(name, applies.includes("territorio")), clear: () => filters.setCod(0) })
  }
  if (filters.ano !== calendarYear()) {
    chips.push({ id: "ano", text: note(String(filters.ano), applies.includes("ano")), clear: () => filters.setAno(calendarYear()) })
  }
  if (filters.sexo !== "Ambos") {
    chips.push({ id: "sexo", text: note(filters.sexo, applies.includes("sexo")), clear: () => filters.setSexo("Ambos") })
  }
  for (const faixa of selection.faixa ?? []) {
    chips.push({ id: `faixa-${faixa}`, text: formatAgeBand(faixa), clear: () => toggle(faixa, { multi: true, source: "chips" }) })
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.querySelector("[role=dialog]")) clear()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [clear])

  if (!chips.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
      {chips.map((chip) => (
        <button key={chip.id} type="button" className="rounded-full border border-border px-2 py-1 text-xs" onClick={chip.clear}>
          {chip.text} ×
        </button>
      ))}
      <button
        type="button"
        className="text-xs underline"
        onClick={() => {
          filters.resetFilters()
          clear()
        }}
      >
        Limpar tudo
      </button>
    </div>
  )
}
