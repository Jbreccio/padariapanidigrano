// migrate-dev-to-prod.js
// Uso: node migrate-dev-to-prod.js
// Coloque em: backend/worker/

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';

const KVS = [
  {
    nome: 'KV_LITURGIA — momentos litúrgicos',
    chave: 'momentos',
    devId: '48754d29671b4e48a001947961fdc051',
    prodId: '2102f38f6c264837b68601f3e4032873',
  },
  {
    nome: 'KV_FILES — carrossel',
    chave: 'santuario_carrossel',
    devId: '2d99aa7af87b463f811fd65626fa8a75',
    prodId: 'd818d7cdfba3444dbef86e7764ab7275',
  },
  {
    nome: 'KV_FILES — popups',
    chave: 'santuario_popups',
    devId: '2d99aa7af87b463f811fd65626fa8a75',
    prodId: 'd818d7cdfba3444dbef86e7764ab7275',
  },
  {
    nome: 'KV_FILES — recados',
    chave: 'santuario_recados',
    devId: '2d99aa7af87b463f811fd65626fa8a75',
    prodId: 'd818d7cdfba3444dbef86e7764ab7275',
  },
  {
    nome: 'KV_MISSAS — horários de missas',
    chave: 'horariosMissas',
    devId: 'd13dc3c0458d4a8ca601cbb579bef388',
    prodId: 'f7ea3a01334c4cc29b48ac6ac3d07506',
  },
  {
    // ✅ FIX: chave correta é 'live_manual' (não 'youtube_live')
    nome: 'KV_YOUTUBE_STORAGE — youtube live',
    chave: 'live_manual',
    devId: 'e50693648a1646b1b717f14a9b025ef1',
    prodId: 'b5b9197948214f71a5805cbb9d64973d',
  },
];

function kvGet(namespaceId, chave) {
  try {
    const result = execSync(
      `npx wrangler kv key get "${chave}" --namespace-id=${namespaceId} --remote`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    if (!result || result.includes('Value not found')) return null;
    return result;
  } catch {
    return null;
  }
}

function kvPut(namespaceId, chave, valor) {
  const tmpFile = `_migrate_tmp_${Date.now()}.json`;
  writeFileSync(tmpFile, valor, 'utf-8');
  try {
    execSync(
      `npx wrangler kv key put "${chave}" --path=${tmpFile} --namespace-id=${namespaceId} --remote`,
      { encoding: 'utf-8', stdio: 'inherit' }
    );
  } finally {
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
  }
}

async function migrar() {
  console.log('\n🚀 MIGRAÇÃO DEV → PRODUÇÃO');
  console.log('══════════════════════════════════════════════\n');

  let ok = 0, vazio = 0, erro = 0;

  for (const kv of KVS) {
    console.log(`📦 ${kv.nome}`);
    console.log(`   Chave: "${kv.chave}"`);
    process.stdout.write(`   Lendo do DEV... `);

    const valor = kvGet(kv.devId, kv.chave);

    if (!valor) {
      console.log('⚠️  vazio — pulando\n');
      vazio++;
      continue;
    }

    try { JSON.parse(valor); } catch {
      console.log('❌ JSON inválido — pulando\n');
      erro++;
      continue;
    }

    const preview = valor.length > 100 ? valor.substring(0, 100) + '...' : valor;
    console.log(`✅ ok (${valor.length} chars)`);
    console.log(`   ${preview}`);

    process.stdout.write(`   Salvando na PRODUÇÃO... `);
    try {
      kvPut(kv.prodId, kv.chave, valor);
      console.log('✅ salvo!\n');
      ok++;
    } catch (e) {
      console.log(`❌ erro: ${e.message}\n`);
      erro++;
    }
  }

  console.log('══════════════════════════════════════════════');
  console.log(`✅ Migrados: ${ok}  ⚠️  Vazios: ${vazio}  ❌ Erros: ${erro}`);

  if (ok > 0) {
    console.log('\n🎯 Agora pode fazer o deploy:');
    console.log('   1. npx wrangler deploy');
    console.log('   2. npm run build  (na pasta do frontend)');
    console.log('   3. Upload da pasta dist/ para a Hostinger');
    console.log('   4. npx cap sync android');
    console.log('   5. npx cap open android → Build & Run no Android Studio\n');
  } else {
    console.log('\n⚠️  Nenhum dado migrado.');
    console.log('   → Salve os dados pelo painel admin (localhost:5173) primeiro');
    console.log('   → Depois rode: node migrate-dev-to-prod.js');
    console.log('💡 Dica: rode o comando abaixo para build + sync automático:');
    console.log('   cd ../frontend && npm run build && npx cap sync android\n');
  }
}

migrar().catch(console.error);