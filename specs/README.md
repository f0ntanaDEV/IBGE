# Specs

Desenvolvimento orientado a especificação, em 3 etapas. Cada etapa tem:

| Arquivo | Conteúdo |
|---|---|
| `requirements.md` | O quê: histórias e critérios de aceite (formato QUANDO/ENTÃO), com IDs |
| `design.md` | Como: arquitetura, contratos, decisões técnicas |
| `tasks.md` | Checklist executável; cada tarefa cita os requisitos que atende |

| Etapa | Pasta | Escopo |
|---|---|---|
| 1 | `01-backend/` | Monorepo, ETL, MySQL, integração IBGE, API |
| 2 | `02-frontend-base/` | Design system, layout, tema, Modo leve |
| 3 | `03-dashboards/` | 5 dashboards, notícias, qualidade, upload, acabamento |

Regras transversais ficam em `.cursor/rules/`, o perfil das 5 planilhas em `DATA_PROFILE.md` e as decisões tomadas durante a implementação em `DECISIONS.md`.
