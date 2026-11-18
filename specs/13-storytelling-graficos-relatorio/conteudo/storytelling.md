# Storytelling por página

Copie para `apps/web/src/content/storytelling.ts` sem reescrever: `{ pageId: { tecnico, simples } }`.

O texto é teórico: explica o tema da página e o problema que ele gera. Não traz números, porque os números ficam no resumo dinâmico (Headline) logo acima. Cada texto tem no máximo 300 caracteres, o que dá até 3 linhas no desktop.

## overview — Visão Geral
- **tecnico:** A população cresce cada vez mais devagar até atingir um pico e passar a encolher. Na prática, a demanda total por serviços para de crescer e muda de perfil etário, pressionando previdência e saúde e deixando ociosa parte da infraestrutura planejada para expansão.
- **simples:** O Brasil ainda está crescendo, mas cada vez mais devagar, e uma hora a conta vira: vai ter menos gente. Parece tranquilo, mas mexe com tudo: menos crianças na escola, mais avós no posto de saúde e menos gente trabalhando para bancar a aposentadoria.

## ds1 — População por idade
- **tecnico:** A distribuição por idade mostra o envelhecimento pela base e pelo topo: menos nascimentos estreitam a base e a maior longevidade alarga o topo. A demanda migra de creches e escolas para saúde, cuidado de longa duração e previdência, com risco de oferta mal dimensionada.
- **simples:** Pensa na pirâmide como uma foto da galera por idade. Antes ela era larga embaixo, cheia de crianças; agora está ficando mais cheinha em cima. Resultado: sobra vaga na escola e falta geriatra, cuidador e calçada acessível.

## ds2 — Grupos quinquenais
- **tecnico:** Os grupos de cinco anos mostram quais gerações crescem e quais encolhem, acompanhando a onda de nascimentos que atravessa a pirâmide. Orientam o planejamento por etapa de vida e expõem o descompasso entre a oferta de serviços e o tamanho real de cada geração.
- **simples:** Aqui a galera é separada em turminhas de 5 em 5 anos. Umas encolhem (as crianças) e outras não param de crescer (quem tem 80 ou mais). O problema é quando a cidade continua construindo para a turma que está diminuindo.

## ds3 — Grupos etários
- **tecnico:** A relação entre idosos e crianças e a razão de dependência medem quanto a população em idade ativa sustenta os demais grupos. Quando os idosos superam as crianças e a dependência volta a subir, termina o bônus demográfico e cresce a pressão sobre previdência e saúde.
- **simples:** Por um tempo, o Brasil teve muita gente em idade de trabalhar para pouca gente dependente: é o tal bônus demográfico. Ele está acabando. Com mais idosos do que crianças, menos gente trabalha para sustentar mais gente.

## ds4 — Indicadores
- **tecnico:** Esperança de vida, fecundidade e mortalidade infantil resumem a transição demográfica: vive-se mais e nascem menos filhos. Fecundidade abaixo da reposição (2,1) e diferenças entre UFs indicam onde concentrar políticas de saúde, cuidado e apoio às famílias.
- **simples:** Resumão: a gente está vivendo mais e tendo menos filhos. Parece ótimo, e em parte é, mas com menos de 2,1 filhos por mulher a população não se repõe. E isso não acontece igual em todo lugar: tem estado bem na frente e outro bem atrás.

## ds5 — Tábuas de mortalidade
- **tecnico:** A tábua de mortalidade estima, para cada idade, a chance de morrer e os anos de vida restantes. Na prática, revela mortes evitáveis, como o excesso de mortes de homens jovens e adultos, e sustenta os cálculos atuariais da previdência e dos seguros.
- **simples:** A tábua responde: de cada 100 bebês, quantos chegam aos 60? E aos 80? E quanto tempo ainda vive quem chegou lá? Spoiler: os homens morrem bem mais cedo, muito por violência e acidente, e dá para evitar boa parte disso.

## quality — Qualidade de dados
- **tecnico:** As regras de validação comparam a base tratada com a fonte do IBGE e registram duplicatas, nulos e valores atípicos. Garantem que cada número seja rastreável; uma regra com falha indica erro de carga ou de tratamento e invalida as análises até ser corrigida.
- **simples:** Antes de mostrar qualquer número, a gente confere se ele bate com o arquivo oficial do IBGE: nada repetido, nada sumido, nada estranho. Se algo falha aqui, é sinal de que o resto do painel pode estar errado.
