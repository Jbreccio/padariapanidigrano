// backend/src/api/momentos.js
import express from 'express';

const router = express.Router();

router.get('/momentos-liturgicos', (req, res) => {
  const dados = {
    momentosLiturgicos: [
      {
        id: 'momento-liturgico-solenidade',
        periodo: 'Renovação da Consagração ao Imaculado Coração de Maria',
        cor: 'verde',
        tituloFaixa: 'SOLENIDADE 2025',
        imagens: [
          '/Solenidade-02.png',
          '/Solenidade-03.png',
          '/Solenidade-04.png',
          '/Solenidade-05.png',
          '/Solenidade-06.png'
        ],
        ativo: true,
        ordem: 1
      },
      {
        id: 'ano-jubilar',
        periodo: 'Ano Jubilar',
        cor: 'verde',
        tituloFaixa: 'ANO JUBILAR 2025',
        imagens: [
          '/Jubileo.png',
          '/Jubileo2.png',
          '/Jubileo3.png',
          '/Jubileo4.png',
          '/Jubileo5.png',
          '/Jubileo6.png',
          '/Jubileo7.png',
          '/Jubileo8.png'
        ],
        ativo: true,
        ordem: 2
      },
      {
        id: 'proximo-domingo-ramos',
        periodo: 'Próximo Domingo de Ramos',
        cor: 'vermelho',
        tituloFaixa: 'DOMINGO DE RAMOS 2025',
        imagens: [
          '/ramos01.png',
          '/ramos02.png',
          '/ramos03.png',
          '/ramos04.png',
          '/ramos05.png'
        ],
        ativo: true,
        ordem: 3
      },
      {
        id: 'quarta-cinzas',
        periodo: 'Quarta-feira de Cinzas',
        cor: 'roxo',
        tituloFaixa: 'QUARTA-FEIRA DE CINZAS 2025',
        imagens: [
          '/Cinzas1.png',
          '/Cinzas02.png',
          '/Cinzas03.png',
          '/Cinzas4.png',
          '/Cinzas5.png',
          '/Cinzas6.png'
        ],
        ativo: true,
        ordem: 4
      }
    ],
    recados: [],
    eventos: []
  };
  
  res.json(dados);
});

export default router;