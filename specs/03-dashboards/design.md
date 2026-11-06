# Etapa 3: Design

## Dashboard dirigido por configuração
Um único `DatasetDashboardPage` renderiza qualquer dataset a partir de `features/datasets/dashboards.config.ts`:

```ts
type Metric = { key: string; format: 'int' | 'decimal' | 'percent' | 'permil' | 'years' };

type ChartSpec =
  | { kind: 'line' | 'area' | 'area100'; title: string; series: Metric[]; refLine?: { y: number; label: string };
      markCrossing?: [string, string]; markMax?: boolean; logY?: boolean; description: string }
  | { kind: 'pyramid'; title: string; granularity: 'idade' | 'quinquenal'; compare?: boolean; animate?: boolean; description: string }
  | { kind: 'lifeTable'; title: string; metric: 'lx' | 'nqx' | 'ex'; logY?: boolean; compareYears?: boolean; description: string }
  | { kind: 'ranking'; title: string; metricOptions: Metric[]; level: 'uf'; description: string };

type DashboardSpec = {
  id: 'ds1' | 'ds2' | 'ds3' | 'ds4' | 'ds5';
  kpis: (Metric & { label: string; hint: string; deltaYears?: number })[];   // 4 itens
  charts: ChartSpec[];
  filters: ('territorio' | 'ano' | 'sexo')[];
  showCensoReference: boolean;
  tableColumns: string[];   // prioridade; as primeiras ficam visíveis no mobile
};
```
Preencha os 5 specs conforme R3.1–R3.5. Rótulos e unidades vêm de `/datasets/{id}/metrics`.

## Componentes de gráfico (Recharts)
- `PopulationPyramid`: BarChart horizontal, com homens em valores negativos e eixo formatado em absoluto. A comparação aparece como uma segunda série só com contorno. Em ds1, agrupar rótulos do eixo a cada 10 anos. Cores: `--chart-1` (homens) e `--chart-2` (mulheres), dessaturadas.
- `ProjectionLine`: LineChart que divide a série em dois segmentos (observado/projetado, este com `strokeDasharray`) no ano atual, com `ReferenceLine` e `ReferenceDot` opcionais (pico, cruzamento).
- `LifeTableChart`: suporta `scale="log"` no eixo Y e comparação entre dois anos.
- `RankingBars`: barras horizontais com as 27 UFs, destacando a UF selecionada; as demais em `--muted-foreground`.
- Todos recebem `isAnimationActive={!reducedMotion}` e um `aria-label` gerado com um resumo textual (ex.: "População projetada atinge o pico de 220,4 milhões em 2041").

## Layout do dashboard (desktop)
```
PageHeader (nome · fonte · atualização · ações)
FilterBar (território · ano · sexo)
[KPI][KPI][KPI][KPI]
[Gráfico principal 2/3        ][Referência Censo / Fatos 1/3]
[Gráfico 2          ][Gráfico 3            ]
Notícias que confirmam (3 cards)
DataTable
```
No mobile: coluna única, com o slider de ano fixo no topo da pirâmide.

## Dados
- Query keys: `['dataset', id, 'summary', filtros]`, `['dataset', id, 'pyramid', cod, sexo]` (busca **todos os anos** de uma vez para o slider ser instantâneo), `['dataset', id, 'claims']`, `['dataset', id, 'news']`, `['censo', cod]`, `['quality', id, source]`.
- Filtros ↔ URL via `useSearchParams`; território padrão `cod=0`.

## Upload
`UploadDialog` → `/upload` → `/process` → exibe o `QualityReport`. O stepper reflete cada resposta. A confirmação de `cap`/`remove` usa `AlertDialog`.

## Entrega
`apps/web/Dockerfile` multi-stage → nginx com fallback de SPA e proxy `/api`. Compose final: `web`, `api`, `mysql`.
