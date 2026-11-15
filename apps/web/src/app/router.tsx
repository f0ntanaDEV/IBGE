import { lazy, Suspense, type ReactNode } from "react"
import { createBrowserRouter } from "react-router-dom"
import { AppShell } from "@/app/layout/AppShell"
import { NotFoundPage, RouteErrorPage } from "@/features/error/page"

const OverviewPage = lazy(() => import("@/features/overview/page").then((mod) => ({ default: mod.OverviewPage })))
const DatasetPage = lazy(() => import("@/features/datasets/page").then((mod) => ({ default: mod.DatasetPage })))
const QualityPage = lazy(() => import("@/features/quality/page").then((mod) => ({ default: mod.QualityPage })))
const NewsPage = lazy(() => import("@/features/news/page").then((mod) => ({ default: mod.NewsPage })))
const SettingsPage = lazy(() => import("@/features/settings/page").then((mod) => ({ default: mod.SettingsPage })))
const InsightsPage = lazy(() => import("@/features/insights/InsightsPage").then((mod) => ({ default: mod.InsightsPage })))
const AboutPage = lazy(() => import("@/features/about/page").then((mod) => ({ default: mod.AboutPage })))
const NovidadesPage = lazy(() => import("@/features/novidades/page").then((mod) => ({ default: mod.NovidadesPage })))
const DatabricksPage = lazy(() => import("@/features/databricks/page").then((mod) => ({ default: mod.DatabricksPage })))

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>{children}</Suspense>
}

function page(node: ReactNode) {
  return (
    <Lazy>
      {node}
    </Lazy>
  )
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: page(<OverviewPage />) },
          { path: "databricks", element: page(<DatabricksPage />) },
          { path: "datasets/:id", element: page(<DatasetPage />) },
          { path: "qualidade", element: page(<QualityPage />) },
          { path: "insights", element: page(<InsightsPage />) },
          { path: "noticias", element: page(<NewsPage />) },
          { path: "sobre", element: page(<AboutPage />) },
          { path: "novidades", element: page(<NovidadesPage />) },
          { path: "configuracoes", element: page(<SettingsPage />) },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
