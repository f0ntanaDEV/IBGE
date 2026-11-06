import { createApiClient, type components } from "@ibge/shared"

export const api = createApiClient(import.meta.env.VITE_API_URL ?? "")

export type HealthStatus = components["schemas"]["HealthOut"]

export async function fetchHealth(): Promise<HealthStatus> {
  const { data, error, response } = await api.GET("/api/v1/health")
  if (error || !response.ok || !data) throw new Error("API indisponível")
  return data
}
