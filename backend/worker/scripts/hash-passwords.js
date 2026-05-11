// backend/worker/scripts/hash-passwords.js
// Execute com: node hash-passwords.js
// ⚠️  Usa a mesma função sha256 do backend (crypto.subtle) para garantir hashes idênticos

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── ALTERE AS SENHAS AQUI SE NECESSÁRIO ───────────────────────────────────
const usuarios = [
  {
    nome: 'Beto Breccio',
    email: 'oibreccio@gmail.com',
    senha: 'QWERT@',          // ← senha atual que funciona
    role: 'admin',
    celular: '11999999999'
  },
  {
    nome: 'Marcelo',
    email: 'marcelotscarlos@gmail.com',
    senha: 'Marcelo@2025',    // ← senha que você vai passar para ele
    role: 'admin',
    celular: '11988888888'
  },
  {
    nome: 'Anderson Zamboni',
    email: 'andersonmarinho011@gmail.com',
    senha: 'Anderson@2025',   // ← senha que você vai passar para ele
    role: 'admin',
    celular: '11977777777'
  }
];
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔐 GERANDO HASHES SHA-256 (compatível com fiel_auth.js)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const sqlLines = [];

  for (const user of usuarios) {
    const hash = await sha256(user.senha);

    console.log(`📧  ${user.email}`);
    console.log(`👤  Nome    : ${user.nome}`);
    console.log(`🔑  Role    : ${user.role}`);
    console.log(`🔒  Senha   : ${user.senha}`);
    console.log(`🔐  Hash    : ${hash}`);
    console.log('───────────────────────────────────────────────────────────────\n');

    sqlLines.push(`-- ${user.nome} (${user.email})`);
    sqlLines.push(
      `UPDATE users SET senha_hash = '${hash}', role = '${user.role}', ` +
      `twofa_enabled = 0, twofa_secret = NULL, backup_codes = NULL, ` +
      `failed_attempts = 0, locked_until = 0, token_hash = NULL, token_expires = 0 ` +
      `WHERE LOWER(email) = '${user.email.toLowerCase()}';`
    );
    sqlLines.push('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 SQL PARA EXECUTAR NO D1 CONSOLE:');
  console.log('   (Cloudflare Dashboard → D1 → seu banco → Console)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(sqlLines.join('\n'));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ DEPOIS DE RODAR O SQL:');
  console.log('   1. Marcelo  → login com senha Marcelo@2025  → vai receber PIN → vai para QR 2FA');
  console.log('   2. Anderson → login com senha Anderson@2025 → vai receber PIN → vai para QR 2FA');
  console.log('   3. Ambos escaneiam o QR no Google Authenticator e finalizam o setup');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);