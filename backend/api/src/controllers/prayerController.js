import pool from '../config/database.js';
import { sendPrayerRequestEmail } from '../config/emailConfig.js';

// Função para calcular timestamp
const calculateTimestamp = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInMs = now.getTime() - created.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? 'Agora' : `${diffInMinutes} min`;
    }
    return `${diffInHours}h`;
  } else if (diffInDays === 1) {
    return 'Ontem';
  } else if (diffInDays < 7) {
    return `${diffInDays} dias`;
  }
  return '7 dias';
};

// GET /api/candles - Buscar velas dos últimos 7 dias
export const getCandles = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, intention, city_state as cityState, 
             created_at as createdAt 
      FROM candles 
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC 
      LIMIT 50
    `);
    
    // Calcular timestamps
    const candles = rows.map(candle => ({
      ...candle,
      timestamp: calculateTimestamp(candle.createdAt)
    }));
    
    res.json({
      success: true,
      candles,
      count: rows.length
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar velas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar velas'
    });
  }
};

// POST /api/prayer-request - Enviar pedido de oração (COM email)
export const createPrayerRequest = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { name, email, prayerRequest } = req.body;
    
    console.log('📝 Pedido de oração recebido:', { name, email });
    
    // 1. Salvar pedido de oração
    const [prayerResult] = await connection.query(
      `INSERT INTO prayer_requests (name, email, prayer_request) VALUES (?, ?, ?)`,
      [name, email, prayerRequest]
    );
    
    // 2. Criar vela associada
    const candleIntention = prayerRequest.length > 30 
      ? prayerRequest.substring(0, 30) + '...' 
      : prayerRequest;
    
    const [candleResult] = await connection.query(
      `INSERT INTO candles (name, intention, city_state) VALUES (?, ?, ?)`,
      [name || 'Anônimo', candleIntention, 'Oração pessoal\nLocal não informado']
    );
    
    await connection.commit();
    
    // 3. Enviar email (não bloqueia a resposta)
    if (email) {
      sendPrayerRequestEmail({ name, email, prayerRequest })
        .then(() => console.log('✅ Email enviado para:', email))
        .catch(err => console.warn('⚠️ Falha no email:', err.message));
    }
    
    // 4. Buscar vela criada para retornar
    const [candleRows] = await pool.query(
      `SELECT * FROM candles WHERE id = ?`,
      [candleResult.insertId]
    );
    
    const newCandle = {
      id: candleRows[0].id,
      name: candleRows[0].name,
      intention: candleRows[0].intention,
      cityState: candleRows[0].city_state,
      timestamp: "Agora",
      createdAt: candleRows[0].created_at
    };
    
    res.status(201).json({
      success: true,
      message: 'Pedido de oração enviado com sucesso!',
      candle: newCandle
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erro ao processar pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  } finally {
    connection.release();
  }
};

// POST /api/candle-lighting - Acender vela (SEM email)
export const createCandle = async (req, res) => {
  try {
    const { name, intention, city, state } = req.body;
    
    console.log('🕯️ Vela recebida:', { name, intention, city, state });
    
    const [result] = await pool.query(
      `INSERT INTO candles (name, intention, city_state) VALUES (?, ?, ?)`,
      [name || 'Anônimo', 'Quem acendeu?', `${intention}\n${city}, ${state}`]
    );
    
    // Buscar vela criada
    const [candleRows] = await pool.query(
      `SELECT * FROM candles WHERE id = ?`,
      [result.insertId]
    );
    
    const newCandle = {
      id: candleRows[0].id,
      name: candleRows[0].name,
      intention: candleRows[0].intention,
      cityState: candleRows[0].city_state,
      timestamp: "Agora",
      createdAt: candleRows[0].created_at
    };
    
    res.status(201).json({
      success: true,
      message: 'Vela acesa com sucesso!',
      candle: newCandle
    });
    
  } catch (error) {
    console.error('❌ Erro ao acender vela:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Função para limpar velas antigas (para cron job)
export const cleanupOldCandles = async () => {
  try {
    const [result] = await pool.query(`
      DELETE FROM candles 
      WHERE created_at <= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    console.log(`🧹 ${result.affectedRows} velas antigas removidas`);
    return result.affectedRows;
    
  } catch (error) {
    console.error('❌ Erro ao limpar velas:', error);
    return 0;
  }
};