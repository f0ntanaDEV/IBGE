import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { CountUp } from "@/motion/CountUp"
import { MotionProvider } from "@/motion/MotionProvider"
import { countUpStart, decimalsOf } from "@/motion/count"
import { shownPartsAt, splitWords, wordCount } from "@/motion/words"
import { WordReveal } from "@/motion/WordReveal"
import { usePreferences } from "@/stores/preferences"

describe("countUpStart", () => {
  it("cobre inteiro, decimal, negativo, módulo pequeno e texto", () => {
    expect(countUpStart(214211951)).toBe(0)
    expect(countUpStart(77.03)).toBe(0)
    expect(countUpStart(-1.5)).toBe(0)
    expect(countUpStart(0.04)).toBe(0)
    expect(countUpStart(-0.02)).toBe(0)
    expect(countUpStart("2041")).toBeNull()
    expect(countUpStart("40–44")).toBeNull()
    expect(countUpStart("DF")).toBeNull()
    expect(decimalsOf(77.03, { casas: 2 })).toBe(2)
  })
})

describe("CountUp desligado", () => {
  it("mostra o valor final no primeiro render", () => {
    usePreferences.setState({ motion: "off" })
    render(
      <MemoryRouter>
        <MotionProvider>
          <CountUp value={77.03} metricKey="e0_t" />
        </MotionProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText("77,03 anos")).toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})

describe("palavras", () => {
  it("divide o texto preservando espaços e avança a cada 100 ms", () => {
    const parts = splitWords("um dois três")
    expect(wordCount(parts)).toBe(3)
    expect(parts.filter((part) => part.trim()).join("|")).toBe("um|dois|três")
    expect(wordCount(parts.slice(0, shownPartsAt(0, parts)))).toBe(1)
    expect(wordCount(parts.slice(0, shownPartsAt(100, parts)))).toBe(2)
    expect(wordCount(parts.slice(0, shownPartsAt(200, parts)))).toBe(3)
  })

  it("sem animação mostra o parágrafo inteiro", () => {
    usePreferences.setState({ motion: "off", mode: "simple" })
    render(
      <MemoryRouter>
        <MotionProvider>
          <WordReveal text="alfa beta" />
        </MotionProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText("alfa beta")).toBeInTheDocument()
  })
})
