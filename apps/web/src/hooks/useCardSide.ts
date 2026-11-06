import { useEffect, useState, type RefObject } from "react"

export type CardSide = "right" | "left" | "bottom"

const MIN = 280

export function computeSide(card: DOMRect, area: DOMRect): CardSide {
  const center = card.left + card.width / 2
  const prefer = center < area.left + area.width / 2 ? "right" : "left"
  const space = { right: area.right - card.right - 16, left: card.left - area.left - 16 }
  if (space[prefer] >= MIN) return prefer
  const other = prefer === "right" ? "left" : "right"
  return space[other] >= MIN ? other : "bottom"
}

export function useCardSide(cardRef: RefObject<HTMLElement | null>) {
  const [side, setSide] = useState<CardSide>("bottom")

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const update = () => {
      const area = document.querySelector("main") ?? document.documentElement
      setSide(computeSide(card.getBoundingClientRect(), area.getBoundingClientRect()))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(card)
    const main = document.querySelector("main")
    const aside = document.querySelector("aside")
    if (main) observer.observe(main)
    if (aside) observer.observe(aside)
    window.addEventListener("resize", update)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [cardRef])

  return side
}
