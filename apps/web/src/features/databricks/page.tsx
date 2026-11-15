import { usePageReady } from "@/motion/usePageReady"
import { Reveal } from "@/motion/useMotion"

const DASHBOARD_URL =
  "https://dbc-e7ffba4b-1a76.cloud.databricks.com/embed/dashboardsv3/01f1e08bd1d71ca9b49a4604ee008ce0?o=7474648187013488"

export function DatabricksPage() {
  usePageReady(true)
  return (
    <Reveal className="h-full w-full">
      <iframe
        title="Painel Databricks"
        src={DASHBOARD_URL}
        className="h-full w-full border-0"
        allow="fullscreen"
      />
    </Reveal>
  )
}
