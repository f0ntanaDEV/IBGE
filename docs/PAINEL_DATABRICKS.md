# Painel Databricks

O Lakeview substitui o Power BI. Não há arquivo `.pbix` nem medida DAX. A página `/databricks` monta o painel com `@databricks/aibi-client` e o token de 1 h emitido pela API.

Dashboard `01f1e08bd1d71ca9b49a4604ee008ce0` no workspace `7474648187013488` (`https://dbc-e7ffba4b-1a76.cloud.databricks.com`).

## Linhagem

MySQL ouro → Volume `ibge.bronze.ouro_mysql` → tabelas `ibge.bronze` → views `ibge.silver` → views `ibge.gold` → páginas do Lakeview.

`python -m app.tools.export_gold` lê as fatos e dimensões no MySQL e envia o Parquet. `databricks/00_catalogo.sql` lê esse Volume. `01_silver.sql` e `02_gold.sql` sobem as views. Cada página em `databricks/paginas/` consulta só `ibge.gold`.

## KPI, view e SQL

| KPI | View | Fórmula |
|---|---|---|
| População, e0, TFT e IE60 | `ibge.gold.visao_geral` | `pop_t`, `e0_t`, `tft`, `ie60` e a diferença contra o ano − 10 |
| Série 2000–2070 | `ibge.gold.populacao_brasil` | `pop_t` por ano; o pico é o maior `pop_t` do território |
| População por idade | `ibge.gold.ds1_kpis` | soma de `populacao`; idade mediana na acumulada |
| Pirâmide | `ibge.gold.ds1_idade` | homens com sinal negativo, mulheres positivo, no ano escolhido |
| Grupo quinquenal | `ibge.gold.ds2_kpis` | maior `populacao` do grupo; 0–4 e 80+ |
| Faixas etárias | `ibge.gold.ds3_faixas` | proporções `p_*`; cruzamento quando 60+ supera 0–14 |
| Indicadores | `ibge.gold.indicadores_uf` | `e0_t`, `tft`, `tmi_t`, `ie60` do território e do ano |
| Tábua | `ibge.gold.ds5_kpis` | `ex` nas idades 0 e 60; `nqx` aos 0; `lx` aos 80 |
| Qualidade | `ibge.gold.qualidade_linhas` | `count(*)` e soma de `is_outlier` por base |

O seletor de território é `SELECT DISTINCT local FROM ibge.gold.territorios`. Os parâmetros de página são `ano` (INT, padrão 2026) e `territorio` (STRING, padrão Brasil).

## Variantes de conexão

**A, padrão.** Não abre porta no MySQL. `make export-databricks` (ou `python -m app.tools.export_gold`) grava a execução em `etl_runs` com `source = 'export_databricks'`. Sem `DATABRICKS_HOST` e `DATABRICKS_TOKEN`, o comando sai com código 2 e não registra o token.

**B, Lakehouse Federation.** `databricks/00_catalogo_federation.sql` está comentado: cria `CONNECTION mysql_ouro` e `FOREIGN CATALOG ibge_mysql` com um usuário só de leitura. Quem for usar libera a rede até o banco. Nas views silver, a troca é `bronze.*` por `ibge_mysql.ibge.*`.

## Como reproduzir

1. Carregar a ouro: `python -m app.tools.load_mysql_from_parquet`.
2. Exportar: `make export-databricks`.
3. No workspace, rodar os SQL nesta ordem: `00_catalogo.sql`, `01_silver.sql`, `02_gold.sql`, as páginas e `99_validacao.sql`.
4. Publicar o dashboard Lakeview com as sete páginas.
5. `99_validacao.sql` deve devolver `ok` em todas as linhas (linhas das bases, Brasil 2026 = 214.211.951, e0 = 77,03, TFT = 1,51, atípicos da ds1 = 0, total = 918.456).

## Capturas esperadas

Quem não tem conta no workspace vê o painel por estas capturas e por `docs/painel-databricks.pdf`.

| Página | Arquivo |
|---|---|
| Visão geral | `docs/screenshots/databricks/01-visao-geral.png` |
| População por idade | `docs/screenshots/databricks/02-populacao-idade.png` |
| Grupos quinquenais | `docs/screenshots/databricks/03-quinquenal.png` |
| Grupos etários | `docs/screenshots/databricks/04-grupos.png` |
| Indicadores | `docs/screenshots/databricks/05-indicadores.png` |
| Tábuas de mortalidade | `docs/screenshots/databricks/06-tabuas.png` |
| Qualidade | `docs/screenshots/databricks/07-qualidade.png` |
