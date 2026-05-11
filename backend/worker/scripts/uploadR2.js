import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// caminho absoluto correto (Windows seguro)
const __dirname = new URL('.', import.meta.url).pathname;
const dir = path.resolve(
  __dirname,
  '../../../../frontend/public/images/carrosselFotos'
);

// correção Windows (remove / inicial)
const finalDir = dir.replace(/^\/([A-Z]:)/, '$1');

console.log('📂 CAMINHO:', finalDir);
console.log('📁 EXISTE?', fs.existsSync(finalDir));

// 🔥 SE NÃO EXISTIR, PARA TUDO (evita loop infernal)
if (!fs.existsSync(finalDir)) {
  console.error('❌ PASTA NÃO ENCONTRADA!');
  process.exit(1);
}

function uploadDir(dirAtual) {
  const files = fs.readdirSync(dirAtual);

  for (const file of files) {
    const fullPath = path.join(dirAtual, file);

    if (fs.statSync(fullPath).isDirectory()) {
      uploadDir(fullPath);
    } else {
      const key = fullPath
        .split('public')[1]
        .replace(/\\/g, '/');

      console.log('⬆️ Enviando:', key);

      execSync(
        npx wrangler r2 object put santuariodefatima-imagens${key} --file="${fullPath}",
        { stdio: 'inherit' }
      );
    }
  }
}

uploadDir(finalDir);