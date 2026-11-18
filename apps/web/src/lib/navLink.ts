const FILTER_KEYS = ["cod", "ano", "sexo"] as const
const LEGACY_KEYS = ["sel_uf", "sel_regiao", "sel_ano", "sel_sexo", "sel_faixa"] as const

/** Copia `cod`, `ano` e `sexo` da URL atual para o destino. */
export function withFilters(to: string, search = "") {
  const hashAt = to.indexOf("#")
  const hash = hashAt >= 0 ? to.slice(hashAt) : ""
  const bare = hashAt >= 0 ? to.slice(0, hashAt) : to
  const split = bare.indexOf("?")
  const path = split >= 0 ? bare.slice(0, split) : bare
  const next = new URLSearchParams(split >= 0 ? bare.slice(split + 1) : "")
  const current = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  for (const key of FILTER_KEYS) {
    const value = current.get(key)
    if (value != null) next.set(key, value)
  }
  const query = next.toString()
  return `${path}${query ? `?${query}` : ""}${hash}`
}

/** Converte `sel_*` salvos em `cod`, `ano` e `sexo` e remove os parâmetros antigos. */
export function migrateLegacyFilters(params: URLSearchParams) {
  if (!LEGACY_KEYS.some((key) => params.has(key))) return null
  const next = new URLSearchParams(params)
  const uf = next.get("sel_uf")?.split(",").find((item) => item !== "")
  const regiao = next.get("sel_regiao")?.split(",").find((item) => item !== "")
  if (uf) next.set("cod", uf)
  else if (regiao) next.set("cod", regiao)
  const ano = next.get("sel_ano")
  if (ano) next.set("ano", ano)
  const sexo = next.get("sel_sexo")
  if (sexo === "H" || sexo === "Homens") next.set("sexo", "Homens")
  if (sexo === "M" || sexo === "Mulheres") next.set("sexo", "Mulheres")
  const faixa = next.get("sel_faixa")?.split(",").filter(Boolean)
  for (const key of LEGACY_KEYS) next.delete(key)
  for (const key of [...next.keys()]) {
    if (key.startsWith("d_")) next.delete(key)
  }
  return { params: next, faixa }
}
