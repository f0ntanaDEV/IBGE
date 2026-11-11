# Regras de status e ações dos KPIs

Transcrever para `apps/web/src/content/kpi-rules.ts` (frontend) e `apps/api/app/domain/kpi_rules.yaml` (backend, usado nos testes). Os limites são **parâmetros do painel** (documentados e ajustáveis), não metas oficiais do IBGE. Isso deve aparecer escrito na página "Como ler este painel".

Status: **Favorável** · **Atenção** · **Crítico**, sempre com ícone + texto (nunca só cor).
"Ação" = texto curto exibido no popover do KPI e no card "O que fazer". Até 25 palavras.

| KPI (nome padrão) | Regra | Favorável | Atenção | Crítico | Ação sugerida (Atenção/Crítico) |
|---|---|---|---|---|---|
| Crescimento anual da população | variação % ano a ano | > 0,5% | 0% a 0,5% | < 0% | Revisar projetos de expansão de infraestrutura e priorizar adaptação e manutenção da rede existente. |
| Esperança de vida ao nascer | diferença em relação ao Brasil no mesmo ano (para o Brasil: em relação ao ano anterior) | ≥ 0 | −1 a 0 ano | < −1 ano (ou queda anual) | Priorizar atenção primária, saneamento e prevenção de mortes evitáveis no território. |
| Filhos por mulher | valor | ≥ 2,1 | 1,6 a 2,1 | < 1,6 | Planejar para menos nascimentos: rede escolar, políticas de conciliação entre trabalho e família. |
| Idosos para cada 100 crianças | valor | < 50 | 50 a 100 | > 100 | Ampliar cuidados de longa duração, geriatria e acessibilidade urbana. |
| Mortalidade infantil (por mil) | valor | ≤ 10 | 10 a 15 | > 15 | Reforçar pré-natal, parto seguro, vacinação e leitos neonatais. |
| Idosos (60+) na população | % | < 10% | 10% a 20% | > 20% | Dimensionar saúde, previdência e cuidado para uma população mais velha. |
| Crianças (0–14) na população | variação em 10 anos (p.p.) | ≥ 0 | −3 a 0 p.p. | < −3 p.p. | Reavaliar a oferta de creches e escolas e redirecionar a capacidade ociosa. |
| Razão de dependência total | valor (0–14 e 65+ por 100 de 15–64) | ≤ 45 | 45 a 55 | > 55 | Aproveitar a janela restante para elevar produtividade, escolaridade e formalização. |
| Idade mediana | valor | < 30 | 30 a 40 | > 40 | Antecipar mudanças na demanda: de serviços para jovens para serviços para adultos e idosos. |
| Risco de morrer antes de 1 ano (por mil) | valor | ≤ 10 | 10 a 15 | > 15 | Mesmas ações da mortalidade infantil. |
| Chegam aos 80 (de cada 100) | valor | ≥ 55 | 45 a 55 | < 45 | Reduzir a mortalidade adulta evitável, sobretudo masculina (violência, acidentes, doenças crônicas). |
| Vida restante aos 60 (anos) | valor | ≥ 22 | 20 a 22 | < 20 | Fortalecer o cuidado de doenças crônicas e o envelhecimento ativo. |
| Validações aprovadas (Qualidade) | % das regras ok | 100% | 95% a 100% | < 95% | Não publicar análises até investigar as regras com falha na página de Qualidade. |
| Valores atípicos (Qualidade) | % das linhas sinalizadas | < 0,5% | 0,5% a 2% | > 2% | Revisar a regra de detecção ou a carga; atípicos em dados oficiais costumam indicar falso positivo. |

Valores de referência (Brasil, 2026), que servem de teste:
| KPI | Valor | Status esperado |
|---|---|---|
| Crescimento anual da população | +0,37% | Atenção |
| Esperança de vida ao nascer | 77,03 (+0,21 ano em relação a 2025) | Favorável |
| Filhos por mulher | 1,51 | Crítico |
| Idosos para cada 100 crianças | 89,06 | Atenção |
| Mortalidade infantil | 11,83 | Atenção |
| Idosos (60+) | 17,1% | Atenção |
| Crianças (0–14), variação em 10 anos | −3,0 p.p. | Atenção (limite inclusivo) |
| Razão de dependência | 45,2 | Atenção |
| Idade mediana | 36,1 | Atenção |
| Chegam aos 80 | 54,6 | Atenção |
| Vida restante aos 60 | 22,82 | Favorável |

Bahia (2026): Esperança de vida 76,26 → **Atenção** (−0,77 em relação ao Brasil).
