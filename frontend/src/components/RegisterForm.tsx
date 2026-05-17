import { useState } from "react";
import { User, Mail, Smartphone, Lock, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const API_BASE = (import.meta.env.VITE_WORKER_URL || 'http://localhost:8787/api').replace('/api', '');
const API = `${API_BASE}/api`;

interface RegisterFormProps {
  onSuccess: () => void;
}

const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pwChecks, setPwChecks] = useState({
    length: false, upper: false, lower: false, number: false, special: false
  });

  const checkPasswordStrength = (s: string) => {
    setPwChecks({
      length: s.length >= 8,
      upper: /[A-Z]/.test(s),
      lower: /[a-z]/.test(s),
      number: /[0-9]/.test(s),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(s)
    });
  };

  const getPasswordStrength = () => {
    const validCount = Object.values(pwChecks).filter(Boolean).length;
    if (senha.length === 0) return { color: "bg-gray-300", label: "", barWidth: "w-0" };
    if (validCount >= 4) return { color: "bg-green-500", label: "Forte", barWidth: "w-full" };
    if (validCount >= 2) return { color: "bg-yellow-500", label: "Média", barWidth: "w-2/3" };
    return { color: "bg-red-500", label: "Fraca", barWidth: "w-1/3" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!nome.trim()) {
      setError("Nome completo é obrigatório");
      setLoading(false);
      return;
    }
    if (!email || !email.includes("@")) {
      setError("E-mail válido é obrigatório");
      setLoading(false);
      return;
    }
    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }
    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }
    const validCount = Object.values(pwChecks).filter(Boolean).length;
    if (validCount < 3) {
      setError("Escolha uma senha mais forte");
      setLoading(false);
      return;
    }
    if (!telefone.replace(/\D/g, "").match(/^\d{10,11}$/)) {
      setError("Telefone inválido. Use DDD + número");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.toLowerCase().trim(),
          senha,
          telefone: telefone.replace(/\D/g, ""),
          role: "cliente"
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao cadastrar");
      }

      setSuccess("✅ Cadastro realizado! Faça login para continuar.");
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-lg text-xs flex gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 p-2.5 rounded-lg text-xs flex gap-2">
          <CheckCircle size={14} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="relative">
        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full py-2 pl-10 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          required
          disabled={loading}
        />
      </div>

      <div className="relative">
        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full py-2 pl-10 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          required
          disabled={loading}
        />
      </div>

      <div className="relative">
        <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="tel"
          placeholder="WhatsApp (DDD + número)"
          value={telefone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            let formatted = value;
            if (value.length <= 11) {
              if (value.length <= 2) formatted = value;
              else if (value.length <= 7) formatted = `(${value.slice(0,2)}) ${value.slice(2)}`;
              else formatted = `(${value.slice(0,2)}) ${value.slice(2,7)}-${value.slice(7,11)}`;
            }
            setTelefone(formatted);
          }}
          className="w-full py-2 pl-10 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          required
          disabled={loading}
        />
      </div>

      <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={mostrarSenha ? "text" : "password"}
          placeholder="Senha (mínimo 6 caracteres)"
          value={senha}
          onChange={(e) => {
            setSenha(e.target.value);
            checkPasswordStrength(e.target.value);
          }}
          className="w-full py-2 pl-10 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          required
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setMostrarSenha(!mostrarSenha)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {senha.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Força da senha:</span>
            <span className={`text-xs font-medium ${
              strength.label === "Forte" ? "text-green-600" : 
              strength.label === "Média" ? "text-yellow-600" : "text-red-500"
            }`}>
              {strength.label}
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.barWidth}`} />
          </div>
        </div>
      )}

      <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          className="w-full py-2 pl-10 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          required
          disabled={loading}
        />
      </div>

      {confirmarSenha && senha !== confirmarSenha && (
        <div className="flex items-center gap-1.5 text-red-500 text-xs">
          <XCircle size={12} />
          <span>As senhas não coincidem</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            Cadastrando...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Criar Conta <UserPlus size={16} />
          </span>
        )}
      </button>
    </form>
  );
};

export default RegisterForm;