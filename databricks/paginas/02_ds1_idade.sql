-- Página População por idade.
-- Parâmetros: cod INT = 0, ano INT = 2026, sexo STRING = 'Ambos'.
-- sexo aceita Ambos, Homens ou Mulheres.
-- Pirâmide: barras horizontais; homens é negativo. Idade 0 fica embaixo se o eixo for invertido.
-- Calor: idade × ano, cor = populacao. Proporções em formato de percentual.

-- WIDGET counters
SELECT populacao, delta_populacao_10a, p_0_14, delta_p_0_14_10a, p_60, delta_p_60_10a, idade_mediana, delta_idade_mediana_10a, tipo
FROM ibge.gold.ds1_kpis
WHERE cod = :cod AND ano = :ano AND sexo = :sexo;

-- WIDGET barras divergentes: pirâmide do ano
SELECT
  idade,
  SUM(CASE WHEN sexo = 'Homens' THEN -populacao END) AS homens,
  SUM(CASE WHEN sexo = 'Mulheres' THEN populacao END) AS mulheres
FROM ibge.silver.ds1_populacao_idade
WHERE cod = :cod AND ano = :ano AND sexo IN ('Homens', 'Mulheres')
GROUP BY idade
ORDER BY idade;

-- WIDGET barras: contorno de outro ano (2000) no mesmo gráfico, se o widget aceitar duas séries
SELECT
  idade,
  SUM(CASE WHEN ano = :ano AND sexo = 'Homens' THEN -populacao END) AS homens,
  SUM(CASE WHEN ano = :ano AND sexo = 'Mulheres' THEN populacao END) AS mulheres,
  SUM(CASE WHEN ano = 2000 AND sexo = 'Homens' THEN -populacao END) AS homens_2000,
  SUM(CASE WHEN ano = 2000 AND sexo = 'Mulheres' THEN populacao END) AS mulheres_2000
FROM ibge.silver.ds1_populacao_idade
WHERE cod = :cod AND (ano = :ano OR ano = 2000) AND sexo IN ('Homens', 'Mulheres')
GROUP BY idade
ORDER BY idade;

-- WIDGET heatmap
SELECT ano, idade, populacao,
  CASE WHEN ano > year(current_date()) THEN 'projeção' ELSE 'observado' END AS tipo
FROM ibge.silver.ds1_populacao_idade
WHERE cod = :cod AND sexo = :sexo
ORDER BY ano, idade;

-- WIDGET tabela
SELECT ano, idade, sexo, local, sigla, populacao, is_outlier
FROM ibge.silver.ds1_populacao_idade
WHERE cod = :cod AND ano = :ano AND sexo = :sexo
ORDER BY idade;
