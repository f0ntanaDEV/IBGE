# Etapa 11: Desenho

## Pastas
```
data/raw/            xlsx originais (versionados)
data/silver/         Parquet do ETL (gitignored) + README.md
data/silver/amostra/ amostra versionada, usada nos testes
docs/eda/            estatisticas.md + *.png (gerados pelo script de EDA)
docs/screenshots/databricks/  capturas manuais
```
- `settings.silver_dir` (padrão `data/silver`) substitui todo caminho fixo `data/processed`.
- Procure `data/processed` em Python, Dockerfile, compose, Makefile, `railway.toml`, docs e `databricks/`.
- Na inicialização, se `data/processed/` existir e `data/silver/` não, mova o conteúdo uma vez e registre um aviso no log.

## Amostra silver
- `python -m app.tools.make_sample` filtra Brasil (cod 0), Nordeste e Bahia (cod 29) da silver completa e grava `data/silver/amostra/<dataset>.parquet`.
- Teto: 2 mil linhas por base. Na ds1, use anos 2000, 2024, 2026, 2041 e 2070.
- Um `conftest.py` aponta `silver_dir` para a amostra quando o Parquet completo não existir.
- Testes que dependem de contagens da base inteira continuam com o golden completo e são marcados `full_data`. Esses podem ser pulados, e o motivo do skip passa a ser "base completa".
- Golden recalculado só para a amostra: um `amostra/golden.json` gerado junto com ela.

## Carga ouro (`services/loader.py`)
```
load_mysql(frame_iter, dataset_id, source, metrics)
  source == "sujo"     → etl_runs (+ demo_<fato> se usado pela API) e retorna
  source == "original" → BEGIN
                           upsert dim_dataset, dim_territorio (regiões antes das UFs), dim_metrica
                           DELETE FROM <fato>
                           INSERT em lotes de 10k (pyarrow iter_batches)
                           validate_golden(connection, dataset_id)  # SELECT nas tabelas recém-carregadas
                         COMMIT  | ROLLBACK + etl_runs failed + raise
```
- Verifique com `grep` se alguma rota lê linhas da suja no MySQL. Se nenhuma ler, não crie `demo_<fato>`.
- `validate_golden` fica em `services/golden.py`, com a tabela de valores da requirements. Cada dataset só valida o que tem.
- Tolerância:
  - contagens: igualdade exata;
  - indicadores: comparar arredondado a 2 casas;
  - nasc/obt: manter a tolerância de arredondamento da fonte (≤ 10 pessoas ou ≤ 0,001%), com comentário no código.
- `DELETE` + `INSERT` na mesma transação mantém PK, FK e CHECK.
  - Custo: undo log de cerca de 640 mil linhas, aceitável no servidor Docker.
  - O comentário do Railway sai junto com o atalho.

## Alembic 003
- Para cada fato: `DROP TABLE` e `CREATE TABLE` pelo metadata novo. Não use `ALTER` coluna a coluna, porque os dados de produção estão sujos e a carga seguinte repõe tudo.
- `dim_territorio`: `ALTER` para a FK auto-referente, depois de garantir `regiao_cod NULL` para Brasil e regiões.
- `downgrade` volta ao metadata da 002.
- `schema.py`: `_fact()` recebe as colunas da PK e um mapa de tipos por coluna. Os CHECKs são declarados com `CheckConstraint(..., name="ck_<tabela>_<regra>")`.
- `ddl_ouro.sql` é gerado por `python -m app.tools.dump_ddl` com `CreateTable(...).compile(dialect=mysql.dialect())`. O teste compara esse arquivo com o metadata.

## Testes
- `tests/mysql/` com marcador `mysql`. A fixture `mysql_engine` usa `TEST_MYSQL_URL`, roda `alembic upgrade head` em um schema descartável e faz drop ao final.
- CI (`.github/workflows/ci.yml`): adicionar `services: mysql:8.4`, `TEST_MYSQL_URL` e `pytest -m "mysql or not mysql"`. Se o workflow não existir, crie com os jobs `api` e `web`.
- Teste de docstrings: `ast` percorre os módulos de R1.2 e falha se uma função ou classe pública não tiver docstring.

## EDA (`tools/eda.py`)
- Só pandas e matplotlib. Sem seaborn e sem notebook.
- Paleta: as cores neutras do `tailwind.config` (zinc/slate e o acento).
- Formatação pt-BR com 2 casas, por um helper `fmt()`.
- Saída determinística: mesma ordem, sem data no corpo. Assim o `git diff` mostra só as mudanças reais.
- O relatório (`RELATORIO_EDA.md`) é escrito à mão a partir de `estatisticas.md`. O script não gera o relatório.

## Export para o Databricks (`tools/export_gold.py`)
- Lê do MySQL com `pd.read_sql(..., chunksize=50_000)` e grava `/tmp/ouro/<tabela>/part-*.parquet`.
- Envia com `PUT /api/2.0/fs/files/Volumes/ibge/bronze/ouro_mysql/<tabela>/<arquivo>` (httpx, token no header).
- Antes de enviar, apaga a pasta remota da tabela.
- Sem `DATABRICKS_*` no ambiente, sai com mensagem e código 2. Nunca registra o token em log.
- Agendamento opcional: alvo `make export-databricks`. O cron fica a cargo do usuário.

## Databricks SQL
- `00_catalogo.sql`: `read_files('/Volumes/ibge/bronze/ouro_mysql/<tabela>/', format => 'parquet')`.
- `01_silver.sql` e `02_gold.sql`: só ajuste de nome de coluna se o export mudar algo.
- Criar `gold.indicadores_uf` para a página Indicadores.
- Parâmetros: `:ano` (INT, padrão 2026) e `:territorio` (STRING, padrão 'Brasil'). As queries filtram por `local = :territorio`. O seletor usa `SELECT DISTINCT local FROM gold.territorios`.
- `00_catalogo_federation.sql`: modelo comentado com `CREATE CONNECTION mysql_ouro TYPE mysql OPTIONS (host secret(...), ...)` e `CREATE FOREIGN CATALOG ibge_mysql USING CONNECTION mysql_ouro OPTIONS (database 'ibge')`. As views silver ganham o comentário `-- variante B: trocar bronze.* por ibge_mysql.ibge.*`.

## Embed para usuários externos

`GET /api/v1/databricks/embed` emite o token do browser em três chamadas ao workspace `7474648187013488`, dashboard `01f1e08bd1d71ca9b49a4604ee008ce0`:

1. `POST /oidc/v1/token?o=7474648187013488` com Basic auth do SP Access (`dcabf4c5-5541-46a8-853d-f22b2baed7a3`) e `grant_type=client_credentials&scope=all-apis`.
2. `GET /api/2.0/lakeview/dashboards/01f1e08bd1d71ca9b49a4604ee008ce0/published/tokeninfo` com esse Bearer, `external_viewer_id` opaco e `external_value=publico`.
3. Novo `POST /oidc/v1/token?o=7474648187013488` com `grant_type=client_credentials`, `authorization_details`, os demais campos do tokeninfo e os mesmos `external_viewer_id` e `external_value` do passo 2. Só o `access_token` desse passo vai ao `@databricks/aibi-client`.

O token do passo 1 não é cacheado nem enviado ao browser. O do passo 3 expira em 1 h e é gerado de novo a cada carregamento e no `getNewToken`. A página não usa `<iframe src=".../dashboardsv3/...">`: monta `DatabricksDashboard` e chama `initialize()`.

Checklist (o painel no browser depende dos itens abertos):

- [ ] OAuth secret do SP Access em `DATABRICKS_CLIENT_SECRET` (o client id já existe; o segredo ainda não).
- [ ] Domínio da aplicação na allowlist de embed (admin: Manage dashboard and Genie access).
- [x] Dashboard publicado com `embed_credentials: true` e warehouse `6e8085d1425b8503`.
- [x] SP Access com `CAN_READ` no dashboard. Consultas usam a identidade do publicador; o SP não precisa de `SELECT` nem de `CAN USE` no warehouse.
- [x] `external_viewer_id` sem PII (UUID na sessão do browser) e token novo a cada request.
