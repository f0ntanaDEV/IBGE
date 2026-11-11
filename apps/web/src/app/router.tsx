import { lazy, Suspense, type ReactNode } from "react"
import { Link, createBrowserRouter } from "react-router-dom"
import { AppShell } from "@/app/layout/AppShell"
import { ErrorState } from "@/components/common/ErrorState"

const OverviewPage = lazy(() => import("@/features/overview/page").then((mod) => ({ default: mod.OverviewPage })))
const DatasetPage = lazy(() => import("@/features/datasets/page").then((mod) => ({ default: mod.DatasetPage })))
const QualityPage = lazy(() => import("@/features/quality/page").then((mod) => ({ default: mod.QualityPage })))
const NewsPage = lazy(() => import("@/features/news/page").then((mod) => ({ default: mod.NewsPage })))
const SettingsPage = lazy(() => import("@/features/settings/page").then((mod) => ({ default: mod.SettingsPage })))
const InsightsPage = lazy(() => import("@/features/insights/InsightsPage").then((mod) => ({ default: mod.InsightsPage })))
const AboutPage = lazy(() => import("@/features/about/page").then((mod) => ({ default: mod.AboutPage })))

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <Lazy>
            <OverviewPage />
          </Lazy>
        ),
      },
      {
        path: "datasets/:id",
        element: (
          <Lazy>
            <DatasetPage />
          </Lazy>
        ),
      },
      {
        path: "qualidade",
        element: (
          <Lazy>
            <QualityPage />
          </Lazy>
        ),
      },
      {
        path: "insights",
        element: (
          <Lazy>
            <InsightsPage />
          </Lazy>
        ),
      },
      {
        path: "noticias",
        element: (
          <Lazy>
            <NewsPage />
          </Lazy>
        ),
      },
      {
        path: "sobre",
        element: (
          <Lazy>
            <AboutPage />
          </Lazy>
        ),
      },
      {
        path: "configuracoes",
        element: (
          <Lazy>
            <SettingsPage />
          </Lazy>
        ),
      },
      {
        path: "*",
        element: (
          <ErrorState
            title="Página não encontrada"
            message="Esse endereço não existe."
            action={
              <Link to="/" className="text-sm underline">
                Ir para a visão geral
              </Link>
            }
          />
        ),
      },
    ],
  },
])
