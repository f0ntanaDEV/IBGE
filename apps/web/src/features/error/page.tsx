import { useEffect, type ReactNode } from "react"
import { isRouteErrorResponse, Link, useNavigate, useRouteError } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useMotionApi } from "@/motion/MotionProvider"
import { motionVars, useMotion } from "@/motion/useMotion"
import { usePageReady } from "@/motion/usePageReady"

type ErrorCopy = {
  code: string
  title: string
  message: string
}

export const NOT_FOUND: ErrorCopy = {
  code: "404",
  title: "Página não encontrada",
  message: "Esse endereço não faz parte do painel. Use a busca no topo ou volte para a visão geral.",
}

export function routeErrorCopy(error: unknown): ErrorCopy {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return NOT_FOUND
    return {
      code: String(error.status),
      title: "Não foi possível abrir esta página",
      message: "O painel não conseguiu concluir este pedido. Tente de novo ou volte para a visão geral.",
    }
  }
  return {
    code: "Erro",
    title: "Não foi possível abrir esta página",
    message: "O painel encontrou um problema ao montar o conteúdo. Tente de novo ou volte para a visão geral.",
  }
}

function errorDetail(error: unknown) {
  if (!import.meta.env.DEV) return null
  if (isRouteErrorResponse(error)) return typeof error.data === "string" ? error.data : null
  if (error instanceof Error) return error.message
  return null
}

type ErrorPageProps = ErrorCopy & {
  detail?: string | null
  onRetry?: () => void
}

function ErrorStage({ children }: { children: ReactNode }) {
  const { enabled, page } = useMotionApi()
  return <div data-anim-state={enabled && page == null ? "pending" : undefined}>{children}</div>
}

function Rise({ index, className, children }: { index: number; className?: string; children: ReactNode }) {
  const motion = useMotion()
  if (!motion.animate) return <div className={className}>{children}</div>
  return (
    <div
      className={className}
      data-anim="rise"
      style={motionVars({ ...motion, delayMs: motion.delayMs + index * 70, durationMs: 480 })}
    >
      {children}
    </div>
  )
}

export function ErrorPage({ code, title, message, detail, onRetry }: ErrorPageProps) {
  const navigate = useNavigate()
  usePageReady(true)
  useEffect(() => {
    document.title = `${title} · Projeções IBGE`
  }, [title])

  return (
    <ErrorStage>
    <div className="flex min-h-full flex-col justify-center py-16">
      <Rise index={0}>
        <p className="text-sm font-medium tracking-wide text-muted-foreground">{code}</p>
      </Rise>
      <Rise index={1} className="mt-2">
        <h1 className="max-w-xl text-3xl font-medium tracking-tight">{title}</h1>
      </Rise>
      <Rise index={2} className="mt-3">
        <p className="max-w-lg text-sm text-muted-foreground">{message}</p>
      </Rise>
      <Rise index={3} className="mt-6">
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/">Ir para a visão geral</Link>
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
          {onRetry ? (
            <Button variant="outline" onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : null}
        </div>
      </Rise>
      {detail ? (
        <Rise index={4} className="mt-8">
          <details className="max-w-lg text-xs text-muted-foreground">
            <summary>Detalhe técnico</summary>
            <pre className="mt-2 whitespace-pre-wrap">{detail}</pre>
          </details>
        </Rise>
      ) : null}
    </div>
    </ErrorStage>
  )
}

export function NotFoundPage() {
  return <ErrorPage {...NOT_FOUND} />
}

export function RouteErrorPage() {
  const error = useRouteError()
  return <ErrorPage {...routeErrorCopy(error)} detail={errorDetail(error)} onRetry={() => window.location.reload()} />
}
