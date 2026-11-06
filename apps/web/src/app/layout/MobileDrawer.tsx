import { X } from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"

type MobileDrawerProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      restoreFocus.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-background p-4 outline-none"
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
