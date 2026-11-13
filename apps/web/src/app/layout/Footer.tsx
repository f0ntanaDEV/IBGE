import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight } from "lucide-react"
import { fetchHealth, type HealthStatus } from "@/lib/api"

function mysqlLabel(health: HealthStatus) {
  if (health.mysql === "ok") return "MySQL ok"
  if (!health.mysql_required) return "MySQL não exigido"
  return "MySQL indisponível"
}

export function ApiStatus() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 60_000,
  })

  let label = "Verificando a API…"
  if (health.isError || (health.isFetched && !health.data)) label = "API indisponível"
  else if (health.data) {
    const seeding = Boolean((health.data as HealthStatus & { seeding?: boolean }).seeding)
    label = seeding
      ? "Processando bases…"
      : `API ${health.data.api === "ok" ? "ok" : "indisponível"} · ${mysqlLabel(health.data)}`
  }

  return (
    <p className="truncate" aria-live="polite">
      {label}
    </p>
  )
}

export function Footer() {
  return (
    <footer className="flex h-12 shrink-0 items-center gap-2 overflow-hidden px-2 text-sm md:px-4">
      <span className="size-9 shrink-0 md:hidden" aria-hidden />
      <div className="min-w-0 flex-1">
        <ApiStatus />
      </div>
      <a
        href="https://github.com/f0ntanaDEV"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Perfil de f0ntanaDEV no GitHub (abre em nova aba)"
        className="inline-flex items-center gap-1"
      >
        @f0ntanaDEV <ArrowUpRight className="size-3.5" />
      </a>
    </footer>
  )
}
