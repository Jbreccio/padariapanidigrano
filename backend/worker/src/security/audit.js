export async function logAccess(env, data) {
  try {
    await env.DB.prepare(`
      INSERT INTO access_logs (
        user_type,
        user_id,
        user_email,
        ip_address,
        user_agent,
        login_time,
        attempt_success,
        failure_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.user_type,
      data.user_id,
      data.user_email,
      data.ip,
      data.user_agent,
      Date.now(),
      data.success ? 1 : 0,
      data.reason || null
    ).run();
  } catch (e) {
    console.error('logAccess error', e);
  }
}