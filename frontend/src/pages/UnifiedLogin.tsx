// src/pages/UnifiedLogin.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, AlertCircle, Eye, EyeOff, Mail, Lock, UserPlus, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = (import.meta.env.VITE_WORKER_URL || 'http://localhost:8787/api').replace('/api', '');
const API = `${API_BASE}/api`;

type Step = 'login' | 'register' | 'pin-verify';

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();
  
  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Login state
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  // Register state
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerSenha, setRegisterSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // PIN verification state
  const [pin, setPin] = useState('');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const apiFetch = async (url: string, options?: RequestInit): Promise<any> => {
    const fullUrl = `${API}${url}`;
    const res = await fetch(fullUrl, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);
    return data;
  };

  const api = {
    login: (email: string, senha: string) =>
      apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
    register: (data: any) =>
      apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    verifyPin: (userId: string, pin: string) =>
      apiFetch('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ userId, pin }) }),
    resendPin: (userId: string) =>
      apiFetch('/auth/reenviar-pin', { method: 'POST', body: JSON.stringify({ userId }) }),
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const data = await api.login(email, senha);
      if (!data.success) {
        setError(data.error || 'Login inválido');
        return;
      }
      
      setUserId(String(data.userId));
      setUserEmail(data.email);
      setUserName(data.nome);
      setTempToken(data.token || '');
      setStep('pin-verify');
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    
    if (registerSenha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    if (registerSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (!telefone.replace(/\D/g, '').match(/^\d{10,11}$/)) {
      setError('Telefone inválido. Use DDD + número (Ex: 11999999999)');
      return;
    }
    
    setLoading(true);
    try {
      const data = await api.register({
        nome,
        email: registerEmail,
        senha: registerSenha,
        telefone: telefone.replace(/\D/g, '')
      });
      
      if (!data.success) {
        setError(data.error || 'Erro ao cadastrar');
        return;
      }
      
      setSuccess('✅ Cadastro realizado! Enviamos um PIN para seu e-mail.');
      setUserId(String(data.userId));
      setUserEmail(registerEmail);
      setUserName(nome);
      setTempToken(data.token || '');
      
      setTimeout(() => {
        setSuccess('');
        setStep('pin-verify');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!pin || pin.length !== 6) {
      setError('Digite o PIN de 6 dígitos');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await api.verifyPin(userId, pin);
      if (!data.success) {
        setError(data.error || 'PIN inválido');
        return;
      }
      
      // Store auth data
      localStorage.setItem('user_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update auth context
      await authLogin(data.user, data.token);
      
      // Redirect to client panel or checkout
      if (from.includes('checkout')) {
        navigate('/checkout');
      } else {
        navigate('/cliente/painel');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleResendPin = async () => {
    if (loading || resendCountdown > 0) return;
    setLoading(true);
    try {
      const data = await api.resendPin(userId);
      if (data.success) {
        setSuccess('✅ Novo PIN enviado! Verifique seu e-mail.');
        setResendCountdown(60);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Erro ao reenviar');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full p-3 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
          
          {/* Logo */}
          <div className="pt-8 px-6 text-center">
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-primary/30 shadow-lg mb-4 bg-primary">
              <img src="/images/logo.png" alt="Pani Di Grano" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-foreground font-bold text-2xl">Pani Di Grano</h1>
            <p className="text-muted-foreground text-sm mt-1">Área do Cliente</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-lg text-sm mb-4 flex gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-300 text-green-700 p-3 rounded-lg text-sm mb-4 flex gap-2">
                <CheckCircle size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Tabs */}
            {step === 'login' && (
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setStep('login')}
                  className="flex-1 py-2 text-center font-medium border-b-2 border-primary text-primary"
                >
                  Entrar
                </button>
                <button
                  onClick={() => setStep('register')}
                  className="flex-1 py-2 text-center font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                >
                  Cadastrar
                </button>
              </div>
            )}

            {/* Login Form */}
            {step === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass + " pl-10"}
                    autoFocus
                    disabled={loading}
                    required
                  />
                </div>
                
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className={inputClass + " pl-10 pr-10"}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Entrando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <LogIn size={16} /> Entrar
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('register')}
                  className="w-full text-center text-muted-foreground hover:text-primary text-sm transition-colors"
                >
                  Não tem conta? Cadastre-se
                </button>
              </form>
            )}

            {/* Register Form */}
            {step === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative">
                  <UserPlus size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className={inputClass + " pl-10"}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className={inputClass + " pl-10"}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="relative">
                  <Smartphone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    placeholder="WhatsApp (DDD + número)"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className={inputClass + " pl-10"}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="Senha (mínimo 6 caracteres)"
                    value={registerSenha}
                    onChange={(e) => setRegisterSenha(e.target.value)}
                    className={inputClass + " pl-10 pr-10"}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Confirmar senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className={inputClass + " pl-10"}
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Cadastrando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus size={16} /> Cadastrar
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full text-center text-muted-foreground hover:text-primary text-sm transition-colors"
                >
                  Já tem conta? Faça login
                </button>
              </form>
            )}

            {/* PIN Verification */}
            {step === 'pin-verify' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-primary/30 flex items-center justify-center bg-muted">
                    <Mail size={32} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Verifique seu e-mail</h2>
                  <p className="text-muted-foreground text-sm">
                    Enviamos um PIN de 6 dígitos para<br />
                    <strong className="text-foreground">{userEmail}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerifyPin} className="space-y-4">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Digite o PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-4 bg-card border border-border text-foreground rounded-lg text-center text-2xl font-mono tracking-widest placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    autoFocus
                    disabled={loading}
                  />

                  <button
                    type="submit"
                    disabled={loading || pin.length !== 6}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Smartphone(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}