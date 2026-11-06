# Etapa 7: Tarefas

Execute uma por vez, marque `[x]` e continue. Esta etapa **prevalece** sobre as anteriores onde houver conflito.

- [x] **T7.1** Setup do Playwright (`e2e/`) + teste de rolagem horizontal e fumaça de gráficos. Rodar e registrar as falhas atuais em `DECISIONS.md` (linha de base). → R8.1
- [x] **T7.2** `OverlayHost`, `CardModal`, `CardMenu`, `overlay-store`; `Card` e `<main>` como hospedeiros. → R1.1–R1.5
- [x] **T7.3** Migrar `GlossaryPopover`, `AlertDialog`s, `UploadDialog`, `WelcomeViewDialog` e demais popovers para `CardModal`; ajustar tooltips. Teste de rolagem horizontal verde. → R1.6, R1.7
- [x] **T7.4** Remover expansão (`ChartDialog`, botão, atalho `F`, `?expandido`, `layoutId` de expansão) e criar o menu "⋯" com "Ver como tabela" e "Exportar imagem". → R3
- [x] **T7.5** Diagnosticar por que as linhas não aparecem (Modo leve on/off, `dataKey`, domínio). Registrar a causa raiz em `DECISIONS.md`. → R2.1
- [x] **T7.6** `lib/chart-axes.ts` + correção do `ProjectionLine` (segmentos, eixos, "hoje", marcadores, rótulos diretos). Testes com os golden values. → R2.1–R2.8
- [x] **T7.7** Reescrever o render do `AgeYearHeatmap`. → R2.9
- [x] **T7.8** Narrativas com várias séries + KPI delta + faixas etárias. Testes. → R2.10–R2.12
- [ ] **T7.9** `useDrill`, `DrillBreadcrumb`, `DrillSpec` no `ChartCard` + integração com o crossfilter + URL + teclado. Testes. → R4.1
- [ ] **T7.10** Drill de território: mapa, rankings, slope, barras divergentes, dispersão e small multiples. → R4.3
- [ ] **T7.11** Drill de tempo e composição: população, e0 H × M, TFT, TBN × TBM, bônus demográfico e 0–14 × 60+. → R4.3
- [ ] **T7.12** Drill de idade e coorte: pirâmides, composição 100% e mapa de calor. → R4.3
- [ ] **T7.13** Drill na ds5, nos KPIs (sparkline), nos marcos e na Qualidade. → R4.3
- [ ] **T7.14** Remover busca (command palette, território, DataTable, Notícias) e trocar o território por `Select` agrupado. → R5
- [ ] **T7.15** Remover "Em poucas palavras". Tokens de espaçamento, `DashboardGrid` com `packRows`, `KpiRow`, `FilterBar` compacta; aplicar em todas as páginas e nas duas visões. → R6
- [ ] **T7.16** Sidebar recolhida: ícones centralizados, monograma "P", crossfade, toggle no rodapé. → R7
- [ ] **T7.17** Testes de layout E2E (linhas sem sobra, alturas iguais, sem card vazio) em todas as rotas × visões × larguras + screenshots em `e2e/__screenshots__/`. Suítes web, api e e2e verdes. → R6.2–R6.4, R8
