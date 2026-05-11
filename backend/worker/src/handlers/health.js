import { jsonResponse } from '../utils/responses.js';

export async function handleHealth(request) {
  return jsonResponse({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
}