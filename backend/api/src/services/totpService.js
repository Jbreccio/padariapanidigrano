import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';

// Configurações do TOTP (Google Authenticator)
const TOTP_CONFIG = {
  issuer: process.env.TOTP_ISSUER || 'Santuário de Fátima',
  label: 'Santuário de Fátima',
  algorithm: 'sha1',
  digits: 6,
  step: parseInt(process.env.TOTP_STEP) || 30, // 30 segundos
  window: parseInt(process.env.TOTP_WINDOW) || 1, // 1 passo de tolerância
  encoding: 'base32'
};

export class TOTPManager {
  // Gerar novo secret para um usuário
  static generateSecret(email) {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `${TOTP_CONFIG.issuer} (${email})`,
      issuer: TOTP_CONFIG.issuer,
      algorithm: TOTP_CONFIG.algorithm
    });
    
    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
      ascii: secret.ascii,
      hex: secret.hex
    };
  }
  
  // Verificar código TOTP
  static verifyToken(secret, token, options = {}) {
    const verifyOptions = {
      secret: secret,
      encoding: TOTP_CONFIG.encoding,
      token: token,
      window: options.window || TOTP_CONFIG.window,
      step: options.step || TOTP_CONFIG.step,
      digits: options.digits || TOTP_CONFIG.digits,
      algorithm: options.algorithm || TOTP_CONFIG.algorithm
    };
    
    // Log para debug (apenas desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Verificando TOTP:', {
        secret: secret.substring(0, 10) + '...',
        token,
        window: verifyOptions.window
      });
    }
    
    const verified = speakeasy.totp.verify(verifyOptions);
    
    // Verificação alternativa se a primeira falhar (sync de tempo)
    if (!verified && TOTP_CONFIG.window > 0) {
      const currentTime = Math.floor(Date.now() / 1000);
      const tokenTime = speakeasy.totp({
        secret: secret,
        encoding: TOTP_CONFIG.encoding,
        time: currentTime
      });
      
      if (tokenTime === token) {
        console.log('⚠️  TOTP verificado com sync de tempo manual');
        return true;
      }
    }
    
    return verified;
  }
  
  // Gerar código atual (para testes)
  static generateCurrentToken(secret) {
    return speakeasy.totp({
      secret: secret,
      encoding: TOTP_CONFIG.encoding,
      digits: TOTP_CONFIG.digits,
      step: TOTP_CONFIG.step,
      algorithm: TOTP_CONFIG.algorithm
    });
  }
  
  // Gerar QR Code como Data URL
  static async generateQRCodeDataURL(otpauthUrl) {
    try {
      const qrCodeDataURL = await qrcode.toDataURL(otpauthUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#1a237e', // Azul escuro
          light: '#ffffff'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return null;
    }
  }
  
  // Gerar QR Code como SVG
  static async generateQRCodeSVG(otpauthUrl) {
    try {
      const qrCodeSVG = await qrcode.toString(otpauthUrl, {
        type: 'svg',
        width: 200,
        margin: 1,
        color: {
          dark: '#1a237e',
          light: '#ffffff'
        }
      });
      
      return qrCodeSVG;
    } catch (error) {
      console.error('Erro ao gerar QR Code SVG:', error);
      return null;
    }
  }
  
  // Validar secret format
  static isValidSecret(secret) {
    if (!secret || typeof secret !== 'string') return false;
    
    // Base32 deve ter apenas A-Z2-7 e = para padding
    const base32Regex = /^[A-Z2-7]+=*$/;
    return base32Regex.test(secret) && secret.length >= 16;
  }
  
  // Recuperar backup codes (códigos de emergência)
  static generateBackupCodes(count = 8) {
    const backupCodes = [];
    
    for (let i = 0; i < count; i++) {
      // Gerar código de 8 dígitos com hífen
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const formattedCode = code.match(/.{4}/g).join('-');
      
      backupCodes.push({
        code: formattedCode,
        used: false,
        createdAt: new Date().toISOString()
      });
    }
    
    return backupCodes;
  }
  
  // Verificar backup code
  static verifyBackupCode(backupCodes, code) {
    if (!Array.isArray(backupCodes) || !code) return false;
    
    const cleanCode = code.replace(/-/g, '').toUpperCase();
    
    for (const backupCode of backupCodes) {
      if (!backupCode.used) {
        const cleanBackupCode = backupCode.code.replace(/-/g, '').toUpperCase();
        
        if (cleanBackupCode === cleanCode) {
          backupCode.used = true;
          backupCode.usedAt = new Date().toISOString();
          return true;
        }
      }
    }
    
    return false;
  }
  
  // Verificar se o TOTP está configurado corretamente para um usuário
  static async validateUserTOTP(userId, token, userSecret) {
    try {
      // Verificar token
      const isValid = this.verifyToken(userSecret, token);
      
      if (!isValid) {
        return {
          valid: false,
          error: 'Código do autenticador inválido',
          timestamp: new Date().toISOString()
        };
      }
      
      // Verificar se o secret está no formato correto
      if (!this.isValidSecret(userSecret)) {
        return {
          valid: false,
          error: 'Configuração do autenticador inválida',
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        valid: true,
        message: 'Autenticação TOTP válida',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Erro na validação TOTP:', error);
      
      return {
        valid: false,
        error: 'Erro na verificação do autenticador',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Resetar TOTP para um usuário
  static async resetTOTP(email) {
    try {
      const newSecret = this.generateSecret(email);
      
      return {
        success: true,
        message: 'TOTP resetado com sucesso',
        secret: newSecret.secret,
        otpauth_url: newSecret.otpauth_url,
        backup_codes: this.generateBackupCodes(),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Erro ao resetar TOTP:', error);
      
      return {
        success: false,
        error: 'Erro ao resetar autenticador',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Middleware para verificar TOTP em rotas específicas
  static totpRequired(req, res, next) {
    const token = req.headers['x-totp-token'] || req.body.totpToken;
    
    if (!token) {
      return res.status(401).json({
        error: 'Autenticação de dois fatores requerida',
        message: 'Forneça o código do Google Authenticator',
        timestamp: new Date().toISOString()
      });
    }
    
    // Aqui você precisaria buscar o secret do usuário do banco
    // Exemplo: const userSecret = await getUserSecret(req.user.id);
    
    next();
  }
  
  // Testar configuração do TOTP
  static testTOTP() {
    console.log('🧪 Testando configuração TOTP...');
    
    const testEmail = 'test@example.com';
    const secret = this.generateSecret(testEmail);
    
    console.log('✅ Secret gerado:', secret.secret.substring(0, 20) + '...');
    console.log('✅ OTPAuth URL:', secret.otpauth_url.substring(0, 50) + '...');
    
    // Gerar código atual
    const currentToken = this.generateCurrentToken(secret.secret);
    console.log('✅ Token atual:', currentToken);
    
    // Verificar token
    const isValid = this.verifyToken(secret.secret, currentToken);
    console.log('✅ Token verificado:', isValid ? 'SIM' : 'NÃO');
    
    // Testar QR Code
    this.generateQRCodeDataURL(secret.otpauth_url)
      .then(qrCode => {
        if (qrCode) {
          console.log('✅ QR Code gerado (tamanho):', qrCode.length, 'bytes');
        }
      });
    
    return {
      secret: secret.secret,
      token: currentToken,
      isValid,
      config: TOTP_CONFIG
    };
  }
}

// Middleware para verificar se o Google Auth está configurado
export const requireGoogleAuth = async (req, res, next) => {
  try {
    // Supondo que req.user existe (do middleware de autenticação JWT)
    if (!req.user) {
      return res.status(401).json({
        error: 'Não autenticado',
        timestamp: new Date().toISOString()
      });
    }
    
    // Verificar se o usuário tem Google Auth configurado
    // Aqui você buscaria do banco se o usuário tem google_secret
    // Exemplo: const hasGoogleAuth = await checkUserHasGoogleAuth(req.user.id);
    
    // Por enquanto, vamos assumir que todos os administradores precisam
    const hasGoogleAuth = true;
    
    if (!hasGoogleAuth) {
      return res.status(403).json({
        error: 'Google Authenticator não configurado',
        message: 'Configure o Google Authenticator para acessar esta funcionalidade',
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware requireGoogleAuth:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
};

// Helper para gerar URL de configuração manual
export const getManualSetupInstructions = (secret, email) => {
  return {
    steps: [
      '1. Abra o Google Authenticator no seu celular',
      '2. Toque em "Adicionar conta"',
      '3. Selecione "Digitar uma chave de configuração"',
      `4. Digite: ${email}`,
      `5. Cole a chave: ${secret}`,
      '6. Selecione "Baseada no tempo"',
      '7. Toque em "Adicionar"'
    ],
    secret: secret,
    email: email,
    issuer: TOTP_CONFIG.issuer,
    timestamp: new Date().toISOString()
  };
};

// Adicionar dependência QR Code no package.json
export const requiredDependencies = {
  'speakeasy': 'Para gerar e verificar tokens TOTP',
  'qrcode': 'Para gerar QR Codes (opcional)'
};

export default TOTPManager;     