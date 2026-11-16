# Etapa 9: Requisitos (Ajustes da avaliação de 14/11)

Origem: `specs/08-negocio-confiabilidade-storytelling-v2/avaliacao-2026-11-14.md`. Prevalece sobre as etapas anteriores. Não mexa no que já foi aprovado (público, perguntas, status, atualização, hierarquia, estabilidade).

## R1. Validações: tolerância para arredondamento da fonte (prioridade máxima)
As 10 validações que falham (Brasil = Σ regiões = Σ UFs para `nasc_*` e `obt_*` da ds4) têm diferença de 2 a 5 pessoas que **já existe na planilha original do IBGE** (arredondamento das projeções de fluxo; no máximo 0,0006%). A população (`pop_*`) bate exatamente.
- R1.1 Cada regra de validação ganha `tolerancia_abs` e `tolerancia_rel`, que vivem na **definição da regra** (não no código da checagem):
  - estoques (`pop_*` e somas da ds1): tolerância **0**;
  - fluxos (`nasc_*` e `obt_*`): **≤ 10 pessoas** ou **≤ 0,001%**, o que for maior.
- R1.2 Resultado com três estados: **ok** (diferença 0), **ok com arredondamento** (dentro da tolerância) e **falha** (acima da tolerância). Os dois primeiros contam como aprovados.
- R1.3 A lista mostra "ok com arredondamento · diferença máxima de 5 pessoas (0,0006%) · arredondamento da fonte IBGE" e um "i" explicando: "O IBGE arredonda nascimentos e óbitos de cada território; a soma das UFs pode diferir do total em poucas unidades".
- R1.4 Esperado: **113 de 113 aprovadas** (103 ok + 10 ok com arredondamento) e o status "Validações aprovadas" **Favorável**, igual na página e nos Fatos.
- R1.5 Teste: uma base com diferença de 50 pessoas em `nasc_t` deve dar **falha**; a base original deve dar 113/113.

## R2. Base de demonstração executada em produção
- R2.1 Diagnosticar por que `quality-report?source=sujo` retorna 404 em produção (registrar a causa em `DECISIONS.md`). Verificar: geração dos arquivos sujos no deploy, semeadura da fonte `sujo`, limpeza de execuções antigas (Novidades de 14/11: "versões antigas das bases tratadas saíram do disco"), que pode estar apagando a execução `sujo`.
- R2.2 A limpeza mantém **a execução mais recente de cada dataset e de cada fonte** (original e sujo).
- R2.3 O deploy executa a fonte `sujo` se ela não existir. A página mostra a comparação Inserido × Detectado × Corrigido (etapa 5) com todos os selos ok.
- R2.4 Os Fatos da Qualidade mostram "Base de demonstração (suja): N duplicatas removidas · M nulos imputados" com os números reais (nunca "0 · nulos imputados: 0" se houve execução).

## R3. Fatos: rótulos corretos
Formato obrigatório: `valor principal · rótulo: valor · rótulo: valor`. O rótulo descreve o que o valor é; o ano de referência (2026) **nunca** é usado como rótulo de um valor de 2026. Correções:

| Página | Hoje | Correto |
|---|---|---|
| Visão Geral | 199.228.708 · 2070: −9,6% | 199.228.708 · −9,6% em relação ao pico |
| Indicadores | Queda na pandemia 72,78 anos · 2019: 76,22 · 2021: −3,44 anos | 76,22 (2019) → 72,78 (2021) · queda de 3,44 anos |
| Indicadores | Mortalidade infantil 11,83 por mil · 2000: 28,13 · 2026: −57,9% | 11,83 por mil · em 2000: 28,13 · queda de 57,9% |
| Indicadores | Nascimentos e óbitos 11,17 por mil · 2026: 7,26 por mil | nascimentos 11,17 · óbitos 7,26 por mil |
| Grupos etários | RS · 2026: 21,8% | RS · 21,8% |
| Tábuas | Risco 20–24 (H · M) 10,85 por mil · 2026: 2,67 por mil | homens 10,85 · mulheres 2,67 por mil |
| Tábuas | Maior excesso de mortalidade masculina 20–24 · 2026: 4,07 | 20–24 anos · 4,07× |
| Tábuas | Chegam aos 80: 2000 → 2070 · 71,8 · 2000: 40,7 | 40,7 (2000) → 71,8 (2070) |
| População por idade | 2.386.874 · 2000: 3.423.475 · 2026: 2.386.874 · 2070: 1.485.716 | 2.386.874 · em 2000: 3.423.475 · em 2070: 1.485.716 |
| Grupos quinquenais | (mesmo padrão para 0–4, 80+ e razão 80+/0–4) | remover o valor de 2026 repetido |
| Grupos quinquenais | 90+ · 2070: 576% / 05–09 · 2070: −43,8% | 90+ · +576,0% até 2070 / 05–09 · −43,8% até 2070 |
| População por idade | Homens para cada 100 mulheres com 90+: 48,20 | 48,2 |

- R3.1 Teste automatizado: para cada página × Brasil e Nordeste, nenhum fato pode conter (a) o mesmo número duas vezes, (b) o rótulo "2026:" quando o ano de referência é 2026, (c) mais casas decimais do que as definidas no dicionário.

## R4. Consistência de métricas
- R4.1 **Idade mediana**: há duas medidas com o mesmo nome. A oficial (`id_med` da ds4: Brasil 36,1; Bahia 36,4) passa a ser a **única** chamada "Idade mediana", com 1 casa, em KPI, manchete, Contexto e Fatos de todas as páginas. A calculada pela distribuição por idade simples vira "Idade central da distribuição (em anos completos)" e aparece só nos Fatos da População por idade, com o "i": "Calculada com idades inteiras; pode diferir da idade mediana oficial".
- R4.2 Percentuais sempre com **1 casa**: "65 anos ou mais **12,0%**", "2000: **6,0%**" (corrigir onde o zero final some).
- R4.3 Faixas etárias com meia-risca em **todos** os lugares: "40–44" (KPI e manchete da Grupos quinquenais).
- R4.4 Contexto sem valor repetido: "Idade com mais pessoas: 41 anos" (não "41 · 41 anos"); "Idade mediana: 36,1 anos".
- R4.5 Eixos:
  - ranking de UFs com ticks na unidade sem casas desnecessárias ("0 anos", "25 anos"…);
  - curva de sobrevivência na mesma escala do KPI ("de cada 100": 0 a 100);
  - eixo de população com espaço ("100 mi", não "100mi").
- R4.6 Subtítulos sem siglas: "Sobreviventes de cada 100 nascidos, por idade (homens e mulheres)" no lugar de "lx de homens e mulheres por idade"; "Anos de vida restantes por idade (homens e mulheres)" no lugar de "ex de homens e mulheres por idade".
- R4.7 Narrativas com o nome da métrica em minúscula no meio da frase e sujeito correto: "No Brasil, a população cresce 14% entre 2000 e 2070"; "Entre os anos observados, no Brasil, o número de filhos por mulher cai 35,4%". Teste: nenhuma narrativa tem palavra iniciada em maiúscula logo após vírgula, exceto nomes próprios de territórios.

## R5. Manchetes que respondem à pergunta da página
| Página | Pergunta | Manchete (modelo dinâmico) | Brasil 2026 | Bahia 2026 |
|---|---|---|---|---|
| População por idade | …onde estará a demanda por serviços? | "Hoje, **{p60}%** da população tem 60 anos ou mais; em 2040 serão **{p60_2040}%**. A demanda se desloca para adultos e idosos." | 17,1% → 24,3% | 16,6% → 25,1% |
| Grupos quinquenais | Quais faixas etárias crescem e quais encolhem? | "Até 2070, o grupo de **{g_max}** cresce **{v_max}%**, e o de **{g_min}** encolhe **{v_min}%**." | 90+ +576,0% · 5–9 −43,8% | 90+ +542,0% · 5–9 −49,7% |
| Indicadores | (corrigir texto) | "Vivemos **{e0}** anos em média, e cada mulher tem **{tft} filho(s)**, abaixo da reposição de 2,1." | 77,03 · 1,51 filho | — |
- R5.1 O ano-base da manchete é o ano selecionado; o horizonte da Grupos quinquenais é 2070, e o da População por idade, ano + 14 (2040 quando o ano é 2026), limitado a 2070.
- R5.2 "filho" no singular quando o valor for < 2.
- R5.3 Testes golden com os valores da tabela.

## R6. Contexto mais rápido fora do Brasil
- R6.1 A primeira chamada de `/context?page=ds1` para Bahia e Nordeste levou mais de 6 s. Meta: < 1 s no p95, para os 33 territórios, com cache aquecido no deploy para o ano atual (`page × cod`) e cálculo sob demanda com cache nos demais anos.
- R6.2 Teste: medir o `/context` para os 33 códigos em todas as páginas após o deploy; falha se algum passar de 2 s.

## R7. Painel Databricks acessível
Hoje a página mostra só a tela de **login** do Databricks; visitantes não veem nada.
- R7.1 Verificar, na documentação atual do Databricks, a forma de incorporar dashboards de AI/BI para **usuários externos** (sem conta no workspace). Registrar em `DECISIONS.md` o método escolhido.
- R7.2 Se houver incorporação externa: implementar pelo backend (service principal, token de curta duração gerado por endpoint `/api/v1/databricks/embed`, segredos só no servidor) e carregar o dashboard sem login.
- R7.3 Se não houver, ou enquanto não estiver configurado: a página **não** mostra o iframe de login. Mostra um card com o que o painel contém, uma **prévia estática** (capturas das páginas do dashboard, atualizadas a cada publicação) e o botão "Abrir no Databricks (requer acesso)".
- R7.4 Configuração por variáveis de ambiente (`DATABRICKS_EMBED_MODE=external|login|preview`); padrão `preview`.

## R8. Itens de decisão
- R8.1 **Busca**: a barra "Buscar página ou território" voltou, revertendo uma decisão registrada ("sem busca"). **Pare e me pergunte** se ela deve permanecer; registre a resposta em `DECISIONS.md` e atualize `.cursor/rules/01-project.mdc`.
- R8.2 **Nome**: a aba do navegador mostra "Analytics". Usar "Projeções IBGE" no título das páginas (`{Página} · Projeções IBGE`) e no nome do painel.

## R9. Verificação
- R9.1 Suítes web, api e e2e verdes.
- R9.2 E2E:
  - Qualidade com 113/113 e Favorável;
  - base de demonstração com selos ok;
  - testes de Fatos (R3.1);
  - manchetes golden (R5);
  - idade mediana igual em todas as páginas (36,1 no Brasil);
  - nenhum "lx"/"ex"/"TFT" em títulos ou subtítulos;
  - Painel Databricks sem tela de login;
  - tempo do `/context` (R6.2).
- R9.3 Atualizar a página Novidades com as mudanças desta spec.
- R9.4 Reavaliar com a tabela de `avaliacao-2026-11-14.md` e salvar como `avaliacao-<data>.md`.
