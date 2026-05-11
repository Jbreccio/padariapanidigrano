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

INSERT OR IGNORE INTO users (id, usuario, nome, email, senha_hash, celular, role, twofa_enabled, twofa_secret, created_at)
VALUES (1, 'admin', 'BetoBreccio', 'oibreccio@gmail.com', 'QWERT@', '11991016179', 'admin', 1, 'N2IHHP4VFPMG2NLK', '2026-02-24 15:38:13');

INSERT OR IGNORE INTO users (id, usuario, nome, email, senha_hash, celular, role, twofa_enabled, created_at)
VALUES (7, 'marcelotscarlos@gmail.com', 'Marcelo', 'marcelotscarlos@gmail.com', 'Cartola37', '11975109808', 'user', 0, '2026-02-28T00:46:56.151Z');

INSERT OR IGNORE INTO users (id, usuario, nome, email, senha_hash, celular, role, twofa_enabled, created_at)
VALUES (8, 'andersonmarinho011@gmail.com', 'Anderson Zamboni', 'andersonmarinho011@gmail.com', ',.poiuh12', '11964458817', 'user', 0, '2026-03-02T20:02:05.102Z');