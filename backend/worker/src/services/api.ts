// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'user' | 'admin';
  twofa_enabled?: boolean;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
  requiresTwoFactor?: boolean;
  tempToken?: string;
}

export interface ContatoData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export const api = {
  // Autenticação
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  async register(nome: string, email: string, password: string, phone?: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nome, email, password, phone })
    });
    return response.json();
  },

  async verify2fa(code: string, tempToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code, tempToken })
    });
    return response.json();
  },

  async getUser(): Promise<User | null> {
    const response = await fetch(`${API_BASE_URL}/auth/verificar`, {
      credentials: 'include'
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.user : null;
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/esqueci-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });
    return response.json();
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/confirmar-reset-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token, newPassword })
    });
    return response.json();
  },

  // Contato
  async sendContact(data: ContatoData): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/contato/enviar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Admin
  async getAdminDados(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/dados`, {
      credentials: 'include'
    });
    return response.json();
  },

  async saveAdminDados(dados: any): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/dados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dados)
    });
    return response.json();
  },

  async getAdminPerfil(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/perfil`, {
      credentials: 'include'
    });
    return response.json();
  },

  async updateAdminPerfil(dados: any): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/perfil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dados)
    });
    return response.json();
  },

  async updateAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/alterar-senha`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return response.json();
  }
};