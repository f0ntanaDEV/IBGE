# Etapa 5: Design

## Dependências adicionais
`d3-geo` + `topojson-client` (mapa), `d3-scale` / `d3-scale-chromatic` (escalas; a paleta é derivada dos tokens, não as cores padrão do d3), `html-to-image` (exportar PNG/SVG). Nada de bibliotecas de gráfico além do Recharts; mapa e mapa de calor são componentes SVG próprios.

## Novos componentes (`components/charts/`)
| Componente | Base | Observações |
|---|---|---|
| `BrazilMap` | SVG + d3-geo | 5 classes por quantis; legenda em degraus; foco por teclado em cada UF (Tab/Enter) |
| `AgeYearHeatmap` | SVG `<rect>` (91 × 71 = 6.461 células → Canvas) | Escala sequencial de `--chart-seq-1..5`; o eixo marca o ano atual |
| `AnimatedScatter` | Recharts ScatterChart | Controle play/pausa/slider de ano; bolhas com `sqrt` da população |
| `SlopeChart` | Recharts LineChart com 2 pontos por UF | Rótulos à direita com resolução de colisão simples |
| `DemographicBonus` | `ProjectionLine` + `ReferenceArea` | A janela é calculada no backend (`/milestones`) |
| `SmallMultiples` | 5 × `ProjectionLine` compactas | `syncId` comum e domínio Y compartilhado |
| `DivergingBars` | Recharts BarChart horizontal | Zero central |
| `MilestonesTimeline` | HTML/CSS | Marcos clicáveis → `sel_ano` |

Tokens novos: `--chart-seq-1..5` (sequencial monocromática do acento) para os dois temas.

## Ampliação: `ExpandableChart`
```
ChartCard
 └─ ExpandButton → ChartDialog (Radix Dialog, 95vw × 90vh)
      ├─ Tabs: Gráfico | Tabela
      ├─ Toolbar: Redefinir zoom · Exportar PNG · Exportar SVG
      ├─ <Chart zoomable legendInteractive height="100%"/>
      └─ NarrativePanel
```
- O zoom guarda `[x0, x1]` em estado local; Recharts recebe `domain` e `allowDataOverflow`.
- A exportação clona o nó do gráfico, injeta cabeçalho e rodapé e chama `html-to-image` com a cor de fundo do tema ativo.

## Smart Narratives: `lib/narratives/`
```
lib/narratives/
├── types.ts          Insight, NarrativeContext
├── rules/            trend.ts, peak.ts, crossing.ts, rank.ts, vsBrazil.ts,
│                     biggestChange.ts, threshold.ts, sexGap.ts, projection.ts
├── templates.ts      frases por regra × visão (técnica | leiga)
├── grammar.ts        plural(), preposicaoTerritorio(), concordância
└── engine.ts         buildNarratives(ctx) → Insight[] ordenados
```
```ts
type NarrativeContext = {
  datasetId: string; chartId?: string; view: 'full' | 'simple';
  territorio: { cod: number; nome: string; nivel: string }; ano: number; sexo: string;
  selection: CrossSelection; zoom?: [number, number];
  data: unknown;                  // os mesmos dados já carregados pelos gráficos (sem novas requisições)
  brasil?: unknown;               // série do Brasil para comparação
};
type Insight = { type: string; relevance: number; text: string; highlight?: { chartId: string; x: number | string } };
```
- Cada regra é uma função pura `(ctx) => Insight | null`, com teste unitário.
- `templates.ts` tem pelo menos 2 variações de frase por regra e visão; a escolha usa um hash estável do contexto (determinística, sem repetição robótica entre gráficos vizinhos).
- `preposicaoTerritorio` usa uma tabela fixa com as 27 UFs, as regiões e o Brasil ("no Brasil", "na Região Norte", "em São Paulo", "no Rio de Janeiro", ...).
- Todos os números passam por `formatValue(…, view)`.

Exemplos (ds4, Minas Gerais, 2024):
- Técnica: "A TFT em Minas Gerais é de 1,48, a 9ª menor entre as 27 UFs e abaixo do nível de reposição desde 2004."
- Leiga: "Em Minas Gerais, cada mulher tem em média 1,5 filho, menos do que o necessário para a população se manter."
(Os valores acima são ilustrativos; os reais vêm dos dados.)

## Filtros cruzados: `stores/crossfilter.ts`
```ts
type CrossSelection = { uf?: number[]; regiao?: number[]; faixa?: string[]; ano?: number; sexo?: 'H' | 'M' };
type CrossFilterStore = { selection; sourceChartId?; hover?: { ano?: number };
  toggle(dim, value, opts: { multi: boolean; source: string }); clear(dim?); setHover(ano?) };
```
- Sincronia com a URL via `useCrossFilterUrl()`; os filtros globais (Etapa 3) e a seleção são combinados em `useEffectiveFilters()`, que alimenta as query keys.
- Cada spec de gráfico declara `emits: Dimension[]` e `accepts: Dimension[]`. Se uma dimensão selecionada não estiver em `accepts`, aparece o aviso da R4.6.
- O gráfico de origem não refaz a consulta: aplica apenas o destaque (`opacity` via `fill-opacity`).
- Hover sincronizado: `syncId="page"` nos gráficos Recharts de série temporal + `hover.ano` para os componentes próprios.
- `FilterChipsBar` fica fixa sob a `FilterBar`.

## Backend (`apps/api`)
- `analytics.py`: `map_values`, `heatmap`, `scatter`, `slope` e `milestones` (pico, cruzamento 60+ × 0–14, ano em que TFT < 2,1, ano em que `nasc_t < obt_t` e janela do bônus demográfico, isto é, o período em que a `rdt65` está abaixo de um limiar a definir e registrar em `DECISIONS.md`).
- Parsers de lista nos query params, com validação.
- Script `tools/build_geo.py`: baixa a malha uma vez, simplifica (mapshaper ou topojson) e grava em `apps/web/public/geo/br-uf.json`.

## Layout
Os novos gráficos ocupam os espaços vazios do grid de 12 colunas. Exemplo para ds4 em desktop:
```
[KPI×4]
[ProjectionLine e0 H×M 8][BrazilMap 4]
[AnimatedScatter 6      ][SlopeChart 6]
[SmallMultiples por região — 12      ]
[DivergingBars 6        ][TFT + reposição 6]
[Observações finais 12  ]
[Notícias 12] [DataTable 12]
```
