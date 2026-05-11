// Configurações globais
export const CONFIG = {
  YOUTUBE_CHANNEL_ID: "UCwTM4qaQO3fsRpKAAZUZ8Ng",
  VIDEO_PRIORITARIO: "k6sbFio_qDI",
  SECRETARIAT_EMAILS: ["santuariodefatima@santuariodefatima.com.br", "pascom.santuario@outlook.com.br"],
  MAX_USERS: 5,
  FALLBACK_VIDEOS: [
    { id: "k6sbFio_qDI", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/k6sbFio_qDI/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=k6sbFio_qDI", isLiveNow: false },
    { id: "W3kFS0PQEc8", title: "Santa Missa - 1 Domingo da Quaresma - 22 de Fevereiro de 2026", thumbnail: "https://img.youtube.com/vi/W3kFS0PQEc8/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=W3kFS0PQEc8", isLiveNow: false },
    { id: "MkxD4-pTviM", title: "Santa Missa - Quarta-feira de Cinzas - 18 de Fevereiro de 2026", thumbnail: "https://img.youtube.com/vi/MkxD4-pTviM/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=MkxD4-pTviM", isLiveNow: false },
    { id: "uxpvBXYXm6s", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/uxpvBXYXm6s/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=uxpvBXYXm6s", isLiveNow: false },
    { id: "LoRx8F-wRf0", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/LoRx8F-wRf0/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=LoRx8F-wRf0", isLiveNow: false },
    { id: "DQLtlDp9r5c", title: "Santa Missa - Domingo da Quaresma", thumbnail: "https://img.youtube.com/vi/DQLtlDp9r5c/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=DQLtlDp9r5c", isLiveNow: false },
    { id: "L6fHBk0YC5Q", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/L6fHBk0YC5Q/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=L6fHBk0YC5Q", isLiveNow: false }
  ]
};

export const IMAGEM_NOSSA_SENHORA = "https://fashionbubbles.com/wp-content/uploads/2024/04/dia-de-nossa-senhora-de-fatima-750x500.jpg";
export const R2_PUBLIC_URL = "https://pub-a7cc8a4d3af3406aac2a13dacc039fb5.r2.dev";

export const VOZES_XTTS = {
  amandoca: "vozes-base/amandoca_base.mp3",
  antonio:  "vozes-base/antonio_base.mp3",
  arnold:   "vozes-base/arnold_base.mp3",
  arthur:   "vozes-base/arthur_base.mp3",
  ayres:    "vozes-base/ayres_base.mp3",
  claudio:  "vozes-base/claudio_base.mp3",
  eduardo:  "vozes-base/eduardo_base.mp3",
  fernando: "vozes-base/fernando_base.mp3",
  graziella:"vozes-base/graziella_base.mp3",
  juliana:  "vozes-base/juliana_base.mp3",
  maria:    "vozes-base/woman_base.mp3",
  nina:     "vozes-base/nina_base.mp3",
  roberta:  "vozes-base/roberta_base.mp3",
};

export const HORARIOS_MISSAS_PADRAO = [
  { id: 'segunda', dia: "Segunda-Feira", missas: [], ativo: true },
  { id: 'terca', dia: "Terça-Feira", missas: [{ id: 'terca-1', hora: "07h30" }, { id: 'terca-2', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }], ativo: true },
  { id: 'quarta', dia: "Quarta-Feira", missas: [{ id: 'quarta-1', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }], ativo: true },
  { id: 'quinta', dia: "Quinta-Feira", missas: [{ id: 'quinta-1', hora: "07h30" }, { id: 'quinta-2', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }], ativo: true },
  { id: 'sexta', dia: "Sexta-Feira", missas: [{ id: 'sexta-1', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }], ativo: true },
  { id: 'sabado', dia: "Sábado", missas: [{ id: 'sabado-1', hora: "16h30", tipo: "Confissão - Chegue com 1h de antecedência" }], ativo: true },
  { id: 'domingo', dia: "Domingo", missas: [{ id: 'domingo-1', hora: "08h00" }, { id: 'domingo-2', hora: "10h00", tipo: "Transmitida AO VIVO", youtube: true, youtubeLink: "https://youtube.com/@santuariodefatimanews?si=pQ6hupSToauGO1IV" }, { id: 'domingo-3', hora: "18h30" }], ativo: true }
];
