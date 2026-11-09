import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight } from "lucide-react"
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
    const seeding = Boolean((health.data as HealthStatus & { seeding?: boolean }).seeding)
    label = seeding
      ? "Processando bases…"
      : `API ${health.data.api === "ok" ? "ok" : "indisponível"} · ${mysqlLabel(health.data)}`
  }

  return (
    <footer className="flex items-center justify-between gap-4 border-t px-[var(--space-page-x,var(--density-pad))] py-3 text-sm">
      <p aria-live="polite">{label}</p>
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
