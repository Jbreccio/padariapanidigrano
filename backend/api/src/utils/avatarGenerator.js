// backend/api/src/utils/avatarGenerator.js

/**
 * Gera um avatar baseado no nome (iniciais + cor fixa)
 */

export const generateAvatar = (name = '') => {
  const initials = getInitials(name);
  const color = generateColorFromString(name);

  return {
    type: 'initial',
    initials,
    color
  };
};

/**
 * Pega iniciais do nome
 */
const getInitials = (name) => {
  if (!name) return 'U';

  const parts = name.trim().split(' ');

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return (
    parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
};

/**
 * Gera cor fixa baseada no nome (hash)
 */
const generateColorFromString = (str) => {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#A29BFE',
    '#FD79A8',
    '#00B894'
  ];

  return colors[Math.abs(hash) % colors.length];
};