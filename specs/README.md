# Specs

Desenvolvimento orientado a especificação, em 10 etapas. Cada etapa tem:

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
| 4 | `04-modos-acessibilidade-insights/` | Modos, acessibilidade, fatos, Insights e correções de backend |
| 5 | `05-filtros-contexto-insights/` | Filtro de território, Contexto, base de demonstração e Insights |
| 6 | `06-negocio-confiabilidade-storytelling/` | Negócio, confiabilidade, atualização e storytelling |
| 7 | `07-animacoes-opcionais/` | Animações opcionais |
| 8 | `08-negocio-confiabilidade-storytelling-v2/` | Reavaliação em produção de 14/11 |
| 9 | `09-ajustes-avaliacao/` | Ajustes da avaliação de 14/11 |
| 10 | `10-rubrica-entrega/` | Rubrica de entrega (Databricks no lugar do Power BI) |

Regras transversais ficam em `.cursor/rules/`, o perfil das 5 planilhas em `DATA_PROFILE.md` e as decisões tomadas durante a implementação em `DECISIONS.md`.
