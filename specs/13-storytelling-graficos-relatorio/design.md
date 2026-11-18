# Etapa 13: Desenho

## Mapa dos anexos do pedido
Capturas em `anexos/`. Os anexos 6 e 7 estão na mesma imagem, `06-07-mulheres-homens-e-ranking.png`: à esquerda o 7, à direita o 6.

| Anexo | Página | Gráfico (config) | Requisito |
|---|---|---|---|
| 1 | Grupos etários (ds3) | `ranking` "UFs por % de 60+" | R5.1 |
| 2 | Grupos etários (ds3) | `slope` "Quem mudou mais" | R5.2 |
| 3 | Grupos etários (ds3) | `bonus` "Bônus demográfico" | R5.3 |
| 4 | Indicadores (ds4) | `line` "Esperança de vida ao nascer" | R6.1 |
| 5 | Indicadores (ds4) | `line` "Filhos por mulher" | R6.2 |
| 6 | Indicadores (ds4) | `ranking` "Ranking de UFs" | R6.3 |
| 7 | Indicadores (ds4) e Tábuas (ds5) | `diverging` "Mulheres e homens" e "Diferença entre mulheres e homens" | R7 |

## Storytelling
- `content/storytelling.ts`: `Record<PageId, { tecnico: string; simples: string }>`.
- `components/common/StoryBlock.tsx` lê o modo em `stores/preferences.ts`.
- Usado em `DatasetDashboardPage.tsx` (depois do `<Headline>`), em `features/overview/page.tsx`, em `features/quality/page.tsx` e em `features/simple/SimplePage.tsx`.
- Estilo: `text-base text-muted-foreground`, borda esquerda de 2 px na cor do acento, título pequeno "Por que isso importa".

## Filtros
- Remover de `useEffectiveFilters` a sobreposição `selection.uf → cod`, `selection.ano → ano` e `selection.sexo → sexo`. O efetivo passa a ser igual a `useDashboardFilters()`.
- `CrossSelection` fica `{ faixa?: string[] }`, mais o hover. Os pontos que chamavam `toggle("uf" | "ano" | "sexo")` passam a chamar `filters.setCod`, `setAno` e `setSexo` (via um hook `useFilterActions()`).
- Região: `setCod(codRegiao)`. A matriz decide o "só UFs da região".
- `hooks/useTerritory.ts` lê e grava `cod` na URL.
- `lib/navLink.ts`: `withFilters(to)` copia `cod`, `ano` e `sexo` da URL atual. Use em Sidebar, MobileDrawer, busca, ActionStrip, links do Headline e chips.
  - Os parâmetros `sel_*` antigos são lidos uma vez e convertidos para `cod`, `ano` e `sexo`, para links salvos continuarem funcionando, e depois removidos.
- `FilterChipsBar` usa `territories` para mostrar o nome e o padrão de cada filtro. Só mostra chip quando o filtro difere do padrão.
- Matriz: tipo `FilterReaction = "filtra" | "destaca" | "nao_se_aplica"`; cada entrada do config ganha `filters: { territorio, ano, sexo }`. Os padrões por `kind` vêm da tabela de R2.4, com `defaultsFor(kind)`, e o config só sobrescreve exceções.
- `ChartCard` recebe `filters` (rótulos já resolvidos) e renderiza o rodapé de R2.5.

## Tooltip
- `components/ui/chart.tsx`, `ChartTooltipContent`: deduplicar o payload por `baseKey`, a chave sem os sufixos `_obs`, `_proj`, `_dash` e `_solid`. Usar o primeiro valor não nulo.
- Ano maior que o ano corrente → acrescentar " (projeção)".
- `ReferenceLine` e `ReferenceArea` não entram no payload. Conferir que nenhuma série invisível foi criada só para desenhar rótulo.

## Paleta
- Em `styles/*.css`, substituir `--chart-1..6`. Ponto de partida, a ajustar até passar o teste de contraste:

| Token | Claro | Escuro |
|---|---|---|
| chart-1 | 214 62% 40% | 214 75% 70% |
| chart-2 | 170 60% 28% | 170 50% 58% |
| chart-3 | 36 85% 38% | 36 85% 62% |
| chart-4 | 345 58% 44% | 345 70% 72% |
| chart-5 | 262 42% 50% | 262 60% 76% |
| chart-6 | 200 12% 34% | 200 10% 78% |

- `--chart-seq-1..5` ganham mais amplitude de luminosidade (de 90% a 25% no claro).
- Semânticos em `lib/chartDefaults.ts`: `SEX_COLORS = { homens: chart-1, mulheres: chart-4 }`, `BAND_COLORS = { "0-14": chart-2, "15-64": chart-6, "60+": chart-3 }`.
- `lib/contrast.test.ts` lê os tokens dos CSS, converte HSL para luminância relativa e compara com `--card` nos dois temas.
- Na regra `.cursor/rules/01-project.mdc`, a frase da paleta passa a abrir exceção para os gráficos.

## Eixos e rótulos
- `lib/chartDefaults.ts`:
  - `xAxisDefaults = { tickMargin: 8, padding: { left: 12, right: 12 } }`;
  - `yAxisDefaults = { tickMargin: 8, width: "auto" }`.
- `chart-axes.ts`:
  - `niceTicks(min, max, count)` com passos 1, 2 e 5 × 10ⁿ;
  - `valueDomain(values)`: `[0, max]` sem negativo e simétrico com negativo.
- `labelPlace.ts`: `placeReferenceLabels(labels[])` recebe `{x, y, width, height}` estimados e desloca na vertical até não haver interseção. Teste com o caso Covid e Projeção.

## Barras verticais por UF (ranking, slope e divergente)
- Novo `components/charts/UfColumns.tsx`, que substitui as barras horizontais de `RankingBars.tsx`, o `SlopeChart.tsx` e o `DivergingBars.tsx`.
- Props:
  - `rows: {cod, sigla, valores: {serie: number}}[]`;
  - `series: {key, label, color}[]`;
  - `format`, `selectedCods`, `zones?` (R6.2), `sort: "desc"` e `onSelect(cod)`.
- Ticks das siglas: rotação de −45° quando a largura por UF for menor que 28 px.
- Time-lapse:
  - `components/charts/YearPlayer.tsx` com slider, play/pausa e rótulo do ano. Usa `requestAnimationFrame` com passo de 600 ms e para em 2070.
  - Pausar ou soltar o slider → `setAno`.
  - Os dados por ano vêm da mesma consulta já usada pelo slope (todas as UFs × anos). Sem consulta nova por frame: o ano é filtrado no cliente.
- Divergente: duas séries agrupadas e `valueDomain`.

## Zonas
- `lib/zones.ts`: `zonesFor(metricId): {label, from, to, status}[] | null`, a partir de `KPI_RULES` com `basis: "value"`.
  - Os limites abertos usam o domínio do eixo.
  - Rótulos: "Zona Segura", "Zona de Atenção" e "Zona Crítica".
- `ProjectionLine` e `UfColumns` desenham `ReferenceArea y1/y2` atrás das séries (`ifOverflow="hidden"`), com `fillOpacity` 0,14. A legenda das zonas fica no rodapé do card.

## Mapa
- `BrazilMap.tsx`: estilo por estado `selecionado`, `contexto` (outros com seleção) e `normal` (sem seleção), conforme R8.1.
  - A borda usa `hsl(var(--foreground))` no selecionado e `hsl(var(--muted-foreground))` nos demais.
- Visões:
  - "Mapa" e "Contorno" continuam em d3-geo/SVG.
  - "Satélite" usa `maplibre-gl` (lazy `import()`, só ao escolher). Fonte raster de imagens: Esri World Imagery (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`), com a atribuição "Esri, Maxar, Earthstar Geographics".
  - As UFs vêm de `/geo/br-uf.json` como camadas `fill` (opacidade 0,35; 0,85 no selecionado) e `line`.
  - Encaixe no Brasil, sem rotação, zoom de 3 a 8.
- Falha de tile: `map.on("error")` com 3 erros seguidos → volta para "Mapa" e mostra o aviso.
- `preferences.ts`: `mapView: "mapa" | "contorno" | "satelite"`, padrão "mapa".
- Se houver CSP em nginx ou `vercel.json`, liberar `img-src` e `connect-src` para `server.arcgisonline.com`, e `worker-src blob:` para o maplibre.

## Relatório
- Dependências: `jspdf` e `jspdf-autotable` (lazy `import()` no clique). Imagens com o `html-to-image` já instalado, `pixelRatio` 2.
- `features/report/registry.ts`: um contexto onde cada `ChartCard` registra `{ id, title, description, help, filtersLabel, narrative, node: RefObject, table: { columns, rows } }`.
  - Cada gráfico informa `table` com os dados já usados no render, sem nova consulta.
  - KPIs, Fatos, Contexto, Headline, storytelling e notícias também se registram.
- `features/report/buildReport.ts` monta a estrutura, testável sem DOM.
- `features/report/renderPdf.ts`:
  1. desenha com jsPDF em A4 e margens de 15 mm;
  2. faz uma primeira passada para saber em que página cai cada seção;
  3. escreve o sumário na página 2 (reservada);
  4. termina com o rodapé "Página X de Y".
- Captura no tema claro: clonar o nó num contêiner fora da tela com `data-theme="light"` e as animações desligadas, sem alterar o painel visível.
- Marca: `public/brand/` (símbolo e wordmark em SVG → PNG via canvas).
- Botão: `components/common/ReportButton.tsx`, ao lado de "Baixar" no `PageHeader` das 7 páginas.

## Ajuda
- `help: { oQueMostra: string; comoLer: string }` obrigatório no tipo de cada entrada de gráfico.
- `ChartCard` sempre mostra o (?):
  - um popover com as duas frases, a linha "Filtros que afetam" (da matriz) e "Fonte: IBGE, Projeções da População, revisão 2024";
  - o link para o glossário quando houver `metricKey`.
- Os textos de ajuda são escritos pelo Cursor seguindo o tom do modo Técnico: frases curtas, sem número fixo.
