// src/routes/public/terco.js
import { jsonResponse } from '../../utils/responses.js';

export function getMisterioTerco() {
  try {
    const day = new Date().getDay();
    const mapa = {
      0: { tipo: 'gloriosos', titulo: 'Mistérios Gloriosos', descricao: 'A Ressurreição de Jesus', cor: 'branco' },
      1: { tipo: 'gozosos', titulo: 'Mistérios Gozosos', descricao: 'A Anunciação do Anjo', cor: 'azul' },
      2: { tipo: 'dolorosos', titulo: 'Mistérios Dolorosos', descricao: 'A Agonia de Jesus', cor: 'roxo' },
      3: { tipo: 'gloriosos', titulo: 'Mistérios Gloriosos', descricao: 'A Ascensão de Jesus', cor: 'branco' },
      4: { tipo: 'luminosos', titulo: 'Mistérios Luminosos', descricao: 'O Batismo de Jesus', cor: 'branco' },
      5: { tipo: 'dolorosos', titulo: 'Mistérios Dolorosos', descricao: 'A Crucificação', cor: 'roxo' },
      6: { tipo: 'gozosos', titulo: 'Mistérios Gozosos', descricao: 'A Visitação', cor: 'azul' }
    };
    const misterio = mapa[day] || mapa[2];
    const audioUrls = {
      gloriosos: 'https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-gloriosos.mp3',
      gozosos: 'https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-gozosos.mp3',
      dolorosos: 'https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-dolorosos.mp3',
      luminosos: 'https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-luminosos.mp3'
    };
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const horarios = [
      { hora: 7, nome: 'Manhã', descricao: 'Terço da Aurora' },
      { hora: 15, nome: 'Misericórdia', descricao: 'Hora da Misericórdia' },
      { hora: 21, nome: 'Noite', descricao: 'Terço do Descanso' },
      { hora: 3, nome: 'Madrugada', descricao: 'Terço da Vigília' }
    ];
    const horaAtual = new Date().getHours();
    const proximoHorario = horarios.find(h => h.hora > horaAtual) || horarios[0];
    return {
      success: true,
      dia: day,
      diaSemana: diasSemana[day],
      misterio: misterio.tipo,
      titulo: misterio.titulo,
      descricao: misterio.descricao,
      corLiturgica: misterio.cor,
      audioUrl: audioUrls[misterio.tipo],
      estrutura: { paiNosso: 6, aveMaria: 50, gloria: 5, totalContas: 56, tempoMedio: '25 minutos' },
      horarios,
      proximoHorario,
      dataReferencia: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };
  } catch {
    return {
      success: true,
      dia: 2,
      diaSemana: 'Terça-feira',
      misterio: 'dolorosos',
      titulo: 'Mistérios Dolorosos',
      descricao: 'A Agonia de Jesus',
      corLiturgica: 'roxo',
      audioUrl: 'https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-dolorosos.mp3',
      estrutura: { paiNosso: 6, aveMaria: 50, gloria: 5, totalContas: 56, tempoMedio: '25 minutos' },
      horarios: [],
      proximoHorario: { hora: 15, nome: 'Misericórdia', descricao: 'Hora da Misericórdia' },
      dataReferencia: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };
  }
}

// Exporta a função para uso no index.js
export async function handleTerco(request, env) {
  return jsonResponse(getMisterioTerco());
}