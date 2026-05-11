// src/security/challenge-store.js

export async function saveChallenge(env, key, data, ttl = 300) {
  if (!env.SECURITY_KV) return;

  await env.SECURITY_KV.put(
    `challenge:${key}`,
    JSON.stringify(data),
    { expirationTtl: ttl }
  );
}

export async function getChallenge(env, key) {
  if (!env.SECURITY_KV) return null;

  const data = await env.SECURITY_KV.get(`challenge:${key}`, 'json');
  return data;
}

export async function deleteChallenge(env, key) {
  if (!env.SECURITY_KV) return;

  await env.SECURITY_KV.delete(`challenge:${key}`);
}