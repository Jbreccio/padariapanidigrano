// backend/worker/src/services/adminService.js

export function isAdmin(user) {
  return user?.role === 'admin' || user?.role === 'fiel';
}

export function canAccessAdmin(user) {
  return isAdmin(user);
}