export type Novidade = {
  area: string
  text: string
}

export type NovidadeGrupo = {
  date: string
  items: Novidade[]
}

/** Alterações registradas em specs/DECISIONS.md, da mais recente para a mais antiga. */
export const NOVIDADES: NovidadeGrupo[] = [
  {
    date: "2026-11-13",
    items: [
      { area: "Interface", text: "Novidades ficou no canto inferior esquerdo da sidebar e abre este histórico. O status da API saiu da sidebar e permanece no rodapé, alinhado a Visão geral." },
      { area: "Interface", text: "Configurações e Como ler este painel foram para o mesmo bloco inferior, junto com Novidades." },
    ],
  },
  {
    date: "2026-11-12",
    items: [
      { area: "Infraestrutura", text: "O MySQL apaga os redo temporários na subida e limita redo e temporário a 32 MB, para o volume de 500 MB não encher com arquivos de crash." },
      { area: "Interface", text: "O cabeçalho das bases ficou só com Reprocessar e Baixar. A opção Enviar arquivo saiu do projeto." },
      { area: "Datas", text: "Carimbo sem fuso é tratado como UTC do servidor e a tela mostra o horário de Brasília. “Processado em” usa a mesma execução do histórico." },
      { area: "Indicadores", text: "Grupos quinquenais e grupos etários ganharam regras de status. O selo do KPI passou a ser só o ícone, no canto inferior direito." },
      { area: "Notícias", text: "Matéria que marca outro ano de pico populacional que não 2041 saiu de “Notícias que confirmam”." },
      { area: "Gráficos", text: "A série projetada entra com fade nos últimos 20% da janela, sem a animação de desenho que apagava o tracejado." },
      { area: "Animação", text: "A contagem parte de 0, inclusive nos decimais. Configurações não anima. O aviso fica no canto inferior esquerdo." },
      { area: "Animação", text: "O fade por letra ficou só em KPIs e cards. Todo número estatístico conta de 0 até o valor final. Anos de calendário continuam estáticos." },
      { area: "Animação", text: "Nenhum texto entra mais por letra ou palavra. A contagem dos números permanece." },
      { area: "Infraestrutura", text: "A API sobe sem semear a base suja e com menos arenas de memória, para caber no limite de 1 GB." },
      { area: "Infraestrutura", text: "O Parquet tratado fica em um cache único do processo, para a página de população por idade não duplicar a leitura." },
    ],
  },
  {
    date: "2026-11-11",
    items: [
      { area: "Filtros", text: "O território inválido volta para o Brasil e avisa. Voltar e avançar desfazem a troca. A sidebar preserva só os filtros úteis. As regiões seguem a ordem oficial e a UF aparece como sigla e nome. Mapa, ranking e séries passam a respeitar a região e a linha do Brasil." },
      { area: "Filtros", text: "O seletor de território é um select nativo com três grupos." },
      { area: "Fatos", text: "A consulta de fatos fica de fora do teste dos 33 códigos: UF sem suporte mantém o último território válido." },
      { area: "Filtros", text: "Código entre 0 e 53 que não é território responde que o território não existe. Acima de 53 a validação da consulta também recusa." },
      { area: "Qualidade", text: "A base suja passou a sujar o layout longo, gravar manifesto e deduplicar antes da imputação. O identificador da linha fica só no relatório de atípicos." },
      { area: "Qualidade", text: "Duplicatas e nulos do manifesto são contados depois do reshape, como o pipeline." },
      { area: "Comparação", text: "O chip de comparação da pirâmide quinquenal aponta o gráfico certo, e o de mortalidade infantil aponta o mapa da esperança de vida." },
      { area: "Testes", text: "O teste de ponta a ponta sobe a API com uvicorn." },
      { area: "Dados", text: "O diretório de dados só cai na pasta do repositório quando o caminho configurado não existe." },
      { area: "Filtros", text: "A barra de seleção cruzada regrava a URL a partir da busca atual, sem apagar o território recém-escolhido." },
      { area: "Notícias", text: "Cada base devolve até 30 matérias das três páginas já no snapshot." },
      { area: "Qualidade", text: "Um valor só é atípico quando o salto anual passa de 5%, fica longe da mediana e a variação absoluta é grande. Os anos de 2020 e 2021 ficam fora da referência. A base oficial deixa de marcar quase metade dos indicadores." },
      { area: "Desempenho", text: "O pré-aquecimento do contexto cobre os anos 2000, 2010, 2020, 2026, 2030, 2040, 2050, 2060 e 2070." },
      { area: "Visão geral", text: "A manchete de população usa o formato compacto." },
      { area: "Datas", text: "Carimbo sem fuso é exibido no fuso de São Paulo." },
      { area: "Notícias", text: "As cinco URLs curadas da Agência IBGE foram confirmadas manualmente." },
      { area: "Visão geral", text: "A manchete destaca os números em negrito, no mesmo tamanho da frase." },
      { area: "Infraestrutura", text: "A imagem de publicação só pré-calcula as bases oficiais. A base suja segue na subida do processo." },
    ],
  },
  {
    date: "2026-11-09",
    items: [
      { area: "Filtros", text: "O código 0 continua sendo o Brasil. Nível incompatível com o território responde erro de validação." },
      { area: "Qualidade", text: "O relatório de qualidade publicado usa o contrato novo. Original e sujo gravados no mesmo segundo deixaram de se apagar." },
      { area: "Dados", text: "Sem banco, a semeadura só roda se ainda não houver parquet das cinco bases." },
      { area: "Qualidade", text: "Os fatos de qualidade registram 103 de 113 validações, em vez de dizer que todas passaram." },
      { area: "Modo simples", text: "Cada categoria aparece em um card próprio." },
      { area: "Fatos", text: "Cada página de dados lista de 6 a 10 fatos, um por linha." },
      { area: "Filtros", text: "Diretório de dados inexistente cai na pasta do repositório. O resumo sem sexo usa só o total, sem somar homens, mulheres e ambos." },
      { area: "Notícias", text: "A busca vai entre aspas e o card só fica com matéria que cita o termo." },
      { area: "Infraestrutura", text: "A carga no MySQL pula a tabela quando o número de linhas já é o do Parquet." },
    ],
  },
  {
    date: "2026-11-06",
    items: [
      { area: "Testes", text: "O teste de ponta a ponta lê os parquet locais do repositório." },
      { area: "Testes", text: "A linha de base do navegador registrou rolagem horizontal em 375 e 768 px e gráficos sem marca em algumas bases." },
      { area: "Layout", text: "O cabeçalho quebra linha em vez de esticar a página em telas estreitas." },
      { area: "Gráficos", text: "As linhas dos gráficos voltam a aparecer: a curva passa a nascer dos pontos quando o traço não traz o caminho pronto." },
      { area: "Censo", text: "A comparação com o Censo 2022 usa a população residente de 203.080.756 pessoas, 3,8% abaixo da projeção." },
      { area: "Leitura", text: "Fatos e bônus usam um parágrafo de 3 a 5 frases. A barra de rolagem e a seleção de texto seguem as cores do painel." },
      { area: "Publicação", text: "A API e o MySQL ficam no Railway. A publicação estática só encaminha as chamadas da API." },
      { area: "Notícias", text: "O snapshot das matérias vai na imagem da API e vale 7 dias." },
    ],
  },
  {
    date: "2026-11-05",
    items: [
      { area: "Qualidade", text: "Outliers passam a ser só sinalizados. Os valores oficiais não são alterados nem removidos." },
      { area: "Qualidade", text: "A detecção de outliers compara a variação ano a ano dentro de cada série, em vez de misturar Brasil, regiões e UFs." },
      { area: "Qualidade", text: "A base suja de demonstração é gerada com semente fixa." },
      { area: "Projeto", text: "O painel web usa React. Um aplicativo móvel fica para depois, reaproveitando os tipos compartilhados." },
      { area: "Dados", text: "A linha de cabeçalho das planilhas é lida como índice do pandas, abaixo do cabeçalho agrupador." },
      { area: "Dados", text: "O perfil das cinco planilhas foi materializado para os testes conferirem os totais oficiais." },
      { area: "Dados", text: "Todas as abas são lidas com o mesmo motor rápido. A escrita continua no formato da planilha." },
      { area: "Dados", text: "Coluna que começa com dígito ganha prefixo, para o nome permanecer válido." },
      { area: "Dados", text: "O intervalo de idade é publicado com o nome curto pedido na especificação." },
      { area: "Qualidade", text: "O desempate de duplicata usa a contagem de nulos de antes da imputação." },
      { area: "Qualidade", text: "A soma territorial e a soma dos sexos só valem para colunas de contagem ou proporção." },
      { area: "Dados", text: "O MySQL é opcional na API local e obrigatório no ambiente com banco." },
      { area: "Censo", text: "O Censo 2022 fica associado ao agregado e à variável confirmados na API do IBGE." },
      { area: "Dados", text: "O ano atual da série usa o ano corrente quando ele existe; senão, o último ano publicado." },
      { area: "Qualidade", text: "A tolerância das somas de contagem é de 1 pessoa. Diferenças maiores ficam no relatório." },
      { area: "Projeto", text: "O front usa React 18, Vite 8 e Tailwind 4, com as cores em variáveis do tema." },
      { area: "Projeto", text: "O navegador fala com a API pela mesma origem." },
      { area: "API", text: "A verificação de saúde passou a ter contrato explícito." },
      { area: "Tabelas", text: "As tabelas usam a versão que mantém colunas, ordenação e paginação." },
      { area: "Navegação", text: "A navegação usa rótulos curtos. O nome oficial fica no título da página." },
      { area: "Gráficos", text: "O cartão de gráfico passou a oferecer “Tentar novamente”." },
      { area: "Gráficos", text: "As cores dos gráficos ficam dessaturadas e com luminosidade distinta." },
      { area: "Gráficos", text: "A pirâmide sem ano devolve todos os anos, para o seletor trocar o ano na hora." },
      { area: "Tabelas", text: "Busca e ordenação passaram a ir na consulta dos dados." },
      { area: "Qualidade", text: "O envio de arquivo devolve a prévia de 10 linhas. A validação das colunas fica no servidor." },
      { area: "Qualidade", text: "A página de qualidade permanece no endereço já usado na navegação." },
      { area: "Projeto", text: "A API lê a configuração na raiz do repositório." },
      { area: "Projeto", text: "Subir o ambiente deixa de exigir o arquivo de configuração local." },
      { area: "Números", text: "Percentual na formatação é uma proporção de 0 a 1." },
      { area: "Gráficos", text: "A pirâmide simples mantém 6 faixas e o eixo numérico fica com 5 marcas." },
      { area: "Números", text: "A formatação numérica fica centralizada, com verificação automática fora desse ponto." },
      { area: "Testes", text: "O teste de vazamento de formatação olha cada texto e cada rótulo acessível." },
      { area: "Indicadores", text: "O bônus demográfico são os anos seguidos com razão de dependência abaixo do limiar clássico, em torno do ponto mais baixo." },
      { area: "Mapa", text: "A malha do Brasil usa GeoJSON enxuto, com coordenadas de 3 casas." },
      { area: "Animação", text: "As animações usam só transformação, opacidade e traço, param o escalonamento em 400 ms e respeitam o Modo leve." },
      { area: "Animação", text: "A página de laboratório de movimento só existe durante o desenvolvimento." },
      { area: "Números", text: "O plural dos textos usa a mesma formatação do restante do painel." },
    ],
  },
]
