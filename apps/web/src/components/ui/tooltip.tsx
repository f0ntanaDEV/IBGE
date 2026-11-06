import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { type ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/cn"

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        {...props}
        collisionPadding={8}
        className={cn(
          "z-50 max-w-[16rem] rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm",
          className,
        )}
      />
    </TooltipPrimitive.Portal>
  )
}
