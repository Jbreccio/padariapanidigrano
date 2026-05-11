export async function cleanupOldCandles(env) {
  try {
    if (!env.DB) return;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare(`UPDATE velas SET status = 0 WHERE data < ? AND status = 1`).bind(sevenDaysAgo).run();
  } catch (error) {
    console.error("Erro na limpeza de velas:", error);
  }
}

export async function backupOldPrayers(env) {
  try {
    if (!env.DB) return;
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare(`DELETE FROM prayer WHERE created_at < ?`).bind(sixtyDaysAgo).run();
  } catch (error) {
    console.error("Erro ao limpar pedidos:", error);
  }
}