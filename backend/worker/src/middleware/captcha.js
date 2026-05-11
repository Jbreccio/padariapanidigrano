// src/middleware/captcha.js

/**
 * Verifica CAPTCHA (Google reCAPTCHA ou hCaptcha)
 */
export async function verifyCaptcha(context) {
  const { request, env } = context;
  
  // Tentar pegar token do body ou header
  let token = null;
  
  try {
    const body = await request.clone().json().catch(() => ({}));
    token = body.captchaToken || body['g-recaptcha-response'] || null;
  } catch (e) {}
  
  if (!token) {
    // Verificar se está em ambiente de desenvolvimento
    if (env.ENVIRONMENT === 'development') {
      return true; // Pula CAPTCHA em dev
    }
    return false;
  }
  
  // Usar reCAPTCHA v3 ou hCaptcha
  const secretKey = env.RECAPTCHA_SECRET_KEY || env.HCAPTCHA_SECRET_KEY;
  const verifyUrl = env.RECAPTCHA_SECRET_KEY 
    ? `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    : `https://hcaptcha.com/siteverify?secret=${secretKey}&response=${token}`;
  
  try {
    const response = await fetch(verifyUrl, { method: 'POST' });
    const data = await response.json();
    
    if (data.success && data.score >= 0.5) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar CAPTCHA:', error);
    return env.ENVIRONMENT === 'development'; // Pula em dev
  }
}