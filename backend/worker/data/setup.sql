-- setup.sql
-- Cria as tabelas se não existirem (sem mexer nos dados existentes)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT,
  nome TEXT,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT,
  celular TEXT,
  role TEXT DEFAULT 'user',
  twofa_enabled INTEGER DEFAULT 0,
  twofa_secret TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS velas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  familia TEXT,
  cidade TEXT,
  estado TEXT,
  data TEXT,
  duracao INTEGER,
  status INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS prayer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT,
  pedido TEXT NOT NULL,
  cidade TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS fiel_dados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  musicas TEXT DEFAULT '[]',
  versiculos TEXT DEFAULT '[]',
  oracoes TEXT DEFAULT '[]',
  fotos TEXT DEFAULT '[]',
  termo_aceito INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

-- INSERE OS ADMINISTRADORES (SOMENTE SE NÃO EXISTIREM)
-- SEU REGISTRO JÁ EXISTE, ENTÃO NÃO VAI SOBRESCREVER!
INSERT OR IGNORE INTO users (nome, email, role, senha_hash, twofa_enabled, twofa_secret, created_at, updated_at) 
VALUES ('BetoBreccio', 'oibreccio@gmail.com', 'admin', 'QWERT@', 1, 'N2IHHP4VFPMG2NLK', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO users (nome, email, role, created_at, updated_at) 
VALUES ('Marcelo', 'marcelotscarlos@gmail.com', 'admin', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO users (nome, email, role, created_at, updated_at) 
VALUES ('Anderson', 'andersonmarinho011@gmail.com', 'admin', datetime('now'), datetime('now'));