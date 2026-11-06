# Perfil das projeções IBGE (revisão 2024)

Gerado a partir das planilhas em `data/raw/` (abas e cabeçalhos de `apps/api/datasets.yaml`). `header_row` é o índice base 0 do pandas: a linha anterior é o cabeçalho agrupador e é descartada. A aba `NOTAS` de ds4 não entra na leitura.

Os testes golden leem o bloco YAML abaixo e conferem as células correspondentes nas fixtures de `apps/api/tests/fixtures/` (Brasil, Norte, Rondônia e Rio de Janeiro; anos 2022–2024). Os totais de pico e de cruzamento usam a série completa e são reaplicados sobre o Parquet depois do processamento integral.

```yaml
ds1:
  rows: 9009
  years: [2000, 2070]
  sexo: [Ambos, Homens, Mulheres]
  brasil_ambos:
    "2000": 174695935
    "2022": 210862983
    "2024": 212583750
    "2026": 214211951
    "2041": 220425299
    "2070": 199228708
  pico: {ano: 2041, populacao: 220425299}
  brasil_ambos_idade_0:
    "2024": 2484344
    homens_2024: 1271325
    mulheres_2024: 1213019
  territorial_2024_ambos_max_diff: 0
ds2:
  rows: 1881
  grupos: 19
  exemplo: "00-04"
ds3:
  rows: 2343
  brasil_2022:
    pop_t: 210862983
    pop_0_14: 42984314
    pop_60_mais: 31864499
  idosos_superam_0_14_ano: 2029
ds4:
  rows: 2343
  tcg_nulos_no_primeiro_ano: 33
  brasil:
    "2000": {pop_t: 174695935, tft: 2.3155517895268, e0_t: 71.1021851042547, tmi_t: 28.1269745904994}
    "2022": {pop_t: 210862983, tft: 1.57625383660638, e0_t: 75.448044104081, tmi_t: 12.4213105471151}
    "2024": {pop_t: 212583750, tft: 1.54680260681053, e0_t: 76.6057109845871, tmi_t: 12.2488303378121}
    "2026": {pop_t: 214211951, tft: 1.51291796111521, e0_t: 77.0272472172583, tmi_t: 11.8289603033109}
ds5:
  rows: 140580
  idades: 20
  intervalo_aberto: 7029
  nqx_min: 0.000403425066147821
  nqx_max: 1
  brasil_idade_0_2022:
    mulheres_ex: 78.793178
    homens_ex: 72.108304
    ambos_ex: 75.448044
```
