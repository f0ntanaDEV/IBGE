import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { commitCount, countedFrom, decimalsOf, formatCount, metricFor, roundPlaces } from "@/motion/count"
import { easeOutExpo } from "@/motion/tokens"
import { useMotion, motionVars } from "@/motion/useMotion"
import { metricById } from "@/content/metricas"
import type { NumberFormat } from "@/lib/format"
import { useSearchParams } from "react-router-dom"
import { useMode } from "@/stores/preferences"

type CountUpProps = {
  value: number
  metricKey?: string
  format?: NumberFormat
  compact?: boolean
  metric?: { key: string; kind: "count" | "percent" | "permil" | "years" | "rate" | "index" | "delta" | "year" | "raw" }
  className?: string
  renderValue?: (value: number) => string
}

export function CountUp({ value, metricKey, format, compact = false, metric, className, renderValue }: CountUpProps) {
  const mode = useMode()
  const [params] = useSearchParams()
  const cod = Number(params.get("cod") ?? 0)
  const motion = useMotion()
  const resolved = metric ?? metricFor(metricKey, format, value)
  const catalog = metricKey ? metricById(metricKey) : undefined
  const places = Number.isInteger(value) ? 0 : decimalsOf(value, catalog ?? undefined)
  const finalText = renderValue
    ? renderValue(value)
    : formatCount(Number.isInteger(value) ? value : roundPlaces(value, places), resolved, mode, compact)
  const key = `${metricKey ?? resolved.key}|${cod}|${compact ? "c" : "f"}`
  const [text, setText] = useState(finalText)
  const [animating, setAnimating] = useState(false)
  const ghost = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState<number | undefined>()

  const metricRef = useRef(resolved)
  metricRef.current = resolved

  useEffect(() => {
    const metric = metricRef.current
    const rendered = renderValue ? renderValue(value) : formatCount(Number.isInteger(value) ? value : roundPlaces(value, places), metric, mode, compact)
    if (!motion.animate) {
      commitCount(key, value)
      setText(rendered)
      setAnimating(false)
      return
    }
    const from = countedFrom(key, value)
    if (from == null || from === value) {
      commitCount(key, value)
      setText(rendered)
      setAnimating(false)
      return
    }
    const integer = Number.isInteger(value)
    setAnimating(true)
    let frame = 0
    let settled = false
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - motion.start) / Math.max(motion.durationMs, 1)))
      const next = from + (value - from) * easeOutExpo(t)
      const shown = integer ? Math.round(next) : roundPlaces(next, places)
      setText(renderValue ? renderValue(shown) : formatCount(shown, metric, mode, compact))
      if (t < 1) frame = requestAnimationFrame(tick)
      else {
        settled = true
        commitCount(key, value)
        setText(rendered)
        setAnimating(false)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      if (!settled) setAnimating(false)
    }
  }, [compact, key, mode, motion.animate, motion.durationMs, motion.groupId, motion.start, places, value])

  useEffect(() => {
    if (!animating) {
      setWidth(undefined)
      return
    }
    setWidth(ghost.current?.offsetWidth)
  }, [animating, finalText])

  if (!animating) return <span className={className}>{finalText}</span>

  return (
    <span className={`relative inline-block ${className ?? ""}`} style={{ minWidth: width }}>
      <span ref={ghost} className="invisible absolute" aria-hidden>
        {finalText}
      </span>
      <span aria-hidden className="tabular-nums">
        {text}
      </span>
      <span className="sr-only" aria-live="polite">
        {finalText}
      </span>
    </span>
  )
}

export function EndFade({ children, svg = false }: { children: ReactNode; svg?: boolean }) {
  const motion = useMotion()
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!motion.animate) {
      setOn(false)
      return
    }
    setOn(true)
    const timer = window.setTimeout(() => setOn(false), motion.delayMs + motion.durationMs + 80)
    return () => window.clearTimeout(timer)
  }, [motion.animate, motion.delayMs, motion.durationMs, motion.groupId])
  if (!on) return svg ? <g>{children}</g> : <span className="contents">{children}</span>
  const style = motionVars(motion) as CSSProperties
  if (svg) {
    return (
      <g data-anim="pop" style={style}>
        {children}
      </g>
    )
  }
  return (
    <span data-anim="fade" className="block" style={style}>
      {children}
    </span>
  )
}
