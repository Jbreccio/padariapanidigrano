#!/bin/bash
# Restauração segura de backup

BACKUP_FILE=$1
ENCRYPTION_PASSWORD=$2

if [ -z "$BACKUP_FILE" ] || [ -z "$ENCRYPTION_PASSWORD" ]; then
  echo "Uso: $0 <arquivo_backup> <senha_criptografia>"
  exit 1
fi

echo "🔄 Iniciando restauração..."

# Descriptografar e restaurar banco
gpg --batch --passphrase "$ENCRYPTION_PASSWORD" \
  --decrypt $BACKUP_FILE/db_backup_*.sql.gpg \
  | mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME

echo "✅ Banco de dados restaurado"

# Restaurar arquivos
tar -xzf $BACKUP_FILE/app_backup_*.tar.gz -C /

echo "✅ Arquivos do projeto restaurados"

# Restaurar .env
gpg --batch --passphrase "$ENCRYPTION_PASSWORD" \
  --decrypt $BACKUP_FILE/env_backup_*.gpg \
  > /home/user/backend/.env.production

echo "✅ Configurações restauradas"
echo "🎉 Restauração completa! Reinicie o servidor."