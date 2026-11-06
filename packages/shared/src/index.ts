import createClient from "openapi-fetch"
import type { components, paths } from "./api-types"

export type { components, paths }

export function createApiClient(baseUrl = "") {
  return createClient<paths>({ baseUrl })
}
