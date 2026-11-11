# Spec 11: Tarefas

Execute uma por vez, marque `[x]` e continue.

## Filtro de território
- [x] **T11.1** Escrever `e2e/territory.spec.ts` (matriz R1.9) e o teste da API com os 33 códigos; rodar no estado atual e registrar as falhas em `DECISIONS.md`. → R1.1, R1.9, R1.11
- [x] **T11.2** `useTerritory` como fonte única + `TerritorySelect` agrupado + persistência entre páginas + limpeza de seleção cruzada e drills. → R1.2–R1.5
- [x] **T11.3** `ufsForScope` nos gráficos por UF (mapa enquadrado, destaque da UF) + linha de referência do Brasil nos gráficos de série. → R1.6, R1.7
- [x] **T11.4** Tratamento de erros (422 claro, `ErrorState`); matriz E2E e testes da API verdes. → R1.8–R1.11

## Contexto
- [x] **T11.5** `services/context/` com todos os itens de `conteudo/contexto.md` + endpoint `/context` + testes golden (Brasil e Bahia 2026). → R2.2–R2.5, R2.8
- [x] **T11.6** Card Contexto no frontend + `focusChart` + `data-chart-id` em todos os `ChartCard` + layouts da linha 2 + itens no modo Simples. → R2.1, R2.6, R2.7

## Base de demonstração
- [x] **T11.7** Diagnóstico (checklist R3.1) e registro da causa em `DECISIONS.md`.
- [x] **T11.8** `make_dirty` sobre a base longa + reescrita no layout original + manifesto + `row_uid`; regenerar as 5 bases sujas. → R3.2
- [x] **T11.9** `QualityReport.manifest`, filtro por `source` (API e chaves de cache) e teste de integração de recuperação. → R3.1, R3.6
- [x] **T11.10** Página Qualidade: `?source`, comparação lado a lado e tabela "Inserido · Detectado · Corrigido" com selos. → R3.3–R3.5

## Insights
- [x] **T11.11** Transcrever `insights-explicacoes.md` para `content/insights.ts` (campos `why`, `keyNumbers`, `route`, `chartId`, `chartLabel`). → R4.1
- [x] **T11.12** Accordion sem animação, controles por seção, âncoras na URL, padrões como caixas e acessibilidade. → R4.1–R4.6

## Verificação
- [x] **T11.13** E2E do R5.2, screenshots do R5.3, suítes web, api e e2e verdes. → R5
