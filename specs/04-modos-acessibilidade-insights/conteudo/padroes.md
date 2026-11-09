# Padrões dos dados (seção "Padrões dos dados" da página Insights)

Transcrever para `PATTERNS` em `apps/web/src/content/insights.ts`. Um título + um parágrafo por padrão.

### 1. Mesma cobertura e hierarquia exata
As cinco tabelas cobrem os mesmos 33 territórios (Brasil, 5 regiões e 27 UFs) de 2000 a 2070. Brasil e regiões são somas exatas das UFs: a diferença é zero em todos os anos, o que permite navegar entre níveis sem perda de consistência.

### 2. Formatos diferentes para o mesmo assunto
As tabelas de idade simples e de grupos quinquenais trazem os anos em colunas (formato largo); as de grupos etários e de indicadores têm uma linha por território e ano; a tábua de mortalidade tem uma linha por idade, sexo, ano e território. Os cabeçalhos ocupam várias linhas, e os anos do cabeçalho são fórmulas no Excel.

### 3. Qualidade de origem muito alta
Não há duplicatas, e os únicos nulos (99) são estruturais: a taxa de crescimento do ano 2000, que não tem ano anterior. Homens + mulheres = total em todos os casos, e a soma das idades simples coincide com a população total da tabela de indicadores (212.583.750 em 2024).

### 4. Séries suaves, com uma exceção
As projeções variam de forma gradual de um ano para outro. A exceção é 2020–2021, quando a pandemia elevou os óbitos de 1,38 milhão (2019) para 1,86 milhão (2021) e reduziu a esperança de vida de 76,22 para 72,78 anos. É uma variação real, não um erro.

### 5. O grupo aberto "90 ou mais"
A idade 90 reúne todas as idades a partir de 90 anos. Por isso, ela parece desproporcionalmente grande nas idades simples (em 2070, seria a "idade" mais numerosa) e precisa ficar fora de escalas e de cálculos de idade modal.

### 6. A onda geracional
Uma geração numerosa, nascida por volta de 1985, atravessa a pirâmide: a idade com mais pessoas era 15 anos em 2000 e é 41 em 2026. No mapa de calor idade × ano, ela aparece como uma faixa diagonal.

### 7. Inversão etária com datas marcadas
Os marcos acontecem em sequência: idosos (60+) superam crianças (0–14) em 2029, o grupo de 65+ em 2036, a população atinge o pico em 2041 e as pessoas com 80+ superam as crianças de 0–4 no mesmo ano, e os óbitos superam os nascimentos em 2042.

### 8. Fecundidade baixa e estável
A taxa de fecundidade total cai de 2,32 (2000) para 1,51 (2026) e fica em torno de 1,50 até 2070, abaixo da reposição desde 2002. Em 2026, Roraima (2,14) é a única UF acima de 2,1, e o Rio de Janeiro tem o menor valor (1,37).

### 9. Diferenças persistentes entre os sexos
As mulheres são maioria a partir dos 28 anos e vivem 6,52 anos a mais (2026), diferença que cai para cerca de 4,4 anos em 2070. Entre 20 e 24 anos, o risco de morte dos homens é cerca de 4 vezes o das mulheres. Entre os que têm 90 anos ou mais, há 48 homens para cada 100 mulheres.

### 10. Gradiente regional com defasagem de décadas
O Norte é a região mais jovem (idade mediana de 30,7 anos e 49 idosos por 100 crianças em 2026), e Sudeste e Sul as mais envelhecidas (mais de 100 idosos por 100 crianças). Os mesmos marcos chegam ao Norte de 12 a 18 anos depois do Sudeste: por exemplo, óbitos acima de nascimentos em 2054, contra 2036.

### 11. Trajetórias divergentes entre UFs
Entre 2026 e 2070, 21 das 27 UFs terão menos habitantes. O Rio Grande do Sul perde 19,0%, enquanto Roraima cresce 41,2%. Alagoas atinge o pico populacional já em 2026, e Mato Grosso é a única UF ainda crescendo em 2070.

### 12. Queda contínua da mortalidade
A mortalidade infantil cai 58% entre 2000 e 2026 (de 28,13 para 11,83 por mil). A proporção de nascidos que chegam aos 80 anos passa de 40,7% (2000) para 54,6% (2026) e 71,8% (2070).

### 13. Unidades heterogêneas
Há contagens (pessoas), percentuais (taxa de crescimento), taxas por mil (natalidade, mortalidade, mortalidade infantil), proporções entre 0 e 1 (colunas `P_*` dos grupos etários), anos (esperança de vida) e índices (envelhecimento, dependência). Por isso, todo valor exibido usa o dicionário de métricas para aplicar a unidade e o formato corretos.
