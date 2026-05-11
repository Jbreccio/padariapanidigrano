// ============================================
// 🕒 UTILITÁRIOS DE TEMPO
// ============================================

export function now() {
  return Date.now();
}

export function addMinutes(minutes) {
  return Date.now() + minutes * 60 * 1000;
}

export function addHours(hours) {
  return Date.now() + hours * 60 * 60 * 1000;
}

export function addDays(days) {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

export function isExpired(timestamp) {
  return !timestamp || Date.now() > timestamp;
}

export function secondsFromNow(seconds) {
  return Date.now() + seconds * 1000;
}

export function formatISO(date = new Date()) {
  return date.toISOString();
}

export function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'agora';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;

  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}