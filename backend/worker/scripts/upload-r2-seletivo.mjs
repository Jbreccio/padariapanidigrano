import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE = 'C:/Users/Beto/PROJETO-APPS/santuariofatima/frontend/public';
const BUCKET = 'santuario-midias'; // ← corrigido

// ❌ Esses ficam na public — NÃO sobem para o R2
const EXCECOES = new Set([
  'Vela.gif',
  'Vela.png',
  'VelhoTestamento.png',
  'VaticanNewsLINK.png',
  'vaticanNewshome3.png',
  'textobiblico.png',
  'SobreNosBanner.png',
  'snsfoval.png',
  'snsf.png',
  'snsf02.png',
  'snsf03.png',
  '3pastorinhos.png',
  'BannerML.png',
  'bannerPastorais.png',
  'Batismo.png',
  'Biblia.png',
  'brasao3.png',
  'brasao5.png',
  'capelaantiga.png',
  'Capelaatual.png',
  'Capelatoda.png',
  'Casamento.png',
  'contatodireto.png',
  'DioceseSantoAmaro2.png',
  'DioceseSantoAmaroLINK.png',
  'doacoesbanner.png',
  'Dom José Negr.png',
  'envia-nos.png',
  'favicon - 16x16.png',
  'favicon - 32x32.png',
  'favicon.ico',
  'fundomodalDiocese.png',
  'fundoredessociais.png',
  'GoogleDriveLINK.png',
  'historia.png',
  'historia2.png',
  'historia3.png',
  'historia4.png',
  'historia5.png',
  'home1.png',
  'home2.png',
  'iconeapp.png',
  'Internoantigo.png',
  'Irmã_Lúcia_e_João_PauloI.png',
  'JornalDeFundo.png',
  'missasbunner.png',
  'padrebeto.png',
  'PapaVI_com_a_Irmã_Lúcia.png',
  'pascomlogo.png',
  'PeDavi.png',
  'people.church.png',
]);

let ok = 0;
let erro = 0;
let pulado = 0;

function upload(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      upload(fullPath); // entra em subpastas (ex: carrosselFotos)
    } else {
      // Se está na raiz da public, checa exceções
      const isRaiz = path.dirname(fullPath) === path.resolve(BASE);
      if (isRaiz && EXCECOES.has(entry.name)) {
        console.log(`⏭️  Pulando (fica na public): ${entry.name}`);
        pulado++;
        continue;
      }

      const key = '/' + fullPath.replace(path.resolve(BASE), '').replace(/\\/g, '/');
      console.log(`⬆️  Enviando: ${key}`);

      try {
        execSync(
          `npx wrangler r2 object put "${BUCKET}${key}" --file="${fullPath}" --remote`,
          { stdio: 'inherit' }
        );
        console.log(`✅ OK: ${key}\n`);
        ok++;
      } catch (e) {
        console.error(`❌ Erro: ${key}\n`);
        erro++;
      }
    }
  }
}

upload(BASE);

console.log(`\n🏁 Concluído!`);
console.log(`✅ Enviados: ${ok}`);
console.log(`⏭️  Pulados (ficam na public): ${pulado}`);
console.log(`❌ Erros: ${erro}`);