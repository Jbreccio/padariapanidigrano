import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/PaniLogin.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, AlertCircle, Eye, EyeOff, Key, RefreshCw, CheckCircle, XCircle, Copy, Mail, Smartphone, AlertTriangle, Lock } from 'lucide-react';
const API_BASE = (import.meta.env.VITE_WORKER_URL || 'http://localhost:8787/api').replace('/api', '');
const API = `${API_BASE}/api`;
console.log('='.repeat(50));
console.log(`🔗 AMBIENTE: ${import.meta.env.DEV ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);
console.log(`🔗 API URL: "${API}"`);
console.log('='.repeat(50));
const apiFetch = async (url, options) => {
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('//'))
        cleanUrl = cleanUrl.substring(1);
    if (!cleanUrl.startsWith('/'))
        cleanUrl = '/' + cleanUrl;
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
        }
        catch (jsonError) {
            console.error('❌ Resposta não é JSON');
            throw new Error('Resposta inválida do servidor');
        }
        if (!res.ok)
            throw new Error(data.error || `Erro HTTP ${res.status}`);
        return data;
    }
    catch (err) {
        console.error(`❌ FETCH ERROR:`, err.message);
        throw err;
    }
};
const api = {
    login: (email, senha) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
    verifyPin: (userId, pin, celular) => apiFetch('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ userId, pin, celular }) }),
    resendPin: (userId) => apiFetch('/auth/reenviar-pin', { method: 'POST', body: JSON.stringify({ userId }) }),
    verify2FA: (userId, codigo2FA) => apiFetch('/auth/verify-2fa', { method: 'POST', body: JSON.stringify({ userId, codigo2FA }) }),
    reset2FABackup: (email, backupCode) => apiFetch('/auth/reset-2fa-backup', { method: 'POST', body: JSON.stringify({ email, backupCode }) }),
    solicitarReset2FA: (email) => apiFetch('/auth/solicitar-reset-2fa', { method: 'POST', body: JSON.stringify({ email }) }),
    confirmarReset2FA: (token) => apiFetch('/auth/confirmar-reset-2fa', { method: 'POST', body: JSON.stringify({ token }) }),
    esqueciSenha: (email) => apiFetch('/auth/esqueci-senha', { method: 'POST', body: JSON.stringify({ email }) }),
    confirmarResetSenha: (token, novaSenha, userId) => apiFetch('/auth/confirmar-reset-senha', { method: 'POST', body: JSON.stringify({ token, novaSenha, userId }) }),
    verificarToken: (token) => apiFetch('/auth/verificar', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
};
const shouldShowLogo = (step) => {
    return !['pin', '2fa-setup', '2fa-verify', 'reset-2fa', 'reset-2fa-backup', 'reset-2fa-email'].includes(step);
};
export const getAuthToken = () => localStorage.getItem('fiel_token');
export default function PaniLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const reenviandoRef = useRef(false);
    const checkedOnceRef = useRef(false);
    const [step, setStep] = useState('idle');
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
    const [backupCodes, setBackupCodes] = useState([]);
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetBackupCode, setResetBackupCode] = useState('');
    const [resetTokenInput, setResetTokenInput] = useState('');
    const [resetMethod, setResetMethod] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const [emailReset, setEmailReset] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarNova, setConfirmarNova] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState('');
    const [authChecked, setAuthChecked] = useState(false);
    const [pwChecks, setPwChecks] = useState({
        length: false, upper: false, lower: false, number: false, special: false
    });
    const showPopup = useCallback((message, type) => {
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
        if (!search || search === '?') {
            setStep('idle');
            return;
        }
        const params = new URLSearchParams(search);
        if (params.get('reset2fa')) {
            setStep('reset-2fa-email');
            setResetToken(params.get('reset2fa') || '');
        }
        else if (params.get('reset_token') && params.get('userId')) {
            setStep('reset-senha');
            setResetSenhaToken(params.get('reset_token') || '');
            setResetUserId(params.get('userId') || '');
        }
        else if (params.get('token') && params.get('userId')) {
            setStep('reset-senha');
            setResetSenhaToken(params.get('token') || '');
            setResetUserId(params.get('userId') || '');
        }
        else {
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
    const pwStrength = useCallback(() => {
        const n = Object.values(pwChecks).filter(Boolean).length;
        if (novaSenha.length === 0)
            return 'weak';
        if (n >= 4)
            return 'strong';
        if (n >= 2)
            return 'medium';
        return 'weak';
    }, [novaSenha.length, pwChecks]);
    const handleBack = useCallback(() => {
        if (loading)
            return;
        const map = {
            login: 'idle', pin: 'login', '2fa-setup': 'pin', '2fa-verify': 'pin',
            'esqueci-senha': 'login', 'reset-senha': 'idle', 'reset-2fa': '2fa-verify',
            'reset-2fa-backup': 'reset-2fa', 'reset-2fa-email': 'reset-2fa', idle: 'idle'
        };
        const newStep = map[step] || 'idle';
        setStep(newStep);
        if (newStep === 'idle')
            navigate('/panilogin', { replace: true });
        setResetEmail('');
        setResetBackupCode('');
        setResetTokenInput('');
        setNovaSenha('');
        setConfirmarNova('');
    }, [step, navigate, loading]);
    useEffect(() => {
        let isMounted = true;
        const verificarToken = async () => {
            if (checkedOnceRef.current)
                return;
            const token = localStorage.getItem('fiel_token');
            if (!token) {
                if (isMounted) {
                    setStep('idle');
                    setAuthChecked(true);
                    checkedOnceRef.current = true;
                }
                return;
            }
            if (location.search && location.search !== '?') {
                if (isMounted) {
                    setAuthChecked(true);
                    checkedOnceRef.current = true;
                }
                return;
            }
            try {
                const data = await api.verificarToken(token);
                if (isMounted) {
                    if (data.success && data.user?.role === 'admin')
                        navigate('/paineladmin', { replace: true });
                    else if (data.success)
                        navigate('/', { replace: true });
                    else {
                        localStorage.removeItem('fiel_token');
                        localStorage.removeItem('fiel_user');
                        setStep('idle');
                    }
                }
            }
            catch (err) {
                if (isMounted) {
                    localStorage.removeItem('fiel_token');
                    localStorage.removeItem('fiel_user');
                    setStep('idle');
                }
            }
            finally {
                if (isMounted) {
                    setAuthChecked(true);
                    checkedOnceRef.current = true;
                }
            }
        };
        verificarToken();
        return () => { isMounted = false; };
    }, [navigate, location.search]);
    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading)
            return;
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
            if (!data.success) {
                setError(data.error || 'Login inválido');
                return;
            }
            setUserId(String(data.userId));
            setUserEmail(data.email);
            setUserName(data.nome);
            setPin('');
            setCelular('');
            setStep('pin');
        }
        catch (err) {
            setError(err.message || 'Erro de conexão com o servidor');
        }
        finally {
            setLoading(false);
        }
    };
    const handleVerifyPin = async (e) => {
        e.preventDefault();
        if (loading)
            return;
        setError('');
        if (!pin || pin.length !== 6) {
            setError('Digite um PIN válido de 6 dígitos');
            return;
        }
        setLoading(true);
        try {
            const data = await api.verifyPin(userId, pin, celular || undefined);
            if (!data.success) {
                setError(data.error || 'PIN inválido');
                return;
            }
            const stepNext = data.step || data.nextStep;
            if (stepNext === '2fa-setup') {
                setQrCodeUrl(data.qrCodeUrl);
                setSecretKey(data.secretKey);
                setBackupCodes(data.backupCodes || []);
                setShowBackupCodes(true);
                setStep('2fa-setup');
            }
            else if (stepNext === '2fa-verify') {
                setCodigo2FA('');
                setStep('2fa-verify');
            }
        }
        catch (err) {
            setError(err.message || 'Erro de conexão');
        }
        finally {
            setLoading(false);
        }
    };
    const handleReenviarPin = async () => {
        if (reenviando || reenviandoRef.current || loading)
            return;
        setReenviando(true);
        reenviandoRef.current = true;
        setError('');
        try {
            const data = await api.resendPin(userId);
            if (data.success) {
                setSucesso('✅ Novo PIN enviado! Verifique seu e-mail.');
                setTimeout(() => setSucesso(''), 5000);
            }
            else
                setError(data.error || 'Erro ao reenviar');
        }
        catch (err) {
            setError(err.message || 'Erro de conexão');
        }
        finally {
            setTimeout(() => { setReenviando(false); reenviandoRef.current = false; }, 2000);
        }
    };
    const handleSetup2FA = useCallback(() => {
        if (loading)
            return;
        setCodigo2FA('');
        setShowBackupCodes(false);
        setStep('2fa-verify');
    }, [loading]);
    const handleVerify2FA = async (e) => {
        e.preventDefault();
        if (loading)
            return;
        if (!codigo2FA || codigo2FA.length !== 6) {
            setError('Digite o código de 6 dígitos');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await api.verify2FA(userId, codigo2FA);
            if (!data.success) {
                setError(data.error);
                return;
            }
            localStorage.setItem('fiel_token', data.token);
            localStorage.setItem('fiel_user', JSON.stringify(data.user));
            if (data.user?.role === 'admin')
                navigate('/paineladmin', { replace: true });
            else
                navigate('/', { replace: true });
        }
        catch (err) {
            setError(err.message || 'Erro de conexão');
        }
        finally {
            setLoading(false);
        }
    };
    const handleReset2FABackup = async (e) => {
        e.preventDefault();
        if (loading)
            return;
        setLoading(true);
        setError('');
        try {
            const data = await api.reset2FABackup(resetEmail, resetBackupCode);
            if (!data.success) {
                setError(data.error || 'Código inválido');
                return;
            }
            showPopup('2FA removido com sucesso', 'success');
            setStep('login');
        }
        catch (err) {
            setError(err.message || 'Erro de conexão');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSolicitarReset2FAEmail = async (e) => {
        e.preventDefault();
        if (loading)
            return;
        setLoading(true);
        setError('');
        try {
            const data = await api.solicitarReset2FA(resetEmail);
            if (!data.success) {
                setError(data.error);
                return;
            }
            setCountdown(60);
            setResetMethod('email');
        }
        catch (err) {
            setError(err.message || 'Erro de conexão');
        }
        finally {
            setLoading(false);
        }
    };
    const handleConfirmarReset2FA = async (e) => {
        e.preventDefault();
        if (loading)
            return;
        setLoading(true);
        setError('');
        const finalToken = resetToken && resetToken.trim() !== '' ? resetToken : resetTokenInput;
        if (!finalToken || finalToken.trim() === '') {
            setError('Token inválido');
            setLoading(false);
            return;
        }
        try {
            const data = await api.confirmarReset2FA(finalToken);
            if (!data.success) {
                setError(data.error);
                return;
            }
            showPopup('2FA resetado com sucesso!', 'success');
            setStep('login');
        }
        catch (err) {
            setError(err.message || 'Erro de conexão');
        }
        finally {
            setLoading(false);
        }
    };
    const handleEsqueciSenha = async (e) => {
        e.preventDefault();
        if (loading)
            return;
        setLoading(true);
        setError('');
        try {
            const data = await api.esqueciSenha(emailReset);
            if (!data.success) {
                setError(data.error);
                return;
            }
            setSucesso('✅ E-mail enviado! Verifique sua caixa de entrada.');
            setTimeout(() => setSucesso(''), 5000);
        }
        catch (err) {
            setError(err.message || 'Erro de conexão');
        }
        finally {
            setLoading(false);
        }
    };
    const handleConfirmarResetSenha = async (e) => {
        e.preventDefault();
        if (loading)
            return;
        const validCount = Object.values(pwChecks).filter(Boolean).length;
        if (validCount < 4) {
            setError('Senha fraca — use maiúsculas, minúsculas, números e caracteres especiais');
            return;
        }
        if (novaSenha !== confirmarNova) {
            setError('Senhas não coincidem');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await api.confirmarResetSenha(resetSenhaToken, novaSenha, resetUserId);
            if (!data.success) {
                setError(data.error);
                return;
            }
            showPopup('Senha alterada com sucesso!', 'success');
            setTimeout(() => { setStep('login'); setNovaSenha(''); setConfirmarNova(''); }, 2000);
        }
        catch (err) {
            setError(err.message || 'Erro de conexão');
        }
        finally {
            setLoading(false);
        }
    };
    // Input class usando bg-card do tema (igual ao Auth.tsx)
    const inputClass = 'w-full p-2.5 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
    const ErrorBox = ({ msg }) => (_jsxs("div", { className: "bg-destructive/10 border border-destructive/30 text-destructive p-2.5 rounded-lg text-xs mb-3 flex gap-2", children: [_jsx(AlertCircle, { size: 14, className: "mt-0.5 shrink-0" }), _jsx("span", { children: msg })] }));
    const SucessoBox = ({ msg }) => (_jsx("div", { className: "bg-green-100 border border-green-300 text-green-700 p-2.5 rounded-lg text-xs mb-3", children: msg }));
    const Popup = () => {
        if (!popupMessage)
            return null;
        return (_jsx("div", { className: `fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-lg transition-all duration-300 ${popupType === 'success' ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`, children: _jsxs("div", { className: "flex items-center gap-2", children: [popupType === 'success' ? _jsx(CheckCircle, { size: 18 }) : _jsx(AlertCircle, { size: 18 }), _jsx("span", { className: "text-sm font-medium", children: popupMessage })] }) }));
    };
    const CardHeader = ({ title, onBack, showReset2FA }) => (_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("button", { onClick: onBack, disabled: loading, className: "text-muted-foreground hover:text-foreground text-sm transition-colors", children: "\u2190 Voltar" }), title && _jsx("span", { className: "text-foreground font-bold text-sm", children: title }), showReset2FA ? (_jsxs("button", { onClick: () => setStep('reset-2fa'), className: "text-muted-foreground hover:text-foreground text-xs underline flex items-center gap-1", children: [_jsx(Smartphone, { size: 12 }), " Perdi meu celular"] })) : _jsx("span", { className: "w-24" })] }));
    const PasswordStrengthBar = () => {
        const strength = pwStrength();
        const getColor = () => {
            if (strength === 'strong')
                return 'bg-green-500 w-full';
            if (strength === 'medium')
                return 'bg-yellow-500 w-2/3';
            return 'bg-red-500 w-1/3';
        };
        const getLabel = () => {
            if (strength === 'strong')
                return ['Forte', 'text-green-600'];
            if (strength === 'medium')
                return ['Média', 'text-yellow-600'];
            return ['Fraca', 'text-red-500'];
        };
        const [label, color] = getLabel();
        if (novaSenha.length === 0)
            return null;
        return (_jsxs("div", { className: "mt-2", children: [_jsxs("div", { className: "flex justify-between items-center mb-1", children: [_jsx("span", { className: "text-muted-foreground text-xs", children: "For\u00E7a da senha:" }), _jsx("span", { className: `text-xs font-medium ${color}`, children: label })] }), _jsx("div", { className: "h-1.5 w-full bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all ${getColor()}` }) })] }));
    };
    const PasswordChecklist = () => (_jsx("div", { className: "mt-3 space-y-1.5", children: [['length', 'Mínimo 8 caracteres'], ['upper', 'Letra maiúscula (A-Z)'], ['lower', 'Letra minúscula (a-z)'], ['number', 'Número (0-9)'], ['special', 'Caractere especial (!@#$%^&*)']].map(([k, label]) => (_jsxs("div", { className: "flex items-center gap-2 text-xs", children: [pwChecks[k] ? _jsx(CheckCircle, { size: 14, className: "text-green-500" }) : _jsx(XCircle, { size: 14, className: "text-destructive/60" }), _jsx("span", { className: pwChecks[k] ? 'text-green-600' : 'text-muted-foreground', children: label })] }, k))) }));
    const mostrarLogo = shouldShowLogo(step);
    if (!authChecked) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" }), _jsx("p", { className: "text-foreground", children: "Verificando autentica\u00E7\u00E3o..." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen flex flex-col md:flex-row overflow-hidden bg-background", children: [_jsx(Popup, {}), _jsx("div", { className: "w-full md:w-1/2 flex items-center justify-center p-4 min-h-screen", children: _jsx("div", { className: "w-full max-w-sm", children: _jsxs("div", { className: "bg-card rounded-2xl border border-border shadow-lg overflow-hidden", children: [mostrarLogo && (_jsxs("div", { className: "pt-8 px-5 text-center bg-gradient-to-b from-muted/30 to-card", children: [_jsx("div", { className: "flex justify-center mb-3", children: _jsx("div", { className: "w-28 h-28 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg bg-primary p-2", children: _jsx("img", { src: "/images/logo.png", alt: "Pani Di Grano", className: "w-full h-full object-contain" }) }) }), _jsx("h1", { className: "text-foreground font-bold text-2xl", children: "Pani Di Grano" }), _jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "\u00C1rea Administrativa" })] })), !mostrarLogo && _jsx("div", { className: "pt-4 px-5" }), _jsxs("div", { className: "px-5 pb-6", children: [step === 'idle' && (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-muted-foreground text-xs text-center mb-4", children: "Acesso restrito \u00E0 administra\u00E7\u00E3o" }), _jsxs("button", { onClick: () => setStep('login'), className: "flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-6 rounded-lg w-full text-sm shadow-md transition-colors", children: [_jsx(LogIn, { size: 16 }), " Entrar"] })] })), step === 'login' && (_jsxs(_Fragment, { children: [_jsx(CardHeader, { onBack: handleBack }), error && _jsx(ErrorBox, { msg: error }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-3", children: [_jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { type: "email", placeholder: "E-mail", value: email, onChange: e => setEmail(e.target.value), className: "w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary", autoFocus: true, disabled: loading, required: true })] }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { type: mostrarSenha ? 'text' : 'password', placeholder: "Senha", value: senha, onChange: e => setSenha(e.target.value), className: "w-full py-2.5 pl-10 pr-10 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary", disabled: loading, required: true }), _jsx("button", { type: "button", onClick: () => setMostrarSenha(!mostrarSenha), className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", children: mostrarSenha ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] }), _jsx("div", { className: "text-right", children: _jsx("button", { type: "button", onClick: () => { setEmailReset(''); setStep('esqueci-senha'); }, className: "text-muted-foreground hover:text-foreground text-xs underline", children: "Esqueci minha senha" }) }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors", children: loading ? (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), "Entrando..."] })) : 'Entrar' })] })] })), step === 'pin' && (_jsxs(_Fragment, { children: [_jsx(CardHeader, { title: "Verifica\u00E7\u00E3o", onBack: handleBack }), error && _jsx(ErrorBox, { msg: error }), sucesso && _jsx(SucessoBox, { msg: sucesso }), _jsxs("form", { onSubmit: handleVerifyPin, className: "space-y-3", children: [_jsxs("div", { className: "text-center py-2", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-3 rounded-full border-2 border-primary/30 flex items-center justify-center overflow-hidden bg-primary", children: _jsx("img", { src: "/images/email.png", alt: "Email", className: "w-full h-full object-cover", onError: (e) => { e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/732/732200.png'; } }) }), _jsx("p", { className: "text-muted-foreground text-xs mb-1", children: "PIN de 6 d\u00EDgitos enviado para:" }), _jsx("p", { className: "text-foreground text-[11px] font-semibold", children: userEmail || email })] }), _jsx("input", { type: "text", maxLength: 6, placeholder: "000000", value: pin, onChange: e => setPin(e.target.value.replace(/\D/g, '')), className: "w-full p-3 bg-card border border-border text-foreground rounded-lg text-center text-2xl font-mono tracking-widest placeholder:text-muted-foreground focus:outline-none focus:border-primary", autoFocus: true, disabled: loading }), _jsxs("div", { children: [_jsx("input", { type: "tel", placeholder: "Telefone com DDD (opcional)", value: celular, onChange: e => setCelular(e.target.value.replace(/\D/g, '')), className: inputClass, disabled: loading, maxLength: 11 }), _jsx("p", { className: "text-muted-foreground text-[10px] mt-1", children: "Ex: 11999999999 \u2014 necess\u00E1rio para o 2FA" })] }), _jsx("button", { type: "submit", disabled: loading || pin.length !== 6, className: "w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors", children: loading ? 'Verificando...' : 'Continuar' }), _jsxs("button", { type: "button", onClick: handleReenviarPin, disabled: reenviando, className: "flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground text-[11px] underline mx-auto w-full", children: [_jsx(RefreshCw, { size: 10, className: reenviando ? 'animate-spin' : '' }), " N\u00E3o recebeu? Reenviar PIN"] })] })] })), step === '2fa-setup' && (_jsxs(_Fragment, { children: [_jsx(CardHeader, { title: "Configurar 2FA", onBack: handleBack }), error && _jsx(ErrorBox, { msg: error }), _jsxs("div", { className: "space-y-3 text-center", children: [_jsxs("div", { className: "bg-muted/30 p-2 rounded-lg border border-border", children: [_jsx("p", { className: "text-foreground/70 text-[10px] font-bold flex items-center justify-center gap-2 mb-1", children: "Instale o Google Authenticator" }), _jsxs("div", { className: "flex justify-center gap-3", children: [_jsx("a", { href: "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2", target: "_blank", rel: "noreferrer", className: "hover:opacity-80 transition-opacity", children: _jsx("img", { src: "/images/disponivelAndroid.png", alt: "Android", className: "w-16 h-16 object-contain" }) }), _jsx("a", { href: "https://apps.apple.com/br/app/google-authenticator/id388497605", target: "_blank", rel: "noreferrer", className: "hover:opacity-80 transition-opacity", children: _jsx("img", { src: "/images/disponiveIOS.png", alt: "iOS", className: "w-16 h-16 object-contain" }) })] })] }), showBackupCodes && backupCodes.length > 0 && (_jsxs("div", { className: "bg-muted/30 p-3 rounded-lg border border-border", children: [_jsxs("p", { className: "text-foreground/70 text-[11px] font-bold flex items-center justify-center gap-2 mb-2", children: [_jsx(AlertTriangle, { size: 14 }), " C\u00D3DIGOS DE RECUPERA\u00C7\u00C3O"] }), _jsx("p", { className: "text-muted-foreground text-[10px] mb-2", children: "Guarde em local seguro. Use um se perder o celular." }), _jsx("div", { className: "grid grid-cols-2 gap-1 bg-muted/50 p-2 rounded", children: backupCodes.map((code, idx) => (_jsx("code", { className: "text-foreground text-[10px] font-mono", children: code }, idx))) }), _jsxs("button", { onClick: () => { navigator.clipboard.writeText(backupCodes.join('\n')); showPopup('✅ Códigos copiados!', 'success'); }, className: "mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1", children: [_jsx(Copy, { size: 12 }), " Copiar todos"] })] })), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground text-xs mb-2", children: "Escaneie o QR Code:" }), _jsxs("div", { className: "flex items-center justify-center gap-4", children: [_jsx("div", { className: "bg-white p-3 rounded-lg inline-block border border-border", children: _jsx("img", { src: qrCodeUrl, alt: "QR", className: "w-40 h-40" }) }), _jsx("div", { className: "w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center overflow-hidden bg-primary", children: _jsx("img", { src: "/images/google-authenticator.png", alt: "GA", className: "w-full h-full object-cover rounded-full" }) })] })] }), _jsxs("div", { className: "bg-muted/30 p-3 rounded-lg border border-border", children: [_jsx("p", { className: "text-foreground/70 text-[10px] font-bold mb-1", children: "\uD83D\uDD10 Chave manual" }), _jsxs("div", { className: "flex items-center gap-2 bg-muted/50 p-2 rounded", children: [_jsx("code", { className: "text-foreground text-[10px] font-mono break-all flex-1", children: secretKey }), _jsx("button", { onClick: () => { navigator.clipboard.writeText(secretKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }, className: "text-muted-foreground hover:text-foreground shrink-0", children: copied ? _jsx(CheckCircle, { size: 13, className: "text-green-500" }) : _jsx(Copy, { size: 13 }) })] })] }), _jsx("button", { onClick: handleSetup2FA, className: "w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-sm transition-colors", children: "Continuar para verifica\u00E7\u00E3o" })] })] })), step === '2fa-verify' && (_jsxs(_Fragment, { children: [_jsx(CardHeader, { title: "Verificar 2FA", onBack: handleBack, showReset2FA: true }), error && _jsx(ErrorBox, { msg: error }), _jsxs("form", { onSubmit: handleVerify2FA, className: "space-y-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-3 rounded-full border-2 border-primary/30 flex items-center justify-center overflow-hidden bg-primary", children: _jsx("img", { src: "/images/google-authenticator.png", alt: "GA", className: "w-full h-full object-cover rounded-full" }) }), _jsx("p", { className: "text-foreground font-semibold text-sm", children: "Google Authenticator" }), _jsx("p", { className: "text-muted-foreground text-xs mt-1", children: "Digite o c\u00F3digo de 6 d\u00EDgitos do app" })] }), _jsx("input", { type: "text", maxLength: 6, placeholder: "000000", value: codigo2FA, onChange: e => setCodigo2FA(e.target.value.replace(/\D/g, '')), className: "w-full p-3 bg-card border border-border text-foreground rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-primary", autoFocus: true, disabled: loading }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors", children: loading ? 'Verificando...' : 'Acessar Painel' })] })] })), step === 'reset-2fa' && (_jsxs(_Fragment, { children: [_jsx(CardHeader, { title: "Recuperar Acesso", onBack: handleBack }), error && _jsx(ErrorBox, { msg: error }), _jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-muted-foreground text-xs text-center mb-2", children: "Escolha como recuperar o acesso" }), _jsxs("button", { onClick: () => setStep('reset-2fa-backup'), className: "w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2", children: [_jsx(Key, { size: 16 }), " Tenho um c\u00F3digo de backup"] }), _jsxs("button", { onClick: () => setStep('reset-2fa-email'), className: "w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2", children: [_jsx(Mail, { size: 16 }), " Receber link por e-mail"] }), _jsx("div", { className: "p-3 bg-destructive/10 rounded-lg border border-destructive/30", children: _jsxs("p", { className: "text-destructive text-[10px] text-center", children: [_jsx(AlertTriangle, { size: 12, className: "inline mr-1" }), "Se nenhuma op\u00E7\u00E3o funcionar, contate o administrador."] }) })] })] })), step === 'reset-2fa-backup' && (_jsxs(_Fragment, { children: [_jsx(CardHeader, { title: "C\u00F3digo de Backup", onBack: handleBack }), error && _jsx(ErrorBox, { msg: error }), _jsxs("form", { onSubmit: handleReset2FABackup, className: "space-y-3", children: [_jsxs("div", { className: "text-center mb-2", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-3 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary", children: _jsx(Key, { size: 32, className: "text-white" }) }), _jsx("p", { className: "text-muted-foreground text-xs", children: "Digite o c\u00F3digo de backup salvo ao configurar o 2FA" })] }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { type: "email", placeholder: "Seu e-mail", value: resetEmail, onChange: e => setResetEmail(e.target.value), className: "w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary", required: true, disabled: loading })] }), _jsx("input", { type: "text", placeholder: "C\u00F3digo de backup (ex: X7K9P2M4)", value: resetBackupCode, onChange: e => setResetBackupCode(e.target.value.toUpperCase()), className: inputClass, required: true, disabled: loading, maxLength: 8 }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors", children: loading ? 'Verificando...' : 'Remover 2FA' })] })] })), step === 'reset-2fa-email' && (_jsxs(_Fragment, { children: [_jsx(CardHeader, { title: "Recuperar por E-mail", onBack: handleBack }), error && _jsx(ErrorBox, { msg: error }), sucesso && _jsx(SucessoBox, { msg: sucesso }), !resetMethod ? (_jsxs("form", { onSubmit: handleSolicitarReset2FAEmail, className: "space-y-3", children: [_jsxs("div", { className: "text-center mb-2", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-3 rounded-full border-2 border-primary/30 flex items-center justify-center overflow-hidden bg-primary", children: _jsx("img", { src: "/images/email.png", alt: "Email", className: "w-full h-full object-cover" }) }), _jsx("p", { className: "text-muted-foreground text-xs", children: "Enviaremos um link para remover o 2FA. V\u00E1lido por 10 minutos." })] }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { type: "email", placeholder: "Seu e-mail", value: resetEmail, onChange: e => setResetEmail(e.target.value), className: "w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary", required: true, disabled: loading })] }), _jsx("button", { type: "submit", disabled: loading || countdown > 0, className: "w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors", children: loading ? 'Enviando...' : countdown > 0 ? `Aguarde ${countdown}s` : 'Enviar link de recuperação' })] })) : (_jsxs("form", { onSubmit: handleConfirmarReset2FA, className: "space-y-3", children: [_jsx("div", { className: "bg-green-100 border border-green-300 rounded-lg p-2 text-center mb-2", children: _jsx("p", { className: "text-green-700 text-xs", children: "\u2705 Link enviado! Verifique seu e-mail." }) }), _jsx("p", { className: "text-muted-foreground text-xs text-center", children: "Cole o token recebido por e-mail" }), _jsx("input", { type: "text", placeholder: "Token de recupera\u00E7\u00E3o", value: resetTokenInput, onChange: e => setResetTokenInput(e.target.value), className: inputClass, required: true, disabled: loading }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors", children: loading ? 'Verificando...' : 'Confirmar e remover 2FA' })] }))] })), step === 'esqueci-senha' && (_jsxs(_Fragment, { children: [_jsx(CardHeader, { onBack: handleBack }), error && _jsx(ErrorBox, { msg: error }), sucesso && _jsx(SucessoBox, { msg: sucesso }), !sucesso && (_jsxs("form", { onSubmit: handleEsqueciSenha, className: "space-y-3", children: [_jsxs("div", { className: "text-center mb-2", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-3 rounded-full border-2 border-primary/30 flex items-center justify-center overflow-hidden bg-primary", children: _jsx("img", { src: "/images/email.png", alt: "Email", className: "w-full h-full object-cover" }) }), _jsx("p", { className: "text-muted-foreground text-xs", children: "Digite seu e-mail para receber o link de redefini\u00E7\u00E3o." })] }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { type: "email", placeholder: "Seu e-mail cadastrado", value: emailReset, onChange: e => setEmailReset(e.target.value), className: "w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary", required: true, disabled: loading, autoFocus: true })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors", children: loading ? (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), "Enviando..."] })) : 'Enviar link de redefinição' })] }))] })), step === 'reset-senha' && (_jsxs(_Fragment, { children: [_jsx(CardHeader, { title: "Redefinir Senha", onBack: handleBack }), error && _jsx(ErrorBox, { msg: error }), _jsxs("form", { onSubmit: handleConfirmarResetSenha, className: "space-y-4", children: [_jsx("div", { className: "bg-green-100 border border-green-300 rounded-lg p-2 text-center mb-2", children: _jsx("p", { className: "text-green-700 text-xs", children: "\u2705 Link v\u00E1lido! Defina sua nova senha abaixo." }) }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { type: mostrarSenha ? 'text' : 'password', placeholder: "Nova senha", value: novaSenha, onChange: e => setNovaSenha(e.target.value), className: "w-full py-2.5 pl-10 pr-10 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary", required: true, disabled: loading, autoFocus: true }), _jsx("button", { type: "button", onClick: () => setMostrarSenha(!mostrarSenha), className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", children: mostrarSenha ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] }), _jsx(PasswordStrengthBar, {}), _jsx(PasswordChecklist, {}), _jsxs("div", { className: "relative", children: [_jsx(Lock, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { type: "password", placeholder: "Confirmar nova senha", value: confirmarNova, onChange: e => setConfirmarNova(e.target.value), className: "w-full py-2.5 pl-10 pr-3 bg-card border border-border text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary", required: true, disabled: loading })] }), confirmarNova && novaSenha !== confirmarNova && (_jsxs("div", { className: "flex items-center gap-1.5 text-destructive text-xs", children: [_jsx(XCircle, { size: 12 }), _jsx("span", { children: "As senhas n\u00E3o coincidem" })] })), confirmarNova && novaSenha === confirmarNova && novaSenha.length > 0 && (_jsxs("div", { className: "flex items-center gap-1.5 text-green-600 text-xs", children: [_jsx(CheckCircle, { size: 12 }), _jsx("span", { children: "Senhas coincidem" })] })), _jsx("button", { type: "submit", disabled: loading || novaSenha !== confirmarNova || Object.values(pwChecks).filter(Boolean).length < 4, className: "w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors", children: loading ? (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), "Redefinindo..."] })) : 'Redefinir senha' })] })] }))] })] }) }) }), _jsx("div", { className: "hidden md:flex md:w-1/2 bg-secondary items-center justify-center p-8", children: _jsxs("div", { className: "text-center max-w-sm", children: [_jsx("div", { className: "w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl mb-6 bg-primary", children: _jsx("img", { src: "/images/foto17.png", alt: "Pani Di Grano", className: "w-full h-full object-cover" }) }), _jsx("h2", { className: "text-secondary-foreground font-bold text-2xl mb-4", children: "Pani Di Grano" }), _jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-secondary-foreground/20", children: [_jsx("p", { className: "text-secondary-foreground/80 text-sm italic leading-relaxed mb-2", children: "\"Bolos e P\u00E3es Artesanais feitos com amor e ingredientes de qualidade.\"" }), _jsx("p", { className: "text-secondary-foreground/40 text-xs", children: "\u2014 Pani Di Grano" })] })] }) })] }));
}
