// backend/worker/src/utils/cors.js

const allowedOrigins = [
  // DEV
  'http://localhost:5173',
  'http://localhost:4173',

  // DOMÍNIO REAL
  'https://www.santuariodefatima.com.br',
  'https://santuariodefatima.com.br',

  // Workers
  'https://santuariodefatima.oibreccio.workers.dev',
  'https://santuariodefatima.oibreccio.workers.dev',
];

const baseHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const corsHeaders = {
  ...baseHeaders,
  'Access-Control-Allow-Origin': '*',
};

export function getCorsHeaders(origin) {
  if (!origin) {
    return { ...baseHeaders, 'Access-Control-Allow-Origin': '*' };
  }

  if (allowedOrigins.includes(origin)) {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    };
  }

  return {
    ...baseHeaders,
    'Access-Control-Allow-Origin': 'null',
  };
}

export function handleCorsOptions(request) {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin');
    return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
  }
  return null;
}

export function addCorsHeaders(response, request) {
  const origin = request.headers.get('Origin');
  const headers = getCorsHeaders(origin);
  const newResponse = new Response(response.body, response);
  Object.entries(headers).forEach(([k, v]) => newResponse.headers.set(k, v));
  return newResponse;
}