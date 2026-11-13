import { readFileSync, readdirSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { formatAgeBand, formatCompact, formatValue, type MetricMeta } from "@/lib/format"

const count: MetricMeta = { key: "populacao", kind: "count" }
const percent: MetricMeta = { key: "p", kind: "percent" }
const permil: MetricMeta = { key: "tmi", kind: "permil" }
const years: MetricMeta = { key: "e0", kind: "years" }
const rate: MetricMeta = { key: "tft", kind: "rate" }
const delta: MetricMeta = { key: "delta", kind: "delta" }
const year: MetricMeta = { key: "ano", kind: "year" }

describe("formatCompact", () => {
  it("resume inteiros nos eixos", () => {
    expect(formatCompact(214211951)).toBe("214 mi")
    expect(formatCompact(8542314)).toBe("8,5 mi")
    expect(formatCompact(1284)).toBe("1,3 mil")
    expect(formatCompact(999)).toBe("999")
  })
})

describe("formatValue", () => {
  it("mantém o valor exato em pt-BR", () => {
    expect(formatValue(214211951, count)).toBe("214.211.951")
    expect(formatValue(0.146732, percent)).toBe("14,7%")
    expect(formatValue(12.42, permil)).toBe("12,42 por mil")
    expect(formatValue(76.6057, years)).toBe("76,61 anos")
    expect(formatValue(1.5468, rate)).toBe("1,55")
    expect(formatValue(3.8421, delta)).toBe("3,8")
    expect(formatValue(2041, year)).toBe("2041")
    expect(formatValue(2000, year)).toBe("2000")
    expect(formatValue(2026, year)).toBe("2026")
    expect(formatValue(2070, year)).toBe("2070")
    expect(formatValue(null, years)).toBe("—")
    expect(formatAgeBand("40-44")).toBe("40–44")
  })
})

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = resolve(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : []
  })
}

describe("modo simples", () => {
  it("compacta os números da tabela do requisito", () => {
    expect(formatValue(214211951, count, "simple")).toBe("214 mi")
    expect(formatValue(8542314, count, "simple")).toBe("8,5 mi")
    expect(formatValue(1284, count, "simple")).toBe("1,3 mil")
    expect(formatValue(999, count, "simple")).toBe("999")
    expect(formatValue(0.1713, percent, "simple")).toBe("17%")
    expect(formatValue(0.0037, percent, "simple")).toBe("0,37%")
    expect(formatValue(-0.0012, percent, "simple")).toBe("-0,12%")
    expect(formatValue(11.83, permil, "simple")).toBe("12 a cada mil")
    expect(formatValue(77.03, years, "simple")).toBe("77 anos")
    expect(formatValue(1.51, { key: "tft", kind: "rate", unitSimple: "filho por mulher" }, "simple")).toBe("1,5 filho por mulher")
    expect(formatValue(2026, year, "simple")).toBe("2026")
  })
})

describe("formatação central", () => {
  it("não chama toLocaleString, toFixed nem Intl.NumberFormat fora de lib/format.ts", () => {
    const root = resolve(process.cwd(), "src")
    const hits = sourceFiles(root).flatMap((path) => {
      if (path.replaceAll("\\", "/").endsWith("/lib/format.ts")) return []
      const text = readFileSync(path, "utf8")
      const found = text.match(/\.toLocaleString\(|\.toFixed\(|new Intl\.NumberFormat\(/g)
      return found ? [`${path}: ${found.join(", ")}`] : []
    })
    expect(hits).toEqual([])
  })
})
