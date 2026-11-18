# Etapa 13: Tarefas

Execute uma por vez. Ao concluir, marque `[x]`, rode o teste citado e pare. Comece apagando `specs/13-databricks-painel/`, se existir.

## Base
- [x] **T13.1** Filtros com fonte única:
  - `useEffectiveFilters` sem sobreposição e `CrossSelection` só com faixa e hover;
  - `useFilterActions`, `withFilters` em toda navegação e conversão dos `sel_*` antigos;
  - chips com nomes e padrões.

  Rodar `npm test -w @ibge/web` e o e2e de território. → R2.1–R2.3, R2.6
- [x] **T13.2** Matriz `filters` por gráfico com `defaultsFor(kind)`, aplicação de `filtra`/`destaca`/`nao_se_aplica` em todos os tipos, rodapé de filtros no `ChartCard` e teste da matriz. → R2.4, R2.5
- [x] **T13.3** Paleta nova, cores semânticas, `lib/contrast.test.ts`, espessura e grade, `chartDefaults` com espaço na origem, `niceTicks` e ajuste na regra `01-project.mdc`. → R4.1, R4.2, R4.4–R4.6
- [x] **T13.4** Tooltip sem duplicata e "(projeção)", mais o teste. Colisão de rótulos de referência em `labelPlace.ts` (caso Covid e Projeção). → R3, R6.1

## Gráficos
- [x] **T13.5** Legenda ou rótulo direto em todo gráfico com mais de uma série. Cabeçalho "← Homens | Mulheres →" nas pirâmides e legenda com percentual na area100. → R4.3
- [x] **T13.6** `UfColumns` substituindo `RankingBars`, `SlopeChart` e `DivergingBars`, com seleção via `setCod`. Inclui "UFs por % de 60+", "Ranking de UFs" e os dois divergentes, com `valueDomain`. → R5.1, R6.3, R7
- [x] **T13.7** `YearPlayer` e time-lapse nos dois slope, sincronizado com `ano`. → R5.2
- [x] **T13.8** Bônus demográfico sem janela e com a frase única. Zonas de alerta (`lib/zones.ts`) em linhas e colunas, com legenda e rótulos. → R5.3, R6.2

## Mapa
- [x] **T13.9** Estilos selecionado, contexto e normal no `BrazilMap`, mais o teste de estilo por estado. → R8.1, R8.4
- [x] **T13.10** Seletor Mapa/Contorno/Satélite, preferência `mapView`, maplibre lazy com Esri World Imagery, atribuição, fallback e CSP se houver. → R8.2, R8.3

## Textos
- [x] **T13.11** `content/storytelling.ts` copiado de `conteudo/storytelling.md`, `StoryBlock` nas 7 páginas e no modo Simples, com a animação da etapa 7 e o teste. → R1
- [x] **T13.12** Campo `help` obrigatório, textos de ajuda de todos os gráficos, (?) sempre visível com filtros e fonte, e o teste de cobertura. → R10

## Relatório
- [x] **T13.13** Registry de gráficos, KPIs, textos e notícias. `buildReport` com o teste da estrutura (ordem, sumário e anexos). → R9.2, R9.6
- [x] **T13.14** `renderPdf` (jsPDF + autotable lazy, captura no tema claro, sumário, rodapé), `ReportButton` nas 7 páginas, progresso, modo Simples e e2e do download. → R9

## Fechamento
- [x] **T13.15** Conferir no navegador (desktop e 375 px, claro, escuro e alto contraste) as 7 páginas e os 7 anexos do pedido. Atualizar as capturas de `docs/screenshots/` que mudaram, adicionar uma linha em `DECISIONS.md` e o prompt 13 no README igual ao do `PROMPTS.md`. Rodar a suíte completa (`npm test`, `pytest` e `npx playwright test`). → todos
