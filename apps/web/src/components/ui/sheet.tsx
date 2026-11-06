import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { type ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/cn"

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger

export function SheetContent({
  className,
  children,
  title = "Menu",
  side = "left",
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { title?: string; side?: "left" | "right" }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex h-full w-72 flex-col gap-4 border-border bg-background p-4 shadow-sm",
          side === "left" ? "inset-y-0 left-0 border-r" : "inset-y-0 right-0 border-l",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">Navegação do painel.</DialogPrimitive.Description>
        {children}
        <DialogPrimitive.Close className="absolute top-3 right-3 rounded-md p-1" aria-label="Fechar">
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
