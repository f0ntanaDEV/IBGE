# Painel Databricks

O Lakeview substitui o Power BI. As medidas são as views em `databricks/02_gold.sql` e os `SELECT` de `databricks/paginas/`. Não há arquivo `.pbix` nem medida DAX, e o painel não abre conexão JDBC com o MySQL.

O painel publicado entra no app por este embed, já usado em `apps/web/src/features/databricks/page.tsx`:

https://dbc-e7ffba4b-1a76.cloud.databricks.com/embed/dashboardsv3/01f1e08bd1d71ca9b49a4604ee008ce0?o=7474648187013488

## Linhagem

O mesmo Parquet silver, gerado em `data/processed/`, alimenta a carga ouro do MySQL (`python -m app.tools.load_mysql_from_parquet`) e o volume `ibge.bronze.raw`. O catálogo em `databricks/00_catalogo.sql` lê esse volume para as tabelas bronze; `databricks/01_silver.sql` e `databricks/02_gold.sql` sobem as views. O Lakeview consulta só essas views e os `SELECT` das páginas.

## Páginas

A navegação é a troca de página no Lakeview. Cada página abaixo é um arquivo em `databricks/paginas/`, com o filtro de território e ano quando o comentário do SQL declara o parâmetro.

| Página | Arquivo SQL | Medida principal | KPI |
|---|---|---|---|
| Visão geral | `databricks/paginas/01_visao_geral.sql` | `ibge.gold.visao_geral` | População, esperança de vida, filhos por mulher e IE60 |
| População por idade | `databricks/paginas/02_ds1_idade.sql` | `ibge.gold.ds1_kpis` | População, participação de 0–14 e de 60+, idade mediana |
| Grupos quinquenais | `databricks/paginas/03_ds2_quinquenal.sql` | `ibge.gold.ds2_kpis` | Maior grupo, população 0–4, população 80+ e razão 80+/0–4 |
| Grupos etários | `databricks/paginas/04_ds3_grupos.sql` | `ibge.gold.ds3_cruzamento` | Participação de 0–14, 15–64, 65+ e 80+, e ano em que 60+ supera 0–14 |
| Indicadores | `databricks/paginas/05_ds4_indicadores.sql` | `ibge.silver.ds4_indicadores` | Esperança de vida, TFT e TMI |
| Tábuas de mortalidade | `databricks/paginas/06_ds5_tabuas.sql` | `ibge.gold.ds5_kpis` | e0, e60, nqx na idade 0 e lx aos 80 |
| Qualidade | `databricks/paginas/07_qualidade.sql` | `ibge.gold.qualidade_linhas` | Linhas e outliers por dataset |
