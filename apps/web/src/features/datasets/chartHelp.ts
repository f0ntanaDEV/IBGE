export type ChartHelp = { oQueMostra: string; comoLer: string }

export const CHART_HELP: Record<string, ChartHelp> = {
  "Pirâmide etária": {
    oQueMostra: "A população por idade simples, com homens e mulheres em lados opostos.",
    comoLer: "Cada barra é uma idade. O contorno compara outro ano sem substituir o ano selecionado.",
  },
  Contexto: {
    oQueMostra: "Referências do território no ano selecionado, inclusive o Censo quando existe.",
    comoLer: "Leia cada linha como um número oficial ao lado da projeção, não como uma série.",
  },
  "Idade por ano": {
    oQueMostra: "A concentração de pessoas por idade ao longo de 2000 a 2070.",
    comoLer: "Tons mais fortes indicam mais pessoas naquela idade e ano. A faixa etária clicada fica guardada à parte dos filtros.",
  },
  Fatos: {
    oQueMostra: "Frases curtas já calculadas para o território.",
    comoLer: "Cada fato descreve uma mudança da série. O território da página define qual conjunto aparece.",
  },
  "Pirâmide quinquenal": {
    oQueMostra: "A população em grupos de cinco anos, em três momentos.",
    comoLer: "Compare a largura de cada grupo entre 2000, o ano selecionado e 2070.",
  },
  "Composição por grandes faixas": {
    oQueMostra: "A parcela de 0–14, 15–59 e 60+ em cada ano.",
    comoLer: "As três faixas somam 100%. A legenda traz o percentual do ano selecionado.",
  },
  "0–14 e 60+": {
    oQueMostra: "A proporção de crianças e de idosos no território.",
    comoLer: "O cruzamento marca o ano em que os idosos passam as crianças. A linha vertical é o ano selecionado.",
  },
  "UFs por % de 60+": {
    oQueMostra: "A parcela de pessoas com 60 anos ou mais em cada UF.",
    comoLer: "As barras estão da maior para a menor. A UF escolhida fica destacada; uma região mostra só as UFs dela.",
  },
  "Mapa por UF": {
    oQueMostra: "A parcela de idosos em cada UF no ano selecionado.",
    comoLer: "Cores mais escuras na escala indicam valores maiores. O clique escolhe o território da página.",
  },
  "Quem mudou mais": {
    oQueMostra: "A parcela de 60+ em cada UF no ano selecionado.",
    comoLer: "O controle de ano reordena as barras. Pausar ou soltar o controle atualiza o ano da página.",
  },
  "Bônus demográfico": {
    oQueMostra: "A razão de dependência ao longo dos anos.",
    comoLer: "A linha vertical marca a projeção e o ano selecionado. Valores mais baixos indicam mais gente em idade ativa.",
  },
  "Esperança de vida ao nascer": {
    oQueMostra: "Os anos médios de vida de homens e de mulheres.",
    comoLer: "A série contínua é o período observado e a tracejada é a projeção. Os rótulos de Covid-19 e de projeção não se sobrepõem.",
  },
  "Filhos por mulher": {
    oQueMostra: "O número médio de filhos por mulher.",
    comoLer: "A linha de 2,1 é o limite entre a zona segura e a de atenção. As faixas ao fundo repetem a regra do indicador.",
  },
  "Crescimento vegetativo": {
    oQueMostra: "As taxas brutas de natalidade e de mortalidade.",
    comoLer: "A área entre as duas linhas é o crescimento vegetativo. Quando a mortalidade passa a natalidade, a área muda de sentido.",
  },
  "Mapa da esperança de vida": {
    oQueMostra: "A esperança de vida ao nascer em cada UF.",
    comoLer: "O clique define o território. As visões Mapa, Contorno e Satélite mantêm o mesmo clique.",
  },
  "Vida longa e fecundidade": {
    oQueMostra: "Esperança de vida e filhos por mulher em cada UF.",
    comoLer: "A posição compara os dois indicadores e o tamanho da bolha é a população. O sexo não entra neste gráfico.",
  },
  "Quem mudou mais a esperança de vida": {
    oQueMostra: "A esperança de vida de cada UF no ano selecionado.",
    comoLer: "As barras são reordenadas a cada ano do controle. A UF escolhida permanece destacada.",
  },
  "Mulheres e homens": {
    oQueMostra: "Quantos anos as mulheres vivem a mais do que os homens, ao nascer e aos 60.",
    comoLer: "Cada UF tem duas barras. Se não houver valor negativo, o eixo começa em zero.",
  },
  "Ranking de UFs": {
    oQueMostra: "As UFs ordenadas pelo indicador escolhido no seletor.",
    comoLer: "A ordem é da maior para a menor. Trocar o indicador redesenha as barras sem mudar o território.",
  },
  "Curva de sobrevivência": {
    oQueMostra: "De cada 100 nascidos, quantos continuam vivos em cada idade.",
    comoLer: "Homens e mulheres são séries separadas. O sexo da página escolhe qual conjunto de tábuas entra no cálculo quando o filtro se aplica.",
  },
  "Probabilidade de morte": {
    oQueMostra: "O risco de morrer em cada idade, em escala logarítmica.",
    comoLer: "Compare o ano selecionado com o outro ano do controle. Subidas no começo da curva indicam risco na infância.",
  },
  "Esperança de vida por idade": {
    oQueMostra: "Os anos de vida que ainda restam em cada idade.",
    comoLer: "A curva desce com a idade. A distância entre homens e mulheres mostra a diferença de longevidade.",
  },
  "Diferença entre mulheres e homens": {
    oQueMostra: "A diferença, em anos, entre mulheres e homens ao nascer e aos 60, por UF.",
    comoLer: "As duas séries ficam lado a lado. O eixo só abre para valores negativos quando alguma UF tem diferença negativa.",
  },
  "Marcos da projeção": {
    oQueMostra: "Os anos do pico populacional, do cruzamento de idades, da reposição e do saldo natural.",
    comoLer: "Cada marco é um ano da projeção. O clique leva o ano da página para aquele marco.",
  },
}
