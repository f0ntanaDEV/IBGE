# Silver

Parquet gerado pelo ETL a partir de `data/raw/`. A pasta guarda a base tratada que a API lê e que a carga ouro envia ao MySQL. Os Parquet completos não entram no Git.

## Como gerar

Na raiz do repositório, com as cinco planilhas em `data/raw/`:

```bash
cd apps/api
python -m app.tools.run_all
python -m app.tools.make_sample
```

`run_all` grava `data/silver/dsN_<carimbo>.parquet` (e o relatório ao lado). `make_sample` lê essa silver e grava `data/silver/amostra/`, com no máximo 2.000 linhas por base: Brasil (cod 0), Nordeste (cod 2) e Bahia (cod 29). Na ds1 entram só os anos 2000, 2024, 2026, 2041 e 2070. `amostra/golden.json` repete as conferências possíveis nesse recorte.

Se `data/processed/` ainda existir e `data/silver/` não tiver Parquet, a API move o conteúdo uma vez e registra um aviso no log.

## Esquema

Cada arquivo tem as colunas da fato em `apps/api/app/repositories/schema.py`, em snake_case, mais `nivel`, `is_outlier` e `outlier_motivo`.

| Arquivo | Grão | Chave |
|---|---|---|
| `ds1.parquet` | uma idade, um sexo, um território, um ano | `idade, sexo, cod, ano` |
| `ds2.parquet` | um grupo quinquenal, um sexo, um território, um ano | `grupo_etario, sexo, cod, ano` |
| `ds3.parquet` | um território e um ano, com faixas e proporções | `cod, ano` |
| `ds4.parquet` | um território e um ano, com os indicadores | `cod, ano` |
| `ds5.parquet` | uma idade da tábua, um sexo, um território, um ano | `idade, sexo, cod, ano` |

`cod` 0 é o Brasil, 1–5 são as regiões e os demais são UFs. `sexo` é `Ambos`, `Homens` ou `Mulheres`. Contagens de pessoas são inteiras; taxas e a tábua são decimais. `tcg_t`, `tcg_h` e `tcg_m` ficam nulos no primeiro ano da série.
