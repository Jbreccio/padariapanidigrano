// backend/src/routes/userRoutes.js
import express from 'express';
import { query, execute } from '../config/database.js';
import { put } from '../config/r2.js';
import authMiddleware from '../middleware/auth.js';
import { AVATAR_CATEGORIES, generateInitialAvatar } from '../data/avatars.js';

const router = express.Router();

// ============================================
// PERFIL DO USUÁRIO
// ============================================

// GET /api/user/profile - Buscar perfil completo
router.get('/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await query(`
      SELECT id, nome, email, telefone, pastoral, tema_cor, tema_imagem_fundo,
             foto_perfil, avatar_tipo, avatar_predefinido_id, created_at
      FROM fielusers 
      WHERE id = ?
    `, [req.user.id]);
    
    // Buscar saldo da carteira
    const wallet = await query(`
      SELECT saldo FROM wallet WHERE user_id = ?
    `, [req.user.id]);
    
    // Contar favoritos
    const [musicsCount, versesCount, prayersCount, photosCount] = await Promise.all([
      query('SELECT COUNT(*) as total FROM favorite_musics WHERE user_id = ?', [req.user.id]),
      query('SELECT COUNT(*) as total FROM favorite_verses WHERE user_id = ?', [req.user.id]),
      query('SELECT COUNT(*) as total FROM favorite_prayers WHERE user_id = ?', [req.user.id]),
      query('SELECT COUNT(*) as total FROM gallery_photos WHERE user_id = ?', [req.user.id])
    ]);
    
    res.json({
      ...user[0],
      saldo: wallet[0]?.saldo || 0,
      estatisticas: {
        musicas: musicsCount[0]?.total || 0,
        versiculos: versesCount[0]?.total || 0,
        oracoes: prayersCount[0]?.total || 0,
        fotos: photosCount[0]?.total || 0
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PUT /api/user/profile - Atualizar perfil
router.put('/user/profile', authMiddleware, async (req, res) => {
  try {
    const { nome, telefone, pastoral, temaCor, temaImagemFundo } = req.body;
    
    const updates = [];
    const values = [];
    
    if (nome !== undefined) { updates.push('nome = ?'); values.push(nome); }
    if (telefone !== undefined) { updates.push('telefone = ?'); values.push(telefone); }
    if (pastoral !== undefined) { updates.push('pastoral = ?'); values.push(pastoral); }
    if (temaCor !== undefined) { updates.push('tema_cor = ?'); values.push(temaCor); }
    if (temaImagemFundo !== undefined) { updates.push('tema_imagem_fundo = ?'); values.push(temaImagemFundo); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar' });
    }
    
    values.push(req.user.id);
    await execute(`UPDATE fielusers SET ${updates.join(', ')} WHERE id = ?`, values);
    
    res.json({ message: 'Perfil atualizado' });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ============================================
// AVATARES
// ============================================

// GET /api/user/avatar/categories - Listar categorias de avatares
router.get('/user/avatar/categories', authMiddleware, async (req, res) => {
  res.json(AVATAR_CATEGORIES);
});

// POST /api/user/avatar/predefined - Usar avatar pré-definido
router.post('/user/avatar/predefined', authMiddleware, async (req, res) => {
  try {
    const { categoriaId, avatarId } = req.body;
    
    // Buscar URL do avatar pré-definido
    const category = AVATAR_CATEGORIES[categoriaId];
    const avatar = category?.find(a => a.id === avatarId);
    
    if (!avatar) {
      return res.status(400).json({ error: 'Avatar não encontrado' });
    }
    
    await execute(`
      UPDATE fielusers 
      SET foto_perfil = ?, avatar_tipo = 'predefinido', avatar_predefinido_id = ?
      WHERE id = ?
    `, [avatar.url, avatarId, req.user.id]);
    
    res.json({ avatar: avatar.url });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/user/avatar/upload - Upload de avatar personalizado
router.post('/user/avatar/upload', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body; // base64
    
    // Validar tamanho
    const matches = avatar.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Formato de imagem inválido' });
    }
    
    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.length > 500 * 1024) {
      return res.status(400).json({ error: 'Imagem muito grande. Máximo 500KB' });
    }
    
    // Upload para R2
    const key = `avatars/${req.user.id}_${Date.now()}.jpg`;
    const url = await put(key, avatar);
    
    // Salvar no D1
    await execute(`
      UPDATE fielusers 
      SET foto_perfil = ?, avatar_tipo = 'upload', avatar_predefinido_id = NULL
      WHERE id = ?
    `, [url, req.user.id]);
    
    res.json({ avatar: url });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao fazer upload' });
  }
});

// POST /api/user/avatar/initials - Gerar avatar com iniciais
router.post('/user/avatar/initials', authMiddleware, async (req, res) => {
  try {
    const user = await query('SELECT nome FROM fielusers WHERE id = ?', [req.user.id]);
    const avatarUrl = generateInitialAvatar(user[0].nome);
    
    await execute(`
      UPDATE fielusers 
      SET foto_perfil = ?, avatar_tipo = 'inicial', avatar_predefinido_id = NULL
      WHERE id = ?
    `, [avatarUrl, req.user.id]);
    
    res.json({ avatar: avatarUrl });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ============================================
// MÚSICAS FAVORITAS (SPOTIFY)
// ============================================

// GET /api/user/favorite-musics - Listar músicas favoritas
router.get('/user/favorite-musics', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const musics = await query(`
      SELECT id, spotify_id, music_name, artist_name, album_name, 
             cover_url, preview_url, duration_ms, created_at
      FROM favorite_musics 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), parseInt(offset)]);
    
    const total = await query(`
      SELECT COUNT(*) as total FROM favorite_musics WHERE user_id = ?
    `, [req.user.id]);
    
    res.json({
      data: musics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0]?.total || 0,
        pages: Math.ceil((total[0]?.total || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/user/favorite-musics - Adicionar música favorita
router.post('/user/favorite-musics', authMiddleware, async (req, res) => {
  try {
    const { spotifyId, musicName, artistName, albumName, coverUrl, previewUrl, durationMs } = req.body;
    
    // Verificar duplicado
    const existing = await query(`
      SELECT id FROM favorite_musics 
      WHERE user_id = ? AND spotify_id = ?
    `, [req.user.id, spotifyId]);
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Música já está nos favoritos' });
    }
    
    await execute(`
      INSERT INTO favorite_musics 
      (user_id, spotify_id, music_name, artist_name, album_name, cover_url, preview_url, duration_ms) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, spotifyId, musicName, artistName, albumName, coverUrl, previewUrl, durationMs]);
    
    res.status(201).json({ message: 'Adicionado aos favoritos' });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/user/favorite-musics/:spotifyId - Remover música favorita
router.delete('/user/favorite-musics/:spotifyId', authMiddleware, async (req, res) => {
  try {
    await execute(`
      DELETE FROM favorite_musics 
      WHERE user_id = ? AND spotify_id = ?
    `, [req.user.id, req.params.spotifyId]);
    
    res.json({ message: 'Removido dos favoritos' });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ============================================
// FAVORITOS DA BÍBLIA
// ============================================

// GET /api/user/favorite-verses - Listar versículos favoritos
router.get('/user/favorite-verses', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, livro } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT id, livro, capitulo, versiculo, texto, nota_pessoal, created_at
      FROM favorite_verses 
      WHERE user_id = ?
    `;
    const params = [req.user.id];
    
    if (livro) {
      sql += ' AND livro = ?';
      params.push(livro);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const verses = await query(sql, params);
    
    const total = await query(`
      SELECT COUNT(*) as total FROM favorite_verses WHERE user_id = ?
    `, [req.user.id]);
    
    res.json({
      data: verses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0]?.total || 0
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/user/favorite-verses - Adicionar versículo favorito
router.post('/user/favorite-verses', authMiddleware, async (req, res) => {
  try {
    const { livro, capitulo, versiculo, texto, notaPessoal } = req.body;
    
    await execute(`
      INSERT INTO favorite_verses (user_id, livro, capitulo, versiculo, texto, nota_pessoal) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.user.id, livro, capitulo, versiculo, texto, notaPessoal]);
    
    res.status(201).json({ message: 'Adicionado aos favoritos' });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/user/favorite-verses/:id - Remover versículo favorito
router.delete('/user/favorite-verses/:id', authMiddleware, async (req, res) => {
  try {
    await execute(`
      DELETE FROM favorite_verses 
      WHERE id = ? AND user_id = ?
    `, [req.params.id, req.user.id]);
    
    res.json({ message: 'Removido dos favoritos' });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ============================================
// ORAÇÕES FAVORITAS
// ============================================

// GET /api/user/favorite-prayers - Listar orações favoritas
router.get('/user/favorite-prayers', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const prayers = await query(`
      SELECT id, titulo, texto, categoria, created_at
      FROM favorite_prayers 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), parseInt(offset)]);
    
    const total = await query(`
      SELECT COUNT(*) as total FROM favorite_prayers WHERE user_id = ?
    `, [req.user.id]);
    
    res.json({
      data: prayers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0]?.total || 0
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/user/favorite-prayers - Adicionar oração favorita
router.post('/user/favorite-prayers', authMiddleware, async (req, res) => {
  try {
    const { titulo, texto, categoria } = req.body;
    
    await execute(`
      INSERT INTO favorite_prayers (user_id, titulo, texto, categoria) 
      VALUES (?, ?, ?, ?)
    `, [req.user.id, titulo, texto, categoria]);
    
    res.status(201).json({ message: 'Adicionado aos favoritos' });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/user/favorite-prayers/:id - Remover oração favorita
router.delete('/user/favorite-prayers/:id', authMiddleware, async (req, res) => {
  try {
    await execute(`
      DELETE FROM favorite_prayers 
      WHERE id = ? AND user_id = ?
    `, [req.params.id, req.user.id]);
    
    res.json({ message: 'Removido dos favoritos' });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ============================================
// GALERIA DE FOTOS (EVENTOS)
// ============================================

// GET /api/user/gallery - Listar fotos da galeria
router.get('/user/gallery', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const photos = await query(`
      SELECT id, titulo, descricao, url, evento, data_evento, created_at
      FROM gallery_photos 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), parseInt(offset)]);
    
    const total = await query(`
      SELECT COUNT(*) as total FROM gallery_photos WHERE user_id = ?
    `, [req.user.id]);
    
    res.json({
      data: photos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0]?.total || 0
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/user/gallery - Adicionar foto à galeria
router.post('/user/gallery', authMiddleware, async (req, res) => {
  try {
    const { titulo, descricao, foto, evento, dataEvento } = req.body;
    
    // Validar tamanho
    const matches = foto.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Formato de imagem inválido' });
    }
    
    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.length > 2 * 1024 * 1024) { // 2MB
      return res.status(400).json({ error: 'Imagem muito grande. Máximo 2MB' });
    }
    
    // Upload para R2
    const key = `gallery/${req.user.id}_${Date.now()}.jpg`;
    const url = await put(key, foto);
    
    await execute(`
      INSERT INTO gallery_photos (user_id, titulo, descricao, url, evento, data_evento) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.user.id, titulo, descricao, url, evento, dataEvento]);
    
    res.status(201).json({ message: 'Foto adicionada', url });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/user/gallery/:id - Remover foto da galeria
router.delete('/user/gallery/:id', authMiddleware, async (req, res) => {
  try {
    // Buscar URL da foto para deletar do R2
    const photo = await query(`
      SELECT url FROM gallery_photos WHERE id = ? AND user_id = ?
    `, [req.params.id, req.user.id]);
    
    if (photo.length > 0 && photo[0].url) {
      // Extrair key da URL
      const key = photo[0].url.split('/').pop();
      // Deletar do R2 (implementar)
    }
    
    await execute(`
      DELETE FROM gallery_photos WHERE id = ? AND user_id = ?
    `, [req.params.id, req.user.id]);
    
    res.json({ message: 'Foto removida' });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ============================================
// PASTORAIS
// ============================================

// GET /api/user/pastorais - Listar pastorais disponíveis
router.get('/user/pastorais', async (req, res) => {
  const pastorais = [
    'Não participo',
    'Coroinhas',
    'Catequese',
    'Música',
    'Dízimo',
    'Liturgia',
    'Acolhida',
    'Pastoral Familiar',
    'Pastoral da Criança',
    'Terço dos Homens',
    'Pastoral da Saúde',
    'Pastoral da Comunicação',
    'Pastoral Carcerária',
    'Pastoral da Juventude',
    'Pastoral da Sobriedade',
    'Pastoral do Dízimo',
    'Pastoral da Esperança',
    'Pastoral dos Coroinhas',
    'Pastoral dos Ministros',
    'Pastoral do Batismo',
    'Pastoral do Matrimônio'
  ];
  
  res.json(pastorais);
});

// ============================================
// CARTEIRA E PEDIDOS
// ============================================

// GET /api/user/wallet - Buscar saldo da carteira
router.get('/user/wallet', authMiddleware, async (req, res) => {
  try {
    const wallet = await query(`
      SELECT saldo, total_compras, total_creditos, updated_at
      FROM wallet WHERE user_id = ?
    `, [req.user.id]);
    
    if (wallet.length === 0) {
      await execute(`
        INSERT INTO wallet (user_id, saldo) VALUES (?, 0)
      `, [req.user.id]);
      return res.json({ saldo: 0, total_compras: 0, total_creditos: 0 });
    }
    
    res.json(wallet[0]);
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/user/orders - Listar pedidos
router.get('/user/orders', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const orders = await query(`
      SELECT id, itens, total, status, qr_code, pagamento_tipo, created_at
      FROM orders 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), parseInt(offset)]);
    
    const total = await query(`
      SELECT COUNT(*) as total FROM orders WHERE user_id = ?
    `, [req.user.id]);
    
    res.json({
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0]?.total || 0
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/user/order - Criar novo pedido
router.post('/user/order', authMiddleware, async (req, res) => {
  try {
    const { itens, total, pagamentoTipo } = req.body;
    const user = await query('SELECT nome FROM fielusers WHERE id = ?', [req.user.id]);
    
    // Gerar QR Code (simplificado)
    const orderId = Date.now().toString();
    const qrCode = `pedido_${orderId}_${req.user.id}`;
    
    await execute(`
      INSERT INTO orders (user_id, usuario_nome, itens, total, qr_code, pagamento_tipo) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.user.id, user[0].nome, JSON.stringify(itens), total, qrCode, pagamentoTipo]);
    
    res.status(201).json({ 
      message: 'Pedido criado',
      orderId,
      qrCode
    });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;