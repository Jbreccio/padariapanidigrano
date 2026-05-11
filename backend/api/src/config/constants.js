// backend/api/src/config/constants.js
// Constantes globais do sistema

export const CONFIG = {
  // Canais e mídias
  YOUTUBE_CHANNEL_ID: "UCwTM4qaQO3fsRpKAAZUZ8Ng",
  VIDEO_PRIORITARIO: "k6sbFio_qDI",
  
  // Emails da secretaria
  SECRETARIAT_EMAILS: [
    "santuariodefatima@santuariodefatima.com.br",
    "pascom.santuario@outlook.com.br"
  ],
  
  // Limites
  MAX_USERS: 5,
  MAX_PRAYER_LENGTH: 1200,
  MAX_CONTRIBUTION_LENGTH: 5000,
  
  // Vídeos fallback
  FALLBACK_VIDEOS: [
    { id: "k6sbFio_qDI", title: "Santa Missa - Santuario de Fatima", isLiveNow: false },
    { id: "W3kFS0PQEc8", title: "Santa Missa - 1 Domingo da Quaresma", isLiveNow: false },
    { id: "MkxD4-pTviM", title: "Santa Missa - Quarta-feira de Cinzas", isLiveNow: false }
  ],
  
  // Horários das missas padrão
  HORARIOS_MISSAS_PADRAO: [
    { id: 'segunda', dia: "Segunda-Feira", missas: [], ativo: true },
    { id: 'terca', dia: "Terça-Feira", missas: [{ id: 'terca-1', hora: "07h30" }, { id: 'terca-2', hora: "19h30" }], ativo: true },
    { id: 'quarta', dia: "Quarta-Feira", missas: [{ id: 'quarta-1', hora: "19h30" }], ativo: true },
    { id: 'quinta', dia: "Quinta-Feira", missas: [{ id: 'quinta-1', hora: "07h30" }, { id: 'quinta-2', hora: "19h30" }], ativo: true },
    { id: 'sexta', dia: "Sexta-Feira", missas: [{ id: 'sexta-1', hora: "19h30" }], ativo: true },
    { id: 'sabado', dia: "Sábado", missas: [{ id: 'sabado-1', hora: "16h30" }], ativo: true },
    { id: 'domingo', dia: "Domingo", missas: [{ id: 'domingo-1', hora: "08h00" }, { id: 'domingo-2', hora: "10h00" }, { id: 'domingo-3', hora: "18h30" }], ativo: true }
  ],
  
  // Cores da liturgia
  CORES_LITURGICAS: {
    roxo: '#4b2e2e',
    verde: '#2e6b2e',
    branco: '#f5f5f5',
    vermelho: '#b22222',
    rosa: '#ffb6c1'
  },
  
  // Cores da palheta
  CORES_PALHETA: [
    '#1a237e', '#0d47a1', '#1565c0', '#1976d2', '#2196f3',
    '#4caf50', '#2e7d32', '#ff9800', '#f57c00', '#e65100',
    '#9c27b0', '#7b1fa2', '#e91e63', '#c2185b', '#d32f2f'
  ],
  
  // Tempos de expiração (em segundos)
  EXPIRATION: {
    TWOFA: 300,      // 5 minutos
    PIN: 300,        // 5 minutos
    RESET_TOKEN: 3600, // 1 hora
    SESSION: 86400,  // 24 horas
    CACHE: 604800    // 7 dias
  },
  
  // URLs
  R2_PUBLIC_URL: "https://pub-a7cc8a4d3af3406aac2a13dacc039fb5.r2.dev",
  IMAGEM_NOSSA_SENHORA: "https://fashionbubbles.com/wp-content/uploads/2024/04/dia-de-nossa-senhora-de-fatima-750x500.jpg",
  
  // Vozes disponíveis
  VOZES_XTTS: {
    amandoca: "vozes-base/amandoca_base.mp3",
    antonio: "vozes-base/antonio_base.mp3",
    arnold: "vozes-base/arnold_base.mp3",
    maria: "vozes-base/woman_base.mp3"
  }
};

export default CONFIG;