// src/pages/MinhaConta.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn, AlertCircle, Eye, EyeOff, UserPlus,
  RefreshCw, CheckCircle, XCircle, Mail,
  Smartphone, Lock, User, ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Footer from '@/components/Footer'; 

const API_BASE = (import.meta.env.VITE_WORKER_URL || 'http://localhost:8787/api').replace('/api', '');
const API = `${API_BASE}/api`;

type Step = 'idle' | 'login' | 'register' | 'pin' | 'esqueci-senha' | 'reset-senha';

const apiFetch = async (url: string, options?: RequestInit): Promise<any> => {
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith('//')) cleanUrl = cleanUrl.substring(1);
  if (!cleanUrl.startsWith('/')) cleanUrl = '/' + cleanUrl;
  const fullUrl = `${API}${cleanUrl}`;
  
  try {
    const res = await fetch(fullUrl, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      throw new Error('Resposta inválida do servidor');
    }
    if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);
    return data;
  } catch (err: any) {
    throw err;
  }
};

const api = {
  register: (data: any) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (email: string, senha: string) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
  verifyPin: (userId: string, pin: string) =>
    apiFetch('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ userId, pin }) }),
  resendPin: (userId: string) =>
    apiFetch('/auth/reenviar-pin', { method: 'POST', body: JSON.stringify({ userId }) }),
  esqueciSenha: (email: string) =>
    apiFetch('/auth/esqueci-senha', { method: 'POST', body: JSON.stringify({ email }) }),
  confirmarResetSenha: (token: string, novaSenha: string, userId: string) =>
    apiFetch('/auth/confirmar-reset-senha', { method: 'POST', body: JSON.stringify({ token, novaSenha, userId }) }),
};

interface MinhaContaProps {
  isModal?: boolean;
}

export default function MinhaConta({ isModal = false }: MinhaContaProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();
  
  const [step, setStep] = useState<Step>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Login state
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  // Register state
  const [nome, setNome] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerSenha, setRegisterSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [mostrarRegisterSenha, setMostrarRegisterSenha] = useState(false);
  
  // PIN state
  const [pin, setPin] = useState('');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  
  // Reset password state
  const [emailReset, setEmailReset] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNova, setConfirmarNova] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  
  // Password strength checks
  const [pwChecks, setPwChecks] = useState({
    length: false, upper: false, lower: false, number: false, special: false
  });

  // Check URL params for reset token
  useEffect(() => {
    const search = location.search;
    if (search && search.includes('reset_token')) {
      const params = new URLSearchParams(search);
      const token = params.get('reset_token');
      const userId = params.get('userId');
      if (token && userId) {
        setResetToken(token);
        setResetUserId(userId);
        setStep('reset-senha');
      }
    }
  }, [location.search]);

  // Password strength checker
  useEffect(() => {
    const s = registerSenha || novaSenha;
    const checks = {
      length: s.length >= 8,
      upper: /[A-Z]/.test(s),
      lower: /[a-z]/.test(s),
      number: /[0-9]/.test(s),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(s)
    };
    setPwChecks(checks);
  }, [registerSenha, novaSenha]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const getPasswordStrength = (): { strength: 'weak' | 'medium' | 'strong'; color: string; label: string; barWidth: string } => {
    const validCount = Object.values(pwChecks).filter(Boolean).length;
    const senhaLength = registerSenha.length || novaSenha.length;
    
    if (senhaLength === 0) {
      return { strength: 'weak', color: 'bg-gray-300', label: '', barWidth: 'w-0' };
    }
    if (validCount >= 4) {
      return { strength: 'strong', color: 'bg-green-500', label: 'Forte', barWidth: 'w-full' };
    }
    if (validCount >= 2) {
      return { strength: 'medium', color: 'bg-yellow-500', label: 'Média', barWidth: 'w-2/3' };
    }
    return { strength: 'weak', color: 'bg-red-500', label: 'Fraca', barWidth: 'w-1/3' };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    
    if (!nome.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }
    if (!registerEmail || !registerEmail.includes('@')) {
      setError('E-mail válido é obrigatório');
      return;
    }
    if (registerSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (registerSenha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    const validCount = Object.values(pwChecks).filter(Boolean).length;
    if (validCount < 3) {
      setError('Escolha uma senha mais forte (use letras maiúsculas, minúsculas, números ou caracteres especiais)');
      return;
    }
    if (!telefone.replace(/\D/g, '').match(/^\d{10,11}$/)) {
      setError('Telefone inválido. Use DDD + número (Ex: 11999999999)');
      return;
    }
    
    setLoading(true);
    try {
      const data = await api.register({
        nome: nome.trim(),
        email: registerEmail.toLowerCase().trim(),
        senha: registerSenha,
        telefone: telefone.replace(/\D/g, ''),
        role: 'Cliente'
      });
      
      if (!data.success) {
        setError(data.error || 'Erro ao cadastrar');
        return;
      }
      
      setSuccess('✅ Cadastro realizado! Enviamos um PIN de verificação para seu e-mail.');
      setUserId(data.userId);
      setUserEmail(registerEmail);
      setUserName(nome);
      setStep('pin');
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  // handleLogin - MinhaConta: SEMPRE vai para tela de PIN (ignora 2FA)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      if (!email || !email.includes('@')) {
        setError('Digite um e-mail válido');
        setLoading(false);
        return;
      }
      if (!senha || senha.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres');
        setLoading(false);
        return;
      }
      
      const data = await api.login(email, senha);
      console.log('📦 RESPOSTA LOGIN:', JSON.stringify(data));
      
      if (!data.success) {
        setError(data.error || 'Login inválido');
        return;
      }
      
      // ✅ MinhaConta: SEMPRE vai para tela de PIN
      // Ignora qualquer "nextStep" do backend
      setUserId(String(data.userId));
      setUserEmail(data.email);
      setUserName(data.nome || email.split('@')[0]);
      setPin('');
      setStep('pin');
      
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // handleVerifyPin - Verifica o PIN e redireciona para o painel do cliente
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    
    if (!pin || pin.length !== 6) {
      setError('Digite o PIN de 6 dígitos enviado para seu e-mail');
      return;
    }
    
    setLoading(true);
    try {
      const data = await api.verifyPin(userId, pin);
      console.log('✅ RESPOSTA VERIFY PIN:', JSON.stringify(data));
      
      if (!data.success) {
        setError(data.error || 'PIN inválido');
        return;
      }

      // Verifica se token e user existem
      if (!data.token || !data.user) {
        setError('Erro de autenticação. Tente novamente.');
        return;
      }

      console.log('✅ TOKEN:', data.token);
      console.log('✅ USER:', data.user);

      // Salva no localStorage
      localStorage.setItem('pani_token', data.token);
      localStorage.setItem('pani_user', JSON.stringify(data.user));
      
      // Atualiza o contexto de autenticação
      await authLogin(data.user, data.token);
      
      // ✅ MinhaConta: SEMPRE redireciona para o painel do cliente
      // Mesmo que o usuário seja admin, pelo MinhaConta vai para o painel do cliente
      console.log('✅ Redirecionando para /painelcliente');
      navigate('/painelcliente', { replace: true });
      
    } catch (err: any) {
      console.error('❌ ERRO no handleVerifyPin:', err);
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleResendPin = async () => {
    if (loading || resendCountdown > 0) return;
    setLoading(true);
    setError('');
    
    try {
      const data = await api.resendPin(userId);
      if (data.success) {
        setSuccess('✅ Novo PIN enviado! Verifique seu e-mail.');
        setResendCountdown(60);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Erro ao reenviar PIN');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleEsqueciSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    
    try {
      const data = await api.esqueciSenha(emailReset);
      if (!data.success) {
        setError(data.error || 'E-mail não encontrado');
        return;
      }
      setSuccess('✅ Link de redefinição enviado! Verifique seu e-mail.');
      setTimeout(() => {
        setSuccess('');
        setStep('login');
        setEmailReset('');
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarResetSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    const validCount = Object.values(pwChecks).filter(Boolean).length;
    if (validCount < 3) {
      setError('Senha fraca — use maiúsculas, minúsculas, números ou caracteres especiais');
      return;
    }
    if (novaSenha !== confirmarNova) {
      setError('Senhas não coincidem');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await api.confirmarResetSenha(resetToken, novaSenha, resetUserId);
      if (!data.success) {
        setError(data.error || 'Erro ao redefinir senha');
        return;
      }
      setSuccess('✅ Senha alterada com sucesso! Faça login.');
      setTimeout(() => {
        setSuccess('');
        setStep('login');
        setNovaSenha('');
        setConfirmarNova('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (loading) return;
    const stepMap: Record<Step, Step> = {
      idle: 'idle',
      login: 'idle',
      register: 'idle',
      pin: 'login',
      'esqueci-senha': 'login',
      'reset-senha': 'login'
    };
    setStep(stepMap[step]);
    setError('');
    setSuccess('');
  };

  const strength = getPasswordStrength();

  // Mostrar logo apenas nas telas principais
  const mostrarLogo = step === 'idle' || step === 'login' || step === 'register' || step === 'esqueci-senha';

  // Conteúdo do card
  const cardContent = (
    <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
      {mostrarLogo && (
        <div className="pt-8 px-5 text-center bg-gradient-to-b from-muted/30 to-card">
          <div className="flex justify-center mb-3">
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl mb-6 bg-primary">
              <img src="/images/logo.png" alt="Pani Di Grano" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-foreground font-bold text-2xl">Pani Di Grano</h1>
          <p className="text-muted-foreground text-sm mt-1">Área do Cliente</p>
        </div>
      )}
      {!mostrarLogo && <div className="pt-4 px-5" />}

      <div className="px-5 pb-6">
        {/* Error and Success Messages */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive p-2.5 rounded-lg text-xs mb-4 flex gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-300 text-green-700 p-2.5 rounded-lg text-xs mb-4 flex gap-2">
            <CheckCircle size={14} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* IDLE */}
        {step === 'idle' && (
          <div className="space-y-3">
            <button
              onClick={() => setStep('login')}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg w-full text-sm shadow-md transition-colors"
            >
              <LogIn size={18} /> Entrar
            </button>
            <button
              onClick={() => setStep('register')}
              className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-3 px-6 rounded-lg w-full text-sm shadow-md transition-colors"
            >
              <UserPlus size={18} /> Criar Conta
            </button>
          </div>
        )}

        {/* LOGIN */}
        {step === 'login' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={handleBack} disabled={loading} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                ← Voltar
              </button>
              <span className="text-foreground font-bold text-sm">Entrar</span>
              <div className="w-16" />
            </div>
            
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  autoFocus
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-10 bg-card border border-border text-foreground rounded-lg text-sm focus:outline-none focus:border-primary"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setEmailReset(''); setStep('esqueci-senha'); }}
                  className="text-muted-foreground hover:text-primary text-xs underline transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Entrar <ArrowRight size={16} />
                  </span>
                )}
              </button>

              <p className="text-center text-muted-foreground text-xs">
                Não tem conta?{' '}
                <button type="button" onClick={() => setStep('register')} className="text-primary hover:underline">
                  Cadastre-se
                </button>
              </p>
            </form>
          </>
        )}

        {/* REGISTER */}
        {step === 'register' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={handleBack} disabled={loading} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                ← Voltar
              </button>
              <span className="text-foreground font-bold text-sm">Criar Conta</span>
              <div className="w-16" />
            </div>
            
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm focus:outline-none focus:border-primary"
                  autoFocus
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm focus:outline-none focus:border-primary"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="relative">
                <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="Telefone com DDD (ex: 11999999999)"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm focus:outline-none focus:border-primary"
                  disabled={loading}
                  maxLength={11}
                  required
                />
              </div>
              
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={mostrarRegisterSenha ? 'text' : 'password'}
                  placeholder="Senha"
                  value={registerSenha}
                  onChange={(e) => setRegisterSenha(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-10 bg-card border border-border text-foreground rounded-lg text-sm focus:outline-none focus:border-primary"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarRegisterSenha(!mostrarRegisterSenha)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {mostrarRegisterSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {registerSenha.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Força da senha:</span>
                    <span className={`text-xs font-medium ${
                      strength.strength === 'strong' ? 'text-green-600' : 
                      strength.strength === 'medium' ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.barWidth}`} />
                  </div>
                </div>
              )}

              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm focus:outline-none focus:border-primary"
                  disabled={loading}
                  required
                />
              </div>

              {confirmarSenha && registerSenha !== confirmarSenha && (
                <div className="flex items-center gap-1.5 text-destructive text-xs">
                  <XCircle size={12} />
                  <span>As senhas não coincidem</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || registerSenha !== confirmarSenha || Object.values(pwChecks).filter(Boolean).length < 3}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Cadastrando...
                  </span>
                ) : (
                  'Criar Conta'
                )}
              </button>
            </form>
          </>
        )}

        {/* PIN VERIFICATION */}
        {step === 'pin' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={handleBack} disabled={loading} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                ← Voltar
              </button>
              <span className="text-foreground font-bold text-sm">Verificar E-mail</span>
              <div className="w-16" />
            </div>
            
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-primary/30 flex items-center justify-center overflow-hidden bg-white">
                <img src="/images/email.png" alt="E-mail" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/732/732200.png'; }} />
              </div>
              <p className="text-muted-foreground text-xs mb-1">
                Enviamos um PIN de 6 dígitos para:
              </p>
              <p className="text-foreground font-semibold text-sm">{userEmail}</p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                placeholder="Digite o PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full p-3 bg-card border border-border text-foreground rounded-lg text-center text-2xl font-mono tracking-widest placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                autoFocus
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading || pin.length !== 6}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verificando...' : 'Confirmar e Entrar'}
              </button>

              <button
                type="button"
                onClick={handleResendPin}
                disabled={resendCountdown > 0}
                className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-primary text-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={resendCountdown > 0 ? 'animate-spin' : ''} />
                {resendCountdown > 0 ? `Aguarde ${resendCountdown}s` : 'Reenviar PIN'}
              </button>
            </form>
          </>
        )}

        {/* ESQUECI SENHA */}
        {step === 'esqueci-senha' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={handleBack} disabled={loading} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                ← Voltar
              </button>
              <span className="text-foreground font-bold text-sm">Recuperar Senha</span>
              <div className="w-16" />
            </div>
            
            <form onSubmit={handleEsqueciSenha} className="space-y-3">
              <div className="text-center mb-2">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-primary/30 flex items-center justify-center overflow-hidden bg-white">
                  <img src="/images/email.png" alt="E-mail" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/732/732200.png'; }} />
                </div>
                <p className="text-muted-foreground text-xs">
                  Digite seu e-mail para receber o link de redefinição de senha.
                </p>
              </div>
              
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Seu e-mail cadastrado"
                  value={emailReset}
                  onChange={(e) => setEmailReset(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm focus:outline-none focus:border-primary"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Enviando...
                  </span>
                ) : (
                  'Enviar link de redefinição'
                )}
              </button>
            </form>
          </>
        )}

        {/* RESET SENHA */}
        {step === 'reset-senha' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={handleBack} disabled={loading} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                ← Voltar
              </button>
              <span className="text-foreground font-bold text-sm">Redefinir Senha</span>
              <div className="w-16" />
            </div>
            
            <form onSubmit={handleConfirmarResetSenha} className="space-y-3">
              <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center mb-2">
                <p className="text-green-700 text-xs">✅ Link válido! Defina sua nova senha.</p>
              </div>
              
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  placeholder="Nova senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-10 bg-card border border-border text-foreground rounded-lg text-sm focus:outline-none focus:border-primary"
                  required
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {mostrarNovaSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {novaSenha.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Força da senha:</span>
                    <span className={`text-xs font-medium ${
                      strength.strength === 'strong' ? 'text-green-600' : 
                      strength.strength === 'medium' ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.barWidth}`} />
                  </div>
                </div>
              )}

              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Confirmar nova senha"
                  value={confirmarNova}
                  onChange={(e) => setConfirmarNova(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm focus:outline-none focus:border-primary"
                  required
                  disabled={loading}
                />
              </div>

              {confirmarNova && novaSenha !== confirmarNova && (
                <div className="flex items-center gap-1.5 text-destructive text-xs">
                  <XCircle size={12} />
                  <span>As senhas não coincidem</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || novaSenha !== confirmarNova || Object.values(pwChecks).filter(Boolean).length < 3}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Redefinindo...
                  </span>
                ) : (
                  'Redefinir senha'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  // Se for modal, retorna apenas o card
  if (isModal) {
    return cardContent;
  }

  // Página completa
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 to-orange-100">
      <main className="flex-1 flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-md">
          {cardContent}
        </div>
      </main>
      <Footer />
    </div>
  );
}