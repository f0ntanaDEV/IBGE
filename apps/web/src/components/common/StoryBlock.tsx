import { STORYTELLING } from "@/content/storytelling"
import { WordReveal } from "@/motion/WordReveal"
import { useMode } from "@/stores/preferences"

export function StoryBlock({ pageId }: { pageId: string }) {
  const mode = useMode()
  const text = STORYTELLING[pageId]?.[mode === "simple" ? "simples" : "tecnico"]
  if (!text) return null
  return (
    <aside className="border-l-2 border-primary pl-3 text-sm leading-5 text-muted-foreground">
      <h2 className="text-xs font-medium text-foreground">Por que isso importa</h2>
      {mode === "simple" ? <WordReveal text={text} /> : <p>{text}</p>}
    </aside>
  )
}
