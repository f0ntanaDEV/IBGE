-- Tipagem das chaves. O Parquet já sai em snake_case do ETL.
-- cod 0 = Brasil; nivel é brasil, regiao ou uf.
-- sexo é Ambos, Homens ou Mulheres.

CREATE OR REPLACE VIEW ibge.silver.ds1_populacao_idade AS
SELECT
  CAST(ano AS INT) AS ano,
  CAST(cod AS INT) AS cod,
  CAST(idade AS INT) AS idade,
  * EXCEPT (ano, cod, idade)
FROM ibge.bronze.ds1_populacao_idade;

CREATE OR REPLACE VIEW ibge.silver.ds2_populacao_quinquenal AS
SELECT
  CAST(ano AS INT) AS ano,
  CAST(cod AS INT) AS cod,
  CAST(idade_inicio AS INT) AS idade_inicio,
  * EXCEPT (ano, cod, idade_inicio)
FROM ibge.bronze.ds2_populacao_quinquenal;

CREATE OR REPLACE VIEW ibge.silver.ds3_grupos_etarios AS
SELECT
  CAST(ano AS INT) AS ano,
  CAST(cod AS INT) AS cod,
  * EXCEPT (ano, cod)
FROM ibge.bronze.ds3_grupos_etarios;

CREATE OR REPLACE VIEW ibge.silver.ds4_indicadores AS
SELECT
  CAST(ano AS INT) AS ano,
  CAST(cod AS INT) AS cod,
  * EXCEPT (ano, cod)
FROM ibge.bronze.ds4_indicadores;

CREATE OR REPLACE VIEW ibge.silver.ds5_tabuas_mortalidade AS
SELECT
  CAST(ano AS INT) AS ano,
  CAST(cod AS INT) AS cod,
  CAST(idade AS INT) AS idade,
  * EXCEPT (ano, cod, idade)
FROM ibge.bronze.ds5_tabuas_mortalidade;

CREATE OR REPLACE VIEW ibge.silver.dim_territorio AS
SELECT
  CAST(cod AS INT) AS cod,
  sigla,
  local,
  nivel,
  CAST(regiao_cod AS INT) AS regiao_cod
FROM ibge.bronze.dim_territorio;
