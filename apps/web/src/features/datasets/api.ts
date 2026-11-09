const base = import.meta.env.VITE_API_URL ?? ""

export class ApiError extends Error {
  code: string
  status: number
  details: unknown

  constructor(message: string, code: string, status: number, details: unknown) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}

export type Territory = {
  cod: number
  sigla: string
  local: string
  nivel: string
  regiao_cod: number | null
}

export type MetricInfo = {
  coluna: string
  rotulo_original: string
  descricao: string
  unidade: string
}

export type NewsItem = {
  id?: string | number | null
  titulo?: string | null
  introducao?: string | null
  data_publicacao?: string | null
  link?: string | null
  editorias?: string | null
  imagem?: string | null
}

export type Claim = {
  id: string
  label: string
  value: number | string | null
  detail?: Record<string, unknown>
  available?: boolean
  news?: NewsItem[]
}

export type PyramidRow = {
  faixa: string | number
  homens: number
  mulheres: number
  ano?: number
  homens_compare?: number
  mulheres_compare?: number
}

export type DataPage = {
  page: number
  page_size: number
  total: number
  items: Record<string, unknown>[]
}

export type DatasetListItem = {
  id: string
  name: string
  table: string
  last_run: { source?: string; rows_in?: number; rows_out?: number; duration_s?: number } | null
}

export type CensoReference = {
  available: boolean
  projecao: number | null
  censo: number | null
  diff_pct: number | null
  nota: string
}

export type UploadResult = {
  dataset_id: string
  filename: string
  bytes: number
  columns: string[]
  preview: Record<string, unknown>[]
}

export type QualityReport = {
  dataset_id?: string
  source?: string
  rows_before?: number
  rows_after?: number
  nulls_before?: Record<string, number>
  nulls_after?: Record<string, number>
  structural_nulls?: Record<string, number>
  duplicates_removed?: Record<string, number>
  outliers?: Record<string, Record<string, number>>
  validations?: { rule: string; ok: boolean; max_diff?: number | null }[]
  duration_s?: number
  steps?: { step: string }[]
  strategies?: Record<string, unknown>
  rows_discarded?: number
  columns_dropped?: string[]
}

export type DataQuery = {
  page?: number
  pageSize?: number
  ano?: number
  cod?: number
  nivel?: string
  sexo?: string
  idade?: number
  sort?: string
  desc?: boolean
}

async function send<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base}${path}`, init)
  const body = (await response.json().catch(() => ({}))) as { error?: { message?: string; code?: string; details?: unknown } }
  if (!response.ok) {
    const error = body.error
    throw new ApiError(error?.message ?? "Falha na API", error?.code ?? "http_error", response.status, error?.details ?? {})
  }
  return body as T
}

function queryString(params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null) search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ""
}

export function fetchTerritories() {
  return send<Territory[]>("/api/v1/territories")
}

export function fetchDatasets() {
  return send<DatasetListItem[]>("/api/v1/datasets")
}

export function fetchMetrics(id: string) {
  return send<MetricInfo[]>(`/api/v1/datasets/${id}/metrics`)
}

export function fetchSummary(id: string, filters: { ano?: number; cod?: number; sexo?: string }) {
  return send<{ kpis: { id: string; label: string; value: number | null; unidade: string }[]; series: { ano: number; valor: number }[]; rankings: Record<string, unknown>[] }>(
    `/api/v1/datasets/${id}/summary${queryString(filters)}`,
  )
}

export function fetchPyramid(id: string, cod: number) {
  return send<PyramidRow[]>(`/api/v1/datasets/${id}/pyramid${queryString({ cod })}`)
}

export function fetchClaims(id: string) {
  return send<Claim[]>(`/api/v1/datasets/${id}/claims`)
}

export function fetchDatasetNews(id: string) {
  return send<{ available: boolean; items: NewsItem[] }>(`/api/v1/datasets/${id}/news`)
}

export function fetchCenso(cod: number) {
  return send<CensoReference>(`/api/v1/reference/censo-2022${queryString({ cod })}`)
}

export function fetchData(id: string, query: DataQuery) {
  return send<DataPage>(
    `/api/v1/datasets/${id}/data${queryString({
      page: query.page ?? 1,
      page_size: query.pageSize ?? 50,
      ano: query.ano,
      cod: query.cod,
      nivel: query.nivel,
      sexo: query.sexo,
      idade: query.idade,
      sort: query.sort,
      desc: query.desc ? true : undefined,
    })}`,
  )
}

export function fetchRuns(id: string) {
  return send<QualityReport[]>(`/api/v1/datasets/${id}/runs`)
}

export function uploadDataset(id: string, file: File) {
  const body = new FormData()
  body.append("file", file)
  return send<UploadResult>(`/api/v1/datasets/${id}/upload`, { method: "POST", body })
}

export function processDataset(
  id: string,
  payload: {
    source: string
    confirm: boolean
    cleaning?: { null_threshold?: number; outlier_method?: string; outlier_factor?: number; outlier_strategy?: string }
  },
) {
  return send<QualityReport>(`/api/v1/datasets/${id}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function downloadHref(id: string, format: "csv" | "xlsx") {
  return `${base}/api/v1/datasets/${id}/download?format=${format}`
}

export type MapItem = { cod: number; sigla: string; local: string; valor: number | null }
export type HeatCell = { idade: number; ano: number; valor: number }
export type ScatterItem = { ano: number; cod: number; sigla: string; local: string; e0: number; tft: number; populacao: number }
export type SlopeItem = { cod: number; sigla: string; local: string; valor_a: number | null; valor_b: number | null; delta: number | null }
export type Milestones = {
  cod: number
  pico: { ano: number | null; populacao: number | null }
  cruzamento_idosos_jovens: { ano: number | null }
  tft_abaixo_reposicao: { ano: number | null }
  nascimentos_abaixo_obitos: { ano: number | null }
  bonus: { ano_inicio: number | null; ano_fim: number | null; ponto_virada: number | null }
}

export function fetchMap(id: string, metric: string, ano: number) {
  return send<{ items: MapItem[] }>(`/api/v1/datasets/${id}/map${queryString({ metric, ano })}`)
}

export function fetchHeatmap(cod: number, sexo: string) {
  return send<{ cells: HeatCell[] }>(`/api/v1/datasets/ds1/heatmap${queryString({ cod, sexo })}`)
}

export function fetchScatter(anos?: string) {
  return send<{ items: ScatterItem[] }>(`/api/v1/datasets/ds4/scatter${queryString({ anos })}`)
}

export function fetchSlope(id: string, metric: string, anoA: number, anoB: number) {
  return send<{ items: SlopeItem[] }>(`/api/v1/datasets/${id}/slope${queryString({ metric, ano_a: anoA, ano_b: anoB })}`)
}

export type FactItem = {
  id: string
  label: string
  value: number | string
  kind: "count" | "percent" | "permil" | "years" | "rate" | "index" | "year" | "raw"
  detail?: string | null
  detail_values?: { ano: number; valor: number; kind: FactItem["kind"] }[] | null
  reference_year?: number | null
}

export function fetchFacts(page: string, cod: number) {
  return send<FactItem[]>(`/api/v1/facts${queryString({ page, cod })}`)
}

export type PublishedQuality = {
  dataset_id: string
  source: "original" | "sujo" | "upload"
  rows_in: number
  rows_out: number
  dropped_columns: string[]
  duration_s: number
  nulls: { by_column: Record<string, { before: number; after: number }>; structural: Record<string, number>; total_imputed: number }
  duplicates: { exact: number; by_key: number }
  outliers: { by_column: Record<string, number>; by_reason: Record<string, number>; strategy: string; method: string }
  validations: { rule: string; ok: boolean; max_diff: number }[]
}

export function fetchQualityReport(id: string, source: "original" | "sujo") {
  return send<PublishedQuality | null>(`/api/v1/datasets/${id}/quality-report${queryString({ source })}`)
}

export function fetchMilestones(cod: number) {
  return send<Milestones>(`/api/v1/milestones${queryString({ cod })}`)
}
