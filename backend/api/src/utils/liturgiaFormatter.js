// backend/src/utils/liturgiaFormatter.js
export const formatLiturgiaData = (data) => {
  return {
    success: true,
    data: data.data || new Date().toLocaleDateString('pt-BR'),
    titulo: data.titulo || 'Liturgia do Dia',
    corLiturgica: data.corLiturgica || 'Verde',
    tempoLiturgico: data.tempoLiturgico || 'Tempo Comum',
    leituras: {
      primeira: data.leituras?.primeira || {
        titulo: 'Primeira Leitura',
        referencia: 'Leitura do dia',
        texto: 'A Palavra de Deus nos convida à reflexão.'
      },
      salmo: data.leituras?.salmo || {
        referencia: 'Salmo Responsorial',
        resposta: 'O Senhor é meu pastor, nada me faltará.'
      },
      evangelho: data.leituras?.evangelho || {
        titulo: 'Evangelho',
        referencia: 'Evangelho do dia',
        texto: 'Jesus nos fala através do Evangelho.'
      }
    },
    fonte: data.fonte || 'API Local',
    timestamp: new Date().toISOString()
  };
};

export const fallbackLiturgia = () => {
  const hoje = new Date();
  const semana = Math.ceil(hoje.getDate() / 7);
  
  return {
    success: true,
    data: hoje.toLocaleDateString('pt-BR'),
    titulo: `Sexta-feira da ${semana}ª Semana do Tempo Comum`,
    corLiturgica: 'Verde',
    tempoLiturgico: 'Tempo Comum',
    leituras: {
      primeira: {
        titulo: 'Primeira Leitura (1Sm 24,3-21)',
        referencia: '1 Samuel 24,3-21',
        texto: 'Naqueles dias, Saul tomou consigo três mil homens escolhidos em todo o Israel e foi em busca de Davi e dos seus homens, até junto aos rochedos das cabras monteses.'
      },
      salmo: {
        referencia: 'Sl 56(57)',
        resposta: 'Tem piedade de mim, ó Deus, tem piedade.'
      },
      evangelho: {
        titulo: 'Evangelho (Mc 3,13-19)',
        referencia: 'Marcos 3,13-19',
        texto: 'Naquele tempo, Jesus subiu ao monte e chamou a si os que ele quis. E foram até ele.'
      }
    },
    fonte: 'Dados Locais',
    mensagem: 'Backend funcionando. Conecte ao Vatican News para dados atualizados.',
    timestamp: new Date().toISOString()
  };
};