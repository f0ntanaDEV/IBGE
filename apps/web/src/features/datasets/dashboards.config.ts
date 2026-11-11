import { metricLabel } from "@/content/metricas"

export type MetricFormat = "int" | "decimal" | "percent" | "permil" | "years"

export type Metric = { key: string; format: MetricFormat }

export type ChartSpec =
  | {
      kind: "line" | "area" | "area100"
      title: string
      series: Metric[]
      refLine?: { y: number; label: string }
      markCrossing?: [string, string]
      markMax?: boolean
      logY?: boolean
      description: string
      span?: 4 | 6 | 8 | 12
      refBrazil?: boolean
    }
  | { kind: "pyramid"; title: string; granularity: "idade" | "quinquenal" | "ampla"; compare?: boolean; animate?: boolean; description: string; span?: 4 | 6 | 8 | 12 }
  | { kind: "lifeTable"; title: string; metric: "lx" | "nqx" | "ex"; logY?: boolean; compareYears?: boolean; description: string; span?: 4 | 6 | 8 | 12 }
  | { kind: "ranking"; title: string; metricOptions: (Metric & { label: string })[]; level: "uf"; description: string; span?: 4 | 6 | 8 | 12 }
  | { kind: "map"; title: string; metric: string; format: MetricFormat; description: string; span?: 4 | 6 | 8 | 12 }
  | { kind: "heatmap"; title: string; description: string; span?: 4 | 6 | 8 | 12 }
  | { kind: "scatter"; title: string; description: string; span?: 4 | 6 | 8 | 12 }
  | { kind: "slope"; title: string; metric: string; format: MetricFormat; description: string; span?: 4 | 6 | 8 | 12 }
  | { kind: "bonus"; title: string; description: string; span?: 4 | 6 | 8 | 12 }
  | { kind: "diverging"; title: string; description: string; span?: 4 | 6 | 8 | 12 }
  | { kind: "milestones"; title: string; description: string; span?: 4 | 6 | 8 | 12 }
  | { kind: "context"; title: string; description: string; span?: 4 | 6 | 8 | 12 }
  | { kind: "facts"; title: string; description: string; span?: 4 | 6 | 8 | 12 }

export type DashboardSpec = {
  id: "ds1" | "ds2" | "ds3" | "ds4" | "ds5"
  kpis: (Metric & { label: string; hint: string; deltaYears?: number; unit: string })[]
  charts: ChartSpec[]
  filters: ("territorio" | "ano" | "sexo")[]
  showCensoReference: boolean
  tableColumns: string[]
}

const young = { key: "p_0_14_t", format: "percent" as const }
const old = { key: "p_60_mais_t", format: "percent" as const }

export const dashboards: DashboardSpec[] = [
  {
    id: "ds1",
    filters: ["territorio", "ano", "sexo"],
    showCensoReference: true,
    kpis: [
      { key: "populacao", format: "int", label: metricLabel("populacao"), hint: "Pessoas no território, ano e sexo selecionados.", unit: "pessoas", deltaYears: 10 },
      { key: "p_0_14", format: "percent", label: metricLabel("p_0_14"), hint: "Parcela da população com até 14 anos.", unit: "proporção", deltaYears: 10 },
      { key: "p_60", format: "percent", label: metricLabel("p_60"), hint: "Parcela da população com 60 anos ou mais.", unit: "proporção", deltaYears: 10 },
      { key: "idade_mediana", format: "years", label: metricLabel("idade_mediana"), hint: "Idade que divide a população em duas metades.", unit: "anos", deltaYears: 10 },
    ],
    charts: [
      {
        kind: "pyramid",
        title: "Pirâmide etária",
        granularity: "idade",
        compare: true,
        animate: true,
        description: "Homens à esquerda e mulheres à direita, por idade simples. O contorno compara outro ano.",
        span: 8,
      },
      { kind: "context", title: "Contexto", description: "Referência do Censo 2022.", span: 4 },
      {
        kind: "heatmap",
        title: "Idade por ano",
        description: "Densidade da população por idade ao longo de 2000–2070.",
        span: 12,
      },
      { kind: "facts", title: "Fatos", description: "Fatos do território.", span: 12 },
    ],
    tableColumns: ["ano", "idade", "sexo", "local", "sigla", "populacao", "is_outlier"],
  },
  {
    id: "ds2",
    filters: ["territorio", "ano", "sexo"],
    showCensoReference: false,
    kpis: [
      { key: "maior_grupo", format: "decimal", label: "Maior grupo etário", hint: "Grupo quinquenal com mais pessoas no ano selecionado.", unit: "grupo" },
      { key: "pop_0_4", format: "int", label: "População 0–4", hint: "Pessoas no grupo de 0 a 4 anos.", unit: "pessoas", deltaYears: 10 },
      { key: "pop_80", format: "int", label: "População 80+", hint: "Pessoas com 80 anos ou mais.", unit: "pessoas", deltaYears: 10 },
      { key: "razao_80_0_4", format: "decimal", label: "Razão 80+/0–4", hint: "Quantas pessoas de 80+ existem para cada pessoa de 0 a 4 anos.", unit: "razão", deltaYears: 10 },
    ],
    charts: [
      {
        kind: "pyramid",
        title: "Pirâmide quinquenal",
        granularity: "quinquenal",
        compare: true,
        description: "Comparação de 2000, do ano escolhido e de 2070.",
        span: 8,
      },
      { kind: "context", title: "Contexto", description: "Indicadores do território no ano selecionado.", span: 4 },
      {
        kind: "area100",
        title: "Composição por grandes faixas",
        series: [
          { key: "jovem", format: "percent" },
          { key: "ativa", format: "percent" },
          { key: "idosa", format: "percent" },
        ],
        description: "Participação de 0–14, 15–59 e 60+ ao longo do tempo.",
      },
      { kind: "facts", title: "Fatos", description: "Fatos do território.", span: 12 },
    ],
    tableColumns: ["ano", "grupo_etario", "sexo", "local", "populacao", "is_outlier"],
  },
  {
    id: "ds3",
    filters: ["territorio", "ano"],
    showCensoReference: true,
    kpis: [
      { key: "p_0_14_t", format: "percent", label: metricLabel("p_0_14_t"), hint: "Proporção de crianças e adolescentes até 14 anos.", unit: "proporção", deltaYears: 10 },
      { key: "p_15_64_t", format: "percent", label: "15–64 anos", hint: "Proporção da população em idade potencialmente ativa.", unit: "proporção", deltaYears: 10 },
      { key: "p_65_mais_t", format: "percent", label: "65 anos ou mais", hint: "Proporção de pessoas com 65 anos ou mais.", unit: "proporção", deltaYears: 10 },
      { key: "p_80_mais_t", format: "percent", label: "80 anos ou mais", hint: "Proporção de pessoas com 80 anos ou mais.", unit: "proporção", deltaYears: 10 },
    ],
    charts: [
      {
        kind: "line",
        title: "0–14 e 60+",
        series: [young, old],
        markCrossing: ["p_0_14_t", "p_60_mais_t"],
        description: "Proporções de jovens e de idosos, com o ano em que 60+ ultrapassa 0–14.",
        span: 8,
        refBrazil: true,
      },
      { kind: "context", title: "Contexto", description: "Referência do Censo 2022.", span: 4 },
      {
        kind: "ranking",
        title: "UFs por % de 60+",
        level: "uf",
        metricOptions: [{ key: "p_60_mais_t", format: "percent", label: "60 anos ou mais" }],
        description: "Participação da população de 60 anos ou mais em cada UF.",
        span: 6,
      },
      {
        kind: "map",
        title: "Mapa por UF",
        metric: "p_60_mais_t",
        format: "percent",
        description: "Onde a parcela de idosos é maior ou menor.",
        span: 6,
      },
      {
        kind: "slope",
        title: "Quem mudou mais",
        metric: "p_60_mais_t",
        format: "percent",
        description: "Variação da parcela de 60+ entre 2000 e o ano selecionado.",
        span: 6,
      },
      {
        kind: "bonus",
        title: "Bônus demográfico",
        description: "Razão de dependência total e a janela em que ela é mínima.",
        span: 6,
      },
      { kind: "facts", title: "Fatos", description: "Fatos do território.", span: 12 },
    ],
    tableColumns: ["ano", "local", "sigla", "pop_t", "n_0_14_t", "n_60_mais_t", "p_60_mais_t", "is_outlier"],
  },
  {
    id: "ds4",
    filters: ["territorio", "ano"],
    showCensoReference: true,
    kpis: [
      { key: "e0_t", format: "years", label: metricLabel("e0_t", true), hint: "Anos que se espera viver ao nascer.", unit: "anos", deltaYears: 10 },
      { key: "tft", format: "decimal", label: metricLabel("tft", true), hint: "Número médio de filhos por mulher.", unit: "filhos por mulher", deltaYears: 10 },
      { key: "tmi_t", format: "permil", label: metricLabel("tmi_t", true), hint: "Óbitos de menores de 1 ano para cada mil nascidos vivos.", unit: "por mil", deltaYears: 10 },
      { key: "ie60", format: "decimal", label: metricLabel("ie60", true), hint: "Idosos de 60 anos ou mais para cada 100 pessoas de 0 a 14 anos.", unit: "índice", deltaYears: 10 },
    ],
    charts: [
      {
        kind: "line",
        title: "Esperança de vida ao nascer",
        series: [
          { key: "e0_h", format: "years" },
          { key: "e0_m", format: "years" },
        ],
        description: "Quantos anos homens e mulheres vivem, em média",
        span: 8,
        refBrazil: true,
      },
      { kind: "context", title: "Contexto", description: "Referência do Censo 2022.", span: 4 },
      {
        kind: "line",
        title: "Taxa de fecundidade total",
        series: [{ key: "tft", format: "decimal" }],
        refLine: { y: 2.1, label: "Reposição 2,1" },
        description: "TFT comparada ao nível de reposição de 2,1 filhos por mulher.",
        span: 6,
        refBrazil: true,
      },
      {
        kind: "area",
        title: "Crescimento vegetativo",
        series: [
          { key: "tbn", format: "decimal" },
          { key: "tbm", format: "decimal" },
        ],
        description: "Taxa bruta de natalidade e de mortalidade, com a área do crescimento vegetativo entre elas.",
        span: 6,
      },
      {
        kind: "map",
        title: "Mapa da esperança de vida",
        metric: "e0_t",
        format: "years",
        description: "Onde se vive mais e onde se vive menos.",
        span: 4,
      },
      {
        kind: "scatter",
        title: "Vida longa e fecundidade",
        description: "Esperança de vida e filhos por mulher. O tamanho da bolha é a população.",
        span: 4,
      },
      {
        kind: "slope",
        title: "Quem mudou mais a esperança de vida",
        metric: "e0_t",
        format: "years",
        description: "e0 em 2000 e no ano selecionado, por UF.",
        span: 4,
      },
      {
        kind: "diverging",
        title: "Mulheres e homens",
        description: "Quantos anos as mulheres vivem a mais ao nascer e aos 60.",
        span: 6,
      },
      {
        kind: "ranking",
        title: "Ranking de UFs",
        level: "uf",
        metricOptions: [
          { key: "e0_t", format: "years", label: metricLabel("e0_t") },
          { key: "tft", format: "decimal", label: metricLabel("tft") },
          { key: "tmi_t", format: "permil", label: metricLabel("tmi_t") },
          { key: "ie60", format: "decimal", label: metricLabel("ie60") },
          { key: "id_med", format: "years", label: "Idade mediana" },
        ],
        description: "As 27 UFs ordenadas pelo indicador escolhido.",
        span: 6,
      },
      { kind: "facts", title: "Fatos", description: "Fatos do território.", span: 12 },
    ],
    tableColumns: ["ano", "local", "sigla", "pop_t", "e0_t", "tft", "tmi_t", "ie60", "is_outlier"],
  },
  {
    id: "ds5",
    filters: ["territorio", "ano", "sexo"],
    showCensoReference: false,
    kpis: [
      { key: "e0", format: "years", label: metricLabel("e0"), hint: "Esperança de vida ao nascer (ex na idade 0).", unit: "anos" },
      { key: "e60", format: "years", label: metricLabel("e60"), hint: "Anos de vida que restam aos 60 anos.", unit: "anos" },
      { key: "nqx_0", format: "permil", label: metricLabel("nqx_0"), hint: "Óbitos por mil antes de completar 1 ano.", unit: "por mil" },
      { key: "lx_80", format: "decimal", label: metricLabel("lx_80"), hint: "De cada 100 nascidos, quantos chegam aos 80 anos.", unit: "de cada 100" },
    ],
    charts: [
      { kind: "lifeTable", title: "Curva de sobrevivência", metric: "lx", description: "lx de homens e mulheres por idade.", span: 8 },
      { kind: "context", title: "Contexto", description: "Indicadores da tábua no ano e sexo selecionados.", span: 4 },
      { kind: "lifeTable", title: "Probabilidade de morte", metric: "nqx", logY: true, compareYears: true, description: "Risco de morrer por idade, em escala logarítmica, em dois anos." },
      { kind: "lifeTable", title: "Esperança de vida por idade", metric: "ex", description: "ex de homens e mulheres por idade." },
      {
        kind: "diverging",
        title: "Diferença entre mulheres e homens",
        description: "Anos a mais de vida das mulheres ao nascer e aos 60, por UF.",
        span: 12,
      },
      { kind: "facts", title: "Fatos", description: "Fatos do território.", span: 12 },
    ],
    tableColumns: ["ano", "idade", "sexo", "local", "nqx", "lx", "ex", "is_outlier"],
  },
]

export function dashboardById(id: string | undefined) {
  return dashboards.find((item) => item.id === id)
}

export const SERIES_LABELS: Record<string, string> = {
  jovem: "0–14",
  ativa: "15–59",
  idosa: "60+",
  p_0_14_t: "0–14",
  p_60_mais_t: "60+",
  e0_h: "Homens",
  e0_m: "Mulheres",
  tft: "Filhos por mulher",
  tbn: "Natalidade",
  tbm: "Mortalidade",
  pop_t: "População",
  populacao: "População",
}
