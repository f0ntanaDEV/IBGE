-- Página Indicadores. Sem filtro de sexo.
-- Parâmetro: cod INT = 0, ano INT = 2026.
-- TFT compara com a coluna reposicao (2,1). TMI já vem por mil. Ranking: escolha a coluna no widget.

-- WIDGET counters
SELECT
  s.e0_t,
  s.e0_t - a.e0_t AS delta_e0_10a,
  s.tft,
  s.tft - a.tft AS delta_tft_10a,
  s.tmi_t,
  s.tmi_t - a.tmi_t AS delta_tmi_10a,
  s.ie60,
  s.ie60 - a.ie60 AS delta_ie60_10a,
  CASE WHEN s.ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM ibge.silver.ds4_indicadores s
LEFT JOIN ibge.silver.ds4_indicadores a ON a.cod = s.cod AND a.ano = s.ano - 10
WHERE s.cod = :cod AND s.ano = :ano;

-- WIDGET linhas: esperança de vida ao nascer
SELECT
  s.ano,
  s.e0_h,
  s.e0_m,
  b.e0_h AS e0_h_brasil,
  b.e0_m AS e0_m_brasil,
  CASE WHEN s.ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM ibge.silver.ds4_indicadores s
LEFT JOIN ibge.silver.ds4_indicadores b ON b.cod = 0 AND b.ano = s.ano
WHERE s.cod = :cod
ORDER BY s.ano;

-- WIDGET linha: filhos por mulher e reposição 2,1
SELECT
  ano,
  tft,
  2.1 AS reposicao,
  CASE WHEN ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM ibge.silver.ds4_indicadores
WHERE cod = :cod
ORDER BY ano;

-- WIDGET área: natalidade, mortalidade e crescimento vegetativo
SELECT
  ano,
  tbn,
  tbm,
  tbn - tbm AS crescimento_vegetativo,
  CASE WHEN ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM ibge.silver.ds4_indicadores
WHERE cod = :cod
ORDER BY ano;

-- WIDGET dispersão: UFs, tamanho = população
SELECT sigla, local, e0_t, tft, pop_t
FROM ibge.silver.ds4_indicadores
WHERE ano = :ano AND nivel = 'uf';

-- WIDGET barras divergentes: anos a mais das mulheres
SELECT sigla, local, e0_m - e0_h AS diff_e0, e60_m - e60_h AS diff_e60
FROM ibge.silver.ds4_indicadores
WHERE ano = :ano AND nivel = 'uf'
ORDER BY diff_e0 DESC;

-- WIDGET ranking (troque o campo no gráfico: e0_t, tft, tmi_t, ie60, id_med)
SELECT sigla, local, e0_t, tft, tmi_t, ie60, id_med
FROM ibge.silver.ds4_indicadores
WHERE ano = :ano AND nivel = 'uf';

-- WIDGET slope: esperança de vida
SELECT
  u.sigla,
  a.e0_t AS valor_2000,
  b.e0_t AS valor_ano,
  b.e0_t - a.e0_t AS delta
FROM ibge.silver.dim_territorio u
JOIN ibge.silver.ds4_indicadores a ON a.cod = u.cod AND a.ano = 2000
JOIN ibge.silver.ds4_indicadores b ON b.cod = u.cod AND b.ano = :ano
WHERE u.nivel = 'uf'
ORDER BY delta DESC;

-- WIDGET tabela
SELECT ano, local, sigla, pop_t, e0_t, tft, tmi_t, ie60, is_outlier
FROM ibge.silver.ds4_indicadores
WHERE cod = :cod AND ano = :ano;
