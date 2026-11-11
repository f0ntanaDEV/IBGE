# Spec 13: Tarefas

Execute uma por vez, marque `[x]` e continue. A spec 12 (Power BI) está descartada: não implemente nada dela.

## Confiabilidade primeiro (afeta a confiança em todo o resto)
- [x] **T13.1** Diagnosticar e corrigir o card Contexto vazio (altura e tempo de resposta) + pré-aquecimento. → R4.6
- [x] **T13.2** Revisar a regra de atípicos; medir na original e na suja; registrar os números. → R4.1
- [x] **T13.3** Validações coerentes, histórico com data e linhas, nulos sem colunas de engenharia, execução `sujo` em produção. → R4.2–R4.5
- [x] **T13.4** Formatação, rótulos dos Fatos, arredondamento único e narrativas. Testes de regex e de regras. → R4.7–R4.10
- [x] **T13.5** Relevância das notícias + lista curada. **Pare** e me mostre as URLs curadas para validação antes de concluir. → R4.11

## Métricas e atualização
- [x] **T13.6** `metricas.yaml` + `/metrics` + `formatValue`/`formatDelta` pelo dicionário + nomes únicos (sem siglas nos rótulos) + KPIs da ds5 na escala certa. → R6
- [x] **T13.7** Linha de atualização em todas as páginas de dados e notícias, com o "i" explicativo e o selo de revisão nova. → R5

## Negócio e storytelling
- [x] **T13.8** `kpi-rules` (frontend e backend) + `StatusBadge` + referência no KPI + popover com regra e ação + `ActionStrip`. Testes com os golden. → R3, R8.2
- [x] **T13.9** Cabeçalho com pergunta central e persona; manchete por página; reordenação da hierarquia (Fatos na base). → R1.2, R2, R7, R9
- [x] **T13.10** Página "Como ler este painel" com personas, perguntas, regras de status, atualização, dicionário e limitações. → R1.1, R3.6, R6.5

## Verificação
- [ ] **T13.11** E2E do R10.2 + teste da primeira dobra; suítes verdes; deploy.
- [ ] **T13.12** Reavaliar o app em produção e atualizar `avaliacao.md` com o novo status de cada critério. → R10.3
