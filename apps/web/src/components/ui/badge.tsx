import { cva, type VariantProps } from "class-variance-authority"
import { type HTMLAttributes } from "react"
import { cn } from "@/lib/cn"

const badgeVariants = cva("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium", {
  variants: {
    variant: {
      default: "border-border bg-muted text-foreground",
      outline: "border-border bg-background text-foreground",
    },
  },
  defaultVariants: { variant: "default" },
})

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
