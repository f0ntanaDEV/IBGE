-- Catálogo a partir do MySQL ouro exportado para o Volume.
-- Rode depois de `python -m app.tools.export_gold`.
-- Ordem: este arquivo, 01_silver.sql, 02_gold.sql, paginas/*.sql e 99_validacao.sql.

CREATE CATALOG IF NOT EXISTS ibge;
CREATE SCHEMA IF NOT EXISTS ibge.bronze;
CREATE SCHEMA IF NOT EXISTS ibge.silver;
CREATE SCHEMA IF NOT EXISTS ibge.gold;
CREATE VOLUME IF NOT EXISTS ibge.bronze.ouro_mysql;

CREATE OR REPLACE TABLE ibge.bronze.dim_territorio AS
SELECT * FROM read_files('/Volumes/ibge/bronze/ouro_mysql/dim_territorio/', format => 'parquet');

CREATE OR REPLACE TABLE ibge.bronze.dim_metrica AS
SELECT * FROM read_files('/Volumes/ibge/bronze/ouro_mysql/dim_metrica/', format => 'parquet');

CREATE OR REPLACE TABLE ibge.bronze.dim_dataset AS
SELECT * FROM read_files('/Volumes/ibge/bronze/ouro_mysql/dim_dataset/', format => 'parquet');

CREATE OR REPLACE TABLE ibge.bronze.etl_runs AS
SELECT * FROM read_files('/Volumes/ibge/bronze/ouro_mysql/etl_runs/', format => 'parquet');

CREATE OR REPLACE TABLE ibge.bronze.ds1_populacao_idade AS
SELECT * FROM read_files('/Volumes/ibge/bronze/ouro_mysql/ds1_populacao_idade/', format => 'parquet');

CREATE OR REPLACE TABLE ibge.bronze.ds2_populacao_quinquenal AS
SELECT * FROM read_files('/Volumes/ibge/bronze/ouro_mysql/ds2_populacao_quinquenal/', format => 'parquet');

CREATE OR REPLACE TABLE ibge.bronze.ds3_grupos_etarios AS
SELECT * FROM read_files('/Volumes/ibge/bronze/ouro_mysql/ds3_grupos_etarios/', format => 'parquet');

CREATE OR REPLACE TABLE ibge.bronze.ds4_indicadores AS
SELECT * FROM read_files('/Volumes/ibge/bronze/ouro_mysql/ds4_indicadores/', format => 'parquet');

CREATE OR REPLACE TABLE ibge.bronze.ds5_tabuas_mortalidade AS
SELECT * FROM read_files('/Volumes/ibge/bronze/ouro_mysql/ds5_tabuas_mortalidade/', format => 'parquet');
