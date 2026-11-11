export function chartId(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function focusChart(id: string) {
  const node = document.querySelector<HTMLElement>(`[data-chart-id="${CSS.escape(id)}"]`)
  if (!node) return
  node.scrollIntoView({ block: "center" })
  node.focus()
}
