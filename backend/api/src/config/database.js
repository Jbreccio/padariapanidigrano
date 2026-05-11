import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Função para limpar velas antigas automaticamente
const cleanupOldCandles = async () => {
  try {
    const [result] = await pool.execute(`
      DELETE FROM candles 
      WHERE created_at <= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    console.log(`🧹 ${new Date().toISOString()} - ${result.affectedRows} velas antigas removidas`);
    
    // Também limpar pedidos de oração antigos
    const [prayerResult] = await pool.execute(`
      DELETE FROM prayer_requests 
      WHERE created_at <= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    console.log(`📝 ${prayerResult.affectedRows} pedidos antigos removidos`);
    
  } catch (error) {
    console.error('❌ Erro no cron job:', error);
  }
};

// Executar imediatamente e depois a cada 6 horas
cleanupOldCandles();
setInterval(cleanupOldCandles, 6 * 60 * 60 * 1000);

// Configuração para Hostinger MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'santuario_fatima',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true
  }
});

// Testar conexão
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL conectado com sucesso!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MySQL:', error.message);
    return false;
  }
};

export default pool;
