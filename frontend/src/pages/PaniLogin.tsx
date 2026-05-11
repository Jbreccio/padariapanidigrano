// src/pages/PaniLogin.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn, AlertCircle, Eye, EyeOff,
  Key, RefreshCw, CheckCircle, XCircle, Copy, Mail,
  Smartphone, AlertTriangle, Lock
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_WORKER_URL || 'http://localhost:8787/api').replace('/api', '');
const API = `${API_BASE}/api`;

console.log('=' .repeat(50));
console.log(`🔗 AMBIENTE: ${import.meta.env.DEV ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);
console.log(`🔗 API URL: "${API}"`);
console.log('=' .repeat(50));

type Step =
  | 'idle'
  | 'login'
  | 'pin'
  | '2fa-setup'
  | '2fa-verify'
  | 'esqueci-senha'
  | 'reset-senha'
  | 'reset-2fa'
  | 'reset-2fa-backup'
  | 'reset-2fa-email';

const apiFetch = async (url: string, options?: RequestInit): Promise<any> => {
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith('//')) cleanUrl = cleanUrl.substring(1);
  if (!cleanUrl.startsWith('/')) cleanUrl = '/' + cleanUrl;
  const fullUrl = `${API}${cleanUrl}`;
  console.log(`\n🚀 FETCH: ${options?.method || 'GET'} ${fullUrl}`);
  if (fullUrl.includes(' ') || fullUrl.includes('\n') || fullUrl.includes('\t')) {
    console.error(`❌ URL INVALIDA: "${fullUrl}"`);
    throw new Error('URL mal formatada');
  }
  try {
    const res = await fetch(fullUrl, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    console.log(`📡 RESPONSE STATUS: ${res.status}`);
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      console.error('❌ Resposta não é JSON');
      throw new Error('Resposta inválida do servidor');
    }
    if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);
    return data;
  } catch (err: any) {
    console.error(`❌ FETCH ERROR:`, err.message);
    throw err;
  }
};

const api = {
  login: (email: string, senha: string) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
  verifyPin: (userId: string, pin: string, celular?: string) =>
    apiFetch('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ userId, pin, celular }) }),
  resendPin: (userId: string) =>
    apiFetch('/auth/reenviar-pin', { method: 'POST', body: JSON.stringify({ userId }) }),
  verify2FA: (userId: string, codigo2FA: string) =>
    apiFetch('/auth/verify-2fa', { method: 'POST', body: JSON.stringify({ userId, codigo2FA }) }),
  reset2FABackup: (email: string, backupCode: string) =>
    apiFetch('/auth/reset-2fa-backup', { method: 'POST', body: JSON.stringify({ email, backupCode }) }),
  solicitarReset2FA: (email: string) =>
    apiFetch('/auth/solicitar-reset-2fa', { method: 'POST', body: JSON.stringify({ email }) }),
  confirmarReset2FA: (token: string) =>
    apiFetch('/auth/confirmar-reset-2fa', { method: 'POST', body: JSON.stringify({ token }) }),
  esqueciSenha: (email: string) =>
    apiFetch('/auth/esqueci-senha', { method: 'POST', body: JSON.stringify({ email }) }),
  confirmarResetSenha: (token: string, novaSenha: string, userId: string) =>
    apiFetch('/auth/confirmar-reset-senha', { method: 'POST', body: JSON.stringify({ token, novaSenha, userId }) }),
  verificarToken: (token: string) =>
    apiFetch('/auth/verificar', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
};

const shouldShowLogo = (step: Step): boolean => {
  return !['pin', '2fa-setup', '2fa-verify', 'reset-2fa', 'reset-2fa-backup', 'reset-2fa-email'].includes(step);
};

export const getAuthToken = () => localStorage.getItem('fiel_token');

export default function PaniLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const reenviandoRef = useRef(false);
  const checkedOnceRef = useRef(false);

  const [step, setStep] = useState<Step>('idle');
  const [resetToken, setResetToken] = useState('');
  const [resetSenhaToken, setResetSenhaToken] = useState('');
  const [resetUserId, setResetUserId] = useState('');

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [pin, setPin] = useState('');
  const [celular, setCelular] = useState('');
  const [reenviando, setReenviando] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [codigo2FA, setCodigo2FA] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetBackupCode, setResetBackupCode] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [resetMethod, setResetMethod] = useState<'backup' | 'email' | null>(null);
  const [countdown, setCountdown] = useState(0);

  const [emailReset, setEmailReset] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNova, setConfirmarNova] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | ''>('');
  const [authChecked, setAuthChecked] = useState(false);

  const [pwChecks, setPwChecks] = useState({
    length: false, upper: false, lower: false, number: false, special: false
  });

  const showPopup = useCallback((message: string, type: 'success' | 'error') => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => { setPopupMessage(''); setPopupType(''); }, 4000);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    const search = location.search;
    if (!search || search === '?') { setStep('idle'); return; }
    const params = new URLSearchParams(search);
    if (params.get('reset2fa')) {
      setStep('reset-2fa-email');
      setResetToken(params.get('reset2fa') || '');
    } else if (params.get('reset_token') && params.get('userId')) {
      setStep('reset-senha');
      setResetSenhaToken(params.get('reset_token') || '');
      setResetUserId(params.get('userId') || '');
    } else if (params.get('token') && params.get('userId')) {
      setStep('reset-senha');
      setResetSenhaToken(params.get('token') || '');
      setResetUserId(params.get('userId') || '');
    } else {
      setStep('idle');
    }
  }, [location.search]);

  useEffect(() => { setError(''); setSucesso(''); }, [step]);

  useEffect(() => {
    const s = novaSenha;
    setPwChecks({
      length: s.length >= 8,
      upper: /[A-Z]/.test(s),
      lower: /[a-z]/.test(s),
      number: /[0-9]/.test(s),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(s)
    });
  }, [novaSenha]);

  const pwStrength = useCallback((): 'weak' | 'medium' | 'strong' => {
    const n = Object.values(pwChecks).filter(Boolean).length;
    if (novaSenha.length === 0) return 'weak';
    if (n >= 4) return 'strong';
    if (n >= 2) return 'medium';
    return 'weak';
  }, [novaSenha.length, pwChecks]);

  const handleBack = useCallback(() => {
    if (loading) return;
    const map: Record<Step, Step> = {
      login: 'idle', pin: 'login', '2fa-setup': 'pin', '2fa-verify': 'pin',
      'esqueci-senha': 'login', 'reset-senha': 'idle', 'reset-2fa': '2fa-verify',
      'reset-2fa-backup': 'reset-2fa', 'reset-2fa-email': 'reset-2fa', idle: 'idle'
    };
    const newStep = map[step] || 'idle';
    setStep(newStep);
    if (newStep === 'idle') navigate('/panilogin', { replace: true });
    setResetEmail(''); setResetBackupCode(''); setResetTokenInput('');
    setNovaSenha(''); setConfirmarNova('');
  }, [step, navigate, loading]);

  useEffect(() => {
    let isMounted = true;
    const verificarToken = async () => {
      if (checkedOnceRef.current) return;
      const token = localStorage.getItem('fiel_token');
      if (!token) {
        if (isMounted) { setStep('idle'); setAuthChecked(true); checkedOnceRef.current = true; }
        return;
      }
      if (location.search && location.search !== '?') {
        if (isMounted) { setAuthChecked(true); checkedOnceRef.current = true; }
        return;
      }
      try {
        const data = await api.verificarToken(token);
        if (isMounted) {
          if (data.success && data.user?.role === 'admin') navigate('/paineladmin', { replace: true });
          else if (data.success) navigate('/', { replace: true });
          else { localStorage.removeItem('fiel_token'); localStorage.removeItem('fiel_user'); setStep('idle'); }
        }
      } catch (err: any) {
        if (isMounted) { localStorage.removeItem('fiel_token'); localStorage.removeItem('fiel_user'); setStep('idle'); }
      } finally {
        if (isMounted) { setAuthChecked(true); checkedOnceRef.current = true; }
      }
    };
    verificarToken();
    return () => { isMounted = false; };
  }, [navigate, location.search]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    try {
      if (!email || !email.includes('@')) { setError('Digite um e-mail válido'); setLoading(false); return; }
      if (!senha || senha.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); setLoading(false); return; }
      const data = await api.login(email, senha);
      if (!data.success) { setError(data.error || 'Login inválido'); return; }
      setUserId(String(data.userId)); setUserEmail(data.email); setUserName(data.nome);
      setPin(''); setCelular(''); setStep('pin');
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor');
    } finally { setLoading(false); }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!pin || pin.length !== 6) { setError('Digite um PIN válido de 6 dígitos'); return; }
    setLoading(true);
    try {
      const data = await api.verifyPin(userId, pin, celular || undefined);
      if (!data.success) { setError(data.error || 'PIN inválido'); return; }
      const stepNext = data.step || data.nextStep;
      if (stepNext === '2fa-setup') {
        setQrCodeUrl(data.qrCodeUrl); setSecretKey(data.secretKey);
        setBackupCodes(data.backupCodes || []); setShowBackupCodes(true); setStep('2fa-setup');
      } else if (stepNext === '2fa-verify') {
        setCodigo2FA(''); setStep('2fa-verify');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally { setLoading(false); }
  };

  const handleReenviarPin = async () => {
    if (reenviando || reenviandoRef.current || loading) return;
    setReenviando(true); reenviandoRef.current = true; setError('');
    try {
      const data = await api.resendPin(userId);
      if (data.success) { setSucesso('✅ Novo PIN enviado! Verifique seu e-mail.'); setTimeout(() => setSucesso(''), 5000); }
      else setError(data.error || 'Erro ao reenviar');
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setTimeout(() => { setReenviando(false); reenviandoRef.current = false; }, 2000);
    }
  };

  const handleSetup2FA = useCallback(() => {
    if (loading) return;
    setCodigo2FA(''); setShowBackupCodes(false); setStep('2fa-verify');
  }, [loading]);

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!codigo2FA || codigo2FA.length !== 6) { setError('Digite o código de 6 dígitos'); return; }
    setLoading(true); setError('');
    try {
      const data = await api.verify2FA(userId, codigo2FA);
      if (!data.success) { setError(data.error); return; }
      localStorage.setItem('fiel_token', data.token);
      localStorage.setItem('fiel_user', JSON.stringify(data.user));
      if (data.user?.role === 'admin') navigate('/paineladmin', { replace: true });
      else navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally { setLoading(false); }
  };

  const handleReset2FABackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      const data = await api.reset2FABackup(resetEmail, resetBackupCode);
      if (!data.success) { setError(data.error || 'Código inválido'); return; }
      showPopup('2FA removido com sucesso', 'success'); setStep('login');
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally { setLoading(false); }
  };

  const handleSolicitarReset2FAEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      const data = await api.solicitarReset2FA(resetEmail);
      if (!data.success) { setError(data.error); return; }
      setCountdown(60); setResetMethod('email');
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally { setLoading(false); }
  };

  const handleConfirmarReset2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    const finalToken = resetToken && resetToken.trim() !== '' ? resetToken : resetTokenInput;
    if (!finalToken || finalToken.trim() === '') { setError('Token inválido'); setLoading(false); return; }
    try {
      const data = await api.confirmarReset2FA(finalToken);
      if (!data.success) { setError(data.error); return; }
      showPopup('2FA resetado com sucesso!', 'success'); setStep('login');
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally { setLoading(false); }
  };

  const handleEsqueciSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      const data = await api.esqueciSenha(emailReset);
      if (!data.success) { setError(data.error); return; }
      setSucesso('✅ E-mail enviado! Verifique sua caixa de entrada.');
      setTimeout(() => setSucesso(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally { setLoading(false); }
  };

  const handleConfirmarResetSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const validCount = Object.values(pwChecks).filter(Boolean).length;
    if (validCount < 4) { setError('Senha fraca — use maiúsculas, minúsculas, números e caracteres especiais'); return; }
    if (novaSenha !== confirmarNova) { setError('Senhas não coincidem'); return; }
    setLoading(true); setError('');
    try {
      const data = await api.confirmarResetSenha(resetSenhaToken, novaSenha, resetUserId);
      if (!data.success) { setError(data.error); return; }
      showPopup('Senha alterada com sucesso!', 'success');
      setTimeout(() => { setStep('login'); setNovaSenha(''); setConfirmarNova(''); }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally { setLoading(false); }
  };

  // Input class usando bg-card do tema (igual ao Auth.tsx)
  const inputClass = 'w-full p-2.5 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';

  const ErrorBox = ({ msg }: { msg: string }) => (
    <div className="bg-destructive/10 border border-destructive/30 text-destructive p-2.5 rounded-lg text-xs mb-3 flex gap-2">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      <span>{msg}</span>
    </div>
  );

  const SucessoBox = ({ msg }: { msg: string }) => (
    <div className="bg-green-100 border border-green-300 text-green-700 p-2.5 rounded-lg text-xs mb-3">{msg}</div>
  );

  const Popup = () => {
    if (!popupMessage) return null;
    return (
      <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-lg transition-all duration-300 ${popupType === 'success' ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
        <div className="flex items-center gap-2">
          {popupType === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{popupMessage}</span>
        </div>
      </div>
    );
  };

  const CardHeader = ({ title, onBack, showReset2FA }: { title?: string; onBack: () => void; showReset2FA?: boolean }) => (
    <div className="flex items-center justify-between mb-4">
      <button onClick={onBack} disabled={loading} className="text-muted-foreground hover:text-foreground text-sm transition-colors">← Voltar</button>
      {title && <span className="text-foreground font-bold text-sm">{title}</span>}
      {showReset2FA ? (
        <button onClick={() => setStep('reset-2fa')} className="text-muted-foreground hover:text-foreground text-xs underline flex items-center gap-1">
          <Smartphone size={12} /> Perdi meu celular
        </button>
      ) : <span className="w-24" />}
    </div>
  );

  const PasswordStrengthBar = () => {
    const strength = pwStrength();
    const getColor = () => {
      if (strength === 'strong') return 'bg-green-500 w-full';
      if (strength === 'medium') return 'bg-yellow-500 w-2/3';
      return 'bg-red-500 w-1/3';
    };
    const getLabel = () => {
      if (strength === 'strong') return ['Forte', 'text-green-600'];
      if (strength === 'medium') return ['Média', 'text-yellow-600'];
      return ['Fraca', 'text-red-500'];
    };
    const [label, color] = getLabel();
    if (novaSenha.length === 0) return null;
    return (
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-muted-foreground text-xs">Força da senha:</span>
          <span className={`text-xs font-medium ${color}`}>{label}</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${getColor()}`} />
        </div>
      </div>
    );
  };

  const PasswordChecklist = () => (
    <div className="mt-3 space-y-1.5">
      {([['length', 'Mínimo 8 caracteres'], ['upper', 'Letra maiúscula (A-Z)'], ['lower', 'Letra minúscula (a-z)'], ['number', 'Número (0-9)'], ['special', 'Caractere especial (!@#$%^&*)']] as const).map(([k, label]) => (
        <div key={k} className="flex items-center gap-2 text-xs">
          {pwChecks[k] ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-destructive/60" />}
          <span className={pwChecks[k] ? 'text-green-600' : 'text-muted-foreground'}>{label}</span>
        </div>
      ))}
    </div>
  );

  const mostrarLogo = shouldShowLogo(step);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      <Popup />

      {/* Lado ESQUERDO - Modal Central com cores do Auth.tsx (bg-card, border-border) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">

            {mostrarLogo && (
              <div className="pt-8 px-5 text-center bg-gradient-to-b from-muted/30 to-card">
                <div className="flex justify-center mb-3">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg bg-white p-2">
                    <img src="/images/logo.png" alt="Pani Di Grano" className="w-full h-full object-contain" />
                  </div>
                </div>
                <h1 className="text-foreground font-bold text-2xl">Pani Di Grano</h1>
                <p className="text-muted-foreground text-sm mt-1">Área Administrativa</p>
              </div>
            )}
            {!mostrarLogo && <div className="pt-4 px-5" />}

            <div className="px-5 pb-6">

              {/* IDLE */}
              {step === 'idle' && (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs text-center mb-4">Acesso restrito à administração</p>
                  <button onClick={() => setStep('login')} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-6 rounded-lg w-full text-sm shadow-md transition-colors">
                    <LogIn size={16} /> Entrar
                  </button>
                </div>
              )}

              {/* LOGIN */}
              {step === 'login' && (
                <>
                  <CardHeader onBack={handleBack} />
                  {error && <ErrorBox msg={error} />}
                  <form onSubmit={handleLogin} className="space-y-3">
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        autoFocus disabled={loading} required />
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type={mostrarSenha ? 'text' : 'password'} placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-10 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        disabled={loading} required />
                      <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="text-right">
                      <button type="button" onClick={() => { setEmailReset(''); setStep('esqueci-senha'); }} className="text-muted-foreground hover:text-foreground text-xs underline">
                        Esqueci minha senha
                      </button>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors">
                      {loading ? (<span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Entrando...</span>) : 'Entrar'}
                    </button>
                  </form>
                </>
              )}

              {/* PIN */}
              {step === 'pin' && (
                <>
                  <CardHeader title="Verificação" onBack={handleBack} />
                  {error && <ErrorBox msg={error} />}
                  {sucesso && <SucessoBox msg={sucesso} />}
                  <form onSubmit={handleVerifyPin} className="space-y-3">
                    <div className="text-center py-2">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
                        <img src="/images/email.png" alt="Email" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/732/732200.png'; }} />
                      </div>
                      <p className="text-muted-foreground text-xs mb-1">PIN de 6 dígitos enviado para:</p>
                      <p className="text-foreground text-[11px] font-semibold">{userEmail || email}</p>
                    </div>
                    <input type="text" maxLength={6} placeholder="000000" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-3 bg-card border border-border text-foreground rounded-lg text-center text-2xl font-mono tracking-widest placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      autoFocus disabled={loading} />
                    <div>
                      <input type="tel" placeholder="Telefone com DDD (opcional)" value={celular} onChange={e => setCelular(e.target.value.replace(/\D/g, ''))} className={inputClass} disabled={loading} maxLength={11} />
                      <p className="text-muted-foreground text-[10px] mt-1">Ex: 11999999999 — necessário para o 2FA</p>
                    </div>
                    <button type="submit" disabled={loading || pin.length !== 6} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors">
                      {loading ? 'Verificando...' : 'Continuar'}
                    </button>
                    <button type="button" onClick={handleReenviarPin} disabled={reenviando} className="flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground text-[11px] underline mx-auto w-full">
                      <RefreshCw size={10} className={reenviando ? 'animate-spin' : ''} /> Não recebeu? Reenviar PIN
                    </button>
                  </form>
                </>
              )}

              {/* SETUP 2FA */}
              {step === '2fa-setup' && (
                <>
                  <CardHeader title="Configurar 2FA" onBack={handleBack} />
                  {error && <ErrorBox msg={error} />}
                  <div className="space-y-3 text-center">
                    <div className="bg-muted/30 p-2 rounded-lg border border-border">
                      <p className="text-foreground/70 text-[10px] font-bold flex items-center justify-center gap-2 mb-1">Instale o Google Authenticator</p>
                      <div className="flex justify-center gap-3">
                        <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity">
                          <img src="/images/disponivelAndroid.png" alt="Android" className="w-16 h-16 object-contain" />
                        </a>
                        <a href="https://apps.apple.com/br/app/google-authenticator/id388497605" target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity">
                          <img src="/images/disponiveIOS.png" alt="iOS" className="w-16 h-16 object-contain" />
                        </a>
                      </div>
                    </div>

                    {showBackupCodes && backupCodes.length > 0 && (
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <p className="text-foreground/70 text-[11px] font-bold flex items-center justify-center gap-2 mb-2">
                          <AlertTriangle size={14} /> CÓDIGOS DE RECUPERAÇÃO
                        </p>
                        <p className="text-muted-foreground text-[10px] mb-2">Guarde em local seguro. Use um se perder o celular.</p>
                        <div className="grid grid-cols-2 gap-1 bg-muted/50 p-2 rounded">
                          {backupCodes.map((code, idx) => (<code key={idx} className="text-foreground text-[10px] font-mono">{code}</code>))}
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(backupCodes.join('\n')); showPopup('✅ Códigos copiados!', 'success'); }} className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                          <Copy size={12} /> Copiar todos
                        </button>
                      </div>
                    )}

                    <div>
                      <p className="text-muted-foreground text-xs mb-2">Escaneie o QR Code:</p>
                      <div className="flex items-center justify-center gap-4">
                        <div className="bg-white p-3 rounded-lg inline-block border border-border">
                          <img src={qrCodeUrl} alt="QR" className="w-40 h-40" />
                        </div>
                        <div className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
                          <img src="/images/google-authenticator.png" alt="GA" className="w-full h-full object-cover rounded-full" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                      <p className="text-foreground/70 text-[10px] font-bold mb-1">🔐 Chave manual</p>
                      <div className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                        <code className="text-foreground text-[10px] font-mono break-all flex-1">{secretKey}</code>
                        <button onClick={() => { navigator.clipboard.writeText(secretKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-muted-foreground hover:text-foreground shrink-0">
                          {copied ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <button onClick={handleSetup2FA} className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-sm transition-colors">
                      Continuar para verificação
                    </button>
                  </div>
                </>
              )}

              {/* VERIFICAR 2FA */}
              {step === '2fa-verify' && (
                <>
                  <CardHeader title="Verificar 2FA" onBack={handleBack} showReset2FA />
                  {error && <ErrorBox msg={error} />}
                  <form onSubmit={handleVerify2FA} className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
                        <img src="/images/google-authenticator.png" alt="GA" className="w-full h-full object-cover rounded-full" />
                      </div>
                      <p className="text-foreground font-semibold text-sm">Google Authenticator</p>
                      <p className="text-muted-foreground text-xs mt-1">Digite o código de 6 dígitos do app</p>
                    </div>
                    <input type="text" maxLength={6} placeholder="000000" value={codigo2FA} onChange={e => setCodigo2FA(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-3 bg-card border border-border text-foreground rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-primary"
                      autoFocus disabled={loading} />
                    <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors">
                      {loading ? 'Verificando...' : 'Acessar Painel'}
                    </button>
                  </form>
                </>
              )}

              {/* RESET 2FA - OPÇÕES */}
              {step === 'reset-2fa' && (
                <>
                  <CardHeader title="Recuperar Acesso" onBack={handleBack} />
                  {error && <ErrorBox msg={error} />}
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-xs text-center mb-2">Escolha como recuperar o acesso</p>
                    <button onClick={() => setStep('reset-2fa-backup')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                      <Key size={16} /> Tenho um código de backup
                    </button>
                    <button onClick={() => setStep('reset-2fa-email')} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                      <Mail size={16} /> Receber link por e-mail
                    </button>
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                      <p className="text-destructive text-[10px] text-center"><AlertTriangle size={12} className="inline mr-1" />Se nenhuma opção funcionar, contate o administrador.</p>
                    </div>
                  </div>
                </>
              )}

              {/* RESET 2FA BACKUP */}
              {step === 'reset-2fa-backup' && (
                <>
                  <CardHeader title="Código de Backup" onBack={handleBack} />
                  {error && <ErrorBox msg={error} />}
                  <form onSubmit={handleReset2FABackup} className="space-y-3">
                    <div className="text-center mb-2">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                        <Key size={32} className="text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-xs">Digite o código de backup salvo ao configurar o 2FA</p>
                    </div>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="email" placeholder="Seu e-mail" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        required disabled={loading} />
                    </div>
                    <input type="text" placeholder="Código de backup (ex: X7K9P2M4)" value={resetBackupCode} onChange={e => setResetBackupCode(e.target.value.toUpperCase())} className={inputClass} required disabled={loading} maxLength={8} />
                    <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors">
                      {loading ? 'Verificando...' : 'Remover 2FA'}
                    </button>
                  </form>
                </>
              )}

              {/* RESET 2FA EMAIL */}
              {step === 'reset-2fa-email' && (
                <>
                  <CardHeader title="Recuperar por E-mail" onBack={handleBack} />
                  {error && <ErrorBox msg={error} />}
                  {sucesso && <SucessoBox msg={sucesso} />}
                  {!resetMethod ? (
                    <form onSubmit={handleSolicitarReset2FAEmail} className="space-y-3">
                      <div className="text-center mb-2">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
                          <img src="/images/email.png" alt="Email" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-muted-foreground text-xs">Enviaremos um link para remover o 2FA. Válido por 10 minutos.</p>
                      </div>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="email" placeholder="Seu e-mail" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                          className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                          required disabled={loading} />
                      </div>
                      <button type="submit" disabled={loading || countdown > 0} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors">
                        {loading ? 'Enviando...' : countdown > 0 ? `Aguarde ${countdown}s` : 'Enviar link de recuperação'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleConfirmarReset2FA} className="space-y-3">
                      <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center mb-2">
                        <p className="text-green-700 text-xs">✅ Link enviado! Verifique seu e-mail.</p>
                      </div>
                      <p className="text-muted-foreground text-xs text-center">Cole o token recebido por e-mail</p>
                      <input type="text" placeholder="Token de recuperação" value={resetTokenInput} onChange={e => setResetTokenInput(e.target.value)} className={inputClass} required disabled={loading} />
                      <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors">
                        {loading ? 'Verificando...' : 'Confirmar e remover 2FA'}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* ESQUECI SENHA */}
              {step === 'esqueci-senha' && (
                <>
                  <CardHeader onBack={handleBack} />
                  {error && <ErrorBox msg={error} />}
                  {sucesso && <SucessoBox msg={sucesso} />}
                  {!sucesso && (
                    <form onSubmit={handleEsqueciSenha} className="space-y-3">
                      <div className="text-center mb-2">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
                          <img src="/images/email.png" alt="Email" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-muted-foreground text-xs">Digite seu e-mail para receber o link de redefinição.</p>
                      </div>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="email" placeholder="Seu e-mail cadastrado" value={emailReset} onChange={e => setEmailReset(e.target.value)}
                          className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                          required disabled={loading} autoFocus />
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors">
                        {loading ? (<span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Enviando...</span>) : 'Enviar link de redefinição'}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* RESET SENHA */}
              {step === 'reset-senha' && (
                <>
                  <CardHeader title="Redefinir Senha" onBack={handleBack} />
                  {error && <ErrorBox msg={error} />}
                  <form onSubmit={handleConfirmarResetSenha} className="space-y-4">
                    <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center mb-2">
                      <p className="text-green-700 text-xs">✅ Link válido! Defina sua nova senha abaixo.</p>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type={mostrarSenha ? 'text' : 'password'} placeholder="Nova senha" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-10 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        required disabled={loading} autoFocus />
                      <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <PasswordStrengthBar />
                    <PasswordChecklist />
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="password" placeholder="Confirmar nova senha" value={confirmarNova} onChange={e => setConfirmarNova(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        required disabled={loading} />
                    </div>
                    {confirmarNova && novaSenha !== confirmarNova && (<div className="flex items-center gap-1.5 text-destructive text-xs"><XCircle size={12} /><span>As senhas não coincidem</span></div>)}
                    {confirmarNova && novaSenha === confirmarNova && novaSenha.length > 0 && (<div className="flex items-center gap-1.5 text-green-600 text-xs"><CheckCircle size={12} /><span>Senhas coincidem</span></div>)}
                    <button type="submit" disabled={loading || novaSenha !== confirmarNova || Object.values(pwChecks).filter(Boolean).length < 4}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors">
                      {loading ? (<span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Redefinindo...</span>) : 'Redefinir senha'}
                    </button>
                  </form>
                </>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Lado DIREITO - Cor MARROM do Footer (bg-secondary) */}
      <div className="hidden md:flex md:w-1/2 bg-secondary items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-secondary-foreground/30 shadow-2xl mb-6 bg-wh