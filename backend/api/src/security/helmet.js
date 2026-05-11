import helmet from 'helmet';

// Headers de segurança
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", // Apenas se necessário
        "https://www.youtube.com",
        "https://www.instagram.com",
        "https://*.facebook.com",
        "https://*.google.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "http:",
        "https://*.vaticannews.va",
        "https://*.youtube.com",
        "https://*.instagram.com",
        "https://*.wikipedia.org"
      ],
      connectSrc: [
        "'self'",
        "https://www.googleapis.com",
        "https://graph.instagram.com",
        "https://www.vaticannews.va",
        "https://*.wikipedia.org",
        "wss://*.santuariodefatima.net" // WebSockets
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: [
        "'self'",
        "https://www.youtube.com",
        "https://www.instagram.com",
        "https://*.facebook.com"
      ],
      mediaSrc: ["'self'", "https://*.vaticannews.va"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"], // Prevenir clickjacking
      upgradeInsecureRequests: process.env.NODE_ENV === 'production'
    }
  },
  
  // Outras proteções
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  
  xPoweredBy: false, // Esconder que é Node.js
  
  // Desabilitar features perigosas
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  
  // Proteção contra XSS
  xssFilter: true
});