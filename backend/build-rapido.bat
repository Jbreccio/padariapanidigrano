@echo off
echo ===================================
echo 🚀 BUILD RÁPIDO - SANTUÁRIO DE FÁTIMA
echo ===================================
echo.

echo 1. 📦 Instalando dependências...
call npm install --only=production
if errorlevel 1 (
    echo ❌ Erro na instalação!
    pause
    exit /b 1
)

echo ✅ Dependências instaladas
echo.

echo 2. 🧪 Testes RÁPIDOS (30 segundos)...
echo.

REM Teste mínimo do banco
echo Testando banco...
node -e "
const mysql = require('mysql2/promise');
async function test() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'srv1197.hstgr.io',
      user: process.env.DB_USER || 'u102885649_Beto_DEV',
      password: process.env.DB_PASSWORD || 'Fatima2026riquiza',
      database: process.env.DB_NAME || 'u102885649_SNSFatima',
      port: process.env.DB_PORT || 3306
    });
    const [result] = await pool.query('SELECT 1 as ok');
    console.log('✅ Banco: OK');
    await pool.end();
  } catch (err) {
    console.log('❌ Banco ERRO:', err.message);
    process.exit(1);
  }
}
test();
"
if errorlevel 1 (
    echo ❌ Banco falhou! Verifique .env
    pause
    exit /b 1
)

echo ✅ Banco conectado
echo.

echo 3. 🚀 Iniciando servidor EM PRODUÇÃO...
echo.
echo ⚠️  ATENÇÃO: Modo produção ativado!
echo    - Erros serão escondidos
echo    - Logs limitados  
echo    - Performance máxima
echo.

set NODE_ENV=production
call npm start

echo.
echo 🎉 Servidor em produção: http://localhost:3000
echo 📊 Health: http://localhost:3000/api/health
pause