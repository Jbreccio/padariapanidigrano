#!/bin/bash
# Deploy seguro na Hostinger

set -e # Parar em caso de erro

echo "🔐 Iniciando deploy seguro..."

# 1. Verificar variáveis de ambiente
if [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_USER" ]; then
  echo "❌ Variáveis de deploy não configuradas"
  exit 1
fi

# 2. Build seguro
echo "🏗️  Building projeto..."
npm ci --only=production
npm run build

# 3. Verificar vulnerabilidades
echo "🔍 Verificando vulnerabilidades..."
npm audit --production
npx snyk test

# 4. Remover arquivos sensíveis
echo "🧹 Limpando arquivos sensíveis..."
rm -f .env.development
rm -rf .git
find . -name "*.log" -delete

# 5. Deploy via rsync com SSH
echo "🚀 Enviando arquivos..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.git' \
  -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
  ./ $DEPLOY_USER@$DEPLOY_HOST:/home/user/backend/

# 6. Configurar permissões
echo "🔧 Configurando permissões..."
ssh $DEPLOY_USER@$DEPLOY_HOST "chmod 750 /home/user/backend"
ssh $DEPLOY_USER@$DEPLOY_HOST "chmod 640 /home/user/backend/.env.production"

# 7. Instalar dependências no servidor
echo "📦 Instalando dependências..."
ssh $DEPLOY_USER@$DEPLOY_HOST "cd /home/user/backend && npm ci --only=production"

# 8. Reiniciar com PM2
echo "🔄 Reiniciando aplicação..."
ssh $DEPLOY_USER@$DEPLOY_HOST "pm2 restart backend || pm2 start src/server.js --name backend"

echo "✅ Deploy seguro concluído!"
