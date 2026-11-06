import { glossary } from "@/features/glossary/glossary"
import { provisionalNarratives } from "@/features/glossary/narratives"
import { describe, expect, it } from "vitest"

function words(text: string) {
  return text.split(/\s+/).filter(Boolean).length
}

describe("glossário", () => {
  it("explica cada métrica em até 25 palavras, sem sigla", () => {
    expect(glossary.length).toBeGreaterThan(10)
    for (const entry of glossary) {
      expect(words(entry.explicacao), entry.key).toBeLessThanOrEqual(25)
      expect(entry.explicacao).not.toMatch(/\b[A-Z]{2,}\b/)
    }
  })

  it("mantém as frases provisórias curtas", () => {
    const sentences = Object.values(provisionalNarratives).flat()
    const total = sentences.reduce((sum, sentence) => sum + words(sentence), 0)
    expect(total / sentences.length).toBeLessThanOrEqual(15)
  })
})
