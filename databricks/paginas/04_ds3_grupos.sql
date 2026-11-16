-- Parâmetros: ano INT = 2026 e territorio STRING = 'Brasil'. Seletor: SELECT DISTINCT local FROM ibge.gold.territorios.
-- Página Grupos etários. Sem filtro de sexo: as colunas já são o total (_t).
-- Parâmetros: cod INT = 0, ano INT = 2026.
-- p_* entre 0 e 1. ano_cruzamento é o primeiro ano em que 60+ supera 0–14 (Brasil: 2029).

-- WIDGET counters
SELECT
  s.p_0_14_t,
  s.p_0_14_t - a.p_0_14_t AS delta_p_0_14_10a,
  s.p_15_64_t,
  s.p_15_64_t - a.p_15_64_t AS delta_p_15_64_10a,
  s.p_65_mais_t,
  s.p_65_mais_t - a.p_65_mais_t AS delta_p_65_10a,
  s.p_80_mais_t,
  s.p_80_mais_t - a.p_80_mais_t AS delta_p_80_10a,
  c.ano_cruzamento,
  CASE WHEN s.ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM ibge.gold.ds3_faixas s
LEFT JOIN ibge.gold.ds3_faixas a
  ON a.cod = s.cod AND a.ano = s.ano - 10
LEFT JOIN ibge.gold.ds3_cruzamento c ON c.cod = s.cod
WHERE s.local = :territorio AND s.ano = :ano;

-- WIDGET linhas: 0–14 e 60+
SELECT
  s.ano,
  s.p_0_14_t,
  s.p_60_mais_t,
  b.p_0_14_t AS p_0_14_brasil,
  b.p_60_mais_t AS p_60_mais_brasil,
  c.ano_cruzamento,
  CASE WHEN s.ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM ibge.gold.ds3_faixas s
LEFT JOIN ibge.gold.ds3_faixas b ON b.cod = 0 AND b.ano = s.ano
LEFT JOIN ibge.gold.ds3_cruzamento c ON c.cod = s.cod
WHERE s.local = :territorio
ORDER BY s.ano;

-- WIDGET barras: UFs por % de 60+
SELECT sigla, local, p_60_mais_t
FROM ibge.gold.ds3_faixas
WHERE ano = :ano AND nivel = 'uf'
ORDER BY p_60_mais_t DESC;

-- WIDGET slope: 2000 × ano escolhido
SELECT
  u.sigla,
  u.local,
  a.p_60_mais_t AS valor_2000,
  b.p_60_mais_t AS valor_ano,
  b.p_60_mais_t - a.p_60_mais_t AS delta
FROM ibge.gold.territorios u
JOIN ibge.gold.ds3_faixas a ON a.cod = u.cod AND a.ano = 2000
JOIN ibge.gold.ds3_faixas b ON b.cod = u.cod AND b.ano = :ano
WHERE u.nivel = 'uf'
ORDER BY delta DESC;
