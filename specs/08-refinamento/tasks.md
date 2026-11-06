# Etapa 8: Tarefas

Execute uma por vez, marque `[x]` e continue. Esta etapa **prevalece** sobre todas as anteriores.

- [x] **T8.1** Remover a busca (checklist §1), incluindo `q` na API, `cmdk` e os testes; regenerar `packages/shared`. → R1
- [x] **T8.2** Remover o modo simplificado (checklist §2) e ajustar `formatValue`, o glossário, as narrativas e os nomes da sidebar. → R2
- [x] **T8.3** Remover `components/overlay/*`; criar `CardPopover` + `useCardSide`; migrar o glossário e o menu; voltar `UploadDialog`/`AlertDialog` ao padrão. → R3
- [x] **T8.4** Remover "Ver como tabela" e trocar o menu "⋯" pelo botão "Exportar imagem". → R4
- [x] **T8.5** Tokens de altura + `ChartCard`, `KpiCard`, `RankingBars` e `BrazilMap` adaptados à altura fixa. → R5
- [ ] **T8.6** Card "Contexto" (Censo + Fatos) + `packRows` restrito aos padrões + layouts de §5 em todas as páginas. → R6
- [x] **T8.7** Corrigir o mapa (winding + teste de área + legenda com limites). → R9.1
- [ ] **T8.8** Corrigir o ranking, o slope (formatador, níveis do drill, destaques) e o bônus demográfico. Testes com os valores de referência. → R9.2–R9.4
- [ ] **T8.9** Corrigir a Referência Censo 2022 e as unidades dos KPIs. → R9.5, R9.6
- [ ] **T8.10** `PageMotionProvider`, `usePageReady` e `usePageAnimation`; migrar todas as animações e remover staggers/delays. → R7
- [ ] **T8.11** Sidebar recolhida: diagnosticar e registrar a causa em `DECISIONS.md`; aplicar o markup de §7. → R8
- [ ] **T8.12** E2E: lado do popover, alturas, padrões de linha, rolagem, alinhamento da sidebar e sincronização das animações. Screenshots. Suítes web, api e e2e verdes. → R10
