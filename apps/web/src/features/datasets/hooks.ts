import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import {
  fetchCenso,
  fetchClaims,
  fetchData,
  fetchDatasetNews,
  fetchDatasets,
  fetchMetrics,
  fetchPyramid,
  fetchRuns,
  fetchSummary,
  fetchTerritories,
  type DataQuery,
} from "@/features/datasets/api"
import { calendarYear, clampYear } from "@/features/datasets/derive"
import { STALE_TIME } from "@/lib/queryClient"

export function useDashboardFilters() {
  const [params, setParams] = useSearchParams()
  const ano = clampYear(params.has("ano") ? Number(params.get("ano")) : calendarYear())
  const parsed = Number(params.get("cod") ?? "0")
  const sexo = params.get("sexo") ?? "Ambos"

  const setFilter = useCallback(
    (key: "ano" | "cod" | "sexo", value: string) => {
      const next = new URLSearchParams(params)
      next.set(key, value)
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  return {
    ano,
    cod: Number.isFinite(parsed) ? parsed : 0,
    sexo,
    setAno: (value: number) => setFilter("ano", String(clampYear(value))),
    setCod: (value: number) => setFilter("cod", String(value)),
    setSexo: (value: string) => setFilter("sexo", value),
  }
}

export function useTerritories() {
  return useQuery({ queryKey: ["territories"], queryFn: fetchTerritories, staleTime: STALE_TIME })
}

export function useDatasetList() {
  return useQuery({ queryKey: ["datasets"], queryFn: fetchDatasets, staleTime: STALE_TIME })
}

export function useMetrics(id: string) {
  return useQuery({
    queryKey: ["dataset", id, "metrics"],
    queryFn: () => fetchMetrics(id),
    staleTime: STALE_TIME,
    retry: false,
  })
}

export function useSummary(id: string, filters: { ano: number; cod: number; sexo?: string }) {
  return useQuery({
    queryKey: ["dataset", id, "summary", filters],
    queryFn: () => fetchSummary(id, filters),
    staleTime: STALE_TIME,
  })
}

export function usePyramid(id: string, cod: number, sexo: string, enabled: boolean) {
  return useQuery({
    queryKey: ["dataset", id, "pyramid", cod, sexo],
    queryFn: () => fetchPyramid(id, cod),
    staleTime: STALE_TIME,
    enabled,
  })
}

export function useClaims(id: string, enabled = true) {
  return useQuery({
    queryKey: ["dataset", id, "claims"],
    queryFn: () => fetchClaims(id),
    staleTime: STALE_TIME,
    enabled,
  })
}

export function useDatasetNews(id: string) {
  return useQuery({
    queryKey: ["dataset", id, "news"],
    queryFn: () => fetchDatasetNews(id),
    staleTime: STALE_TIME,
  })
}

export function useCenso(cod: number, enabled: boolean) {
  return useQuery({
    queryKey: ["censo", cod],
    queryFn: () => fetchCenso(cod),
    staleTime: STALE_TIME,
    enabled,
  })
}

export function useRows(id: string, query: DataQuery, enabled = true) {
  return useQuery({
    queryKey: ["dataset", id, "rows", query],
    queryFn: () => fetchData(id, { ...query, page: 1, pageSize: query.pageSize ?? 200 }),
    staleTime: STALE_TIME,
    enabled,
  })
}

export function useRuns(id: string, source: string) {
  return useQuery({
    queryKey: ["quality", id, source],
    queryFn: () => fetchRuns(id),
    staleTime: STALE_TIME,
    enabled: id.length > 0,
  })
}
