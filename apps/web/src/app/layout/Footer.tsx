import { useQuery } from "@tanstack/react-query"
import { fetchHealth, type HealthStatus } from "@/lib/api"

function mysqlLabel(health: HealthStatus) {
  if (health.mysql === "ok") return "MySQL ok"
  if (!health.mysql_required) return "MySQL não exigido"
  return "MySQL indisponível"
}

export function Footer() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 60_000,
  })

  let label = "Verificando a API…"
  if (health.isError || (health.isFetched && !health.data)) label = "API indisponível"
  else if (health.data) {
    label = `API ${health.data.api === "ok" ? "ok" : "indisponível"} · ${mysqlLabel(health.data)}`
  }

  return (
    <footer className="border-t border-border px-[var(--density-pad)] py-3 text-xs text-muted-foreground">
      <p aria-live="polite">{label}</p>
    </footer>
  )
}
