#!/bin/bash
# Script de backup seguro

BACKUP_DIR="/home/user/backups"
DB_NAME="u102885649_SNSFatima"
DB_USER="u102885649_Beto_DEV"
DB_PASS="Fatima2026riquiza"
DB_HOST="srv1197.hstgr.io"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Data atual
DATE=$(date +%Y%m%d_%H%M%S)

# 1. Backup do banco de dados com criptografia
echo "🔐 Criando backup criptografado do banco..."
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME \
  | gpg --batch --yes --passphrase "$ENCRYPTION_PASSWORD" \
  --symmetric --cipher-algo AES256 \
  > $BACKUP_DIR/db_backup_$DATE.sql.gpg

# 2. Backup dos arquivos do projeto
echo "📁 Compactando arquivos do projeto..."
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
  --exclude="node_modules" \
  --exclude=".env" \
  --exclude="logs" \
  /home/user/backend

# 3. Backup dos logs (últimos 7 dias)
echo "📝 Backup dos logs..."
find /home/user/backend/logs -name "*.log" -mtime -7 \
  -exec tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz {} +

# 4. Backup do .env criptografado
echo "🔒 Backup do .env criptografado..."
gpg --batch --yes --passphrase "$ENCRYPTION_PASSWORD" \
  --symmetric --cipher-algo AES256 \
  -c /home/user/backend/.env.production \
  > $BACKUP_DIR/env_backup_$DATE.gpg

# 5. Manter apenas últimos 30 backups
echo "🧹 Limpando backups antigos..."
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.gpg" -mtime +30 -delete

# 6. Log do backup
echo "✅ Backup concluído: $BACKUP_DIR/backup_$DATE.tar.gz.gpg"
echo "$DATE: Backup realizado com sucesso" >> $BACKUP_DIR/backup.log

# 7. Enviar notificação (opcional)
curl -X POST -H "Content-Type: application/json" \
  -d '{"text":"Backup do Santuário de Fátima realizado com sucesso"}' \
  https://hooks.slack.com/services/XXX/YYY/ZZZ