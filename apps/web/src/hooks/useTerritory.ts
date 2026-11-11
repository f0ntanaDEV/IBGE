import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { fetchTerritories, type Territory } from "@/features/datasets/api"
import { TERRITORIES } from "@/features/datasets/territories"
import { useCrossFilter } from "@/stores/crossfilter"

const TERRITORIAL_DRILLS = new Set(["map", "ranking", "slope", "diverging", "scatter"])

export function useTerritory() {
  const [params, setParams] = useSearchParams()
  const loaded = useQuery({ queryKey: ["territories"], queryFn: fetchTerritories, staleTime: Infinity })
  const byCod = useMemo(() => {
    const map = new Map<number, Territory>()
    for (const item of TERRITORIES) map.set(item.cod, item)
    for (const item of loaded.data ?? []) {
      const cod = Number(item.cod)
      if (!Number.isInteger(cod)) continue
      const previous = map.get(cod)
      map.set(cod, { ...item, cod, nivel: previous?.nivel ?? item.nivel, local: item.local || previous?.local || "" })
    }
    return map
  }, [loaded.data])
  const raw = params.get("cod")
  const parsed = raw === null ? 0 : Number(raw)
  const valid = Number.isInteger(parsed) && byCod.has(parsed)
  const cod = valid ? parsed : 0
  const warned = useRef<string | null>(null)

  const setCod = useCallback(
    (next: number) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current)
          updated.set("cod", String(next))
          updated.delete("sel_uf")
          updated.delete("sel_regiao")
          for (const key of [...updated.keys()]) {
            if (key.startsWith("d_") && TERRITORIAL_DRILLS.has(key.slice(2))) updated.delete(key)
          }
          return updated
        },
        { replace: false },
      )
      useCrossFilter.getState().clear()
    },
    [setParams],
  )

  useEffect(() => {
    if (raw !== null && !valid && warned.current !== raw) {
      warned.current = raw
      toast("Território inválido, exibindo Brasil")
      setCod(0)
    }
  }, [raw, setCod, valid])

  return {
    cod,
    territory: byCod.get(cod) ?? TERRITORIES[0],
    setCod,
    territories: [...byCod.values()],
  }
}
