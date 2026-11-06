import { create } from "zustand"

export type CrossSelection = {
  uf?: number[]
  regiao?: number[]
  faixa?: string[]
  ano?: number
  sexo?: "H" | "M"
}

type Dimension = keyof CrossSelection

type CrossState = {
  selection: CrossSelection
  sourceChartId?: string
  hover?: { ano?: number }
  toggle: (dim: Dimension, value: number | string, opts: { multi: boolean; source: string }) => void
  clear: (dim?: Dimension) => void
  setHover: (ano?: number) => void
  replace: (selection: CrossSelection, sourceChartId?: string) => void
}

export const useCrossFilter = create<CrossState>((set) => ({
  selection: {},
  toggle(dim, value, opts) {
    set((state) => {
      const selection = { ...state.selection }
      if (dim === "ano") {
        selection.ano = selection.ano === value ? undefined : Number(value)
      } else if (dim === "sexo") {
        const sexo = value === "H" || value === "M" ? value : undefined
        selection.sexo = selection.sexo === sexo ? undefined : sexo
      } else if (dim === "faixa") {
        const current = selection.faixa ?? []
        const text = String(value)
        const next = current.includes(text) ? current.filter((item) => item !== text) : opts.multi ? [...current, text] : [text]
        selection.faixa = next.length ? next : undefined
      } else {
        const current = selection[dim] ?? []
        const code = Number(value)
        const next = current.includes(code) ? current.filter((item) => item !== code) : opts.multi ? [...current, code] : [code]
        selection[dim] = next.length ? next : undefined
      }
      return { selection, sourceChartId: opts.source }
    })
  },
  clear(dim) {
    set((state) => {
      if (!dim) return { selection: {}, sourceChartId: undefined }
      const selection = { ...state.selection, [dim]: undefined }
      return { selection }
    })
  },
  setHover(ano) {
    set({ hover: ano == null ? undefined : { ano } })
  },
  replace(selection, sourceChartId) {
    set({ selection, sourceChartId })
  },
}))

export function useEffectiveFilters(filters: { ano: number; cod: number; sexo: string }) {
  const selection = useCrossFilter((state) => state.selection)
  const uf = selection.uf?.[0]
  return {
    ano: selection.ano ?? filters.ano,
    cod: uf ?? filters.cod,
    sexo: selection.sexo === "H" ? "Homens" : selection.sexo === "M" ? "Mulheres" : filters.sexo,
    selection,
  }
}
