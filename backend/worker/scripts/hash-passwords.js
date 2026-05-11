// backend/worker/scripts/hash-passwords.js
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho correto para a pasta data (estamos em backend/worker/scripts, então voltamos uma pasta)
const dataDir = path.resolve(__dirname, '..', 'data');
console.log('📁 Pasta data:', dataDir);

// Garantir que a pasta existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Pasta data criada!');
}

// Caminho do banco de dados
const dbPath = path.join(dataDir, 'pani.db');
console.log('📁 Banco de dados:', dbPath);

// Verificar se a pasta existe
console.log('📁 Pasta data existe?', fs.existsSync(dataDir));
console.log('📁 Banco existe?', fs.existsSync(dbPath));

// Conectar ao banco (se não existir, cria)
const db = new Database(dbPath);
console.log('✅ Conectado ao banco com sucesso!');

// Função para gerar hash bcrypt
function gerarHash(senha) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(senha, salt);
}

// Dados dos usuários
const usuarios = [
  {
    id: randomUUID(),
    nome: "Oibreccio Admin",
    email: "oibreccio@gmail.com",
    senha_plana: "QWERT@#$%beto79",
    role: "admin",
    celular: "11999999999"
  },
  {
    id: randomUUID(),
    nome: "Pani Di Grano",
    email: "panibolosepaes@gmail.com",
    senha_plana: "ninapani@2026",
    role: "admin",
    celular: "11940566647"
  }
];

// Criar tabela se não existir
console.log('\n📝 Verificando/Criando tabela users...');

const tableExists = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name='users'
`).get();

if (!tableExists) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      celular TEXT,
      role TEXT DEFAULT 'cliente',
      twofa_enabled INTEGER DEFAULT 0,
      twofa_secret TEXT,
      backup_codes TEXT,
      login_pin TEXT,
      login_pin_expires INTEGER,
      failed_attempts INTEGER DEFAULT 0,
      locked_until INTEGER DEFAULT 0,
      failed_2fa_attempts INTEGER DEFAULT 0,
      twofa_locked_until INTEGER DEFAULT 0,
      token_hash TEXT,
      token_expires INTEGER,
      last_login_at INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
      token TEXT,
      last_user_agent TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
  console.log('✅ Tabela "users" criada!');
} else {
  console.log('✅ Tabela "users" já existe!');
}

// Inserir usuários
console.log('\n🚀 Inserindo/Atualizando usuários...\n');

for (const usuario of usuarios) {
  const senhaHash = gerarHash(usuario.senha_plana);
  const now = Math.floor(Date.now() / 1000);
  
  // Verificar se usuário já existe
  const existe = db.prepare('SELECT id FROM users WHERE email = ?').get(usuario.email);
  
  if (existe) {
    console.log(`🔄 Atualizando: ${usuario.email}`);
    db.prepare(`
      UPDATE users SET 
        nome = ?, 
        senha_hash = ?, 
        role = ?, 
        celular = ?,
        updated_at = ?
      WHERE email = ?
    `).run(usuario.nome, senhaHash, usuario.role, usuario.celular, now, usuario.email);
    console.log(`   ✅ Atualizado!`);
  } else {
    console.log(`📝 Criando: ${usuario.email}`);
    db.prepare(`
      INSERT INTO users (
        id, nome, email, senha_hash, celular, role, 
        twofa_enabled, failed_attempts, locked_until, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      usuario.id, usuario.nome, usuario.email, senhaHash, 
      usuario.celular, usuario.role, 0, 0, 0, now, now
    );
    console.log(`   ✅ Criado!`);
  }
  console.log(`   Senha: ${usuario.senha_plana}`);
  console.log(`   Hash: ${senhaHash.substring(0, 50)}...\n`);
}

// Listar todos os usuários
console.log('📋 Usuários no banco:');
const todosUsuarios = db.prepare('SELECT id, nome, email, role FROM users').all();
console.table(todosUsuarios);

console.log('\n✨ PRONTO! Agora você pode fazer login com:\n');
console.log('1️⃣ Email: oibreccio@gmail.com');
console.log('   Senha: QWERT@#$%beto79\n');
console.log('2️⃣ Email: panibolosepaes@gmail.com');
console.log('   Senha: ninapani@2026\n');

db.close();
console.log('🔒 Banco fechado.');