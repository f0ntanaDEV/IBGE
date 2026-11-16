# Estatísticas da silver

Gerado por `python -m app.tools.eda`. Números com no máximo 2 casas.

A planilha larga da ds1 tem 9.009 linhas (33 territórios × 3 sexos × 91 idades). O formato longo repete cada linha nos 71 anos de 2000 a 2070: 9.009 × 71 = 639.639.

## Forma, tipos, nulos, duplicatas e atípicos

### ds1

| | antes | depois |
|---|---:|---:|
| linhas | 639.639 | 639.639 |
| colunas | — | 10 |
| nulos | 0 | 0 |
| duplicatas na chave | 0 | 0 |
| atípicos | 0 | 0 |

Tipos depois da limpeza: `idade` Int64, `sexo` str, `cod` Int64, `sigla` str, `local` str, `ano` Int64, `populacao` int64, `nivel` str, `is_outlier` bool, `outlier_motivo` object.

### ds2

| | antes | depois |
|---|---:|---:|
| linhas | 133.551 | 133.551 |
| colunas | — | 11 |
| nulos | 0 | 0 |
| duplicatas na chave | 0 | 0 |
| atípicos | 0 | 0 |

Tipos depois da limpeza: `grupo_etario` str, `sexo` str, `cod` Int64, `sigla` str, `local` str, `ano` Int64, `populacao` int64, `idade_inicio` Int64, `nivel` str, `is_outlier` bool, `outlier_motivo` object.

### ds3

| | antes | depois |
|---|---:|---:|
| linhas | 2.343 | 2.343 |
| colunas | — | 72 |
| nulos | 0 | 0 |
| duplicatas na chave | 0 | 0 |
| atípicos | 0 | 0 |

Tipos depois da limpeza: `ano` Int64, `cod` Int64, `sigla` str, `local` str, `pop_t` int64, `pop_h` int64, `pop_m` int64, `n_0_1_t` int64, `n_0_1_h` int64, `n_0_1_m` int64, `n_0_4_t` int64, `n_0_4_h` int64, `n_0_4_m` int64, `n_0_14_t` int64, `n_0_14_h` int64, `n_0_14_m` int64, `n_15_17_t` int64, `n_15_17_h` int64, `n_15_17_m` int64, `n_18_21_t` int64, `n_18_21_h` int64, `n_18_21_m` int64, `n_15_59_t` int64, `n_15_59_h` int64, `n_15_59_m` int64, `n_15_64_t` int64, `n_15_64_h` int64, `n_15_64_m` int64, `n_60_mais_t` int64, `n_60_mais_h` int64, `n_60_mais_m` int64, `n_65_mais_t` int64, `n_65_mais_h` int64, `n_65_mais_m` int64, `n_80_mais_t` int64, `n_80_mais_h` int64, `n_80_mais_m` int64, `p_h` float64, `p_m` float64, `p_0_1_t` float64, `p_0_1_h` float64, `p_0_1_m` float64, `p_0_4_t` float64, `p_0_4_h` float64, `p_0_4_m` float64, `p_0_14_t` float64, `p_0_14_h` float64, `p_0_14_m` float64, `p_15_17_t` float64, `p_15_17_h` float64, `p_15_17_m` float64, `p_18_21_t` float64, `p_18_21_h` float64, `p_18_21_m` float64, `p_15_59_t` float64, `p_15_59_h` float64, `p_15_59_m` float64, `p_15_64_t` float64, `p_15_64_h` float64, `p_15_64_m` float64, `p_60_mais_t` float64, `p_60_mais_h` float64, `p_60_mais_m` float64, `p_65_mais_t` float64, `p_65_mais_h` float64, `p_65_mais_m` float64, `p_80_mais_t` float64, `p_80_mais_h` float64, `p_80_mais_m` float64, `nivel` str, `is_outlier` bool, `outlier_motivo` object.

### ds4

| | antes | depois |
|---|---:|---:|
| linhas | 2.343 | 2.343 |
| colunas | — | 62 |
| nulos | 99 | 99 |
| duplicatas na chave | 0 | 0 |
| atípicos | 8 | 7 |

Tipos depois da limpeza: `ano` Int64, `cod` Int64, `sigla` str, `local` str, `pop_t` int64, `pop_h` int64, `pop_m` int64, `tcg_t` float64, `tcg_h` float64, `tcg_m` float64, `rs` float64, `nasc_t` int64, `nasc_h` int64, `nasc_m` int64, `obt_t` int64, `obt_h` int64, `obt_m` int64, `tbn` float64, `tbm` float64, `tcv` float64, `e0_t` float64, `e0_h` float64, `e0_m` float64, `e60_t` float64, `e60_h` float64, `e60_m` float64, `tmi_t` float64, `tmi_h` float64, `tmi_m` float64, `n_5q0_t` float64, `n_5q0_h` float64, `n_5q0_m` float64, `n_45q15_t` float64, `n_45q15_h` float64, `n_45q15_m` float64, `n_20q60_t` float64, `n_20q60_h` float64, `n_20q60_m` float64, `tft` float64, `tef_10_14` float64, `tef_15_19` float64, `tef_20_24` float64, `tef_25_29` float64, `tef_30_34` float64, `tef_35_39` float64, `tef_40_44` float64, `tef_45_49` float64, `tef_50_mais` float64, `rdj60` float64, `rdi60` float64, `rdt60` float64, `rdj65` float64, `rdi65` float64, `rdt65` float64, `ie60` float64, `ie65` float64, `ie80` float64, `id_m` float64, `id_med` float64, `nivel` str, `is_outlier` bool, `outlier_motivo` str.

### ds5

| | antes | depois |
|---|---:|---:|
| linhas | 140.580 | 140.580 |
| colunas | — | 20 |
| nulos | 7.029 | 7.029 |
| duplicatas na chave | 0 | 0 |
| atípicos | 0 | 0 |

Tipos depois da limpeza: `idade` Int64, `intervalo` float64, `sexo` str, `ano` Int64, `cod` Int64, `sigla` str, `local` str, `nmx` float64, `nax` float64, `nqx` float64, `lx` float64, `ndx` float64, `nlx` float64, `sx` float64, `tx` float64, `ex` float64, `intervalo_aberto` bool, `nivel` str, `is_outlier` bool, `outlier_motivo` object.

Os 99 nulos estruturais são `tcg_t`, `tcg_h` e `tcg_m` no ano 2000, nos 33 territórios. A taxa de crescimento não existe no primeiro ano da série e não é imputada.

## Describe

### População por idade, Brasil, 2026, sexo Ambos

| | |
|---|---:|
| média | 2.353.977 |
| mediana | 2.746.996 |
| desvio-padrão | 964.572 |
| mín. | 223.580 |
| Q1 | 1.745.223 |
| Q3 | 3.149.566 |
| máx. | 3.344.410 |

### UFs em 2026

#### e0

| | |
|---|---:|
| média | 76,82 |
| mediana | 76,79 |
| desvio-padrão | 1,17 |
| mín. | 74,84 |
| Q1 | 76,08 |
| Q3 | 77,48 |
| máx. | 80,03 |

#### TFT

| | |
|---|---:|
| média | 1,61 |
| mediana | 1,55 |
| desvio-padrão | 0,19 |
| mín. | 1,37 |
| Q1 | 1,45 |
| Q3 | 1,73 |
| máx. | 2,14 |

#### IE60

| | |
|---|---:|
| média | 75,98 |
| mediana | 79,14 |
| desvio-padrão | 23,85 |
| mín. | 31,52 |
| Q1 | 61,15 |
| Q3 | 89,25 |
| máx. | 125,61 |

#### idade mediana

| | |
|---|---:|
| média | 34,36 |
| mediana | 35,04 |
| desvio-padrão | 3,06 |
| mín. | 28,08 |
| Q1 | 33,05 |
| Q3 | 36,43 |
| máx. | 39,12 |

#### nqx

| | |
|---|---:|
| média | 0,12 |
| mediana | 0,02 |
| desvio-padrão | 0,23 |
| mín. | 0,00 |
| Q1 | 0,01 |
| Q3 | 0,09 |
| máx. | 1,00 |

## Regiões em 2026

| região | população | e0 | TFT | IE60 |
|---|---:|---:|---:|---:|
| Norte | 18.929.341 | 76,35 | 1,75 | 48,70 |
| Nordeste | 57.366.981 | 76,60 | 1,50 | 79,72 |
| Sudeste | 89.015.421 | 77,27 | 1,43 | 105,38 |
| Sul | 31.498.532 | 77,70 | 1,50 | 104,26 |
| Centro-Oeste | 17.401.676 | 77,18 | 1,64 | 71,86 |

## Correlação

Pearson e0 × TFT nas 27 UFs em 2026: **-0,63**. Gráfico: `dispersao_e0_tft.png`.

## Referências

- Pico em **2041** com **220.425.299** pessoas. Gráfico: `populacao_2000_2070.png`.
- 2070: **199.228.708**.
- 60+ supera 0–14 em **2029**.
- Óbitos superam nascimentos em **2042**.
- Pirâmide: `piramide_2026_2070.png`. Histograma de e0: `histograma_e0_2026.png`. Boxplot de TFT: `boxplot_tft_regiao.png`.
