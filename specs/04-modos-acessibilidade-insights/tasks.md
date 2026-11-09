# Spec 10: Tarefas

Execute uma por vez, marque `[x]` e continue. Comece pelo backend: as correções destravam o frontend.

## Backend
- [x] **T10.1** Reproduzir o erro "Brasil → outro → Brasil" com teste de integração; registrar a causa; corrigir com `territory_params` e `is None`; regressão para todos os endpoints com `cod`. → R9.1–R9.4
- [x] **T10.2** Diagnosticar a Qualidade sem estatísticas (checklist R8.1); registrar a causa; aplicar o contrato `QualityReport` + `source`; regenerar `packages/shared`. → R8.1, R8.2
- [x] **T10.3** Semeadura automática (`AUTO_SEED`, `make seed`, `seeding` no `/health`) + teste de integração. → R8.3, R8.5
- [x] **T10.4** `services/facts/` com todos os fatos de `conteudo/fatos.md` + endpoint `/facts` + validação de `cod` (0–5) + cache. Testes golden (Brasil e Nordeste). → R10

## Frontend: correções
- [x] **T10.5** Frontend do bug de território (`cod != null`, helper de query, limpeza de seleção cruzada/drill, `ErrorState`) + E2E de regressão. → R9.3, R9.5
- [x] **T10.6** Página Qualidade consumindo o contrato novo, com estados vazio e "processando". → R8.4
- [x] **T10.7** Anos sem separador (`kind: 'year'`, `formatAxis`, DataTable, selects, slider, narrativas) + teste E2E com a regex. → R3

## Frontend: novidades
- [x] **T10.8** Store `contrast`/`mode` + script anti-flash + página Configurações com o novo layout. → R1.1–R1.3, R2.1, R7
- [x] **T10.9** Tokens de alto contraste, variante `hc:`, `useChartTheme` (traços, marcadores, paleta), mapas com classes, `forced-colors`. Rodar axe e ajustar até zerar as violações. → R1.4–R1.7
- [x] **T10.10** `formatValue(…, mode)` com as regras do modo Simples. Testes unitários da tabela R2.3. → R2.3
- [x] **T10.11** `FactsCard` + `useFacts` (último território válido) + remoção dos fatos do card Contexto + layouts de design §5. → R4
- [x] **T10.12** Modo Simples: `SimplePage`, `UnderstandBlock`, as 9 categorias, textos fixos por página e Qualidade simples. → R2.2, R2.4–R2.6
- [x] **T10.13** Página Insights: transcrição de `conteudo/insights.md` e `conteudo/padroes.md` para `content/insights.ts`, rota, item na sidebar e teste de linhas. → R5
- [x] **T10.14** Rodapé com @f0ntanaDEV, favicon (copiar `assets/favicon/` para `public/` e as tags no `index.html`) e "Ler notícia" no canto inferior direito. → R6

## Verificação
- [ ] **T10.15** E2E do R11.2, screenshots do R11.3, suítes web, api e e2e verdes. Registrar em `DECISIONS.md` as causas encontradas em T10.1 e T10.2. → R11
