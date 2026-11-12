export type InsightExtra = {
  why: string
  keyNumbers: { label: string; value: string }[]
  chartId: string
  chartLabel: string
}

export const INSIGHT_EXTRA: Record<string, InsightExtra[]> = {
  overview: [
    { why: "Define até quando faz sentido planejar expansão de infraestrutura e quando é hora de adaptar o que já existe.", keyNumbers: [{ label: "Pico", value: "2041" }, { label: "Pico", value: "220,4 milhões" }, { label: "2070", value: "199,2 milhões" }], chartId: "populacao-2000-2070", chartLabel: "População 2000–2070" },
    { why: "Mostra o ritmo em que saúde, previdência e cuidados precisam se ajustar a uma população mais velha.", keyNumbers: [{ label: "Idade mediana 2026", value: "36,1 anos" }, { label: "Idosos por 100 crianças em 2070", value: "316" }, { label: "Idosos superam crianças", value: "2029" }], chartId: "marcos-da-projecao", chartLabel: "Marcos" },
    { why: "Explica a causa principal da mudança etária e por que ela continua mesmo com fecundidade estável.", keyNumbers: [{ label: "Filhos por mulher em 2026", value: "1,51" }, { label: "Abaixo da reposição desde", value: "2002" }, { label: "Óbitos superam nascimentos", value: "2042" }], chartId: "marcos-da-projecao", chartLabel: "Marcos" },
    { why: "Revela se uma mesma política nacional serve a todas as regiões ou precisa de calendários diferentes.", keyNumbers: [{ label: "Idade mediana do Norte", value: "30,7 anos" }, { label: "Idosos por 100 crianças no Sudeste", value: "105" }, { label: "Pico do Centro-Oeste", value: "2056" }], chartId: "populacao-2000-2070", chartLabel: "População 2000–2070" },
    { why: "Mostra como um choque real aparece nos dados e por que projeções precisam ser revisadas.", keyNumbers: [{ label: "Esperança de vida em 2019", value: "76,22" }, { label: "Em 2021", value: "72,78" }, { label: "Em 2026", value: "77,03" }], chartId: "populacao-2000-2070", chartLabel: "População 2000–2070" },
  ],
  ds1: [
    { why: "Orienta quantas vagas de creche e escola serão necessárias e onde investir em qualidade em vez de expansão.", keyNumbers: [{ label: "Bebês em 2026", value: "2,39 milhões" }, { label: "6 a 14 anos em 2040", value: "20,2 milhões" }, { label: "Queda até 2070", value: "38%" }], chartId: "piramide-etaria", chartLabel: "Pirâmide etária" },
    { why: "Permite antecipar picos de demanda acompanhando a geração mais numerosa ao longo da vida.", keyNumbers: [{ label: "Idade mais numerosa em 2000", value: "15" }, { label: "Em 2026", value: "41" }, { label: "Em 2070", value: "55" }], chartId: "idade-por-ano", chartLabel: "Mapa de calor idade × ano" },
    { why: "Dimensiona os cuidados de longa duração para o grupo que mais cresce.", keyNumbers: [{ label: "90+ em 2026", value: "814 mil" }, { label: "90+ em 2070", value: "5,5 milhões" }, { label: "Homens por 100 mulheres (90+)", value: "48" }], chartId: "idade-por-ano", chartLabel: "Mapa de calor idade × ano" },
    { why: "Liga a maioria feminina à mortalidade de homens jovens e às necessidades de mulheres idosas.", keyNumbers: [{ label: "Mulheres são maioria a partir de", value: "28 anos" }, { label: "Homens por 100 mulheres", value: "95" }, { label: "Risco masculino aos 20–24", value: "4×" }], chartId: "piramide-etaria", chartLabel: "Pirâmide etária" },
    { why: "Mostra como contar com precisão públicos definidos por idade em leis e programas.", keyNumbers: [{ label: "Jovens com 18 anos em 2026", value: "2,94 milhões" }, { label: "62 anos ou mais em 2026", value: "32,0 milhões" }, { label: "Em 2040", value: "47,7 milhões" }], chartId: "piramide-etaria", chartLabel: "Pirâmide etária" },
  ],
  ds2: [
    { why: "Resume em uma imagem para onde a demanda por serviços está se deslocando.", keyNumbers: [{ label: "Maior grupo em 2000", value: "15–19" }, { label: "Em 2026", value: "40–44" }, { label: "Em 2070", value: "55–59" }], chartId: "piramide-quinquenal", chartLabel: "Pirâmide quinquenal" },
    { why: "Compara as duas pontas da vida que mais exigem cuidado direto.", keyNumbers: [{ label: "80+ por criança de 0–4 em 2026", value: "0,42" }, { label: "Em 2070", value: "3,01" }, { label: "Cruzamento no Brasil", value: "2041" }], chartId: "piramide-quinquenal", chartLabel: "Comparação 2000 × 2070" },
    { why: "Indica quais orçamentos tendem a crescer e quais tendem a sobrar.", keyNumbers: [{ label: "90+ até 2070", value: "+576%" }, { label: "5 a 9 anos até 2070", value: "−43,8%" }, { label: "80+ em 2070", value: "22,7 milhões" }], chartId: "piramide-quinquenal", chartLabel: "Comparação 2000 × 2070" },
    { why: "Antecipa a oferta de trabalhadores e a necessidade de ganhos de produtividade.", keyNumbers: [{ label: "15 a 64 anos em 2026", value: "147,5 milhões" }, { label: "Máximo", value: "2035" }, { label: "Participação em 2070", value: "57,0%" }], chartId: "composicao-por-grandes-faixas", chartLabel: "Composição 100%" },
    { why: "Ajuda empresas e governos a ajustar produtos, serviços e localização ao novo perfil etário.", keyNumbers: [{ label: "Maior grupo em 2070", value: "55–59" }, { label: "80+ em 2070", value: "22,7 milhões" }, { label: "0–4 em 2070", value: "7,5 milhões" }], chartId: "composicao-por-grandes-faixas", chartLabel: "Composição 100%" },
  ],
  ds3: [
    { why: "Marca o momento em que redes pensadas para crianças precisam ser reorientadas para idosos.", keyNumbers: [{ label: "Idosos superam crianças", value: "2029" }, { label: "65+ superam crianças", value: "2036" }, { label: "Idosos em 2070", value: "75,3 milhões" }], chartId: "0-14-e-60", chartLabel: "0–14 e 60+" },
    { why: "Mostra quanto tempo resta de condições demográficas favoráveis ao crescimento econômico.", keyNumbers: [{ label: "Menor razão de dependência", value: "2017" }, { label: "Em 2026", value: "45,2" }, { label: "Em 2070", value: "75,4" }], chartId: "bonus-demografico", chartLabel: "Bônus demográfico" },
    { why: "Aponta onde a pressão por saúde e assistência é maior e cresce mais rápido.", keyNumbers: [{ label: "Maior % de 60+", value: "RS 21,8%" }, { label: "Menor", value: "RR 8,8%" }, { label: "Maior alta desde 2000", value: "RS +11,1 p.p." }], chartId: "ufs-por-de-60", chartLabel: "Ranking de UFs" },
    { why: "Dimensiona o grupo que mais demanda cuidados contínuos e apoio às famílias.", keyNumbers: [{ label: "80+ em 2026", value: "2,4%" }, { label: "80+ em 2070", value: "11,4%" }, { label: "Em número", value: "22,7 milhões" }], chartId: "0-14-e-60", chartLabel: "0–14 e 60+" },
    { why: "Ajuda a planejar ensino médio, ensino superior e entrada no mercado de trabalho.", keyNumbers: [{ label: "15 a 17 anos em 2026", value: "8,7 milhões" }, { label: "18 a 21 anos em 2026", value: "12,0 milhões" }, { label: "18 a 21 em 2070", value: "7,3 milhões" }], chartId: "0-14-e-60", chartLabel: "0–14 e 60+" },
  ],
  ds4: [
    { why: "Identifica onde ainda há mais vidas a ganhar com políticas de saúde e segurança.", keyNumbers: [{ label: "Brasil em 2026", value: "77,03 anos" }, { label: "Maior", value: "DF 80,03" }, { label: "Menor", value: "AP 74,84" }], chartId: "esperanca-de-vida-ao-nascer", chartLabel: "Esperança de vida H × M" },
    { why: "Quantifica a desvantagem masculina e a demanda por proteção a idosas.", keyNumbers: [{ label: "Diferença em 2026", value: "6,52 anos" }, { label: "No Nordeste", value: "7,22" }, { label: "Em 2070", value: "cerca de 4,4" }], chartId: "mulheres-e-homens", chartLabel: "Barras divergentes" },
    { why: "Mostra o avanço já obtido e onde ainda há mortes evitáveis de bebês.", keyNumbers: [{ label: "2000", value: "28,13 por mil" }, { label: "2026", value: "11,83 por mil" }, { label: "Maior em 2026", value: "RR 20,91" }], chartId: "mapa-da-esperanca-de-vida", chartLabel: "Mapa por UF" },
    { why: "Indica quando a população começa a encolher sem depender da migração.", keyNumbers: [{ label: "Nascimentos por mil", value: "11,17" }, { label: "Óbitos por mil", value: "7,26" }, { label: "Virada", value: "2042" }], chartId: "crescimento-vegetativo", chartLabel: "Natalidade × mortalidade" },
    { why: "Explica por que a população envelhece e diminui no longo prazo.", keyNumbers: [{ label: "Filhos por mulher em 2026", value: "1,51" }, { label: "Menor UF", value: "RJ 1,37" }, { label: "Única acima de 2,1", value: "RR 2,14" }], chartId: "taxa-de-fecundidade-total", chartLabel: "Filhos por mulher e reposição" },
  ],
  ds5: [
    { why: "Traduz a longevidade em algo concreto: quantos de cada 100 chegam a idades avançadas.", keyNumbers: [{ label: "Chegam aos 80 em 2026", value: "54,6 de 100" }, { label: "Mulheres", value: "63,0" }, { label: "Em 2070", value: "71,8" }], chartId: "curva-de-sobrevivencia", chartLabel: "Curva de sobrevivência" },
    { why: "É a base para estimar por quanto tempo aposentadorias e cuidados serão necessários.", keyNumbers: [{ label: "Aos 60, mais", value: "22,82 anos" }, { label: "Mulheres", value: "24,41" }, { label: "Homens", value: "21,02" }], chartId: "esperanca-de-vida-por-idade", chartLabel: "Esperança de vida por idade" },
    { why: "Localiza a idade em que a mortalidade evitável de homens é mais grave.", keyNumbers: [{ label: "Homens 20–24", value: "10,85 por mil" }, { label: "Mulheres 20–24", value: "2,67 por mil" }, { label: "Razão no Nordeste", value: "5,04×" }], chartId: "probabilidade-de-morte", chartLabel: "Probabilidade de morte por idade" },
    { why: "Aponta o período de maior risco no início da vida e as diferenças regionais.", keyNumbers: [{ label: "Brasil", value: "11,83 por mil" }, { label: "Norte", value: "14,82" }, { label: "Sul", value: "9,36" }], chartId: "probabilidade-de-morte", chartLabel: "Probabilidade de morte por idade" },
    { why: "Mostra como os dados viram cálculo atuarial para previdência e seguros.", keyNumbers: [{ label: "Chegam aos 60", value: "86,4 de 100" }, { label: "Vida restante aos 60", value: "22,82 anos" }, { label: "Revisão usada", value: "2024" }], chartId: "curva-de-sobrevivencia", chartLabel: "Curva de sobrevivência" },
  ],
  quality: [
    { why: "Justifica o tratamento mesmo quando a fonte é oficial e confiável.", keyNumbers: [{ label: "Duplicatas na origem", value: "0" }, { label: "Nulos estruturais", value: "99" }, { label: "Linhas tratadas", value: "918.456" }], chartId: "original-demonstracao", chartLabel: "Original × Demonstração" },
    { why: "Evita que a limpeza altere dados legítimos publicados pelo IBGE.", keyNumbers: [{ label: "Falsos positivos do IQR global", value: "~12%" }, { label: "Estratégia padrão", value: "sinalizar" }, { label: "Alterar exige", value: "confirmação" }], chartId: "inserido-detectado-corrigido", chartLabel: "Inserido · Detectado · Corrigido" },
    { why: "Comprova, com regras verificáveis, que os números são coerentes entre si.", keyNumbers: [{ label: "Brasil − Σ UFs", value: "0" }, { label: "Homens + mulheres − total", value: "0" }, { label: "Σ idades 2024", value: "212.583.750" }], chartId: "validacoes", chartLabel: "Validações" },
    { why: "Esclarece o que foi mantido como está e o que foi estimado pelo tratamento.", keyNumbers: [{ label: "Nulos estruturais", value: "99" }, { label: "Territórios", value: "33" }, { label: "Imputação", value: "por série" }], chartId: "nulos-por-coluna", chartLabel: "Nulos por coluna" },
    { why: "Garante que a aplicação continue correta quando o IBGE publicar novos dados.", keyNumbers: [{ label: "Revisão atual", value: "2024" }, { label: "Carga", value: "idempotente" }, { label: "Alerta", value: "testes golden" }], chartId: "historico-de-execucoes", chartLabel: "Histórico de execuções" },
  ],
}
