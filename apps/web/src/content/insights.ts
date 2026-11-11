import { INSIGHT_EXTRA, type InsightExtra } from "@/content/insightsExtra"

export type InsightItem = { q: string; a: string[]; route: string } & InsightExtra

export type InsightSection = { pageId: string; title: string; route: string; items: InsightItem[] }

const RAW: { pageId: string; title: string; route: string; items: { q: string; a: string[] }[] }[] = [
  {
    "pageId": "overview",
    "title": "Visão Geral",
    "route": "/",
    "items": [
      {
        "q": "Até quando a população brasileira vai crescer e como isso muda o planejamento de longo prazo?",
        "a": [
          "Em 2026 o Brasil tem 214,2 milhões de habitantes, mas o crescimento já é lento: de 2025 para 2026 a população aumenta cerca de 791 mil pessoas. As projeções indicam o pico em 2041, com 220,4 milhões, seguido de queda contínua até 199,2 milhões em 2070, 9,6% abaixo do pico. A virada acontece porque, a partir de 2042, o país passa a registrar mais óbitos do que nascimentos. O ritmo varia entre as regiões: o Sudeste atinge o máximo em 2036 e o Nordeste em 2037, enquanto o Sul chega ao pico em 2046, o Norte em 2048 e o Centro-Oeste só em 2056. Para o planejamento, infraestrutura pensada para expansão contínua, como redes de água, transporte e habitação, precisa ser revista com horizontes regionais distintos, priorizando adaptação e manutenção em vez de ampliação de capacidade."
        ]
      },
      {
        "q": "Qual é a dimensão e a velocidade do envelhecimento da população?",
        "a": [
          "O envelhecimento é rápido e já está em curso. Em 2026 há 89 pessoas com 60 anos ou mais para cada 100 crianças de até 14 anos; em 2070 serão 316. A idade mediana, que era de 25,3 anos em 2000, chega a 36,1 em 2026 e deve alcançar 51,2 em 2070, ou seja, metade da população terá mais de 51 anos. A participação dos idosos sobe de 17,1% para 37,8% no mesmo período, e o número de pessoas com 60 anos ou mais passa a superar o de crianças já em 2029. Em pouco mais de quatro décadas, o país muda completamente de perfil etário. Isso pressiona previdência, sistema de saúde e cuidados de longa duração, e exige que as políticas sejam ajustadas antes do pico de demanda, e não depois dele."
        ]
      },
      {
        "q": "Por que a queda da fecundidade é o principal motor dessas mudanças?",
        "a": [
          "A taxa de fecundidade total caiu de 2,32 filhos por mulher em 2000 para 1,51 em 2026 e está abaixo do nível de reposição, de 2,1, desde 2002. Com menos filhos por mulher, o número de nascimentos recua de 3,57 milhões em 2000 para 2,39 milhões em 2026. Mesmo que a fecundidade se estabilize, como projetado até 2070, a quantidade de mulheres em idade reprodutiva também diminui, o que reduz ainda mais os nascimentos nas gerações seguintes. Esse efeito explica por que a população continua crescendo por alguns anos depois de a fecundidade ficar baixa e só começa a cair em 2042, quando os óbitos superam os nascimentos. Políticas de apoio à parentalidade podem influenciar a tendência, mas a estrutura etária já acumulada determina boa parte da trajetória até 2070."
        ]
      },
      {
        "q": "As regiões brasileiras seguem o mesmo ritmo demográfico?",
        "a": [
          "Não. O Norte é a região mais jovem: idade mediana de 30,7 anos em 2026, 49 idosos para cada 100 crianças e fecundidade de 1,75 filho por mulher. Lá os idosos só superam as crianças em 2039. No outro extremo, Sudeste e Sul já têm mais de 100 idosos para cada 100 crianças (105,4 e 104,3) e cruzaram essa marca em 2025. O Nordeste ocupa posição intermediária, com cruzamento previsto para 2031, e o Centro-Oeste, com cruzamento em 2033, é a região que continua crescendo por mais tempo, até 2056. Essas diferenças mostram que políticas nacionais uniformes tendem a chegar cedo demais em algumas regiões e tarde demais em outras. Um caminho é usar os indicadores regionais como gatilho para calendários diferenciados de investimento em educação, saúde e cuidado."
        ]
      },
      {
        "q": "Qual foi o impacto da pandemia nos dados e o que ele ensina para o planejamento?",
        "a": [
          "A pandemia de covid-19 aparece claramente nas séries. A esperança de vida ao nascer caiu de 76,22 anos em 2019 para 72,78 em 2021, uma perda de 3,44 anos em apenas dois anos. No mesmo período, os óbitos passaram de 1,38 milhão para 1,86 milhão por ano. A recuperação foi rápida: 75,45 anos em 2022, 76,61 em 2024 e 77,03 em 2026, valor que já supera o nível anterior à crise. A lição é dupla. Primeiro, choques de mortalidade podem ser intensos e repentinos, por isso a saúde pública precisa de capacidade de reserva e de protocolos de resposta. Segundo, projeções são revisadas: esta é a Revisão 2024 do IBGE, e decisões de longo prazo devem ser reavaliadas sempre que uma nova revisão for publicada."
        ]
      }
    ]
  },
  {
    "pageId": "ds1",
    "title": "População por idade",
    "route": "/datasets/ds1",
    "items": [
      {
        "q": "Como a redução de nascimentos afeta a demanda por creches e escolas?",
        "a": [
          "O número de pessoas com 0 anos caiu de 3,42 milhões em 2000 para 2,39 milhões em 2026 e deve chegar a 1,49 milhão em 2070, uma redução adicional de 38%. A população de 6 a 14 anos, idade do ensino fundamental, soma 26,0 milhões em 2026 e deve cair para 20,2 milhões em 2040. Isso significa que a pressão por novas vagas tende a diminuir na maior parte do país. O espaço aberto pode ser usado para ampliar o ensino em tempo integral, reduzir o número de alunos por turma e investir em qualidade em vez de expansão física. A queda não é uniforme: no Nordeste, as crianças com 0 anos diminuíram 39% entre 2000 e 2026, enquanto no Norte a redução foi de 25%, o que pede planos de rede escolar diferentes por região."
        ]
      },
      {
        "q": "Onde está hoje a geração mais numerosa e o que isso indica para os próximos 20 anos?",
        "a": [
          "Em 2026, a idade com mais pessoas no Brasil é 41 anos. Em 2000 era 15 anos: trata-se da mesma geração, nascida por volta de 1985, que atravessa a pirâmide e aparece como uma faixa diagonal no mapa de calor idade × ano. Nos próximos 20 anos, esse grupo chegará perto dos 60 anos, aumentando a demanda por consultas, exames e tratamento de doenças crônicas e, logo depois, por aposentadorias. Como as gerações seguintes são menores, diminui a proporção de pessoas em idade ativa para sustentar esse grupo. Em 2070, a idade mais numerosa entre 0 e 89 anos será 55, sinal de uma estrutura muito mais envelhecida. Acompanhar essa onda permite antecipar picos de demanda, em vez de reagir a eles quando já chegaram."
        ]
      },
      {
        "q": "Como cresce a população com 90 anos ou mais e quais serviços isso exige?",
        "a": [
          "As pessoas com 90 anos ou mais eram 304 mil em 2000, são 814 mil em 2026 e devem chegar a 5,5 milhões em 2070, quase sete vezes o número atual. Esse grupo é majoritariamente feminino: em 2026 há apenas 48 homens para cada 100 mulheres nessa idade. A demanda crescente envolve cuidados de longa duração, atendimento domiciliar, instituições de longa permanência, profissionais com formação em geriatria e adaptações de acessibilidade em moradias e espaços públicos. Também envolve renda, já que muitas dessas mulheres vivem sozinhas após a viuvez. Vale lembrar que a idade 90 nas tabelas é um grupo aberto, que reúne todas as idades a partir de 90, por isso os valores representam o total desse grupo e não uma única idade."
        ]
      },
      {
        "q": "A partir de que idade as mulheres passam a ser maioria e por que isso importa?",
        "a": [
          "Em 2026, as mulheres passam a ser maioria a partir dos 28 anos no Brasil. No Nordeste isso acontece já aos 26 anos, e no Sul e no Centro-Oeste, aos 33. No total, há 95 homens para cada 100 mulheres. A principal causa é a mortalidade masculina mais alta entre jovens adultos: entre 20 e 24 anos, o risco de morte dos homens é cerca de quatro vezes o das mulheres, segundo as tábuas de mortalidade. Essa diferença se acumula ao longo da vida e fica marcante nas idades avançadas. Para a gestão pública, o dado aponta duas frentes: reduzir as mortes evitáveis de homens jovens, ligadas a violência e acidentes, e preparar políticas para mulheres idosas, que vivem mais, com mais frequência sozinhas e, muitas vezes, com menor renda."
        ]
      },
      {
        "q": "Como usar a população por idade simples para planejar políticas com idades específicas?",
        "a": [
          "A idade simples permite contar com precisão públicos definidos em lei ou em programas. Por exemplo, o Brasil tem 2,94 milhões de jovens com 18 anos em 2026, idade da maioridade e do alistamento militar, número que deve cair para 2,57 milhões em 2040. A população com 62 anos ou mais, referência comum em regras de aposentadoria, soma 32,0 milhões em 2026 e deve chegar a 47,7 milhões em 2040. Com esses recortes é possível dimensionar campanhas de vacinação por idade, a oferta de vagas por série escolar e o impacto de mudanças em idades mínimas. Para decisões locais, recomenda-se combinar o recorte etário com o filtro de território e sempre registrar qual revisão das projeções foi utilizada na análise."
        ]
      }
    ]
  },
  {
    "pageId": "ds2",
    "title": "Grupos quinquenais",
    "route": "/datasets/ds2",
    "items": [
      {
        "q": "Como a forma da pirâmide etária brasileira está mudando?",
        "a": [
          "Em 2000, o maior grupo quinquenal era o de 15 a 19 anos, e a pirâmide tinha base larga, típica de uma população jovem. Em 2026, o maior grupo é o de 40 a 44 anos, e a base se estreitou: as crianças de 0 a 4 anos passaram de 17,3 milhões para 12,4 milhões. Em 2070, o grupo mais numeroso será o de 55 a 59 anos, e a base terá apenas 7,5 milhões de crianças nessa faixa. A pirâmide passa, assim, de um triângulo para um formato de barril e, depois, para uma figura mais larga no meio e no topo. Essa mudança indica que serviços voltados à infância tendem a encolher em escala, enquanto os voltados a adultos maduros e idosos precisam crescer e se diversificar nas próximas décadas."
        ]
      },
      {
        "q": "Quando haverá mais pessoas com 80 anos ou mais do que crianças de 0 a 4 anos?",
        "a": [
          "No Brasil, isso acontece em 2041. A relação entre os dois grupos mostra a velocidade da mudança: em 2000 havia 0,12 pessoa com 80 anos ou mais para cada criança de até 4 anos; em 2026 são 0,42; e em 2070 serão 3,01, ou seja, três idosos muito velhos para cada criança pequena. O momento do cruzamento varia: o Sudeste chega lá em 2038, o Sul em 2039, o Nordeste em 2042, o Centro-Oeste em 2047 e o Norte apenas em 2052. Esse indicador é útil para comparar a demanda por cuidado nas duas pontas da vida, como vagas em creches e em instituições de longa permanência, e para planejar a formação de cuidadores, que atendem os dois públicos com competências diferentes."
        ]
      },
      {
        "q": "Quais grupos etários mais crescem e quais mais encolhem até 2070?",
        "a": [
          "Entre 2026 e 2070, o grupo que mais cresce é o de 90 anos ou mais, com aumento de 576%. Na outra ponta, o grupo de 5 a 9 anos é o que mais diminui, com queda de 43,8%. O total de pessoas com 80 anos ou mais passa de 5,2 milhões para 22,7 milhões no período, enquanto o de crianças de 0 a 4 anos recua de 12,4 milhões para 7,5 milhões. Esse movimento em direções opostas significa que orçamentos atrelados ao número de pessoas atendidas, como merenda e transporte escolar de um lado e medicamentos de uso contínuo de outro, terão trajetórias divergentes. Revisar periodicamente a distribuição de recursos entre essas áreas, com base nos grupos quinquenais, ajuda a evitar tanto a falta quanto a sobra de capacidade instalada."
        ]
      },
      {
        "q": "Como a população em idade de trabalhar vai evoluir?",
        "a": [
          "A população de 15 a 64 anos soma 147,5 milhões em 2026, o que corresponde a 68,9% do total. Ela ainda cresce por pouco tempo e atinge o máximo em 2035, com 149,6 milhões. A partir daí, cai até 113,6 milhões em 2070, quando representará apenas 57,0% da população. Ao mesmo tempo, os grupos quinquenais mais numerosos se deslocam para idades acima dos 40 anos, o que torna a força de trabalho mais madura. Para empresas e governos, isso indica a necessidade de investir em produtividade, em requalificação de trabalhadores mais velhos, em ergonomia e em políticas que ampliem a participação de mulheres e de pessoas acima de 55 anos no mercado, compensando a redução do número de pessoas em idade ativa."
        ]
      },
      {
        "q": "O que a mudança dos grupos etários significa para o consumo e os serviços?",
        "a": [
          "Com o maior grupo etário passando de 40 a 44 anos em 2026 para 55 a 59 anos em 2070, e com 22,7 milhões de pessoas com 80 anos ou mais ao fim do período, o perfil do consumidor brasileiro muda. Ganham peso produtos e serviços de saúde, bem-estar, mobilidade acessível, turismo para adultos maduros, moradias adaptadas e serviços financeiros voltados à renda de aposentadoria. Itens associados à infância, como produtos para bebês e materiais escolares, tendem a ter mercados menores. Para o setor público, a mudança se reflete na arrecadação e no tipo de serviço demandado. Os grupos quinquenais permitem estimar o tamanho de cada mercado por território e ano, o que ajuda a orientar investimentos e a localização de serviços."
        ]
      }
    ]
  },
  {
    "pageId": "ds3",
    "title": "Grupos etários",
    "route": "/datasets/ds3",
    "items": [
      {
        "q": "Quando o Brasil passa a ter mais idosos do que crianças e o que isso exige?",
        "a": [
          "Em 2026, as crianças de 0 a 14 anos ainda são 19,2% da população, e os idosos com 60 anos ou mais, 17,1%. O cruzamento acontece em 2029, quando os idosos passam a ser mais numerosos. Considerando apenas quem tem 65 anos ou mais, a virada ocorre em 2036. Em números absolutos, o país tem 41,1 milhões de crianças e 36,6 milhões de idosos em 2026; em 2070 serão 23,8 milhões de crianças e 75,3 milhões de idosos. Essa inversão exige reorientar redes de atendimento, como unidades básicas de saúde com foco em doenças crônicas, centros-dia e transporte acessível, e repensar o uso de equipamentos públicos hoje voltados à infância, que podem ser adaptados para atender outras faixas etárias."
        ]
      },
      {
        "q": "O bônus demográfico ainda existe?",
        "a": [
          "O bônus demográfico é o período em que a proporção de pessoas em idade de trabalhar é alta em relação a crianças e idosos. A razão de dependência total, que considera crianças de 0 a 14 anos e idosos de 65 anos ou mais em relação às pessoas de 15 a 64 anos, atingiu seu menor valor em 2017, com 44,4 dependentes para cada 100 pessoas em idade ativa. Em 2026, o índice está em 45,2, ainda próximo do mínimo, mas em trajetória de alta: deve chegar a 75,4 em 2070. Isso indica que a janela favorável está se fechando. Os anos restantes são decisivos para elevar a produtividade, a escolaridade e a formalização do trabalho, porque o crescimento econômico futuro dependerá menos da quantidade de trabalhadores e mais da produtividade de cada um."
        ]
      },
      {
        "q": "Quais UFs estão mais envelhecidas e quais mudaram mais?",
        "a": [
          "Em 2026, o Rio Grande do Sul tem a maior participação de pessoas com 60 anos ou mais, 21,8%, enquanto Roraima tem a menor, 8,8%. Entre 2000 e 2026, as maiores altas ocorreram no Rio Grande do Sul, com 11,1 pontos percentuais, em Minas Gerais, com 10,0, e no Paraná, com 9,5. As menores ficaram com Amazonas e Roraima, com cerca de 4,5 pontos. Dentro das regiões, os contrastes também são claros: no Nordeste, a Paraíba lidera com 16,8% e o Maranhão tem 13,3%; no Sudeste, o Rio de Janeiro chega a 19,9%. Essas diferenças devem orientar a distribuição de recursos para saúde e assistência, considerando não só o tamanho da população de cada UF, mas também sua composição etária."
        ]
      },
      {
        "q": "Qual o peso dos muito idosos (80 anos ou mais) e como se preparar?",
        "a": [
          "As pessoas com 80 anos ou mais representam 2,4% da população em 2026 e devem chegar a 11,4% em 2070, o que significa passar de 5,2 milhões para 22,7 milhões de pessoas. É o segmento que mais cresce em termos relativos e o que mais demanda cuidados contínuos, pela maior prevalência de dependência funcional, demências e múltiplas doenças crônicas. A preparação envolve formar cuidadores e profissionais de geriatria, criar serviços de apoio às famílias cuidadoras, regulamentar e fiscalizar instituições de longa permanência e adaptar moradias. Como a maior parte desse grupo é formada por mulheres, também são importantes as políticas de renda e de combate ao isolamento social de idosas que vivem sozinhas, especialmente nas grandes cidades."
        ]
      },
      {
        "q": "Como evoluem os adolescentes e jovens adultos, e o que isso significa para educação e emprego?",
        "a": [
          "Os adolescentes de 15 a 17 anos, faixa do ensino médio, eram 10,8 milhões em 2000, são 8,7 milhões em 2026 e devem chegar a 5,3 milhões em 2070. Os jovens de 18 a 21 anos, que entram no ensino superior e no primeiro emprego, passam de 13,9 milhões para 12,0 milhões e, depois, para 7,3 milhões. Com menos jovens, a disputa por vagas tende a diminuir, e instituições de ensino precisarão atrair estudantes com qualidade e flexibilidade, inclusive adultos que retornam aos estudos. No mercado de trabalho, cada jovem ganha importância, o que reforça a necessidade de reduzir a evasão escolar, melhorar a transição entre escola e trabalho e evitar que jovens fiquem sem estudar e sem trabalhar."
        ]
      }
    ]
  },
  {
    "pageId": "ds4",
    "title": "Indicadores",
    "route": "/datasets/ds4",
    "items": [
      {
        "q": "A esperança de vida ainda tem espaço para crescer, e onde?",
        "a": [
          "A esperança de vida ao nascer no Brasil passou de 71,10 anos em 2000 para 77,03 em 2026 e deve chegar a 83,91 em 2070. O ganho futuro, porém, não é igual em todo o território. Em 2026, o Distrito Federal tem a maior esperança de vida, 80,03 anos, e o Amapá a menor, 74,84, uma diferença de mais de cinco anos dentro do mesmo país. No Nordeste, o Rio Grande do Norte chega a 78,19 anos, enquanto Alagoas fica em 74,91. As UFs com valores mais baixos concentram o maior potencial de ganho, especialmente pela redução de mortes evitáveis, como as infantis e as de jovens adultos. Políticas de saneamento, atenção primária e segurança pública tendem a ter mais impacto onde a esperança de vida ainda está abaixo da média nacional."
        ]
      },
      {
        "q": "Qual é o tamanho da diferença de longevidade entre homens e mulheres?",
        "a": [
          "Em 2026, as mulheres vivem em média 80,27 anos e os homens 73,75, uma diferença de 6,52 anos. No Nordeste, a distância é maior, de 7,22 anos. A diferença deve diminuir com o tempo: em 2070, as projeções indicam 86,10 anos para mulheres e 81,68 para homens, cerca de 4,4 anos de distância. Boa parte da desvantagem masculina vem de causas externas, como homicídios e acidentes de trânsito, que atingem principalmente homens jovens, além da menor procura por serviços de saúde. Reduzir essa diferença depende de políticas de segurança, de prevenção de acidentes e de estratégias de saúde do homem, com foco em diagnóstico precoce. Ao mesmo tempo, a maior longevidade feminina aumenta a demanda por proteção social de idosas."
        ]
      },
      {
        "q": "A mortalidade infantil caiu o suficiente?",
        "a": [
          "A taxa de mortalidade infantil caiu de 28,13 para 11,83 óbitos por mil nascidos vivos entre 2000 e 2026, uma redução de 58%. No Nordeste, a queda foi ainda maior, de 69%, partindo de 41,18 para 12,96 por mil. Apesar do avanço, ainda há desigualdades: em 2026, Roraima registra 20,91 por mil, enquanto Santa Catarina tem 8,46, menos da metade. Isso mostra que a média nacional esconde realidades distintas e que parte das mortes ainda é evitável. As medidas com maior efeito são o pré-natal de qualidade, o parto seguro, a vacinação, o aleitamento materno e o saneamento básico. Concentrar esforços nas UFs com as taxas mais altas é o caminho mais rápido para reduzir a média do país nos próximos anos."
        ]
      },
      {
        "q": "Quando a população passa a diminuir por crescimento natural negativo?",
        "a": [
          "Em 2026, o Brasil registra 11,17 nascimentos e 7,26 óbitos para cada mil habitantes, o que ainda gera crescimento natural positivo. A diferença, porém, diminui ano a ano. A partir de 2042, os óbitos passam a superar os nascimentos, e a população começa a encolher, a menos que haja saldo migratório positivo relevante. O momento da virada varia entre as regiões: o Sudeste chega lá em 2036, o Sul em 2038, o Nordeste em 2043, o Centro-Oeste em 2051 e o Norte só em 2054. Para municípios e estados, esse dado ajuda a revisar projeções de arrecadação, de demanda por serviços e de uso do solo urbano, que muitas vezes ainda partem da hipótese de crescimento contínuo da população."
        ]
      },
      {
        "q": "O que significa ter fecundidade abaixo do nível de reposição?",
        "a": [
          "O nível de reposição, de cerca de 2,1 filhos por mulher, é o necessário para que uma geração seja substituída pela seguinte. O Brasil está abaixo dele desde 2002, e a taxa de fecundidade total chega a 1,51 em 2026. Entre as UFs, o Rio de Janeiro tem o menor valor, 1,37, e Roraima o maior, 2,14, a única UF ainda acima da reposição. No longo prazo, a fecundidade baixa reduz o número de nascimentos, acelera o envelhecimento e leva à diminuição da população. Países com o mesmo quadro têm combinado políticas de conciliação entre trabalho e família, como licenças parentais e creches, com estratégias para elevar a produtividade. Para o Brasil, o tema precisa entrar no planejamento de longo prazo das políticas públicas."
        ]
      }
    ]
  },
  {
    "pageId": "ds5",
    "title": "Tábuas de mortalidade",
    "route": "/datasets/ds5",
    "items": [
      {
        "q": "Quantos brasileiros chegam aos 80 anos?",
        "a": [
          "Segundo a tábua de mortalidade de 2026, de cada 100 pessoas nascidas no Brasil, 54,6 chegam aos 80 anos. Entre as mulheres são 63,0, e entre os homens, 46,0. Em 2000, apenas 40,7 de cada 100 chegavam a essa idade, e em 2070 a projeção é de 71,8. Esse indicador traduz a melhora das condições de vida de forma intuitiva e mostra que chegar aos 80 anos já é a experiência da maioria. Para o planejamento, significa que serviços antes considerados de nicho, como atendimento geriátrico e cuidados prolongados, passam a ser de uso amplo. Também indica que a diferença entre os sexos se reflete na composição dos mais idosos, que é majoritariamente feminina e tende a continuar assim nas próximas décadas."
        ]
      },
      {
        "q": "Quanto tempo vive, em média, quem chega aos 60 anos?",
        "a": [
          "Em 2026, uma pessoa que chega aos 60 anos vive, em média, mais 22,82 anos, ou seja, até cerca de 83 anos. Para as mulheres, a expectativa adicional é de 24,41 anos, e para os homens, de 21,02. Esse é um dos indicadores mais relevantes para a previdência, porque mostra por quanto tempo, em média, os benefícios serão pagos a quem se aposenta nessa idade. Ele também orienta o planejamento financeiro individual e o dimensionamento de serviços para idosos. Como a esperança de vida aos 60 anos tende a aumentar, regras de aposentadoria e cálculos atuariais precisam ser revistos periodicamente, e as diferenças entre os sexos devem ser consideradas no desenho de produtos de previdência complementar e de seguros."
        ]
      },
      {
        "q": "Em que idade a mortalidade masculina é mais desproporcional?",
        "a": [
          "A maior diferença entre homens e mulheres está na faixa de 20 a 24 anos. Em 2026, a probabilidade de um homem morrer nessa faixa é de 10,85 por mil, contra 2,67 por mil para as mulheres, cerca de quatro vezes maior. No Nordeste, a razão chega a 5,04 vezes, e no Norte, a 4,85. Esse padrão está associado principalmente a causas externas, como homicídios e acidentes de trânsito. Como essas mortes ocorrem cedo, elas têm grande impacto na esperança de vida masculina e no número de anos de vida perdidos. Políticas de segurança pública, de prevenção da violência e de acidentes e programas de inclusão para jovens são as principais frentes para reduzir essa sobremortalidade e aproximar a longevidade dos dois sexos."
        ]
      },
      {
        "q": "Qual é o risco de morte no primeiro ano de vida e como reduzi-lo?",
        "a": [
          "Em 2026, a probabilidade de uma criança morrer antes de completar um ano é de 11,83 por mil no Brasil. O risco varia entre as regiões: é de 14,82 por mil no Norte e de 9,36 no Sul. Para meninos, o valor é de 12,81 por mil, e para meninas, de 10,80. O primeiro ano continua sendo o período de maior risco de morte antes da velhice, e boa parte desses óbitos acontece nas primeiras semanas de vida, associada a condições da gestação e do parto. Ampliar o acesso ao pré-natal, garantir partos assistidos e leitos neonatais, incentivar o aleitamento materno e manter altas coberturas vacinais estão entre as ações mais eficazes. Reduzir a diferença entre Norte e Sul é um objetivo concreto para os próximos anos."
        ]
      },
      {
        "q": "Como as tábuas de mortalidade sustentam cálculos de previdência e seguros?",
        "a": [
          "As tábuas de mortalidade mostram, para cada idade, a probabilidade de morrer, o número de sobreviventes e a esperança de vida restante. Esses valores são a base de cálculos atuariais: o IBGE publica anualmente a tábua usada, por exemplo, no fator previdenciário do INSS. Em 2026, de cada 100 nascidos, 86,4 chegam aos 60 anos e vivem, em média, mais 22,82 anos. Com essas informações é possível estimar por quanto tempo benefícios serão pagos, precificar seguros de vida e planos de previdência e avaliar o custo de mudanças em regras de idade mínima. Como as tábuas mudam a cada revisão das projeções, é importante registrar a versão utilizada e atualizar os cálculos sempre que o IBGE publicar novos dados."
        ]
      }
    ]
  },
  {
    "pageId": "quality",
    "title": "Qualidade de dados",
    "route": "/qualidade",
    "items": [
      {
        "q": "Por que tratar bases oficiais que já chegam consistentes?",
        "a": [
          "As cinco tabelas do IBGE chegam com qualidade alta: não têm duplicatas, e os únicos valores nulos são estruturais, na taxa de crescimento do ano 2000, que não tem ano anterior para comparação. Mesmo assim, o tratamento é necessário por três motivos. Primeiro, padronização: duas tabelas vêm com os anos em colunas e precisam ser convertidas para o formato longo, e os nomes das colunas são normalizados para uso no banco. Segundo, garantia: as validações confirmam que os dados continuam consistentes após cada carga e detectam corrupção acidental de arquivos. Terceiro, preparação para uploads futuros, que podem trazer problemas reais. A base de demonstração, com falhas inseridas de propósito, comprova que o pipeline detecta e corrige esses problemas."
        ]
      },
      {
        "q": "Como evitar que o tratamento de outliers distorça projeções oficiais?",
        "a": [
          "Em projeções populacionais, valores muito diferentes da média costumam ser legítimos. Uma regra de outlier aplicada à tabela inteira marcaria cerca de 12% das linhas como atípicas, porque mistura Brasil, regiões e UFs, que têm escalas muito diferentes. Por isso, a detecção é feita dentro de cada série, comparando a variação de um ano para o seguinte no mesmo território, sexo e idade. Mudanças bruscas nessas séries, que são suaves, indicam erro de digitação ou de carga. Além disso, a estratégia padrão é apenas sinalizar o valor, sem alterá-lo. Corrigir ou remover exige confirmação explícita, porque modificar um dado oficial mudaria o que foi publicado pelo IBGE. Esse cuidado preserva a fidelidade da fonte e a rastreabilidade de cada decisão."
        ]
      },
      {
        "q": "Quais validações comprovam que os dados estão consistentes?",
        "a": [
          "O pipeline verifica relações que precisam ser verdadeiras em qualquer base correta. A primeira é a hierarquia territorial: a população do Brasil deve ser igual à soma das cinco regiões e à soma das 27 UFs, e a diferença encontrada é zero em todos os anos. A segunda é a consistência por sexo: homens mais mulheres devem resultar exatamente no total, o que também se confirma. A terceira cruza tabelas diferentes: a soma das idades simples da tabela 1 deve ser igual à população total da tabela de indicadores, como em 2024, quando ambas registram 212.583.750 pessoas. Qualquer falha nessas regras aparece no relatório e na página de Qualidade, que indica a regra verificada, o status e a maior diferença encontrada em cada caso."
        ]
      },
      {
        "q": "Qual a diferença entre nulo estrutural e dado faltante?",
        "a": [
          "Um nulo estrutural é um valor que não existe por definição. A taxa de crescimento de 2000, por exemplo, depende do ano anterior, que não faz parte da série, por isso fica vazia nos 33 territórios e nos três recortes de sexo, somando 99 nulos. Preencher esses campos criaria um dado inventado. Já um dado faltante é um valor que deveria existir, mas se perdeu, como uma população ausente no meio de uma série. Nesse caso, o pipeline imputa o valor por interpolação dentro da mesma série, usando os anos vizinhos, e recupera códigos de território a partir da sigla ou do nome. O relatório separa os dois tipos, para que o usuário saiba exatamente o que foi mantido como estava e o que foi estimado pelo tratamento."
        ]
      },
      {
        "q": "Como manter a base atualizada quando o IBGE publicar uma nova revisão?",
        "a": [
          "As projeções são revisadas periodicamente, e esta aplicação usa a Revisão 2024. Para incorporar uma nova versão, basta enviar os novos arquivos pela opção de upload, ou substituí-los na pasta de dados, e reprocessar. O pipeline é idempotente: a carga no banco substitui os dados de forma atômica, sem duplicar registros, e cada execução fica registrada no histórico com seu relatório. Os testes com valores de referência, como o pico populacional e as datas de cruzamento, funcionam como alerta: se uma nova revisão mudar esses valores, os testes apontam exatamente o que mudou. Recomenda-se manter as duas revisões por um período e comparar os principais indicadores antes de atualizar análises e decisões."
        ]
      }
    ]
  }
]

export const INSIGHTS: InsightSection[] = RAW.map((section) => ({
  ...section,
  items: section.items.map((item, index) => ({
    ...item,
    ...INSIGHT_EXTRA[section.pageId][index],
    route: section.route,
  })),
}))

export const PATTERNS: { title: string; text: string }[] = [
  {
    "title": "Mesma cobertura e hierarquia exata",
    "text": "As cinco tabelas cobrem os mesmos 33 territórios (Brasil, 5 regiões e 27 UFs) de 2000 a 2070. Brasil e regiões são somas exatas das UFs: a diferença é zero em todos os anos, o que permite navegar entre níveis sem perda de consistência."
  },
  {
    "title": "Formatos diferentes para o mesmo assunto",
    "text": "As tabelas de idade simples e de grupos quinquenais trazem os anos em colunas (formato largo); as de grupos etários e de indicadores têm uma linha por território e ano; a tábua de mortalidade tem uma linha por idade, sexo, ano e território. Os cabeçalhos ocupam várias linhas, e os anos do cabeçalho são fórmulas no Excel."
  },
  {
    "title": "Qualidade de origem muito alta",
    "text": "Não há duplicatas, e os únicos nulos (99) são estruturais: a taxa de crescimento do ano 2000, que não tem ano anterior. Homens + mulheres = total em todos os casos, e a soma das idades simples coincide com a população total da tabela de indicadores (212.583.750 em 2024)."
  },
  {
    "title": "Séries suaves, com uma exceção",
    "text": "As projeções variam de forma gradual de um ano para outro. A exceção é 2020–2021, quando a pandemia elevou os óbitos de 1,38 milhão (2019) para 1,86 milhão (2021) e reduziu a esperança de vida de 76,22 para 72,78 anos. É uma variação real, não um erro."
  },
  {
    "title": "O grupo aberto \"90 ou mais\"",
    "text": "A idade 90 reúne todas as idades a partir de 90 anos. Por isso, ela parece desproporcionalmente grande nas idades simples (em 2070, seria a \"idade\" mais numerosa) e precisa ficar fora de escalas e de cálculos de idade modal."
  },
  {
    "title": "A onda geracional",
    "text": "Uma geração numerosa, nascida por volta de 1985, atravessa a pirâmide: a idade com mais pessoas era 15 anos em 2000 e é 41 em 2026. No mapa de calor idade × ano, ela aparece como uma faixa diagonal."
  },
  {
    "title": "Inversão etária com datas marcadas",
    "text": "Os marcos acontecem em sequência: idosos (60+) superam crianças (0–14) em 2029, o grupo de 65+ em 2036, a população atinge o pico em 2041 e as pessoas com 80+ superam as crianças de 0–4 no mesmo ano, e os óbitos superam os nascimentos em 2042."
  },
  {
    "title": "Fecundidade baixa e estável",
    "text": "A taxa de fecundidade total cai de 2,32 (2000) para 1,51 (2026) e fica em torno de 1,50 até 2070, abaixo da reposição desde 2002. Em 2026, Roraima (2,14) é a única UF acima de 2,1, e o Rio de Janeiro tem o menor valor (1,37)."
  },
  {
    "title": "Diferenças persistentes entre os sexos",
    "text": "As mulheres são maioria a partir dos 28 anos e vivem 6,52 anos a mais (2026), diferença que cai para cerca de 4,4 anos em 2070. Entre 20 e 24 anos, o risco de morte dos homens é cerca de 4 vezes o das mulheres. Entre os que têm 90 anos ou mais, há 48 homens para cada 100 mulheres."
  },
  {
    "title": "Gradiente regional com defasagem de décadas",
    "text": "O Norte é a região mais jovem (idade mediana de 30,7 anos e 49 idosos por 100 crianças em 2026), e Sudeste e Sul as mais envelhecidas (mais de 100 idosos por 100 crianças). Os mesmos marcos chegam ao Norte de 12 a 18 anos depois do Sudeste: por exemplo, óbitos acima de nascimentos em 2054, contra 2036."
  },
  {
    "title": "Trajetórias divergentes entre UFs",
    "text": "Entre 2026 e 2070, 21 das 27 UFs terão menos habitantes. O Rio Grande do Sul perde 19,0%, enquanto Roraima cresce 41,2%. Alagoas atinge o pico populacional já em 2026, e Mato Grosso é a única UF ainda crescendo em 2070."
  },
  {
    "title": "Queda contínua da mortalidade",
    "text": "A mortalidade infantil cai 58% entre 2000 e 2026 (de 28,13 para 11,83 por mil). A proporção de nascidos que chegam aos 80 anos passa de 40,7% (2000) para 54,6% (2026) e 71,8% (2070)."
  },
  {
    "title": "Unidades heterogêneas",
    "text": "Há contagens (pessoas), percentuais (taxa de crescimento), taxas por mil (natalidade, mortalidade, mortalidade infantil), proporções entre 0 e 1 (colunas `P_*` dos grupos etários), anos (esperança de vida) e índices (envelhecimento, dependência). Por isso, todo valor exibido usa o dicionário de métricas para aplicar a unidade e o formato corretos."
  }
]
