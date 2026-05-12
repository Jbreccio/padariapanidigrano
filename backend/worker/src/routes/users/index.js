// backend/worker/src/routes/fiel/index.js
export { getDados }                          from './dados.js';
export { salvarDados }                       from './salvar.js';
export { atualizarPerfil }                   from './perfil.js';
export { listarPastorais }                   from './pastorais.js';
export { registrarTermoPublico }             from './termo-publico.js';
export { contribuirVoz }                     from './voz.js';
export { salvarVersiculo, buscarVersiculos } from './versiculos.js';
export { buscarMusicas, getMusicaById, getMusicaPlayer } from './musicas.js';
export { uploadImagemFiel, alterarSenhaFiel } from './fiel-utils.js';