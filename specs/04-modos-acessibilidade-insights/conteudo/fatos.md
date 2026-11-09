# Catálogo de fatos

Valores calculados das Projeções da População, Revisão 2024. Ano de referência: **2026**. Os valores de Brasil (BR) e Nordeste (NE) são **testes golden**; as demais regiões são calculadas pelas mesmas funções.
Convenções: `ds4` = indicadores, `ds3` = grupos etários, `ds1` = idade simples (Ambos), `ds2` = quinquenal (Ambos), `ds5` = tábua (Ambos, salvo indicação). "Primeiro ano em que" = o menor `ano` em que a condição é verdadeira.

## Visão Geral (`overview`): 8 fatos
| id | Rótulo | Cálculo | BR | NE |
|---|---|---|---|---|
| pop_ref | População em 2026 | ds4 `pop_t` (2026) | 214.211.951 | 57.366.981 |
| pico | Pico populacional | ano e valor de `max(pop_t)` | 2041 · 220.425.299 | 2037 · 58.094.114 |
| pop_2070 | População em 2070 | `pop_t` (2070) e variação em relação ao pico | 199.228.708 (−9,6%) | 51.017.220 (−12,2%) |
| idosos_criancas | Idosos (60+) passam a superar crianças (0–14) | ds3: primeiro ano em que `pop_60mais_t > pop_0_14_t` | 2029 | 2031 |
| obitos_nasc | Óbitos passam a superar nascimentos | ds4: primeiro ano em que `obt_t > nasc_t` | 2042 | 2043 |
| e0 | Esperança de vida ao nascer | `e0_t` (2026) e diferença desde 2000 | 77,03 anos (+5,93 desde 2000) | 76,60 anos (+6,61) |
| tft | Filhos por mulher | `tft` (2026) e primeiro ano com `tft < 2,1` | 1,51 · abaixo da reposição desde 2002 | 1,50 · desde 2006 |
| id_med | Idade mediana | `id_med` 2000 → 2026 → 2070 | 25,3 → 36,1 → 51,2 | 23,0 → 35,0 → 52,2 |

## População por idade (`ds1`): 7 fatos
| id | Rótulo | Cálculo | BR | NE |
|---|---|---|---|---|
| idade_modal_2026 | Idade com mais pessoas em 2026 | `argmax(populacao)` entre 0 e 89 anos (e o valor de 2000) | 41 anos (2000: 15) | 41 anos (2000: 15) |
| idade_modal_2070 | Idade com mais pessoas em 2070 | idem, 2070, entre 0 e 89 | 55 anos | 70 anos |
| bebes | Pessoas com 0 anos | idade 0: 2000 → 2026 → 2070 | 3.423.475 → 2.386.874 → 1.485.716 | 1.070.056 → 657.383 → 367.288 |
| noventa | Pessoas com 90 anos ou mais | idade 90: 2000 → 2026 → 2070 | 304.306 → 814.288 → 5.504.219 | 102.641 → 229.307 → 1.455.814 |
| idade_mulheres | Idade a partir da qual há mais mulheres que homens | 2026: menor idade com `Mulheres > Homens` | 28 anos | 26 anos |
| rs_90 | Homens para cada 100 mulheres com 90+ | 2026: `H(90) / M(90) × 100` | 48,2 | 50,9 |
| mediana_simples | Idade mediana pela distribuição por idade | 2026: menor idade em que o acumulado ≥ 50% | 36 anos | 34 anos |

## Grupos quinquenais (`ds2`): 7 fatos
| id | Rótulo | Cálculo | BR | NE |
|---|---|---|---|---|
| maior_grupo | Maior grupo etário | `argmax` em 2000 / 2026 / 2070 | 15–19 / 40–44 / 55–59 | 10–14 / 40–44 / 65–69 |
| zero_quatro | Crianças de 0 a 4 anos | 2000 → 2026 → 2070 | 17.281.547 → 12.380.087 → 7.543.093 | 5.339.900 → 3.416.421 → 1.867.005 |
| oitenta | Pessoas com 80 anos ou mais | soma 80–84 + 85–89 + 90+ | 2.032.255 → 5.184.146 → 22.689.672 | 675.989 → 1.388.477 → 6.105.206 |
| razao_80_04 | Pessoas 80+ para cada criança de 0–4 | razão 2000 → 2026 → 2070 | 0,12 → 0,42 → 3,01 | 0,13 → 0,41 → 3,27 |
| ano_80_04 | 80+ passam a superar 0–4 | primeiro ano em que 80+ > 0–4 | 2041 | 2042 |
| mais_cresce | Grupo que mais cresce até 2070 | maior variação % 2026 → 2070 | 90+ (+576,0%) | 90+ (+534,9%) |
| mais_cai | Grupo que mais diminui até 2070 | menor variação % 2026 → 2070 | 05–09 (−43,8%) | 05–09 (−49,8%) |

## Grupos etários (`ds3`): 8 fatos
| id | Rótulo | Cálculo | BR | NE |
|---|---|---|---|---|
| p_0_14 | Crianças (0–14) na população | `p_0_14_t` 2026 | 19,2% | 19,8% |
| p_60 | Idosos (60+) na população | `p_60mais_t` 2026 → 2070 | 17,1% → 37,8% | 15,8% → 39,4% |
| p_80 | Pessoas com 80+ na população | `p_80mais_t` 2026 → 2070 | 2,4% → 11,4% | 2,4% → 12,0% |
| cruz_60 | 60+ passam a superar 0–14 | primeiro ano | 2029 | 2031 |
| cruz_65 | 65+ passam a superar 0–14 | primeiro ano | 2036 | 2037 |
| rd_min | Menor razão de dependência (0–14 e 65+) | ds4 `argmin(rdt65)` e valor | 2017 · 44,4 | 2026 · 44,7 |
| uf_mais_idosa | UF com maior participação de 60+ | entre as UFs do território, 2026 | RS · 21,8% | PB · 16,8% |
| uf_mais_jovem | UF com menor participação de 60+ | idem | RR · 8,8% | MA · 13,3% |

## Indicadores (`ds4`): 10 fatos
| id | Rótulo | Cálculo | BR | NE |
|---|---|---|---|---|
| e0_sexo | Esperança de vida: total, homens e mulheres | `e0_t/h/m` 2026 | 77,03 · 73,75 · 80,27 | 76,60 · 72,99 · 80,20 |
| e0_gap | Mulheres vivem a mais | `e0_m − e0_h` 2026 | 6,52 anos | 7,22 anos |
| e0_longo | Esperança de vida 2000 → 2070 | `e0_t` | 71,10 → 83,91 | 69,99 → 83,81 |
| e0_covid | Queda na pandemia | `e0_t` 2019 → 2021 e diferença | 76,22 → 72,78 (−3,44) | 75,84 → 73,23 (−2,61) |
| tft | Filhos por mulher | `tft` 2000 → 2026 e primeiro ano < 2,1 | 2,32 → 1,51 · desde 2002 | 2,62 → 1,50 · desde 2006 |
| tmi | Mortalidade infantil | `tmi_t` 2000 → 2026 (por mil) e variação | 28,13 → 11,83 (−58%) | 41,18 → 12,96 (−69%) |
| natalidade_mortalidade | Nascimentos e óbitos por mil habitantes | `tbn` e `tbm` 2026 | 11,17 · 7,26 | 11,49 · 7,11 |
| obitos_nasc | Óbitos passam a superar nascimentos | primeiro ano `obt_t > nasc_t` | 2042 | 2043 |
| ie60 | Idosos para cada 100 crianças | `ie60` 2026 → 2070 | 89,1 → 316,2 | 79,7 → 339,7 |
| uf_e0 | UFs com maior e menor esperança de vida | entre as UFs do território, `e0_t` 2026 | DF 80,03 · AP 74,84 | RN 78,19 · AL 74,91 |

## Tábuas de mortalidade (`ds5`): 8 fatos
| id | Rótulo | Cálculo | BR | NE |
|---|---|---|---|---|
| e0 | Esperança de vida ao nascer | `ex` na idade 0, 2026 | 77,03 | 76,60 |
| e60 | Anos de vida restantes aos 60 (total · H · M) | `ex` na idade 60, 2026 | 22,82 · 21,02 · 24,41 | 23,08 · 21,36 · 24,58 |
| q0 | Risco de morrer antes de 1 ano | `nqx` idade 0 × 1000, 2026 | 11,83 por mil | 12,96 por mil |
| l60 | De cada 100 nascidos, chegam aos 60 | `lx(60) / 1000`, 2026 | 86,4 | 85,2 |
| l80 | De cada 100 nascidos, chegam aos 80 (total · H · M) | `lx(80) / 1000`, 2026 | 54,6 · 46,0 · 63,0 | 54,7 · 46,1 · 63,1 |
| l80_longo | Chegam aos 80: 2000 → 2070 | `lx(80) / 1000` | 40,7 → 71,8 | 40,9 → 71,8 |
| q20 | Risco de morrer entre 20 e 24 anos (H · M) | `nqx` idade 20 × 1000, 2026 | 10,85 · 2,67 por mil | 14,59 · 2,90 por mil |
| sobremort | Maior excesso de mortalidade masculina | `argmax(nqx_H / nqx_M)` (idades < 90) e a razão | 20–24 anos · 4,07× | 20–24 anos · 5,04× |

## Qualidade de dados (`quality`): 8 fatos (sem território; base original por padrão)
| id | Rótulo | Cálculo | Golden (base original) |
|---|---|---|---|
| linhas | Linhas tratadas nas 5 bases | Σ `rows_out` (ds1 e ds2 já em formato longo) | 918.456 |
| duplicatas | Duplicatas removidas | Σ `duplicates.exact + by_key` | 0 |
| nulos_estruturais | Nulos estruturais mantidos | Σ `nulls.structural` | 99 (`tcg_t/h/m` em 2000 × 33 territórios) |
| nulos_imputados | Nulos imputados | Σ `nulls.total_imputed` | 0 |
| validacoes | Validações de consistência aprovadas | `ok` / total | todas aprovadas |
| outliers | Valores sinalizados como atípicos | Σ `outliers.by_column` | calculado (sem golden) |
| demo | Base de demonstração (suja) | duplicatas removidas e nulos imputados na última execução `sujo` | calculado |
| ultima | Última execução bem-sucedida | `max(finished_at)` | calculado |

Composição de 918.456: ds1 9.009 × 71 = 639.639 · ds2 1.881 × 71 = 133.551 · ds3 2.343 · ds4 2.343 · ds5 140.580.
