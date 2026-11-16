# Etapa 8: Reavaliação do app em produção (ibge-eight.vercel.app, 14/11/2026, 23:10–23:25)

Backend no ar (`/health` 200 em 167 ms). Todas as páginas percorridas em 1280 × 800, mais um teste de estabilidade com troca de território nas páginas pesadas (Brasil, Bahia, Nordeste e São Paulo): **126 chamadas à API, nenhuma falha**.

Legenda: ✅ atende · ⚠️ parcial · ❌ não atende

## Resumo
| Critério | 11/11 | 12/11 | **14/11** |
|---|---|---|---|
| Público definido | ❌ | ✅ | ✅ |
| Pergunta central | ⚠️ | ✅ | ✅ |
| Ações vinculadas | ❌ | ⚠️ | ✅ |
| Confiabilidade e integridade | ⚠️ | ❌ | ⚠️ |
| Atualização visível | ❌ | ⚠️ | ✅ |
| Consistência de métricas | ⚠️ | ⚠️ | ⚠️ |
| Regra dos 5 segundos | ⚠️ | ⚠️ | ✅ |
| Hierarquia topo / meio / base | ✅ | ✅ | ✅ |
| Grandes números e storytelling | ⚠️ | ✅* | ⚠️ |

\* com ressalvas.

## O que foi corrigido desde 12/11
- **População por idade estável**: carrega com Brasil, Bahia e Nordeste; a API não cai mais. A manchete deixou de mostrar "0 anos".
- **Status em todas as páginas**: Grupos quinquenais (4 KPIs com status e ações próprias) e Grupos etários (4 de 4) agora geram decisão.
- **Validações coerentes**: "103 de 113" na página e nos Fatos, com a lista das 10 falhas e a diferença de cada uma.
- **Atualização**: "Processado em 13/11/2026 17:14 (horário de Brasília)", coerente com o histórico, que agora também está no horário de Brasília.
- **Contexto** renderiza em todas as páginas (inclusive Indicadores e Grupos etários).
- **Grupos etários**: referências em % ("2000: 64,1%") e variações em p.p.
- **Fatos** parcialmente corrigidos: "1,51 · em 2000 2,32 · abaixo de 2,1 desde 2002", "2017 · razão 44,4", "89,06 · em 2070 316,24".
- **Arredondamento**: manchete da Tábuas "54,6" igual ao KPI; "Chegam aos 80" em 54,6 nos Fatos.
- **Siglas** retiradas de subtítulos ("Filhos por mulher, comparados ao nível de reposição", "A razão de dependência mede…").
- **Valores de referência conferidos**: Brasil 214.211.951; Bahia 14.889.472; Nordeste 57.366.981.

## O que ainda falta

### Confiabilidade ⚠️
1. **Falso "Crítico" nas validações.** As 10 falhas são somas de nascimentos e óbitos (Brasil × regiões × UFs) com diferença máxima de **2 a 5 pessoas**. Conferi na planilha original do IBGE: a diferença **já existe na fonte** (arredondamento das projeções de nascimentos e óbitos; no máximo 0,0006%), enquanto a população bate exatamente. O painel marca "Validações aprovadas: **Crítico**", e a regra correspondente manda "não publicar análises", um alarme falso sobre dados corretos. Correção: tolerância documentada para variáveis de fluxo (ex.: ≤ 10 pessoas ou ≤ 0,001%), com a nota "diferença de arredondamento da fonte".
2. **Base de demonstração** ainda "execução ainda não registrada" (`quality-report?source=sujo` → 404).
3. **Fatos com rótulos trocados** que restam:
   - Visão Geral: "199.228.708 · **2070: −9,6%**" (deveria ser "−9,6% em relação ao pico");
   - Indicadores: "Queda na pandemia 72,78 · 2019: 76,22 · **2021: −3,44 anos**", "Mortalidade infantil … **2026: −57,9%**", "Nascimentos e óbitos 11,17 por mil · **2026: 7,26 por mil**";
   - Grupos etários: "RS · **2026:** 21,8%";
   - Tábuas: "Risco 20–24 (H · M) 10,85 · **2026:** 2,67" (deveria ser "mulheres") e "20–24 · **2026: 4,07**" (deveria ser "4,07×");
   - População por idade e Grupos quinquenais: valor repetido ("2.386.874 · 2000: … · **2026: 2.386.874** · 2070: …") e "48,20".
4. **Contexto lento** fora do Brasil na População por idade: a primeira chamada para Bahia e Nordeste não respondeu em 6 s (a segunda, sim).

### Consistência de métricas ⚠️
- "Idade mediana" aparece como **36,0** (manchete e KPI), **36** (Contexto) e **36,1** (Visão Geral, ds4); são duas medidas diferentes (pela distribuição por idade simples × indicador do IBGE) com o mesmo nome.
- "65 anos ou mais **12%**" e "2000: **6%**" sem a casa decimal usada nos demais percentuais (19,2%, 68,9%).
- "Maior grupo etário **40-44**" com hífen (no Contexto aparece "40–44").
- Contexto da População por idade repete o valor: "Idade com mais pessoas 41 · **41 anos**"; "Idade mediana 36 · **36 anos**".
- Eixo do ranking de UFs: "**0,00 anos**, 25,00 anos…"; eixo da curva de sobrevivência de 0 a 100.000 (o KPI usa "de cada 100"); subtítulos ainda com "**lx** de homens e mulheres" e "**ex** de homens e mulheres".
- Narrativas: "No Brasil, **População** cresce 14% no período", "Entre os anos observados no Brasil, **Filhos por mulher** cai 35,4%".

### Storytelling ⚠️
- Manchetes fortes na Visão Geral, Grupos etários e Tábuas. Fracas em:
  - População por idade: "A idade mediana é 36,0 anos." não responde "onde estará a demanda por serviços?";
  - Grupos quinquenais: "A maior faixa é 40-44." não responde "quais crescem e quais encolhem?";
  - Indicadores: "cada mulher tem 1,51, abaixo da reposição" (falta "filho").

### Itens novos observados
- **Painel Databricks**: a página exibe só a tela de login do Databricks; visitantes não veem o dashboard. Exige embed público (ou com token) ou um aviso explicando o acesso.
- **Busca** voltou à barra superior ("Buscar página ou território"), revertendo uma decisão anterior. Se for intencional, registre em `DECISIONS.md`.
- O nome do painel mudou para "Analytics" na aba do navegador; o título genérico perde a referência ao IBGE.

## Conclusão
O painel agora **atende** público, pergunta central, ações, atualização, regra dos 5 segundos e hierarquia, e ficou **estável**. Restam ajustes de **confiabilidade** (o falso "Crítico" é o mais importante, porque contradiz dados corretos; depois, a base de demonstração e os rótulos dos Fatos), de **consistência** (idade mediana com dois valores, casas decimais e hífen) e de **storytelling** em duas manchetes.
