export async function salvarComBackup(env, kv, key, novoValor) {
  const atual = await kv.get(key);

  // 🚫 bloqueia vazio
  if (!novoValor || (Array.isArray(novoValor) && novoValor.length === 0)) {
    console.warn(`⚠️ Tentativa de salvar vazio em ${key}`);
    return { blocked: true };
  }

  // 💾 backup antes de salvar
  if (atual) {
    await env.BACKUP.put(`${key}_backup_${Date.now()}`, atual);
  }

  // 💽 salva novo
  await kv.put(key, JSON.stringify(novoValor));

  return { success: true };
}