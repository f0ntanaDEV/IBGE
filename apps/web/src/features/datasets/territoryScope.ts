import type { Territory } from "@/features/datasets/api"

export function ufsForScope(cod: number, dim: Territory[]): { ufs: number[]; highlight?: number } {
  const ufs = dim.filter((item) => item.nivel === "uf")
  if (cod === 0) return { ufs: ufs.map((item) => item.cod) }
  const region = cod <= 5 ? cod : (dim.find((item) => item.cod === cod)?.regiao_cod ?? Math.floor(cod / 10))
  const list = ufs.filter((item) => (item.regiao_cod ?? Math.floor(item.cod / 10)) === region).map((item) => item.cod)
  if (cod <= 5) return { ufs: list }
  return { ufs: list, highlight: cod }
}
