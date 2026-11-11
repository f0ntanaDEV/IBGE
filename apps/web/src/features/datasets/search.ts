export function pickFilters(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  const next = new URLSearchParams()
  for (const key of ["cod", "ano"]) {
    const value = params.get(key)
    if (value != null) next.set(key, value)
  }
  const text = next.toString()
  return text ? `?${text}` : ""
}
