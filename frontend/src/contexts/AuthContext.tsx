import React, { createContext, useContext, useState, useEffect } from 'react';

// Definição dos tipos
interface User {
  id: string;
  nome: string;
  email: string;
  role: 'user' | 'admin';
  twofa_enabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresTwoFactor?: boolean; tempToken?: string; message?: string }>;
  register: (nome: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  verify2fa: (code: string, tempToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Funções da API
const api = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  async register(nome: string, email: string, password: string, phone?: string) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nome, email, password, phone })
    });
    return response.json();
  },

  async verify2fa(code: string, tempToken: string) {
    const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code, tempToken })
    });
    return response.json();
  },

  async getUser() {
    const response = await fetch(`${API_BASE_URL}/auth/verificar`, {
      credentials: 'include'
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.user : null;
  },

  async logout() {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  },

  async forgotPassword(email: string) {
    const response = await fetch(`${API_BASE_URL}/auth/esqueci-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });
    return response.json();
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await api.getUser();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true };
      }
      if (response.requiresTwoFactor) {
        return { success: false, requiresTwoFactor: true, tempToken: response.tempToken, message: response.message };
      }
      return { success: false, message: response.message || 'Erro ao fazer login' };
    } catch (error) {
      return { success: false, message: 'Erro de conexão com o servidor' };
    }
  };

  const register = async (nome: string, email: string, password: string, phone?: string) => {
    try {
      const response = await api.register(nome, email, password, phone);
      if (response.success) {
        return { success: true };
      }
      return { success: false, message: response.message || 'Erro ao cadastrar' };
    } catch (error) {
      return { success: false, message: 'Erro de conexão com o servidor' };
    }
  };

  const verify2fa = async (code: string, tempToken: string) => {
    try {
      const response = await api.verify2fa(code, tempToken);
      if (response.success && response.user) {
        setUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    return api.forgotPassword(email);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, register, verify2fa, logout, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};