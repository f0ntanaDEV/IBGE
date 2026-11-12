import type { ReactNode } from "react"

export function useWordRevealControl() {
  return { finishAll() {} }
}

export function WordRevealControl({ children }: { children: ReactNode }) {
  return children
}

export function CharFade({
  text,
  className,
  as: Tag = "span",
  onClick,
  id,
  insight = false,
}: {
  text: string
  className?: string
  as?: "p" | "span" | "h1" | "h2" | "h3"
  onClick?: () => void
  id?: string
  insight?: boolean
}) {
  const mark = insight ? { "data-insight-answer": "" } : undefined
  return (
    <Tag id={id} className={className} onClick={onClick} {...mark}>
      {text}
    </Tag>
  )
}

export function WordReveal({
  text,
  className,
  as: Tag = "p",
}: {
  text: string
  className?: string
  as?: "p" | "span"
}) {
  return <Tag className={className}>{text}</Tag>
}
