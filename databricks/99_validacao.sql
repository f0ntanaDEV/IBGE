-- Uma linha por valor de referência. O esperado é resultado = ok em todas.
-- Parâmetros não se aplicam: os alvos são Brasil, 2024 e 2026.

SELECT verificacao, resultado FROM (
  SELECT 'ds1_linhas' AS verificacao,
    CASE WHEN COUNT(*) = 639639 THEN 'ok' ELSE 'falha' END AS resultado
  FROM ibge.gold.ds1_idade
  UNION ALL
  SELECT 'ds1_brasil_2026',
    CASE WHEN SUM(populacao) = 214211951 THEN 'ok' ELSE 'falha' END
  FROM ibge.gold.ds1_idade
  WHERE local = 'Brasil' AND ano = 2026 AND sexo = 'Ambos'
  UNION ALL
  SELECT 'ds1_brasil_2024',
    CASE WHEN SUM(populacao) = 212583750 THEN 'ok' ELSE 'falha' END
  FROM ibge.gold.ds1_idade
  WHERE local = 'Brasil' AND ano = 2024 AND sexo = 'Ambos'
  UNION ALL
  SELECT 'ds1_outliers',
    CASE WHEN COUNT(*) = 0 THEN 'ok' ELSE 'falha' END
  FROM ibge.gold.ds1_idade
  WHERE is_outlier
  UNION ALL
  SELECT 'ds2_linhas', CASE WHEN COUNT(*) = 133551 THEN 'ok' ELSE 'falha' END
  FROM ibge.gold.ds2_faixas
  UNION ALL
  SELECT 'ds3_linhas', CASE WHEN COUNT(*) = 2343 THEN 'ok' ELSE 'falha' END
  FROM ibge.gold.ds3_faixas
  UNION ALL
  SELECT 'ds4_linhas', CASE WHEN COUNT(*) = 2343 THEN 'ok' ELSE 'falha' END
  FROM ibge.gold.indicadores_uf
  UNION ALL
  SELECT 'ds4_pop_t_2026',
    CASE WHEN pop_t = 214211951 THEN 'ok' ELSE 'falha' END
  FROM ibge.gold.indicadores_uf
  WHERE local = 'Brasil' AND ano = 2026
  UNION ALL
  SELECT 'ds4_e0_t_2026',
    CASE WHEN ROUND(e0_t, 2) = 77.03 THEN 'ok' ELSE 'falha' END
  FROM ibge.gold.indicadores_uf
  WHERE local = 'Brasil' AND ano = 2026
  UNION ALL
  SELECT 'ds4_tft_2026',
    CASE WHEN ROUND(tft, 2) = 1.51 THEN 'ok' ELSE 'falha' END
  FROM ibge.gold.indicadores_uf
  WHERE local = 'Brasil' AND ano = 2026
  UNION ALL
  SELECT 'ds4_nulos_tcg',
    CASE WHEN COALESCE(SUM((tcg_t IS NULL) + (tcg_h IS NULL) + (tcg_m IS NULL)), 0) = 99 THEN 'ok' ELSE 'falha' END
  FROM ibge.gold.indicadores_uf
  WHERE ano = 2000
  UNION ALL
  SELECT 'ds5_linhas', CASE WHEN COUNT(*) = 140580 THEN 'ok' ELSE 'falha' END
  FROM ibge.gold.ds5_tabua
  UNION ALL
  SELECT 'total_linhas',
    CASE WHEN
      (SELECT COUNT(*) FROM ibge.gold.ds1_idade)
      + (SELECT COUNT(*) FROM ibge.gold.ds2_faixas)
      + (SELECT COUNT(*) FROM ibge.gold.ds3_faixas)
      + (SELECT COUNT(*) FROM ibge.gold.indicadores_uf)
      + (SELECT COUNT(*) FROM ibge.gold.ds5_tabua) = 918456
    THEN 'ok' ELSE 'falha' END
) ORDER BY verificacao;
