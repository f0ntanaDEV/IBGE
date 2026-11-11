import type { Territory } from "@/features/datasets/api"
import { YEAR_MAX, YEAR_MIN, calendarYear } from "@/features/datasets/derive"

const fieldClass = "h-9 w-full rounded-md border border-border bg-background px-2 text-sm"

type FilterBarProps = {
  territories: Territory[]
  filters: ("territorio" | "ano" | "sexo")[]
  cod: number
  ano: number
  sexo: string
  onCod: (cod: number) => void
  onAno: (ano: number) => void
  onSexo: (sexo: string) => void
}

export function FilterBar({ territories, filters, cod, ano, sexo, onCod, onAno, onSexo }: FilterBarProps) {
  const current = calendarYear()
  const years = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, index) => YEAR_MIN + index)
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {filters.includes("territorio") ? <TerritorySelect territories={territories} cod={cod} onCod={onCod} /> : null}
      {filters.includes("ano") ? (
        <label className="grid gap-1 text-sm">
          Ano
          <select className={fieldClass} value={ano} onChange={(event) => onAno(Number(event.target.value))}>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
                {year > current ? " (projetado)" : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {filters.includes("sexo") ? (
        <label className="grid gap-1 text-sm">
          Sexo
          <select className={fieldClass} value={sexo} onChange={(event) => onSexo(event.target.value)}>
            <option value="Ambos">Ambos</option>
            <option value="Homens">Homens</option>
            <option value="Mulheres">Mulheres</option>
          </select>
        </label>
      ) : null}
    </div>
  )
}

export function TerritorySelect({ territories, cod, onCod }: { territories: Territory[]; cod: number; onCod: (cod: number) => void }) {
  const brasil = territories.filter((item) => item.nivel === "brasil")
  const regions = territories.filter((item) => item.nivel === "regiao").sort((a, b) => a.cod - b.cod)
  const ufs = territories.filter((item) => item.nivel === "uf").sort((a, b) => a.local.localeCompare(b.local, "pt-BR"))
  return (
    <label className="grid gap-1 text-sm">
      Território
      <select className={fieldClass} value={String(cod)} onChange={(event) => onCod(Number(event.target.value))}>
        <optgroup label="Brasil">
          {brasil.map((item) => (
            <option key={item.cod} value={String(item.cod)}>
              {item.local}
            </option>
          ))}
        </optgroup>
        <optgroup label="Regiões">
          {regions.map((item) => (
            <option key={item.cod} value={String(item.cod)}>
              {item.local}
            </option>
          ))}
        </optgroup>
        <optgroup label="Unidades da Federação">
          {ufs.map((item) => (
            <option key={item.cod} value={String(item.cod)}>
              {item.local}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  )
}
