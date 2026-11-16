# Relatório de EDA — Projeções da População (revisão 2024)

Estatística descritiva transcrita de `specs/DATA_PROFILE.md` e das manchetes fechadas na etapa 9 (`specs/09-ajustes-avaliacao/requirements.md`). Nenhum número foi recalculado nas planilhas.

## Estatística descritiva

| Base | Linhas | O que a série cobre | Fonte |
|---|---:|---|---|
| ds1, população por idade | 9.009 | Anos 2000–2070; sexos Ambos, Homens e Mulheres | `specs/DATA_PROFILE.md` |
| ds2, grupos quinquenais | 1.881 | 19 grupos; exemplo 00-04 | `specs/DATA_PROFILE.md` |
| ds3, grupos etários | 2.343 | Totais e faixas por território e ano | `specs/DATA_PROFILE.md` |
| ds4, indicadores | 2.343 | 33 nulos de TCG no primeiro ano | `specs/DATA_PROFILE.md` |
| ds5, tábuas | 140.580 | 20 idades; 7.029 intervalos abertos | `specs/DATA_PROFILE.md` |

| Indicador (Brasil) | 2000 | 2022 | 2024 | 2026 | Fonte |
|---|---:|---:|---:|---:|---|
| População | 174.695.935 | 210.862.983 | 212.583.750 | 214.211.951 | `specs/DATA_PROFILE.md` |
| TFT (filhos por mulher) | 2,3155517895268 | 1,57625383660638 | 1,54680260681053 | 1,51291796111521 | `specs/DATA_PROFILE.md` |
| e0 total (anos) | 71,1021851042547 | 75,448044104081 | 76,6057109845871 | 77,0272472172583 | `specs/DATA_PROFILE.md` |
| TMI total | 28,1269745904994 | 12,4213105471151 | 12,2488303378121 | 11,8289603033109 | `specs/DATA_PROFILE.md` |

Pico da população (Brasil, ambos os sexos): **2041**, com **220.425.299** pessoas. Em 2070 a projeção é **199.228.708**. Fonte: `specs/DATA_PROFILE.md`.

`nqx` na tábua: mínimo **0,000403425066147821**, máximo **1**. Fonte: `specs/DATA_PROFILE.md`.

## Respostas

### A população ainda cresce? Até quando?

Sim, até **2041**. Nesse ano o Brasil chega a **220.425.299** habitantes e depois recua para **199.228.708** em **2070**. A série publicada vai de **2000** a **2070**. Fonte: `specs/DATA_PROFILE.md`.

### Como a idade muda e onde estará a demanda?

A manchete da População por idade, no ano-base 2026, registra que **17,1%** da população tem 60 anos ou mais e que em **2040** serão **24,3%**. A demanda se desloca para adultos e idosos. A idade mediana oficial do Brasil nesse recorte é **36,1** anos. Fonte: manchetes da etapa 9 em `specs/09-ajustes-avaliacao/requirements.md`.

### Quais faixas crescem e quais encolhem até 2070?

Até **2070**, o grupo de **90+** cresce **576,0%** e o de **5–9** encolhe **43,8%** (Brasil). Fonte: manchete da etapa 9 em `specs/09-ajustes-avaliacao/requirements.md`.

### Quando os idosos superam as crianças?

Em **2029** os idosos (60+) superam o grupo de 0–14 anos. Em 2022 o Brasil ainda tinha **42.984.314** pessoas de 0–14 anos e **31.864.499** de 60 anos ou mais. Fonte: `specs/DATA_PROFILE.md`.

### Em que ritmo se vive mais e se tem menos filhos?

De 2000 a 2026 a esperança de vida ao nascer passa de **71,1021851042547** para **77,0272472172583** anos, e a TFT de **2,3155517895268** para **1,51291796111521** filhos por mulher. A manchete de Indicadores arredonda 2026 para **77,03** anos e **1,51** filho, abaixo da reposição de 2,1. A TMI no mesmo intervalo cai de **28,1269745904994** para **11,8289603033109**. Fontes: `specs/DATA_PROFILE.md` e a manchete da etapa 9.

### Quantos chegam a cada idade?

A tábua publica 20 idades. O `nqx` vai de **0,000403425066147821** a **1** (o intervalo aberto). Em 2022, aos 0 anos de idade, a esperança de vida (`ex`) no Brasil é **75,448044** anos para ambos os sexos, **72,108304** para homens e **78,793178** para mulheres. Fonte: `specs/DATA_PROFILE.md`.
