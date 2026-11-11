# Itens do card Contexto

Cada item responde a Território (inclusive UF), Ano e Sexo (quando a métrica tem sexo; padrão Ambos). Valores de referência: **ano 2026, Ambos** — Brasil (BR, cod 0) e Bahia (BA, cod 29). São testes golden.
"Gráfico" = o card ao qual o chip "Ver no gráfico" leva. `alt` = item exibido no lugar quando o território é Brasil (ou região, quando indicado).

## Visão Geral (`overview`)
| id | Rótulo | Cálculo | Gráfico | BR | BA |
|---|---|---|---|---|---|
| pop | População | ds4 `pop_t` (ano) | População 2000–2070 | 214.211.951 | 14.889.472 |
| var_anual | Variação em relação ao ano anterior | `pop(ano) − pop(ano−1)` e % | População 2000–2070 | +790.914 (+0,37%) | +18.565 (+0,12%) |
| pico | Pico populacional | ano de `max(pop_t)` e `pop(ano)/max × 100` | População 2000–2070 (marcador do pico) | 2041 · 97,2% do pico | 2034 · 99,4% do pico |
| cresc_natural | Nascimentos menos óbitos | `nasc_t − obt_t` (ano) | Marcos | +837.215 | +48.515 |
| migracao | Saldo migratório implícito (estimado) | `pop(ano) − pop(ano−1) − (nasc − obt)(ano−1)` | População 2000–2070 | −114.915 | −34.722 |
| participacao | Participação na população do Brasil | `pop / pop_BR × 100` (não Brasil) | População 2000–2070 | `alt` | 7,0% |
| participacao.alt | Região mais populosa | região com maior `pop_t` e % do Brasil | População 2000–2070 | Sudeste · 41,6% | — |
| censo | Censo 2022 × projeção 2022 | projeção 2022, recenseado e diferença % (opcional) | População 2000–2070 | 210.862.983 × 203.080.756 (+3,8%) | sem golden (API) |

Nota do `migracao`: "Derivado: variação da população menos o crescimento natural. Não é publicado pelo IBGE."

## População por idade (`ds1`)
| id | Rótulo | Cálculo | Gráfico | BR | BA |
|---|---|---|---|---|---|
| razao_sexo | Homens para cada 100 mulheres | Σ H / Σ M × 100 (todas as idades) | Pirâmide etária | 95,1 | 94,4 |
| idade_modal | Idade com mais pessoas | `argmax` entre 0 e 89 | Pirâmide etária · Mapa de calor | 41 anos | 42 anos |
| estrutura | Crianças · idade ativa · idosos | % 0–14 · 15–64 · 65+ (soma das idades simples) | Pirâmide etária | 19,2% · 68,9% · 12,0% | 18,8% · 69,5% · 11,7% |
| mediana | Idade mediana | menor idade com acumulado ≥ 50% | Pirâmide etária | 36 anos | 36 anos |
| noventa | Pessoas com 90 anos ou mais | idade 90 (grupo aberto) | Mapa de calor | 814.288 | 61.975 |
| censo | Censo 2022 × projeção 2022 | como na Visão Geral (opcional) | Pirâmide etária | +3,8% | sem golden |

## Grupos quinquenais (`ds2`)
| id | Rótulo | Cálculo | Gráfico | BR | BA |
|---|---|---|---|---|---|
| maior_grupo | Maior grupo etário | `argmax` dos grupos | Pirâmide quinquenal | 40–44 | 40–44 |
| faixas | Crianças · adultos · idosos | % 0–14 · 15–59 · 60+ | Composição 100% | 19,2% · 63,8% · 17,1% | 18,8% · 64,6% · 16,6% |
| razao_80_04 | Pessoas 80+ por criança de 0–4 | (80–84 + 85–89 + 90+) / 00–04 | Pirâmide quinquenal | 0,42 | 0,46 |
| zero_quatro | Crianças de 0–4 em relação a 2000 | variação % de 00–04 entre 2000 e o ano | Comparação 2000 × 2070 | −28,4% | −40,3% |
| mais_cresceu | Grupo que mais cresceu desde 2000 | maior variação % entre 2000 e o ano | Comparação 2000 × 2070 | 90+ (+167,6%) | 65–69 (+134,6%) |

## Grupos etários (`ds3`)
| id | Rótulo | Cálculo | Gráfico | BR | BA |
|---|---|---|---|---|---|
| proporcoes | Crianças (0–14) · idosos (60+) | `p_0_14_t` · `p_60mais_t` | 0–14 e 60+ | 19,2% · 17,1% | 18,8% · 16,6% |
| cruzamento | Idosos superam crianças | primeiro ano 60+ > 0–14 e distância ao ano selecionado ("em N anos" / "há N anos") | 0–14 e 60+ | 2029 (em 3 anos) | 2029 (em 3 anos) |
| rd_total | Razão de dependência total | `rdt65` | Bônus demográfico | 45,2 | 43,8 |
| rd_partes | Dependência de jovens · de idosos | `rdj65` · `rdi65` | Bônus demográfico | 27,8 · 17,4 | 27,0 · 16,8 |
| rd_min | Menor razão de dependência da série | `argmin(rdt65)` e valor | Bônus demográfico | 2017 · 44,4 | 2024 · 43,7 |
| posicao | Posição entre as 27 UFs em % de 60+ | rank decrescente (só UF) | Ranking de UFs | `alt` | 10ª |
| posicao.alt | UF com maior e menor % de 60+ | entre as UFs do território (Brasil ou região) | Ranking de UFs | RS 21,8% · RR 8,8% | — |
| censo | Censo 2022 × projeção 2022 | opcional | 0–14 e 60+ | +3,8% | sem golden |

## Indicadores (`ds4`)
| id | Rótulo | Cálculo | Gráfico | BR | BA |
|---|---|---|---|---|---|
| e0 | Esperança de vida: total · homens · mulheres | `e0_t/h/m` | Esperança de vida H × M | 77,03 · 73,75 · 80,27 | 76,26 · 72,40 · 80,19 |
| e0_gap | Mulheres vivem a mais | `e0_m − e0_h` | Barras divergentes | 6,52 anos | 7,79 anos |
| tft | Filhos por mulher | `tft` e diferença para 2,1 | TFT e reposição | 1,51 (−0,59) | 1,43 (−0,67) |
| tcv | Crescimento vegetativo | `tcv` por mil, com `tbn` e `tbm` na nota | Natalidade × mortalidade | 3,91 por mil (11,17 − 7,26) | 3,26 por mil (10,70 − 7,45) |
| tmi | Mortalidade infantil | `tmi_t` por mil | Mapa por UF (TMI) | 11,83 | 13,76 |
| posicao | Posição entre as 27 UFs em esperança de vida | rank decrescente de `e0_t` (só UF) | Ranking de UFs | `alt` | 18ª |
| posicao.alt | UF com maior e menor esperança de vida | entre as UFs do território | Ranking de UFs | DF 80,03 · AP 74,84 | — |
| censo | Censo 2022 × projeção 2022 | opcional | Esperança de vida H × M | +3,8% | sem golden |

## Tábuas de mortalidade (`ds5`)
| id | Rótulo | Cálculo | Gráfico | BR | BA |
|---|---|---|---|---|---|
| ex | Esperança de vida ao nascer · aos 60 | `ex` nas idades 0 e 60 | Esperança de vida por idade | 77,03 · 22,82 | 76,26 · 23,13 |
| sobreviventes | De cada 100 nascidos, chegam aos 60 · aos 80 | `lx(60)/1000` · `lx(80)/1000` | Curva de sobrevivência | 86,4 · 54,6 | 84,6 · 54,8 |
| idade_metade | Idade em que metade dos nascidos já morreu | interpolação linear de `lx = 50.000` | Curva de sobrevivência | 81,5 anos | 81,6 anos |
| q0 | Risco de morrer antes de 1 ano | `nqx(0) × 1000` | Probabilidade de morte por idade | 11,83 por mil | 13,76 por mil |
| sobremort | Maior excesso de mortalidade masculina | `argmax(nqx_H / nqx_M)` (< 90) | Probabilidade de morte por idade | 20–24 anos · 4,07× | 20–24 anos · 5,61× |

Observação: na ds5, quando Sexo = Homens ou Mulheres, `ex`, `sobreviventes`, `idade_metade` e `q0` usam a tábua do sexo escolhido; `sobremort` é sempre a comparação entre os sexos.
