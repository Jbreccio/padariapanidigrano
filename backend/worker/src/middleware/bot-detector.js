export function detectBot(request) {
  try {
    if (!request || !request.headers) return false;

    const ua = request.headers.get('User-Agent') || '';

    if (!ua) return true;

    const patterns = [
      'bot', 'crawler', 'spider', 'scraper'
    ];

    return patterns.some(p => ua.toLowerCase().includes(p));

  } catch (err) {
    console.error('bot detector error:', err);
    return false;
  }
}