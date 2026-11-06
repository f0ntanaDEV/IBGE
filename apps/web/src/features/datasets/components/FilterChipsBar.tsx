import { useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { formatAgeBand } from "@/lib/format"
import { useCrossFilter, type CrossSelection } from "@/stores/crossfilter"

function label(selection: CrossSelection) {
  const chips: { id: string; text: string; dim: "uf" | "regiao" | "faixa" | "ano" | "sexo" }[] = []
  for (const cod of selection.uf ?? []) chips.push({ id: `uf-${cod}`, text: `UF ${cod}`, dim: "uf" })
  for (const cod of selection.regiao ?? []) chips.push({ id: `regiao-${cod}`, text: `Região ${cod}`, dim: "regiao" })
  for (const faixa of selection.faixa ?? []) chips.push({ id: `faixa-${faixa}`, text: formatAgeBand(faixa), dim: "faixa" })
  if (selection.ano != null) chips.push({ id: "ano", text: String(selection.ano), dim: "ano" })
  if (selection.sexo) chips.push({ id: "sexo", text: selection.sexo === "H" ? "Homens" : "Mulheres", dim: "sexo" })
  return chips
}

export function FilterChipsBar() {
  const selection = useCrossFilter((state) => state.selection)
  const clear = useCrossFilter((state) => state.clear)
  const toggle = useCrossFilter((state) => state.toggle)
  const replace = useCrossFilter((state) => state.replace)
  const [params, setParams] = useSearchParams()
  const chips = label(selection)
  const ready = useRef(false)

  useEffect(() => {
    if (ready.current) return
    ready.current = true
    const fromUrl: CrossSelection = {}
    const uf = params.get("sel_uf")
    const faixa = params.get("sel_faixa")
    const ano = params.get("sel_ano")
    const sexo = params.get("sel_sexo")
    if (uf) fromUrl.uf = uf.split(",").map(Number)
    if (faixa) fromUrl.faixa = faixa.split(",")
    if (ano) fromUrl.ano = Number(ano)
    if (sexo === "H" || sexo === "M") fromUrl.sexo = sexo
    if (uf || faixa || ano || sexo) replace(fromUrl)
  }, [params, replace])

  useEffect(() => {
    if (!ready.current) return
    setParams(
      (current) => {
        const copy = new URLSearchParams(current)
        if (selection.uf?.length) copy.set("sel_uf", selection.uf.join(","))
        else copy.delete("sel_uf")
        if (selection.faixa?.length) copy.set("sel_faixa", selection.faixa.join(","))
        else copy.delete("sel_faixa")
        if (selection.ano != null) copy.set("sel_ano", String(selection.ano))
        else copy.delete("sel_ano")
        if (selection.sexo) copy.set("sel_sexo", selection.sexo)
        else copy.delete("sel_sexo")
        return copy
      },
      { replace: true },
    )
  }, [selection, setParams])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.querySelector("[role=dialog]")) clear()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [clear])

  function write(next: CrossSelection) {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current)
        if (next.uf?.length) copy.set("sel_uf", next.uf.join(","))
        else copy.delete("sel_uf")
        if (next.faixa?.length) copy.set("sel_faixa", next.faixa.join(","))
        else copy.delete("sel_faixa")
        if (next.ano != null) copy.set("sel_ano", String(next.ano))
        else copy.delete("sel_ano")
        if (next.sexo) copy.set("sel_sexo", next.sexo)
        else copy.delete("sel_sexo")
        return copy
      },
      { replace: true },
    )
  }

  if (!chips.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className="rounded-full border border-border px-2 py-1 text-xs"
          onClick={() => {
            if (chip.dim === "uf") toggle("uf", Number(chip.id.slice(3)), { multi: true, source: "chips" })
            else if (chip.dim === "faixa") toggle("faixa", chip.id.slice(6), { multi: true, source: "chips" })
            else clear(chip.dim)
          }}
        >
          {chip.text} ×
        </button>
      ))}
      <button
        type="button"
        className="text-xs underline"
        onClick={() => {
          clear()
          write({})
        }}
      >
        Limpar tudo
      </button>
    </div>
  )
}
