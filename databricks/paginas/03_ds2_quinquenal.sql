-- Página Grupos quinquenais.
-- Parâmetros: cod INT = 0, ano INT = 2026, sexo STRING = 'Ambos'.
-- Área 100%: p_jovem, p_ativa, p_idosa (0–14, 15–59, 60+).

-- WIDGET counters
SELECT maior_grupo, pop_0_4, delta_pop_0_4_10a, pop_80, delta_pop_80_10a, razao_80_0_4, delta_razao_10a, tipo
FROM ibge.gold.ds2_kpis
WHERE local = :territorio AND ano = :ano AND sexo = :sexo;

-- WIDGET barras: 2000, ano escolhido e 2070
SELECT
  grupo_etario,
  MIN(idade_inicio) AS idade_inicio,
  SUM(CASE WHEN ano = 2000 AND sexo = 'Homens' THEN -populacao END) AS homens_2000,
  SUM(CASE WHEN ano = 2000 AND sexo = 'Mulheres' THEN populacao END) AS mulheres_2000,
  SUM(CASE WHEN ano = :ano AND sexo = 'Homens' THEN -populacao END) AS homens,
  SUM(CASE WHEN ano = :ano AND sexo = 'Mulheres' THEN populacao END) AS mulheres,
  SUM(CASE WHEN ano = 2070 AND sexo = 'Homens' THEN -populacao END) AS homens_2070,
  SUM(CASE WHEN ano = 2070 AND sexo = 'Mulheres' THEN populacao END) AS mulheres_2070
FROM ibge.gold.ds2_faixas
WHERE local = :territorio AND (ano = 2000 OR ano = :ano OR ano = 2070) AND sexo IN ('Homens', 'Mulheres')
GROUP BY grupo_etario
ORDER BY idade_inicio;

-- WIDGET área 100%
SELECT ano, p_jovem, p_ativa, p_idosa, tipo
FROM ibge.gold.ds2_composicao
WHERE local = :territorio AND sexo = :sexo
ORDER BY ano;

-- WIDGET tabela
SELECT ano, grupo_etario, sexo, local, populacao, is_outlier
FROM ibge.gold.ds2_faixas
WHERE local = :territorio AND ano = :ano AND sexo = :sexo
ORDER BY idade_inicio;
