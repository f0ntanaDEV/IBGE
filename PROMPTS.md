# Prompts para o Cursor

Copie as pastas `.cursor/`, `specs/` e `assets/` para a raiz do projeto. Se o projeto ainda tiver as pastas `specs/04-…` a `specs/09-…`, apague-as: o efeito delas já está consolidado em `.cursor/rules/01-project.mdc`. Coloque as 5 planilhas em `data/raw/` com estes nomes:

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

## Prompt 10: Modos de navegação, acessibilidade, fatos, Insights e correções de backend

```
Atue como desenvolvedor Fullstack sênior, especialista em acessibilidade e Product Designer. Implemente a spec 10 seguindo @specs/10-modos-acessibilidade-insights/requirements.md, @specs/10-modos-acessibilidade-insights/design.md e @specs/10-modos-acessibilidade-insights/tasks.md. Use os conteúdos prontos de @specs/10-modos-acessibilidade-insights/conteudo sem reescrevê-los. Esta spec prevalece sobre as specs 01–03.
Comece pela primeira tarefa não marcada. Ao terminar cada tarefa, marque [x] e continue para a próxima, até concluir a spec ou encontrar um bloqueio.
```

---

**Se o Cursor parar no meio de uma etapa** (limite de contexto ou erro), abra um chat novo e reenvie o mesmo prompt: ele retoma da primeira tarefa sem `[x]`. Chats novos por etapa também economizam tokens.
