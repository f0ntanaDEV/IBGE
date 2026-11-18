import { withFilters } from "@/lib/navLink"

export function pickFilters(search: string) {
  const href = withFilters("/", search)
  const mark = href.indexOf("?")
  return mark >= 0 ? href.slice(mark) : ""
}
