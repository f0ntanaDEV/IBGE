import { describe, expect, it } from "vitest"
import { buildHeadline } from "@/lib/narratives/headline"
import { metricName } from "@/lib/narratives/grammar"
import { trend } from "@/lib/narratives/rules/trend"
import type { NarrativeContext } from "@/lib/narratives/types"

describe("manchetes da etapa 15", () => {
  it("responde a pergunta de população, faixas e indicadores", () => {
    const age = buildHeadline("ds1", { cod: 0, place: "Brasil", ano: 2026, p60: 0.171, p60Futuro: 0.243, anoFuturo: 2040 })
      .map((part) => part.text)
      .join("")
    expect(age).toContain("17,1%")
    expect(age).toContain("2040")
    expect(age).toContain("24,3%")
    const bands = buildHeadline("ds2", { cod: 0, place: "Brasil", ano: 2026, gMax: "90+", vMax: 5.76, gMin: "05-09", vMin: -0.438 })
      .map((part) => part.text)
      .join("")
    expect(bands).toContain("90+")
    expect(bands).toContain("+576,0%")
    expect(bands).toContain("5–9")
    expect(bands).toContain("−43,8%")
    const life = buildHeadline("ds4", { cod: 0, place: "Brasil", ano: 2026, e0: 77.03, tft: 1.51 })
      .map((part) => part.text)
      .join("")
    expect(life).toContain("filho")
    expect(life).not.toContain("filhos")
    expect(life).toContain("abaixo da reposição de 2,1")
  })
})

describe("narrativa no meio da frase", () => {
  it("não começa a métrica com maiúscula depois da vírgula", () => {
    const ctx: NarrativeContext = {
      datasetId: "overview",
      territorio: { cod: 0, nome: "Brasil", nivel: "brasil" },
      ano: 2026,
      sexo: "Ambos",
      selection: {},
      series: [{ key: "pop_t", label: "População" }],
      data: { series: [{ ano: 2000, valor: 100 }, { ano: 2070, valor: 114 }] },
    }
    const text = trend(ctx)?.text ?? ""
    expect(text).toContain("a população")
    expect(metricName("Filhos por mulher")).toBe("o número de filhos por mulher")
    expect(text).not.toMatch(/, [A-ZÁÉÍÓÚÂÊÔÃÕ]/)
  })
})
