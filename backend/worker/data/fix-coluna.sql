ALTER TABLE users ADD COLUMN telefone TEXT;
UPDATE users SET telefone = celular;