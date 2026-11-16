-- Página Tábuas de mortalidade.
-- Parâmetros: cod INT = 0, ano INT = 2026, sexo STRING = 'Ambos', ano_b INT = 2000.
-- nqx_0 está em óbitos por mil. lx_80 é quantos, de cada 100, chegam aos 80 (lx/1000, raiz 100 mil).
-- nqx_log = ln(nqx) para o gráfico imitar a escala logarítmica.

-- WIDGET counters
SELECT e0, e60, nqx_0, lx_80, tipo
FROM ibge.gold.ds5_kpis
WHERE local = :territorio AND ano = :ano AND sexo = :sexo;

-- WIDGET linhas: sobrevivência lx, homens e mulheres
SELECT
  idade,
  MAX(CASE WHEN sexo = 'Homens' THEN lx END) AS lx_homens,
  MAX(CASE WHEN sexo = 'Mulheres' THEN lx END) AS lx_mulheres
FROM ibge.gold.ds5_tabua
WHERE local = :territorio AND ano = :ano AND sexo IN ('Homens', 'Mulheres')
GROUP BY idade
ORDER BY idade;

-- WIDGET linhas: risco de morrer em dois anos
SELECT
  idade,
  MAX(CASE WHEN ano = :ano THEN nqx END) AS nqx,
  MAX(CASE WHEN ano = :ano_b THEN nqx END) AS nqx_outro_ano,
  MAX(CASE WHEN ano = :ano AND nqx > 0 THEN ln(nqx) END) AS nqx_log,
  MAX(CASE WHEN ano = :ano_b AND nqx > 0 THEN ln(nqx) END) AS nqx_outro_ano_log
FROM ibge.gold.ds5_tabua
WHERE local = :territorio AND sexo = :sexo AND (ano = :ano OR ano = :ano_b)
GROUP BY idade
ORDER BY idade;

-- WIDGET linhas: esperança de vida por idade
SELECT
  idade,
  MAX(CASE WHEN sexo = 'Homens' THEN ex END) AS ex_homens,
  MAX(CASE WHEN sexo = 'Mulheres' THEN ex END) AS ex_mulheres
FROM ibge.gold.ds5_tabua
WHERE local = :territorio AND ano = :ano AND sexo IN ('Homens', 'Mulheres')
GROUP BY idade
ORDER BY idade;

-- WIDGET barras: diferença mulheres − homens, por UF
SELECT
  h.sigla,
  h.local,
  m.e0 - h.e0 AS diff_e0,
  m.e60 - h.e60 AS diff_e60
FROM ibge.gold.ds5_kpis h
JOIN ibge.gold.ds5_kpis m
  ON m.cod = h.cod AND m.ano = h.ano AND m.sexo = 'Mulheres'
WHERE h.ano = :ano AND h.sexo = 'Homens' AND h.nivel = 'uf'
ORDER BY diff_e0 DESC;

-- WIDGET tabela
SELECT ano, idade, sexo, local, nqx, lx, ex, is_outlier
FROM ibge.gold.ds5_tabua
WHERE local = :territorio AND ano = :ano AND sexo = :sexo
ORDER BY idade;
