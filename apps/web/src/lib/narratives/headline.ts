import { formatCompact, formatValue } from "@/lib/format"

export type HeadlineSegment = { text: string; strong?: boolean }

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
          { text: formatValue(Math.abs(gap), { key: "e0_t", kind: "years" }).replace("anos", gap === 1 || gap === -1 ? "ano" : "anos"), strong: true },
          { text: gap < 0 ? " abaixo da média do Brasil" : " acima da média do Brasil" },
        ]
  if (pageId === "overview" && input.pop != null && input.peakYear) {
    return [
      { text: formatCompact(input.pop), strong: true },
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
      { text: `${years(input.e0)} anos`, strong: true },
      { text: " em média, e cada mulher tem " },
      { text: formatValue(input.tft, "tft"), strong: true },
      { text: input.tft < 2.1 ? ", abaixo da reposição" : "" },
      ...compare,
      { text: "." },
    ]
  }
  if (pageId === "ds5" && input.lx80 != null) {
    return [
      { text: formatValue(input.lx80, { key: "lx_80", kind: "rate" }), strong: true },
      { text: " de cada 100 nascidos chegam aos 80 anos." },
    ]
  }
  if (pageId === "ds1" && input.median != null) {
    return [
      { text: "A idade mediana é " },
      { text: `${years(input.median)} anos`, strong: true },
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
