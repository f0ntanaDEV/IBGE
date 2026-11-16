-- Parâmetros: ano INT = 2026 e territorio STRING = 'Brasil'. Seletor: SELECT DISTINCT local FROM ibge.gold.territorios.
-- Página Qualidade. Sem parâmetros.
-- Conta a base tratada. O relatório de nulos, duplicatas e validações fica no
-- .report.json do ETL (MySQL etl_runs); esta página não o reprocessa.

-- WIDGET tabela: linhas e outliers por dataset
SELECT dataset_id, nome, linhas, outliers
FROM ibge.gold.qualidade_linhas
ORDER BY dataset_id;

-- WIDGET barras: outliers por motivo
SELECT dataset_id, outlier_motivo, linhas
FROM ibge.gold.qualidade_outliers
ORDER BY dataset_id, linhas DESC;
