-- Página Visão geral. Parâmetro: ano (INT, padrão = ano corrente, ex. 2026).
-- Counters: um campo por widget. Linha: ano × populacao, quebre a série por tipo.
-- O pico é o ano de populacao máxima (na revisão 2024, 2041).

-- WIDGET counter: população, esperança de vida, filhos por mulher, IE60
SELECT
  populacao,
  var_populacao_10a,
  esperanca_vida,
  delta_e0_10a,
  tft,
  delta_tft_10a,
  ie60,
  delta_ie60_10a,
  tipo
FROM ibge.gold.visao_geral
WHERE ano = :ano;

-- WIDGET linha: população 2000–2070
SELECT ano, populacao, tipo, ano_pico, populacao_pico
FROM ibge.gold.populacao_brasil
ORDER BY ano;

-- WIDGET tabela: volume de cada base
SELECT dataset_id, nome, linhas, outliers
FROM ibge.gold.qualidade_linhas
ORDER BY dataset_id;
