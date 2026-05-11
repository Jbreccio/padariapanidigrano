// src/security/rules.js

export const BLOCKED_USER_AGENTS = [
  'sqlmap',
  'curl',
  'wget',
  'python-requests',
];

export const SUSPICIOUS_PATTERNS = [
  '<script>',
  'SELECT * FROM',
  'UNION SELECT',
  'DROP TABLE',
  '--',
  ' OR 1=1',
];

export function isUserAgentBlocked(userAgent = '') {
  const ua = userAgent.toLowerCase();
  return BLOCKED_USER_AGENTS.some(blocked => ua.includes(blocked));
}

export function hasSuspiciousInput(input = '') {
  const value = input.toLowerCase();
  return SUSPICIOUS_PATTERNS.some(pattern => value.includes(pattern.toLowerCase()));
}