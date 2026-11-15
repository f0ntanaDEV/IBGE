import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/common/DataTable"
import { fetchData } from "@/features/datasets/api"
import { formatBy } from "@/lib/format"
import { usePageReady } from "@/motion/usePageReady"

const COLUMNS = [
  ["ano", "Ano"],
  ["idade", "Idade"],
  ["sexo", "Sexo"],
  ["local", "Local"],
  ["sigla", "Sigla"],
  ["populacao", "População"],
] as const

export function DatabricksPage() {
  usePageReady(true)
  const columns = useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(
    () =>
      COLUMNS.map(([key, header]) => ({
        id: key,
        accessorFn: (row) => row[key],
        header,
        cell: (context) => {
          const value = context.getValue()
          if (key === "populacao" && typeof value === "number") return formatBy("integer", value, "populacao")
          return value == null ? "" : String(value)
        },
      })),
    [],
  )
  return (
    <DataTable
      columns={columns}
      queryKey={["databricks", "ds1"]}
      fetcher={async (params) => {
        const page = await fetchData("ds1", {
          page: params.page,
          pageSize: params.pageSize,
          sort: params.sort,
          desc: params.desc,
        })
        return { rows: page.items, total: page.total }
      }}
    />
  )
}
