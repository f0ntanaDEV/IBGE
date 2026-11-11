import { formatCompact, formatValue, type MetricMeta } from "@/lib/format"

export type HeadlineSegment = { text: string; strong?: boolean; value?: number; metric?: MetricMeta; compact?: boolean }

export type HeadlineInput = {
  cod: number
  place: string
  ano: number
  pop?: number | null
  peakYear?: number | null
  e0?: number | null
  e0Brazil?: number | null
  tft?: number | null
  crossYear?: number | null
  lx80?: number | null
  median?: number | null
  band?: string | null
}

function years(value: number) {
  return formatValue(value, { key: "e0_t", kind: "years" }).replace(/ anos$/, "")
}

export function buildHeadline(pageId: string, input: HeadlineInput): HeadlineSegment[] {
  const gap = input.e0 != null && input.e0Brazil != null && input.cod !== 0 ? input.e0 - input.e0Brazil : null
  const compare: HeadlineSegment[] =
    gap == null
      ? []
      : [
          { text: gap < 0 ? ", " : ", " },
          {
            text: formatValue(Math.abs(gap), { key: "e0_t", kind: "years" }).replace("anos", gap === 1 || gap === -1 ? "ano" : "anos"),
            strong: true,
            value: Math.abs(gap),
            metric: { key: "e0_t", kind: "years" },
          },
          { text: gap < 0 ? " abaixo da média do Brasil" : " acima da média do Brasil" },
        ]
  if (pageId === "overview" && input.pop != null && input.peakYear) {
    return [
      { text: formatCompact(input.pop), strong: true, value: input.pop, metric: { key: "pop_t", kind: "count" }, compact: true },
      { text: " de habitantes hoje. A população para de crescer em " },
      { text: formatValue(input.peakYear, { key: "ano", kind: "year" }), strong: true },
      { text: "." },
      ...compare,
      { text: compare.length ? "." : "" },
    ]
  }
  if (pageId === "ds3" && input.crossYear) {
    return [
      { text: "Em " },
      { text: formatValue(input.crossYear, { key: "ano", kind: "year" }), strong: true },
      { text: ", os idosos passam a ser mais numerosos que as crianças." },
    ]
  }
  if (pageId === "ds4" && input.e0 != null && input.tft != null) {
    return [
      { text: "Vivemos " },
      { text: `${years(input.e0)} anos`, strong: true, value: input.e0, metric: { key: "e0_t", kind: "years" } },
      { text: " em média, e cada mulher tem " },
      { text: formatValue(input.tft, "tft"), strong: true, value: input.tft, metric: { key: "tft", kind: "rate" } },
      { text: input.tft < 2.1 ? ", abaixo da reposição" : "" },
      ...compare,
      { text: "." },
    ]
  }
  if (pageId === "ds5" && input.lx80 != null) {
    return [
      { text: formatValue(input.lx80, { key: "lx_80", kind: "rate" }), strong: true, value: input.lx80, metric: { key: "lx_80", kind: "rate" } },
      { text: " de cada 100 nascidos chegam aos 80 anos." },
    ]
  }
  if (pageId === "ds1" && input.median != null) {
    return [
      { text: "A idade mediana é " },
      { text: `${years(input.median)} anos`, strong: true, value: input.median, metric: { key: "idade_mediana", kind: "years" } },
      { text: "." },
    ]
  }
  if (pageId === "ds2" && input.band) {
    return [
      { text: "A maior faixa é " },
      { text: input.band, strong: true },
      { text: "." },
    ]
  }
  return []
}
