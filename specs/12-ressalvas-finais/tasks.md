# Etapa 12: Tarefas

Execute uma por vez. Ao concluir, marque `[x]`, rode o teste citado e pare. As tarefas com 👤 são do usuário: o Cursor só prepara os arquivos e o passo a passo.

## Banco

- [x] **T12.1** `should_seed` pelo conteúdo das fatos e recarga da ouro a partir da silver existente, com a linha de log. Testes unitários e o cenário de `tests/mysql/` (R1.4). `pytest -k "seed or startup"` e `pytest -m mysql` com `TEST_MYSQL_URL`. → R1.1, R1.2, R1.4
- [x] **T12.2** `/health` com os 4 estados, `HealthOut`, tipos do `packages/shared` e rótulos do `Footer.tsx`. Testes da API e do rodapé (`npm test -w @ibge/web`). → R1.3, R1.4
- [x] **T12.3** `RANGE_CHECKS` no `schema.py`, Alembic `004_checks_taxas` com verificação prévia, `ddl_ouro.sql` regenerado e lista de CHECKs no `docs/DER.md`. `pytest -k "schema or ddl"` e `pytest -m mysql`. → R2

## Repositório

- [x] **T12.4** `docker-compose.prod.yml` versionado, `WEB_BIND` no `.env.example` e README com o diagrama corrigido (R3.1) e a seção de deploy (R3.2). → R3.1, R3.2
- [x] **T12.5** Docstrings e comentários de decisão em `api/v1` e `core`. Rodar `pytest`. → R3.3
- [x] **T12.6** Docstrings e comentários em `domain` e `integrations`. → R3.3
- [x] **T12.7** Docstrings e comentários em `services/context`, `services/facts` e no resto de `services/`. → R3.3
- [x] **T12.8** `tools/doc_coverage.py` e `test_docstrings.py` cobrindo todo `app/`. Meta: ≥ 90%; colar o resultado no fim desta tarefa. `pytest -k docstring`. → R3.4, R3.5

```
app 421/421 100.0%
. 9/9 100.0%
api 3/3 100.0%
api/v1 35/35 100.0%
core 17/17 100.0%
domain 42/42 100.0%
integrations 34/34 100.0%
repositories 12/12 100.0%
services 86/86 100.0%
services/cleaning 37/37 100.0%
services/context 30/30 100.0%
services/facts 48/48 100.0%
tools 68/68 100.0%
```

## EDA

- [x] **T12.9** Formatação pt-BR e os ajustes de gráfico R4.1–R4.5 em `tools/eda.py`. Rodar `python -m app.tools.eda` duas vezes e conferir que `git diff` não mostra mudança na segunda vez. → R4.1–R4.5, R4.8
- [x] **T12.10** `describe` do nqx aos 0 e aos 60 anos em `estatisticas.md`. Relatório com 2042, as imagens embutidas e o novo trecho do nqx. Rodar `pytest -k eda`. → R4.6, R4.7, R4.8

## Fechamento

- [x] **T12.11** Linha em `DECISIONS.md`, prompt 12 no `README.md` igual ao do `PROMPTS.md` e débitos atualizados (tirar "A revisão 003 recria as fatos vazias…", já resolvido por R1). Rodar a suíte completa: `pytest` e `npm test`. → todos
- [x] **T12.12 👤** No servidor:
  - `git pull`;
  - `docker compose -p ibge-projecoes -f docker-compose.yml -f docker-compose.prod.yml up -d --build`;
  - aguardar `/api/v1/health` com `mysql: ok`, sem comando manual;
  - conferir a soma do Brasil em 2026 = 214.211.951 e 0 atípicos na ds1.
  → R1.2
