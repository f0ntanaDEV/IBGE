import { create } from "zustand"

export type CrossSelection = {
  faixa?: string[]
}

type CrossState = {
  selection: CrossSelection
  sourceChartId?: string
  hover?: { ano?: number }
  toggle: (value: string, opts: { multi: boolean; source: string }) => void
  clear: () => void
  setHover: (ano?: number) => void
  replace: (selection: CrossSelection, sourceChartId?: string) => void
}

export const useCrossFilter = create<CrossState>((set) => ({
  selection: {},
  toggle(value, opts) {
    set((state) => {
      const current = state.selection.faixa ?? []
      const next = current.includes(value) ? current.filter((item) => item !== value) : opts.multi ? [...current, value] : [value]
      return { selection: { faixa: next.length ? next : undefined }, sourceChartId: opts.source }
    })
  },
  clear() {
    set({ selection: {}, sourceChartId: undefined })
  },
  setHover(ano) {
    set({ hover: ano == null ? undefined : { ano } })
  },
  replace(selection, sourceChartId) {
    set({ selection, sourceChartId })
  },
}))

/** Território, ano e sexo vêm só da URL. A seleção cruzada guarda a faixa etária. */
export function useEffectiveFilters(filters: { ano: number; cod: number; sexo: string }) {
  const selection = useCrossFilter((state) => state.selection)
  return { ano: filters.ano, cod: filters.cod, sexo: filters.sexo, selection }
}
