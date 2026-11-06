export type CrossSelection = { uf?: number[]; regiao?: number[]; faixa?: string[]; ano?: number; sexo?: "H" | "M" }

export type SeriesMeta = { key: string; label: string }

export type NarrativeContext = {
  datasetId: string
  chartId?: string
  territorio: { cod: number; nome: string; nivel: string }
  ano: number
  sexo: string
  selection: CrossSelection
  zoom?: [number, number]
  series?: SeriesMeta[]
  seriesKey?: string
  narrativePriority?: string[]
  data: NarrativeData
  brasil?: unknown
}

export type SeriesPoint = { ano: number; valor: number }

export type NarrativeData = {
  series?: SeriesPoint[]
  seriesB?: SeriesPoint[]
  rank?: { cod: number; valor: number }[]
  brazilValue?: number
  change?: { anoA: number; anoB: number; delta: number }
  threshold?: { value: number; limiar: number; since: number | null }
  sex?: { h: number; m: number }
  projectionFrom?: number
}

export type Insight = {
  type: string
  relevance: number
  text: string
  highlight?: { chartId: string; x: number | string }
}
