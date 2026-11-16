-- Métricas do painel. Proporções ficam entre 0 e 1 (o app formata como %).
-- Ano acima do calendário é projeção. Variação de 10 anos é o valor atual menos o de ano-10.
-- Idade mediana: primeira idade em que a população acumulada chega à metade.

CREATE OR REPLACE VIEW ibge.gold.visao_geral AS
SELECT
  a.ano,
  a.pop_t AS populacao,
  a.e0_t AS esperanca_vida,
  a.tft,
  a.ie60,
  a.pop_t - b.pop_t AS delta_populacao_10a,
  (a.pop_t - b.pop_t) / NULLIF(b.pop_t, 0) AS var_populacao_10a,
  a.e0_t - b.e0_t AS delta_e0_10a,
  a.tft - b.tft AS delta_tft_10a,
  a.ie60 - b.ie60 AS delta_ie60_10a,
  a.local,
  CASE WHEN a.ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM ibge.silver.ds4_indicadores a
LEFT JOIN ibge.silver.ds4_indicadores b
  ON b.cod = a.cod AND b.ano = a.ano - 10;

CREATE OR REPLACE VIEW ibge.gold.populacao_brasil AS
WITH serie AS (
  SELECT
    ano,
    pop_t AS populacao,
    local,
    CASE WHEN ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
  FROM ibge.silver.ds4_indicadores
),
pico AS (
  SELECT local, ano AS ano_pico, populacao AS populacao_pico
  FROM serie
  QUALIFY row_number() OVER (PARTITION BY local ORDER BY populacao DESC, ano) = 1
)
SELECT s.ano, s.local, s.populacao, s.tipo, p.ano_pico, p.populacao_pico
FROM serie s
JOIN pico p ON p.local = s.local;

CREATE OR REPLACE VIEW ibge.gold.ds1_kpis AS
WITH base AS (
  SELECT cod, sigla, local, nivel, ano, sexo, idade, CAST(populacao AS DOUBLE) AS populacao
  FROM ibge.silver.ds1_populacao_idade
),
totais AS (
  SELECT
    cod, sigla, local, nivel, ano, sexo,
    SUM(populacao) AS populacao,
    SUM(CASE WHEN idade <= 14 THEN populacao ELSE 0 END) / NULLIF(SUM(populacao), 0) AS p_0_14,
    SUM(CASE WHEN idade >= 60 THEN populacao ELSE 0 END) / NULLIF(SUM(populacao), 0) AS p_60
  FROM base
  GROUP BY cod, sigla, local, nivel, ano, sexo
),
acum AS (
  SELECT
    cod, ano, sexo, idade,
    SUM(populacao) OVER (PARTITION BY cod, ano, sexo) AS total,
    SUM(populacao) OVER (
      PARTITION BY cod, ano, sexo
      ORDER BY idade
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS acum
  FROM base
),
mediana AS (
  SELECT cod, ano, sexo, MIN(idade) AS idade_mediana
  FROM acum
  WHERE total > 0 AND acum >= total / 2
  GROUP BY cod, ano, sexo
)
SELECT
  t.cod, t.sigla, t.local, t.nivel, t.ano, t.sexo,
  t.populacao, t.p_0_14, t.p_60, m.idade_mediana,
  t.populacao - p.populacao AS delta_populacao_10a,
  t.p_0_14 - p.p_0_14 AS delta_p_0_14_10a,
  t.p_60 - p.p_60 AS delta_p_60_10a,
  m.idade_mediana - pm.idade_mediana AS delta_idade_mediana_10a,
  CASE WHEN t.ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM totais t
LEFT JOIN mediana m ON m.cod = t.cod AND m.ano = t.ano AND m.sexo = t.sexo
LEFT JOIN totais p ON p.cod = t.cod AND p.sexo = t.sexo AND p.ano = t.ano - 10
LEFT JOIN mediana pm ON pm.cod = t.cod AND pm.sexo = t.sexo AND pm.ano = t.ano - 10;

CREATE OR REPLACE VIEW ibge.gold.ds2_kpis AS
WITH base AS (
  SELECT
    cod, sigla, local, nivel, ano, sexo, grupo_etario, idade_inicio,
    CAST(populacao AS DOUBLE) AS populacao
  FROM ibge.silver.ds2_populacao_quinquenal
),
marcado AS (
  SELECT
    *,
    row_number() OVER (
      PARTITION BY cod, ano, sexo
      ORDER BY populacao DESC, idade_inicio
    ) AS ordem
  FROM base
),
totais AS (
  SELECT
    cod, sigla, local, nivel, ano, sexo,
    MAX(CASE WHEN ordem = 1 THEN grupo_etario END) AS maior_grupo,
    SUM(CASE WHEN idade_inicio = 0 THEN populacao ELSE 0 END) AS pop_0_4,
    SUM(CASE WHEN idade_inicio >= 80 THEN populacao ELSE 0 END) AS pop_80
  FROM marcado
  GROUP BY cod, sigla, local, nivel, ano, sexo
)
SELECT
  t.cod, t.sigla, t.local, t.nivel, t.ano, t.sexo,
  t.maior_grupo, t.pop_0_4, t.pop_80,
  t.pop_80 / NULLIF(t.pop_0_4, 0) AS razao_80_0_4,
  t.pop_0_4 - p.pop_0_4 AS delta_pop_0_4_10a,
  t.pop_80 - p.pop_80 AS delta_pop_80_10a,
  t.pop_80 / NULLIF(t.pop_0_4, 0) - p.pop_80 / NULLIF(p.pop_0_4, 0) AS delta_razao_10a,
  CASE WHEN t.ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM totais t
LEFT JOIN totais p ON p.cod = t.cod AND p.sexo = t.sexo AND p.ano = t.ano - 10;

CREATE OR REPLACE VIEW ibge.gold.ds2_composicao AS
SELECT
  cod, ano, sexo,
  SUM(CASE WHEN idade_inicio <= 14 THEN populacao ELSE 0 END) AS jovem,
  SUM(CASE WHEN idade_inicio BETWEEN 15 AND 59 THEN populacao ELSE 0 END) AS ativa,
  SUM(CASE WHEN idade_inicio >= 60 THEN populacao ELSE 0 END) AS idosa,
  SUM(CASE WHEN idade_inicio <= 14 THEN populacao ELSE 0 END) / NULLIF(SUM(populacao), 0) AS p_jovem,
  SUM(CASE WHEN idade_inicio BETWEEN 15 AND 59 THEN populacao ELSE 0 END) / NULLIF(SUM(populacao), 0) AS p_ativa,
  SUM(CASE WHEN idade_inicio >= 60 THEN populacao ELSE 0 END) / NULLIF(SUM(populacao), 0) AS p_idosa,
  CASE WHEN ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM ibge.silver.ds2_populacao_quinquenal
GROUP BY cod, ano, sexo;

CREATE OR REPLACE VIEW ibge.gold.ds3_cruzamento AS
SELECT cod, MIN(ano) AS ano_cruzamento
FROM ibge.silver.ds3_grupos_etarios
WHERE p_60_mais_t > p_0_14_t
GROUP BY cod;

CREATE OR REPLACE VIEW ibge.gold.ds5_kpis AS
SELECT
  cod, sigla, local, nivel, ano, sexo,
  MAX(CASE WHEN idade = 0 THEN ex END) AS e0,
  MAX(CASE WHEN idade = 60 THEN ex END) AS e60,
  MAX(CASE WHEN idade = 0 THEN nqx END) * 1000 AS nqx_0,
  MAX(CASE WHEN idade = 80 THEN lx END) / 1000 AS lx_80,
  CASE WHEN ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM ibge.silver.ds5_tabuas_mortalidade
GROUP BY cod, sigla, local, nivel, ano, sexo;

CREATE OR REPLACE VIEW ibge.gold.qualidade_linhas AS
SELECT 'ds1' AS dataset_id, 'População por idade' AS nome, count(*) AS linhas,
  SUM(CASE WHEN is_outlier THEN 1 ELSE 0 END) AS outliers
FROM ibge.silver.ds1_populacao_idade
UNION ALL
SELECT 'ds2', 'Grupos quinquenais', count(*),
  SUM(CASE WHEN is_outlier THEN 1 ELSE 0 END)
FROM ibge.silver.ds2_populacao_quinquenal
UNION ALL
SELECT 'ds3', 'Grupos etários', count(*),
  SUM(CASE WHEN is_outlier THEN 1 ELSE 0 END)
FROM ibge.silver.ds3_grupos_etarios
UNION ALL
SELECT 'ds4', 'Indicadores', count(*),
  SUM(CASE WHEN is_outlier THEN 1 ELSE 0 END)
FROM ibge.silver.ds4_indicadores
UNION ALL
SELECT 'ds5', 'Tábuas de mortalidade', count(*),
  SUM(CASE WHEN is_outlier THEN 1 ELSE 0 END)
FROM ibge.silver.ds5_tabuas_mortalidade;

CREATE OR REPLACE VIEW ibge.gold.qualidade_outliers AS
SELECT 'ds1' AS dataset_id, outlier_motivo, count(*) AS linhas
FROM ibge.silver.ds1_populacao_idade
WHERE is_outlier
GROUP BY outlier_motivo
UNION ALL
SELECT 'ds2', outlier_motivo, count(*)
FROM ibge.silver.ds2_populacao_quinquenal
WHERE is_outlier
GROUP BY outlier_motivo
UNION ALL
SELECT 'ds3', outlier_motivo, count(*)
FROM ibge.silver.ds3_grupos_etarios
WHERE is_outlier
GROUP BY outlier_motivo
UNION ALL
SELECT 'ds4', outlier_motivo, count(*)
FROM ibge.silver.ds4_indicadores
WHERE is_outlier
GROUP BY outlier_motivo
UNION ALL
SELECT 'ds5', outlier_motivo, count(*)
FROM ibge.silver.ds5_tabuas_mortalidade
WHERE is_outlier
GROUP BY outlier_motivo;

CREATE OR REPLACE VIEW ibge.gold.territorios AS
SELECT cod, sigla, local, nivel, regiao_cod
FROM ibge.silver.dim_territorio;

CREATE OR REPLACE VIEW ibge.gold.indicadores_uf AS
SELECT * FROM ibge.silver.ds4_indicadores;

CREATE OR REPLACE VIEW ibge.gold.ds1_idade AS
SELECT * FROM ibge.silver.ds1_populacao_idade;

CREATE OR REPLACE VIEW ibge.gold.ds2_faixas AS
SELECT * FROM ibge.silver.ds2_populacao_quinquenal;

CREATE OR REPLACE VIEW ibge.gold.ds3_faixas AS
SELECT * FROM ibge.silver.ds3_grupos_etarios;

CREATE OR REPLACE VIEW ibge.gold.ds5_tabua AS
SELECT * FROM ibge.silver.ds5_tabuas_mortalidade;
