import { useQuery } from "@tanstack/react-query"
import { useCallback, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { useTerritory } from "@/hooks/useTerritory"
import {
  fetchCenso,
  fetchClaims,
  fetchData,
  fetchDatasetNews,
  fetchDatasets,
  fetchMetrics,
  fetchContext,
  fetchFacts,
  fetchPyramid,
  fetchQualityReport,
  fetchRuns,
  fetchSummary,
  fetchTerritories,
  type DataQuery,
} from "@/features/datasets/api"
import { calendarYear, clampYear } from "@/features/datasets/derive"
import { STALE_TIME } from "@/lib/queryClient"

export function useDashboardFilters() {
  const [params, setParams] = useSearchParams()
  const territory = useTerritory()
  const ano = clampYear(params.has("ano") ? Number(params.get("ano")) : calendarYear())
  const sexo = params.get("sexo") ?? "Ambos"

  const setFilter = useCallback(
    (key: "ano" | "sexo", value: string) => {
      const next = new URLSearchParams(params)
      next.set(key, value)
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  return {
    ano,
    cod: territory.cod,
    sexo,
    territories: territory.territories,
    setAno: (value: number) => setFilter("ano", String(clampYear(value))),
    setCod: territory.setCod,
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

const REGION = new Set([0, 1, 2, 3, 4, 5])

export function useLastValidFactsCod(cod: number) {
  const last = useRef(0)
  if (REGION.has(cod)) last.current = cod
  return last.current
}

export function useFacts(pageId: string) {
  const filters = useDashboardFilters()
  const factsCod = useLastValidFactsCod(filters.cod)
  const query = useQuery({
    queryKey: ["facts", pageId, factsCod],
    queryFn: () => fetchFacts(pageId, factsCod),
    staleTime: STALE_TIME,
  })
  return { ...query, factsCod, territoryCod: filters.cod }
}

export function useContext(pageId: string, filters: { ano: number; cod: number; sexo?: string }, enabled = true) {
  return useQuery({
    queryKey: ["context", pageId, filters.cod, filters.ano, filters.sexo ?? "T"],
    queryFn: () =>
      fetchContext(pageId, {
        cod: filters.cod,
        ano: filters.ano,
        sexo: filters.sexo === "Homens" ? "H" : filters.sexo === "Mulheres" ? "M" : "T",
      }),
    staleTime: STALE_TIME,
    enabled,
  })
}

export function useQualityReport(id: string, source: "original" | "sujo") {
  return useQuery({
    queryKey: ["quality-report", id, source],
    queryFn: () => fetchQualityReport(id, source),
    staleTime: STALE_TIME,
  })
}

export function useRuns(id: string, source: string) {
  return useQuery({
    queryKey: ["quality", id, source],
    queryFn: () => fetchRuns(id, source),
    staleTime: STALE_TIME,
    enabled: id.length > 0,
  })
}
