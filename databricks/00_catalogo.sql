-- Dashboard Lakeview das Projeções IBGE (revisão 2024).
-- Troque o catálogo `ibge` se o workspace não deixar criar catálogo.
-- Rode este arquivo, depois 01_silver.sql e 02_gold.sql.
-- Em cada página do dashboard, cole um SELECT de databricks/paginas/.
--
-- Antes de rodar: envie só o Parquet mais recente de data/processed/ para
--   /Volumes/ibge/bronze/raw/ds1/   (ds1_*.parquet)
--   /Volumes/ibge/bronze/raw/ds2/
--   /Volumes/ibge/bronze/raw/ds3/
--   /Volumes/ibge/bronze/raw/ds4/
--   /Volumes/ibge/bronze/raw/ds5/
-- O nome leva o carimbo AAAAMMDDTHHMMSS; o arquivo de caminho maior é o mais novo.

CREATE CATALOG IF NOT EXISTS ibge;
CREATE SCHEMA IF NOT EXISTS ibge.bronze;
CREATE SCHEMA IF NOT EXISTS ibge.silver;
CREATE SCHEMA IF NOT EXISTS ibge.gold;
CREATE VOLUME IF NOT EXISTS ibge.bronze.raw;

CREATE OR REPLACE TABLE ibge.bronze.ds1_populacao_idade AS
WITH src AS (
  SELECT *, _metadata.file_path AS _arquivo
  FROM read_files('/Volumes/ibge/bronze/raw/ds1/*.parquet', format => 'parquet')
)
SELECT * EXCEPT (_arquivo, _rk)
FROM (
  SELECT *, dense_rank() OVER (ORDER BY _arquivo DESC) AS _rk FROM src
)
WHERE _rk = 1;

CREATE OR REPLACE TABLE ibge.bronze.ds2_populacao_quinquenal AS
WITH src AS (
  SELECT *, _metadata.file_path AS _arquivo
  FROM read_files('/Volumes/ibge/bronze/raw/ds2/*.parquet', format => 'parquet')
)
SELECT * EXCEPT (_arquivo, _rk)
FROM (
  SELECT *, dense_rank() OVER (ORDER BY _arquivo DESC) AS _rk FROM src
)
WHERE _rk = 1;

CREATE OR REPLACE TABLE ibge.bronze.ds3_grupos_etarios AS
WITH src AS (
  SELECT *, _metadata.file_path AS _arquivo
  FROM read_files('/Volumes/ibge/bronze/raw/ds3/*.parquet', format => 'parquet')
)
SELECT * EXCEPT (_arquivo, _rk)
FROM (
  SELECT *, dense_rank() OVER (ORDER BY _arquivo DESC) AS _rk FROM src
)
WHERE _rk = 1;

CREATE OR REPLACE TABLE ibge.bronze.ds4_indicadores AS
WITH src AS (
  SELECT *, _metadata.file_path AS _arquivo
  FROM read_files('/Volumes/ibge/bronze/raw/ds4/*.parquet', format => 'parquet')
)
SELECT * EXCEPT (_arquivo, _rk)
FROM (
  SELECT *, dense_rank() OVER (ORDER BY _arquivo DESC) AS _rk FROM src
)
WHERE _rk = 1;

CREATE OR REPLACE TABLE ibge.bronze.ds5_tabuas_mortalidade AS
WITH src AS (
  SELECT *, _metadata.file_path AS _arquivo
  FROM read_files('/Volumes/ibge/bronze/raw/ds5/*.parquet', format => 'parquet')
)
SELECT * EXCEPT (_arquivo, _rk)
FROM (
  SELECT *, dense_rank() OVER (ORDER BY _arquivo DESC) AS _rk FROM src
)
WHERE _rk = 1;
