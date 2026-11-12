import { formatAxisValue, formatValue } from "@/lib/format"

const MIN_CHARS = 125
const MAX_CHARS = 220

type ClaimLike = {
  id: string
  value: number | string | null
  detail?: Record<string, unknown>
}

type BonusPoint = { ano: number; rdt65?: number | null }

function hasRdt(row: BonusPoint): row is BonusPoint & { rdt65: number } {
  return Number.isFinite(row.ano) && typeof row.rdt65 === "number" && Number.isFinite(row.rdt65)
}

function asNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function ano(value: number) {
  return formatValue(value, { key: "ano", kind: "year" })
}

function pessoas(value: number) {
  return formatValue(value, { key: "populacao", kind: "count" })
}

function taxa(value: number) {
  return formatAxisValue(value, { key: "taxa", kind: "rate" })
}

function pack(primary: string[], fillers: string[]) {
  const lines = [...primary]
  while (lines.join(" ").length > MAX_CHARS && lines.length > 3) lines.pop()
  for (const filler of fillers) {
    if (lines.length >= 5) break
    const text = lines.join(" ")
    if (lines.length >= 3 && text.length >= MIN_CHARS) break
    const next = [...lines, filler].join(" ")
    if (next.length > MAX_CHARS) break
    lines.push(filler)
  }
  return lines.join(" ")
}

export function factsStatText(claims: ClaimLike[]) {
  const byId = (id: string) => claims.find((claim) => claim.id === id)
  const sentences: string[] = []
  const pico = byId("pico_populacional")
  const picoYear = asNumber(pico?.value)
  if (picoYear != null) {
    const pop = asNumber(pico?.detail?.populacao)
    sentences.push(
      pop == null
        ? `O pico da população brasileira ocorre em ${ano(picoYear)}.`
        : `O pico da população brasileira ocorre em ${ano(picoYear)}, com ${pessoas(pop)} pessoas.`,
    )
  }
  const idososYear = asNumber(byId("idosos_superam_jovens")?.value)
  if (idososYear != null) sentences.push(`A população de 60+ supera a de 0–14 anos em ${ano(idososYear)}.`)
  const tftClaim = byId("fecundidade_abaixo_reposicao")
  const tft = asNumber(tftClaim?.value)
  if (tft != null) {
    const year = asNumber(tftClaim?.detail?.ano)
    const reposicao = asNumber(tftClaim?.detail?.reposicao) ?? 2.1
    const when = year == null ? "" : ` em ${ano(year)}`
    const lado = tft < reposicao ? "abaixo" : "acima"
    sentences.push(`A fecundidade${when} é de ${taxa(tft)} filho por mulher, ${lado} da reposição de ${taxa(reposicao)}.`)
  }
  const life = byId("esperanca_vida")
  const e0 = asNumber(life?.value)
  if (e0 != null) {
    const year = asNumber(life?.detail?.ano)
    const when = year == null ? "" : ` em ${ano(year)}`
    sentences.push(`A esperança de vida ao nascer${when} é de ${taxa(e0)} anos.`)
  }
  const fillers: string[] = []
  if (picoYear != null) {
    fillers.push("O máximo encerra a fase de crescimento absoluto da projeção.")
    fillers.push("Depois do pico, o efetivo projetado passa a cair.")
  }
  if (idososYear != null) {
    fillers.push("O cruzamento inverte a estrutura etária nacional.")
    fillers.push("A comparação usa os totais de cada grupo de idade.")
  }
  if (tft != null || e0 != null) fillers.push("Fecundidade e longevidade descrevem o regime demográfico do ano.")
  return pack(sentences, fillers)
}

export function bonusStatText(data: BonusPoint[], window: { x1: number; x2: number } | null, turning: number | null) {
  const series = data.filter(hasRdt).sort((a, b) => a.ano - b.ano)
  if (series.length < 2) {
    return pack([], [
      "A razão de dependência total ainda não forma série neste recorte.",
      "O indicador relaciona as idades de 0–14 e de 65+ à faixa de 15–64.",
      "A janela do bônus só é lida quando a série cobre o mínimo.",
    ])
  }
  const ratio = Math.max(...series.map((row) => row.rdt65)) <= 5
  const per = ratio ? "em relação à população de 15–64" : "para cada 100 pessoas de 15–64"
  const limiar = ratio ? taxa(0.5) : formatValue(50, { key: "limiar", kind: "count" })
  const minPoint =
    (turning == null ? undefined : series.find((row) => row.ano === turning)) ??
    series.reduce((best, row) => (row.rdt65 < best.rdt65 ? row : best))
  const first = series[0]
  const last = series[series.length - 1]
  const sentences = [
    `A razão de dependência mede 0–14 e 65+ ${per}.`,
    `O mínimo é ${taxa(minPoint.rdt65)} em ${ano(minPoint.ano)}, ponto de virada da série.`,
    `A série sai de ${taxa(first.rdt65)} em ${ano(first.ano)} e chega a ${taxa(last.rdt65)} em ${ano(last.ano)}.`,
  ]
  if (window) sentences.splice(2, 0, `A janela abaixo de ${limiar} vai de ${ano(window.x1)} a ${ano(window.x2)}.`)
  return pack(sentences, ["Depois do mínimo, a carga de dependentes volta a subir."])
}
