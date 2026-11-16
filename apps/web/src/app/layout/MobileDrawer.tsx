import { X } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/cn"

type MobileDrawerProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

function motionEnabled() {
  return document.documentElement.dataset.motion === "on" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      if (!motionEnabled()) {
        setShown(true)
        return
      }
      const frames = { outer: 0, inner: 0 }
      frames.outer = requestAnimationFrame(() => {
        frames.inner = requestAnimationFrame(() => setShown(true))
      })
      return () => {
        cancelAnimationFrame(frames.outer)
        cancelAnimationFrame(frames.inner)
      }
    }
    setShown(false)
    if (!motionEnabled()) {
      setMounted(false)
      return
    }
    const node = panelRef.current
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      setMounted(false)
    }
    const timer = window.setTimeout(finish, 480)
    const onEnd = (event: TransitionEvent) => {
      if (event.propertyName === "translate" || event.propertyName === "transform") finish()
    }
    node?.addEventListener("transitionend", onEnd)
    return () => {
      window.clearTimeout(timer)
      node?.removeEventListener("transitionend", onEnd)
    }
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mounted])

  useEffect(() => {
    if (!open || !mounted) return
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panelRef.current?.focus()
    return () => {
      restoreFocus.current?.focus()
    }
  }, [open, mounted])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, open])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fechar menu"
        data-allow-motion="drawer-backdrop"
        className={cn("absolute inset-0 bg-foreground/40", shown ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        aria-label="Menu"
        tabIndex={-1}
        data-allow-motion="drawer"
        className={cn(
          "absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-background p-4 outline-none",
          shown ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <h2 className="sr-only">Menu</h2>
        <p className="sr-only">Navegação do painel.</p>
        {children}
        <button type="button" className="absolute top-3 right-3 rounded-md p-1" aria-label="Fechar" onClick={onClose}>
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
