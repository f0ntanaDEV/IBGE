# Etapa 1: Tarefas

Execute uma por vez, marque `[x]` e continue. Use `specs/DATA_PROFILE.md` em vez de abrir as planilhas.

- [x] **T1.1** Scaffold do monorepo, `docker-compose.yml` (MySQL 8 + API, healthcheck), `.env.example`, `core/`. → R10.3
- [x] **T1.2** `datasets.yaml` (conforme `design.md`) + `domain/` com validação do config. `tools/profile.py` para inspeções futuras. → R1.1
- [x] **T1.3** Fixtures de teste: recortar ≤ 200 linhas de cada tabela (BR + 1 região + 2 UFs, 3 anos) em `tests/fixtures/` via script. → R5.2
- [x] **T1.4** `reader.py`, `normalize.py`, `reshape.py` + dicionário de métricas + `nivel`. Testes. → R1
- [x] **T1.5** `tools/make_dirty.py`. → R6.1
- [x] **T1.6** `missing.py` (recuperação de ids, nulos estruturais, interpolação por série). Testes. → R2
- [x] **T1.7** `duplicates.py`. Testes. → R3
- [x] **T1.8** `outliers.py` (`iqr_delta`, MAD, regras de domínio da ds5; flag/cap/remove; `confirm`). Testes. → R4
- [x] **T1.9** `validate.py` + testes golden com os valores de `DATA_PROFILE.md`. → R5
- [x] **T1.10** `pipeline.py` + `QualityReport` + `export.py` + `store.py` (Parquet). Teste de recuperação da base suja. → R6.2, R7
- [x] **T1.11** Alembic (dims, fatos, `etl_runs`) + `loader.py`. → R8
- [x] **T1.12** `integrations/` (notícias, agregados/Censo 2022, cache, fallback), testado com respostas mockadas. → R9
- [x] **T1.13** `analytics.py`: summary, pirâmide, rankings e claims. → R9.2
- [x] **T1.14** Routers `/api/v1`. → R1.7, R10.1, R10.2
- [x] **T1.15** Processar as 5 bases originais e as 5 sujas; checar desempenho (R10.4); suíte completa verde.
- [x] **T1.16** README da API. Registrar decisões em `DECISIONS.md`.
