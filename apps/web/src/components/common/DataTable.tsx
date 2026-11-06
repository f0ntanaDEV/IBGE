import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatBy } from "@/lib/format"
import { cn } from "@/lib/cn"

export type TableQuery = {
  page: number
  pageSize: number
  sort?: string
  desc: boolean
}

type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[]
  queryKey: readonly unknown[]
  fetcher: (params: TableQuery) => Promise<{ rows: T[]; total: number }>
  rowClassName?: (row: T) => string | undefined
}

function priorityClass(meta: unknown) {
  if (meta && typeof meta === "object" && "priority" in meta && meta.priority === "low") return "hidden md:table-cell"
  return undefined
}

export function DataTable<T>({ columns, queryKey, fetcher, rowClassName }: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])
  const sort = sorting[0]?.id
  const desc = Boolean(sorting[0]?.desc)

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  const query = useQuery({
    queryKey: [...queryKey, { page, pageSize, sort, desc }],
    queryFn: () => fetcher({ page, pageSize, sort, desc }),
    placeholderData: keepPreviousData,
  })

  const rows = query.data?.rows ?? []
  const total = query.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    manualPagination: true,
    manualSorting: true,
    pageCount,
    onSortingChange: (updater) => {
      setSorting(updater)
      setPage(1)
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="page-stack">
      {query.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : query.isError ? (
        <ErrorState message="Não foi possível carregar a tabela." onRetry={() => void query.refetch()} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border" role="region" aria-label="Tabela" tabIndex={0}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => {
                    const sorted = header.column.getIsSorted()
                    return (
                      <TableHead
                        key={header.id}
                        className={priorityClass(header.column.columnDef.meta)}
                        aria-sort={sorted === "desc" ? "descending" : sorted === "asc" ? "ascending" : "none"}
                      >
                        {header.column.getCanSort() ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <EmptyState title="Nenhum resultado" description="Não há registros para os filtros atuais." />
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className={rowClassName?.(row.original)} data-outlier={rowClassName?.(row.original) ? "true" : undefined}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cn(priorityClass(cell.column.columnDef.meta))}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">{formatBy("integer", total)} registros</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            Linhas
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-8 rounded-md border border-border bg-background px-2"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <Button variant="outline" size="sm" onClick={() => setPage((current) => current - 1)} disabled={page <= 1}>
            Página anterior
          </Button>
          <span>
            {page} de {pageCount}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={page >= pageCount}>
            Próxima página
          </Button>
        </div>
      </div>
    </div>
  )
}
