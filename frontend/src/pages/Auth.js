import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/Auth.tsx (versão atualizada)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
const Auth = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { login, register, isLoading: authLoading, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [twoFactorMode, setTwoFactorMode] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [tempToken, setTempToken] = useState("");
    // Login state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    // Register state
    const [registerName, setRegisterName] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPhone, setRegisterPhone] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
    // Redirecionar se já estiver logado
    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const result = await login(loginEmail, loginPassword);
        if (result.success) {
            toast({
                title: "Bem-vindo de volta!",
                description: "Login realizado com sucesso.",
            });
            navigate("/");
        }
        else if (result.requiresTwoFactor) {
            setTwoFactorMode(true);
            setTempToken(result.tempToken || "");
            toast({
                title: "Verificação em duas etapas",
                description: result.message || "Digite o código de autenticação",
            });
        }
        else {
            toast({
                title: "Erro no login",
                description: result.message || "Email ou senha incorretos",
                variant: "destructive",
            });
        }
        setIsLoading(false);
    };
    const handleVerify2fa = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await login(loginEmail, loginPassword);
        // Nota: Isso precisa ser ajustado para usar o verify2fa do contexto
        // Por enquanto, vamos simplificar
        setIsLoading(false);
    };
    const handleRegister = async (e) => {
        e.preventDefault();
        if (registerPassword !== registerConfirmPassword) {
            toast({
                title: "Erro",
                description: "As senhas não coincidem.",
                variant: "destructive",
            });
            return;
        }
        if (registerPassword.length < 6) {
            toast({
                title: "Erro",
                description: "A senha deve ter pelo menos 6 caracteres.",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        const result = await register(registerName, registerEmail, registerPassword, registerPhone);
        if (result.success) {
            toast({
                title: "Conta criada com sucesso!",
                description: "Você já pode fazer login.",
            });
            // Limpar formulário e ir para login
            setRegisterName("");
            setRegisterEmail("");
            setRegisterPhone("");
            setRegisterPassword("");
            setRegisterConfirmPassword("");
        }
        else {
            toast({
                title: "Erro no cadastro",
                description: result.message || "Não foi possível criar sua conta",
                variant: "destructive",
            });
        }
        setIsLoading(false);
    };
    if (twoFactorMode) {
        return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, { onLoginClick: () => { } }), _jsx("main", { className: "pt-24 pb-16", children: _jsx("div", { className: "container mx-auto px-4", children: _jsx("div", { className: "max-w-md mx-auto", children: _jsxs("div", { className: "bg-card rounded-2xl border border-border p-6", children: [_jsx("h2", { className: "font-display text-2xl font-bold text-center mb-4", children: "Verifica\u00E7\u00E3o em Duas Etapas" }), _jsx("p", { className: "text-muted-foreground text-center mb-6", children: "Digite o c\u00F3digo de autentica\u00E7\u00E3o gerado pelo seu aplicativo" }), _jsxs("form", { onSubmit: handleVerify2fa, className: "space-y-4", children: [_jsx(Input, { placeholder: "C\u00F3digo de 6 d\u00EDgitos", value: twoFactorCode, onChange: (e) => setTwoFactorCode(e.target.value), maxLength: 6, className: "text-center text-2xl tracking-widest" }), _jsx(Button, { type: "submit", className: "w-full btn-primary", disabled: isLoading, children: isLoading ? "Verificando..." : "Verificar" })] })] }) }) }) }), _jsx(Footer, {})] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, { onLoginClick: () => { } }), _jsx("main", { className: "pt-24 pb-16", children: _jsx("div", { className: "container mx-auto px-4", children: _jsxs("div", { className: "max-w-md mx-auto", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "font-display text-3xl font-bold text-secondary mb-2", children: "Acesse sua conta" }), _jsx("p", { className: "text-muted-foreground", children: "Fa\u00E7a login ou cadastre-se para fazer pedidos" })] }), _jsx("div", { className: "bg-card rounded-2xl border border-border p-6 shadow-lg", children: _jsxs(Tabs, { defaultValue: "login", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2 mb-6", children: [_jsx(TabsTrigger, { value: "login", children: "Entrar" }), _jsx(TabsTrigger, { value: "register", children: "Cadastrar" })] }), _jsx(TabsContent, { value: "login", children: _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "login-email", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "login-email", type: "email", placeholder: "seu@email.com", value: loginEmail, onChange: (e) => setLoginEmail(e.target.value), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "login-password", children: "Senha" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "login-password", type: showPassword ? "text" : "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: loginPassword, onChange: (e) => setLoginPassword(e.target.value), className: "pl-10 pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", children: showPassword ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }) })] })] }), _jsx(Button, { type: "submit", className: "w-full btn-primary", disabled: isLoading || authLoading, children: isLoading ? "Entrando..." : "Entrar" })] }) }), _jsx(TabsContent, { value: "register", children: _jsxs("form", { onSubmit: handleRegister, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-name", children: "Nome completo" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "register-name", type: "text", placeholder: "Seu nome", value: registerName, onChange: (e) => setRegisterName(e.target.value), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-email", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "register-email", type: "email", placeholder: "seu@email.com", value: registerEmail, onChange: (e) => setRegisterEmail(e.target.value), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-phone", children: "Telefone" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "register-phone", type: "tel", placeholder: "(11) 99999-9999", value: registerPhone, onChange: (e) => setRegisterPhone(e.target.value), className: "pl-10" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-password", children: "Senha" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "register-password", type: showPassword ? "text" : "password", placeholder: "M\u00EDnimo 6 caracteres", value: registerPassword, onChange: (e) => setRegisterPassword(e.target.value), className: "pl-10 pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", children: showPassword ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-confirm", children: "Confirmar senha" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "register-confirm", type: showPassword ? "text" : "password", placeholder: "Confirme sua senha", value: registerConfirmPassword, onChange: (e) => setRegisterConfirmPassword(e.target.value), className: "pl-10", required: true })] })] }), _jsx(Button, { type: "submit", className: "w-full btn-primary", disabled: isLoading, children: isLoading ? "Cadastrando..." : "Criar conta" })] }) })] }) })] }) }) }), _jsx(Footer, {})] }));
};
export default Auth;
