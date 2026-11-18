# Prompts para o Cursor

Copie as pastas `.cursor/`, `specs/` e `assets/` para a raiz do projeto. As etapas são as pastas `specs/01-` a `specs/13-`, na ordem do `specs/README.md`. Coloque as 5 planilhas em `data/raw/` com estes nomes:

| Arquivo original | Renomear para |
|---|---|
| `projecoes_2024_tab1_idade_simples.xlsx` | `tab1_idade_simples.xlsx` |
| `projecoes_2024_tab2_grupo_quinquenal.xlsx` | `tab2_grupo_quinquenal.xlsx` |
| `projecoes_2024_tab3_grupos_etarios_especificos.xlsx` | `tab3_grupos_etarios_especificos.xlsx` |
| `projecoes_2024_tab4_indicadores.xlsx` | `tab4_indicadores.xlsx` |
| `projecoes_2024_tab5_tabuas_mortalidade.xlsx` | `tab5_tabuas_mortalidade.xlsx` |

Use o modo Agent.

Os prompts são curtos de propósito: o conteúdo está nas specs e as regras de economia de tokens são carregadas automaticamente.

---

## Prompt 1: Backend e pipeline de dados

```
Atue como desenvolvedor Fullstack sênior. Implemente a Etapa 1 seguindo @specs/01-backend/requirements.md, @specs/01-backend/design.md e @specs/01-backend/tasks.md, com @specs/DATA_PROFILE.md como referência dos dados.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

## Prompt 2: Design system e base do frontend

```
Atue como desenvolvedor Frontend sênior e Product Designer. Implemente a Etapa 2 seguindo @specs/02-frontend-base/requirements.md, @specs/02-frontend-base/design.md e @specs/02-frontend-base/tasks.md.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

## Prompt 3: Dashboards, notícias e acabamento

```
Atue como desenvolvedor Fullstack sênior e Product Designer. Implemente a Etapa 3 seguindo @specs/03-dashboards/requirements.md, @specs/03-dashboards/design.md e @specs/03-dashboards/tasks.md, usando @datasets.yaml e @specs/DECISIONS.md como contexto.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

## Prompt 4: Modos de navegação, acessibilidade, fatos, Insights e correções de backend

```
Atue como desenvolvedor Fullstack sênior, especialista em acessibilidade e Product Designer. Implemente a Etapa 4 seguindo @specs/04-modos-acessibilidade-insights/requirements.md, @specs/04-modos-acessibilidade-insights/design.md e @specs/04-modos-acessibilidade-insights/tasks.md. Use os conteúdos prontos de @specs/04-modos-acessibilidade-insights/conteudo sem reescrevê-los. Esta etapa prevalece sobre as etapas 1–3.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a spec ou encontrar um bloqueio.
```

## Prompt 5: Filtros, contexto, base de demonstração e Insights

```
Atue como desenvolvedor Fullstack sênior. Implemente a Etapa 5 seguindo @specs/05-filtros-contexto-insights/requirements.md, @specs/05-filtros-contexto-insights/design.md e @specs/05-filtros-contexto-insights/tasks.md.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

## Prompt 6: Negócio, confiabilidade e storytelling

```
Atue como desenvolvedor Fullstack sênior. Implemente a Etapa 6 seguindo @specs/06-negocio-confiabilidade-storytelling/requirements.md, @specs/06-negocio-confiabilidade-storytelling/design.md e @specs/06-negocio-confiabilidade-storytelling/tasks.md.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

## Prompt 7: Animações opcionais

```
Atue como desenvolvedor Frontend sênior. Implemente a Etapa 7 seguindo @specs/07-animacoes-opcionais/requirements.md, @specs/07-animacoes-opcionais/design.md e @specs/07-animacoes-opcionais/tasks.md.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

## Prompt 8: Reavaliação em produção

```
Atue como desenvolvedor Fullstack sênior. Implemente a Etapa 8 seguindo @specs/08-negocio-confiabilidade-storytelling-v2/requirements.md, @specs/08-negocio-confiabilidade-storytelling-v2/design.md e @specs/08-negocio-confiabilidade-storytelling-v2/tasks.md. Esta etapa prevalece sobre a 6 nos pontos em que divergir.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

## Prompt 9: Ajustes da avaliação

```
Atue como desenvolvedor Fullstack sênior. Implemente a Etapa 9 seguindo @specs/09-ajustes-avaliacao/requirements.md, @specs/09-ajustes-avaliacao/design.md e @specs/09-ajustes-avaliacao/tasks.md, com @specs/DATA_PROFILE.md como referência dos dados.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

## Prompt 10: Rubrica de entrega

```
Atue como desenvolvedor Fullstack sênior. Implemente a Etapa 10 seguindo @specs/10-rubrica-entrega/requirements.md, @specs/10-rubrica-entrega/design.md e @specs/10-rubrica-entrega/tasks.md. O painel da rubrica é o Databricks, no lugar do Power BI.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

## Prompt 11: Finalização pela rubrica

```
Atue como desenvolvedor Fullstack sênior. Implemente a Etapa 11 seguindo @specs/11-finalizacao-rubrica/requirements.md, @specs/11-finalizacao-rubrica/design.md e @specs/11-finalizacao-rubrica/tasks.md. Esta etapa prevalece sobre a 10 na pasta silver, nas docstrings, na EDA e na leitura do MySQL pelo Databricks.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

## Prompt 12: Ressalvas finais

```
Atue como desenvolvedor Fullstack sênior. Implemente a Etapa 12 seguindo @specs/12-ressalvas-finais/requirements.md, @specs/12-ressalvas-finais/design.md e @specs/12-ressalvas-finais/tasks.md. Esta etapa prevalece sobre a 11 apenas nos arquivos citados. Não edite o Databricks.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

## Prompt 13: Storytelling, filtros, gráficos e relatório

```
Atue como desenvolvedor Frontend sênior. Implemente a Etapa 13 seguindo @specs/13-storytelling-graficos-relatorio/requirements.md, @specs/13-storytelling-graficos-relatorio/design.md e @specs/13-storytelling-graficos-relatorio/tasks.md. Esta etapa prevalece sobre as etapas 1–12 nos filtros, na paleta dos gráficos e no relatório. Apague specs/13-databricks-painel se a pasta existir.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a etapa ou encontrar um bloqueio.
```

---

**Se o Cursor parar no meio de uma etapa** (limite de contexto ou erro), abra um chat novo e reenvie o mesmo prompt: ele retoma da primeira tarefa sem `[x]`. Chats novos por etapa também economizam tokens.
