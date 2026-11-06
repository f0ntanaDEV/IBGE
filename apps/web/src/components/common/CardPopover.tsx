import { type ReactNode, type RefObject } from "react"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCardSide } from "@/hooks/useCardSide"
import { cn } from "@/lib/cn"

type CardPopoverProps = {
  cardRef: RefObject<HTMLElement | null>
  trigger: ReactNode
  children: ReactNode
  title: string
}

export function CardPopover({ cardRef, trigger, children, title }: CardPopoverProps) {
  const side = useCardSide(cardRef)
  return (
    <Popover>
      <PopoverAnchor virtualRef={cardRef} />
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side={side}
        align="start"
        sideOffset={8}
        collisionPadding={16}
        avoidCollisions
        className={cn(
          "max-h-[var(--radix-popover-content-available-height)] overflow-auto",
          side === "bottom" ? "w-[var(--radix-popper-anchor-width)]" : "w-[min(20rem,var(--radix-popover-content-available-width))]",
        )}
      >
        <p className="mb-2 text-sm font-medium">{title}</p>
        {children}
      </PopoverContent>
    </Popover>
  )
}
