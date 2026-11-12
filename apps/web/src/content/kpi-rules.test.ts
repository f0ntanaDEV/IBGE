import { describe, expect, it } from "vitest"
import { evaluate } from "@/content/kpi-rules"
import { contradictsRevision, selectNews } from "@/content/news-curated"
import { detailText } from "@/features/facts/FactsCard"
import type { FactItem } from "@/features/datasets/api"

describe("regras de status", () => {
  it("reproduz a referência do Brasil e da Bahia", () => {
    expect(evaluate("crescimento_anual", { value: 0, yoyPct: 0.37 }).status).toBe("warn")
    expect(evaluate("esperanca_vida", { value: 77.03, prev: 76.82 }).status).toBe("good")
    expect(evaluate("filhos_por_mulher", { value: 1.51 }).status).toBe("bad")
    expect(evaluate("envelhecimento", { value: 89.06 }).status).toBe("warn")
    expect(evaluate("criancas_10_anos", { value: 0, delta10Pp: -3 }).status).toBe("warn")
    expect(evaluate("esperanca_vida", { value: 76.26, brazil: 77.03 }).status).toBe("warn")
    expect(evaluate("vida_60", { value: 22.82 }).status).toBe("good")
  })

  it("não usa o mesmo ano como rótulo de dois detalhes", () => {
    const fact: FactItem = {
      id: "e0",
      label: "Esperança de vida",
      value: 77.03,
      kind: "years",
      reference_year: 2026,
      detail_values: [
        { ano: 2026, valor: 73.75, kind: "years", rotulo: "homens {valor}" },
        { ano: 2026, valor: 80.27, kind: "years", rotulo: "mulheres {valor}" },
      ],
    }
    const text = detailText(fact, "technical")
    expect(text.match(/2026/g) ?? []).toHaveLength(0)
    expect(text).toContain("homens")
    expect(text).toContain("mulheres")
  })

  it("não trata o limiar de 2,1 como se fosse o valor de 2002", () => {
    const text = detailText(
      {
        id: "tft",
        label: "Filhos por mulher",
        value: 1.51,
        kind: "rate",
        detail_values: [{ ano: 2002, valor: 2002, kind: "year", rotulo: "abaixo de 2,1 desde {valor}" }],
      },
      "technical",
    )
    expect(text).toBe("abaixo de 2,1 desde 2002")
    expect(text).not.toContain("2002:")
  })
})

describe("notícias que confirmam", () => {
  it("deixa de fora matéria de revisão antiga com outro ano de pico", () => {
    const old = {
      id: "1",
      titulo: "População do país vai parar de crescer em 2047",
      introducao: "Projeção de 2018.",
      data_publicacao: "2018",
      link: "https://agenciadenoticias.ibge.gov.br/antiga",
    }
    expect(contradictsRevision(old)).toBe(true)
    const chosen = selectNews("overview", [old])
    expect(chosen.some((item) => String(item.titulo).includes("2047"))).toBe(false)
    expect(chosen.some((item) => String(item.titulo).includes("2041"))).toBe(true)
  })
})
