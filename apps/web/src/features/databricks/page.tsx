import { DatabricksDashboard } from "@databricks/aibi-client"
import { useEffect, useRef, useState } from "react"
import { usePageReady } from "@/motion/usePageReady"

type EmbedConfig = {
  token?: string
  instance_url?: string
  workspace_id?: string
  dashboard_id?: string
}

async function fetchEmbed(): Promise<EmbedConfig> {
  const response = await fetch("/api/v1/databricks/embed")
  if (!response.ok) throw new Error("embed")
  return response.json() as Promise<EmbedConfig>
}

export function DatabricksPage() {
  const container = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  usePageReady(true)

  useEffect(() => {
    const node = container.current
    if (!node) return
    let dashboard: DatabricksDashboard | undefined
    let cancelled = false

    void fetchEmbed()
      .then((cfg) => {
        if (cancelled || !cfg.token || !cfg.instance_url || !cfg.workspace_id || !cfg.dashboard_id) {
          if (!cancelled) setFailed(true)
          return
        }
        dashboard = new DatabricksDashboard({
          instanceUrl: cfg.instance_url,
          workspaceId: cfg.workspace_id,
          dashboardId: cfg.dashboard_id,
          token: cfg.token,
          container: node,
          getNewToken: async () => {
            const next = await fetchEmbed()
            if (!next.token) throw new Error("embed")
            return next.token
          },
        })
        dashboard.initialize()
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      dashboard?.destroy()
    }
  }, [])

  return (
    <div id="dashboard-content" ref={container} className="h-full min-h-0 w-full flex-1">
      {failed ? <p className="p-4 text-sm text-zinc-600">Não foi possível abrir o painel Databricks.</p> : null}
    </div>
  )
}
