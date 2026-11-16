import { usePageReady } from "@/motion/usePageReady"

const SRC = "https://dbc-e7ffba4b-1a76.cloud.databricks.com/embed/dashboardsv3/01f1e08bd1d71ca9b49a4604ee008ce0?o=7474648187013488"

export function DatabricksPage() {
  usePageReady(true)
  return <iframe title="Painel Databricks" src={SRC} className="min-h-0 w-full flex-1 border-0" allow="fullscreen" />
}
