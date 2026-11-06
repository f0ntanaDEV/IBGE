# Etapa 1: Design

## Stack
Python 3.12 · FastAPI · Pydantic v2 · pydantic-settings · SQLAlchemy 2 · PyMySQL · Alembic · pandas ≥ 2.2 · python-calamine · pyarrow · numpy · openpyxl (escrita) · httpx · pytest

## Estrutura
```
apps/api/
├── app/
│   ├── core/          config.py, logging.py, errors.py
│   ├── domain/        dataset.py (DatasetConfig), report.py (QualityReport), territory.py
│   ├── services/
│   │   ├── cleaning/  reader.py, normalize.py, reshape.py, missing.py, duplicates.py,
│   │   │              outliers.py, validate.py, pipeline.py
│   │   ├── export.py
│   │   ├── loader.py      # MySQL
│   │   ├── store.py       # cache Parquet em memória/disco
│   │   └── analytics.py   # summary, pirâmide, séries, rankings, claims
│   ├── repositories/  etl_runs.py, dataset_tables.py
│   ├── integrations/  ibge_news.py, ibge_agregados.py, cache.py
│   ├── api/v1/        datasets.py, news.py, territories.py, health.py
│   ├── schemas/
│   └── tools/         profile.py, make_dirty.py
├── datasets.yaml
├── alembic/
└── tests/  (fixtures: amostras pequenas recortadas de cada tabela, ≤ 200 linhas)
```

## datasets.yaml (preenchido)
```yaml
defaults:
  null_threshold: 0.6
  outlier: { method: iqr_delta, factor: 3.0, strategy: flag }

datasets:
  - id: ds1
    name: "População por sexo e idade simples"
    file: tab1_idade_simples.xlsx
    sheet: "1) POP_IDADE SIMPLES"
    header_row: 5
    reshape: { wide_to_long: { id_vars: [IDADE, SEXO, CÓD., SIGLA, LOCAL], var_name: ano, value_name: populacao } }
    table: ds1_populacao_idade
    key: [idade, sexo, cod, ano]
    series_by: [cod, sexo, idade]
    metrics: [populacao]
    news_keywords: ["projeção da população", "pirâmide etária"]
    claims:
      - id: pico_populacional
        label: "Ano de pico da população brasileira"
        compute: "argmax(sum(populacao) where cod=0, sexo='Ambos') by ano"
        news_terms: ["população", "2041"]

  - id: ds2
    name: "População por grupo quinquenal"
    file: tab2_grupo_quinquenal.xlsx
    sheet: "2) POP_GRUPO QUINQUENAL"
    header_row: 5
    reshape: { wide_to_long: { id_vars: [GRUPO ETÁRIO, SEXO, CÓD., SIGLA, LOCAL], var_name: ano, value_name: populacao } }
    derive: { idade_inicio: "int(grupo_etario[:2])" }
    table: ds2_populacao_quinquenal
    key: [grupo_etario, sexo, cod, ano]
    series_by: [cod, sexo, grupo_etario]
    metrics: [populacao]
    news_keywords: ["envelhecimento", "idosos"]

  - id: ds3
    name: "Grupos etários específicos"
    file: tab3_grupos_etarios_especificos.xlsx
    sheet: "3) POP_GRUPO ETÁRIO ESPECÍFICO"
    header_row: 6
    table: ds3_grupos_etarios
    key: [cod, ano]
    series_by: [cod]
    metrics: auto            # todas as numéricas exceto ano/cod
    news_keywords: ["idosos", "crianças", "população em idade de trabalhar"]
    claims:
      - id: idosos_superam_jovens
        label: "Ano em que a população 60+ supera a de 0–14 anos (Brasil)"
        compute: "min(ano) where cod=0 and pop_60mais_t > pop_0_14_t"
        news_terms: ["idosos", "crianças"]

  - id: ds4
    name: "Indicadores demográficos"
    file: tab4_indicadores.xlsx
    sheet: "4) INDICADORES"
    header_row: 6
    table: ds4_indicadores
    key: [cod, ano]
    series_by: [cod]
    metrics: auto
    structural_nulls: [{ columns: [tcg_t, tcg_h, tcg_m], when: "ano == min(ano)" }]
    news_keywords: ["esperança de vida", "fecundidade", "mortalidade infantil"]
    claims:
      - id: fecundidade_abaixo_reposicao
        label: "Taxa de fecundidade total (Brasil, ano atual) vs. reposição (2,1)"
        compute: "tft where cod=0 and ano=current_year"
        news_terms: ["fecundidade"]
      - id: esperanca_vida
        label: "Esperança de vida ao nascer (Brasil, ano atual)"
        compute: "e0_t where cod=0 and ano=current_year"
        news_terms: ["esperança de vida"]

  - id: ds5
    name: "Tábuas de mortalidade"
    file: tab5_tabuas_mortalidade.xlsx
    sheet: "5) TÁBUAS DE MORTALIDADE"
    header_row: 5
    engine: calamine
    table: ds5_tabuas_mortalidade
    key: [idade, sexo, cod, ano]
    series_by: [cod, sexo, idade]
    metrics: [nmx, nax, nqx, lx, ndx, nlx, sx, tx, ex]
    domain_rules: ["0 <= nqx <= 1", "lx non_increasing by idade within (cod, sexo, ano)", "ex >= 0"]
    news_keywords: ["tábuas de mortalidade", "esperança de vida"]
```
`compute` é uma descrição para o desenvolvedor, não uma DSL: implemente cada claim como função em `analytics.py`, registrada pelo `id`.

## Pipeline
Funções puras `(df, cfg) -> (df, StepReport)`:
```
read → normalize → reshape → recover_ids → structural_nulls → drop_sparse → fill_missing
     → dedupe → outliers → validate → export (csv/xlsx/parquet) → load_mysql
```
- `outliers` (`iqr_delta`): em cada série (`series_by`, ordenada por `ano`), calcula `delta = x_t / x_{t-1} - 1` e marca |delta| fora de Q1 − k·IQR, Q3 + k·IQR (k = 3, já que projeções são suaves). `cap` usa a interpolação dos vizinhos.
- `validate`: retorna `[{rule, ok, max_diff}]`.

## MySQL
- `dim_territorio(cod PK, sigla, local, nivel, regiao_cod)`: 33 linhas.
- `dim_metrica(dataset_id, coluna, rotulo, descricao, unidade)`.
- Tabelas de fatos em formato **longo** para ds1/ds2 e no formato original normalizado para ds3–ds5, com índices em `(cod, ano)` e na chave.
- `etl_runs(id, dataset_id, source ENUM(original, upload, sujo), status, started_at, finished_at, rows_in, rows_out, report_json JSON, error)`.

## IBGE
- Notícias: `GET https://servicodados.ibge.gov.br/api/v3/noticias/?busca=<termo>&qtd=10`
- Censo 2022: `https://servicodados.ibge.gov.br/api/v3/agregados` (localizar a tabela de população residente do Censo 2022 pelos metadados e gravar o código no config).
- httpx com timeout de 8 s, 2 retries com backoff e cache TTL de 6 h por URL.

## Endpoints (`/api/v1`)
| Método | Rota | Retorno |
|---|---|---|
| GET | `/health` | API + MySQL |
| GET | `/territories` | `dim_territorio` |
| GET | `/datasets` | lista + último `etl_run` |
| GET | `/datasets/{id}/metrics` | dicionário de métricas |
| POST | `/datasets/{id}/upload` | multipart, valida colunas |
| POST | `/datasets/{id}/process` | `{source, cleaning?, confirm?}` → `QualityReport` |
| GET | `/datasets/{id}/quality-report` · `/runs` | último relatório · histórico |
| GET | `/datasets/{id}/data` | paginado + filtros |
| GET | `/datasets/{id}/summary?ano&cod&sexo` | `{kpis[], series[], rankings[]}` |
| GET | `/datasets/{id}/pyramid?ano&cod&compare_ano?` | ds1/ds2: `[{faixa, homens, mulheres}]` |
| GET | `/datasets/{id}/claims` | `[{id, label, value, news[]}]` |
| GET | `/datasets/{id}/news` | `{available, items[]}` |
| GET | `/reference/censo-2022?cod` | `{available, projecao, censo, diff_pct, nota}` |
| GET | `/datasets/{id}/download?format=csv\|xlsx` | arquivo tratado |

Erro padrão: `{"error": {"code", "message", "details"}}`.
