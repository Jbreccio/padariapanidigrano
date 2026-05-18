// frontend/src/pages/PainelAdmin.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Image, AlertCircle, LogOut,
  Trash2, Eye, Bell, Settings, Plus,
  Globe, X, Edit2, Check, ChevronLeft, ChevronRight,
  Clock, RefreshCw, Camera, DollarSign,
  ArrowLeft, Palette, Menu, Users, Heart, MapPin, Phone, Mail, Facebook, Instagram, Target, Award
} from 'lucide-react';
import { products as initialProducts, ProdutoAdmin, loadProducts, categories, Category } from '../data/products';

/// ============================================
// 🖼️ FUNÇÃO PARA CORRIGIR URL DO R2
// ============================================
const R2_PUBLIC_URL =
  'https://pub-7a286fb65b2f4f6f9a262893f0106232.r2.dev';

const getImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();

  if (!trimmed) return '';

  // Já é URL completa
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  // Caminho relativo vindo do Worker
  if (trimmed.startsWith('/r2/')) {
    return `${R2_PUBLIC_URL}${trimmed}`;
  }

  // Nome puro do arquivo
  return `${R2_PUBLIC_URL}/${trimmed}`;
};

// ============================================
// ✅ WORKER_URL — DEV E PRODUÇÃO
// ============================================
const WORKER_URL = import.meta.env.DEV
  ? 'http://localhost:8787/api'
  : (
      import.meta.env.VITE_WORKER_URL ||
      'https://padariapanidigrano.oibreccio.workers.dev'
    );

console.log('🔗 WORKER_URL (PainelAdmin):', WORKER_URL);


// ============================================
// DADOS INICIAIS
// ============================================
const DADOS_FIXOS_CARROSSEL = [
  { id: '1', imagem: '/images/carrossel/pao1.jpg', titulo: 'Pães Artesanais' },
  { id: '2', imagem: '/images/carrossel/bolo1.jpg', titulo: 'Bolos Caseiros' },
  { id: '3', imagem: '/images/carrossel/pao2.jpg', titulo: 'Pães Especiais' },
];

const DADOS_FIXOS_POPUP = [
  { id: '1', imagem: '/images/popup/popup01.png', tempoExibicao: 5, ativo: true, ordem: 1 },
  { id: '2', imagem: '/images/popup/popup02.png', tempoExibicao: 5, ativo: true, ordem: 2 },
];

const DADOS_SOBRE_NOS = {
  historia: 'A Padaria Pani Di Grano nasceu do sonho de oferecer pães e bolos artesanais de qualidade, feitos com ingredientes selecionados e muito amor. Desde 2010, estamos no coração da cidade, levando sabor e tradição para sua mesa.',
  missao: 'Produzir alimentos artesanais de alta qualidade, valorizando ingredientes naturais e o carinho no preparo, para proporcionar momentos especiais à sua família.',
  valores: ['Qualidade', 'Tradição', 'Sabor', 'Atendimento', 'Higiene'],
  endereco: 'Rua das Padarias, 123 - Centro, São Paulo - SP',
  telefone: '(11) 99999-9999',
  email: 'contato@panidigrano.com.br',
  facebook: 'https://facebook.com/panidigrano',
  instagram: 'https://instagram.com/panidigrano',
  horarioFuncionamento: 'Segunda a Sábado: 06h às 20h | Domingo: 06h às 12h'
};

const LIMITES = {
  CARROSSEL_MAX: 20,
  POPUP_MAX: 10,
  CARDAPIO_MAX: 200,
  RECADOS_MAX: 10
};

const temposExibicao = [
  { segundos: 5, label: '05s' },
  { segundos: 10, label: '10s' },
  { segundos: 20, label: '20s' }
];

// ============================================
// TIPOS
// ============================================
interface CarrosselItem { id: string; imagem: string; titulo?: string; ordem: number; ativo: boolean; }
interface PopupItem { id: string; imagem: string; tempoExibicao: number; ativo: boolean; ordem: number; }
interface RecadoItem { id: string; titulo: string; conteudo: string; dataCriacao: string; ativo: boolean; avisoimportante?: boolean; tempoExibicao?: number; }
interface SobreNosItem {
  historia: string;
  missao: string;
  valores: string[];
  endereco: string;
  telefone: string;
  email: string;
  facebook: string;
  instagram: string;
  horarioFuncionamento: string;
}
interface UserProfile { nome: string; email: string; cargo: string; avatar?: string; }

interface PerfilAdmin {
  nome: string;
  email: string;
  avatar?: string;
  corFundo?: string;
  imagemFundo?: string;
  tema: 'claro' | 'escuro';
}

const coresPalheta = [
  '#1a237e', '#0d47a1', '#1565c0', '#1976d2', '#2196f3', '#42a5f5',
  '#2e7d32', '#388e3c', '#43a047', '#4caf50', '#66bb6a',
  '#c62828', '#d32f2f', '#f44336', '#ef5350',
  '#4a148c', '#6a1b9a', '#8e24aa', '#ab47bc',
  '#e65100', '#f57c00', '#ff9800', '#ffb74d',
  '#37474f', '#546e7a', '#78909c', '#90a4ae', '#8B5A2B'
];

const fundosPredefinidos = [
  '/images/foto17.png',
  '/images/fundo.png',
  '/images/loja08.png',
];

// ============================================
// ✅ AUTENTICAÇÃO
// ============================================
const getAuthToken = (): string | null => {
  return localStorage.getItem('pani_token');
};

// ============================================
// ✅ UPLOAD PARA R2 — CORRIGIDO
// ============================================
const uploadParaR2 = async (file: File, tipo: string): Promise<string> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  // Validação básica do arquivo
  if (!file || file.size === 0) {
    throw new Error('Arquivo inválido ou vazio.');
  }

  // Limite de 10MB
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Arquivo muito grande. Máximo permitido: 10MB.');
  }

  const formData = new FormData();
  formData.append('imagem', file);
  formData.append('tipo', tipo);

  const uploadUrl = `${WORKER_URL}/r2/upload`;
  console.log(`📤 Upload [${tipo}] → ${uploadUrl} (${(file.size / 1024).toFixed(1)}KB)`);

  let response: Response;
  try {
    response = await fetch(uploadUrl, {
      method: 'POST',
      // ⚠️ NÃO definir Content-Type aqui — o browser seta automaticamente com o boundary correto
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
  } catch (networkError: any) {
    // TypeError: Failed to fetch normalmente indica CORS bloqueado ou servidor offline
    const isCors = networkError?.message?.includes('fetch') || networkError instanceof TypeError;
    if (isCors) {
      throw new Error(
        `Falha ao conectar com o servidor.\n` +
        `URL: ${uploadUrl}\n` +
        `Possíveis causas: worker offline, CORS bloqueado ou rede.\n` +
        `Verifique se VITE_API_URL está correto no .env`
      );
    }
    throw new Error(`Erro de rede: ${networkError?.message || 'desconhecido'}`);
  }

  // Tenta ler o corpo da resposta como texto primeiro para diagnóstico
  const responseText = await response.text();

  if (!response.ok) {
    let serverMessage = `Erro HTTP ${response.status}`;
    try {
      const errorJson = JSON.parse(responseText);
      serverMessage = errorJson.error || errorJson.message || serverMessage;
    } catch {
      // responseText não é JSON — pode ser HTML de erro
      if (response.status === 401) serverMessage = 'Sessão expirada. Faça login novamente.';
      else if (response.status === 403) serverMessage = 'Sem permissão para fazer upload.';
      else if (response.status === 413) serverMessage = 'Arquivo muito grande para o servidor.';
      else if (response.status === 0) serverMessage = 'Servidor inacessível (CORS ou rede).';
    }
    throw new Error(serverMessage);
  }

  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error('Resposta inválida do servidor (não é JSON).');
  }

  if (!data.success) {
    throw new Error(data.error || data.message || 'Falha no upload: resposta sem sucesso.');
  }

  if (!data.url) {
    throw new Error('Upload concluído, mas URL não retornada pelo servidor.');
  }

  return data.url;
};

// ============================================
// ✅ HELPER — SALVAR NO KV COM RETRY
// ============================================
const salvarDadosKV = async (dados: object, token: string): Promise<{ success: boolean; error?: string }> => {
  const saveUrl = `${WORKER_URL}/admin/dados`;
  console.log(`💾 Salvando no KV → ${saveUrl}`);

  let response: Response;
  try {
    response = await fetch(saveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(dados),
    });
  } catch (networkError: any) {
    const msg = networkError instanceof TypeError
      ? `Falha ao conectar: ${saveUrl}\nVerifique se VITE_API_URL está correto no .env`
      : `Erro de rede: ${networkError?.message || 'desconhecido'}`;
    return { success: false, error: msg };
  }

  const responseText = await response.text();

  if (!response.ok) {
    let serverMessage = `Erro HTTP ${response.status}`;
    try {
      const errorJson = JSON.parse(responseText);
      serverMessage = errorJson.error || errorJson.message || serverMessage;
    } catch {
      if (response.status === 401) serverMessage = 'Sessão expirada.';
      else if (response.status === 403) serverMessage = 'Sem permissão para salvar.';
    }
    return { success: false, error: serverMessage };
  }

  let result: any;
  try {
    result = JSON.parse(responseText);
  } catch {
    return { success: false, error: 'Resposta inválida do servidor.' };
  }

  if (!result.success) {
    return { success: false, error: result.error || result.message || 'Erro ao salvar no KV.' };
  }

  return { success: true };
};

export default function PainelAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'carrossel-home' | 'cardapio' | 'popup' | 'sobre-nos' | 'recados'>('carrossel-home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'published'|'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ nome: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({ nome: '', email: '', cargo: 'Administrador', avatar: undefined });
  
  // Estados do Carrossel
  const [fotosCarrossel, setFotosCarrossel] = useState<CarrosselItem[]>(
    DADOS_FIXOS_CARROSSEL.map((item, idx) => ({ ...item, ordem: idx, ativo: true }))
  );
  
  // Estados do Cardápio
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>([]);
  const [novoProduto, setNovoProduto] = useState({
    name: '', description: '', price: 0, category: '', imageUrl: '', available: true
  });
  const [editingProdutoId, setEditingProdutoId] = useState<string | null>(null);
  const [editProdutoForm, setEditProdutoForm] = useState({ name: '', description: '', price: 0, category: '', imageUrl: '' });
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Estados do Popup
  const [popups, setPopups] = useState<PopupItem[]>(DADOS_FIXOS_POPUP);
  const [editingPopupId, setEditingPopupId] = useState<string|null>(null);
  
  // Estados do Sobre Nós
  const [sobreNos, setSobreNos] = useState<SobreNosItem>(DADOS_SOBRE_NOS);
  const [editandoSobre, setEditandoSobre] = useState(false);
  const [editSobreForm, setEditSobreForm] = useState<SobreNosItem>(DADOS_SOBRE_NOS);
  
  // Estados dos Recados
  const [recados, setRecados] = useState<RecadoItem[]>([]);
  const [novoRecado, setNovoRecado] = useState({ titulo: '', conteudo: '', avisoimportante: false });
  const [tempoExibicaoRecados, setTempoExibicaoRecados] = useState(5);
  const [editingRecadoId, setEditingRecadoId] = useState<string | null>(null);
  const [editRecadoForm, setEditRecadoForm] = useState({ titulo: '', conteudo: '' });

  const [perfilAdmin, setPerfilAdmin] = useState<PerfilAdmin>({
    nome: '',
    email: '',
    avatar: undefined,
    corFundo: '#8B5A2B',
    imagemFundo: undefined,
    tema: 'escuro'
  });
  const [fundoTipo, setFundoTipo] = useState<'cor' | 'imagem'>('cor');

  const handleUploadImagemFundo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadParaR2(file, 'fundo_admin');
      setPerfilAdmin({ ...perfilAdmin, imagemFundo: url, corFundo: undefined });
      alert('✅ Imagem de fundo enviada com sucesso!');
    } catch (error) {
      alert(`❌ Erro ao fazer upload da imagem de fundo:\n${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Carregar produtos do arquivo products.ts
  useEffect(() => {
    const loadProdutos = async () => {
      await loadProducts();
      const adminProducts = initialProducts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        imageUrl: p.imageUrl || '',
        available: p.available,
        ordem: 0
      }));
      setProdutos(adminProducts);
      
      const uniqueCategories = [...new Set(adminProducts.map(p => p.category))];
      setCategoriasDisponiveis(uniqueCategories);
    };
    loadProdutos();
  }, []);

  // Verificar autenticação
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      const token = getAuthToken();
      const userStr = localStorage.getItem('pani_user');
      
      if (!token || !userStr) {
        if (isMounted) navigate('/panilogin');
        return;
      }
      
      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
          if (isMounted) navigate('/painelcliente');
          return;
        }
        
        if (isMounted) {
          setPerfilAdmin(prev => ({
            ...prev,
            nome: user.nome || 'Admin',
            email: user.email || '',
          }));
          setUserProfile({
            nome: user.nome || 'Admin',
            email: user.email || '',
            cargo: 'Administrador',
            avatar: undefined,
          });
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Erro na autenticação:', err);
        if (isMounted) navigate('/panilogin');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    checkAuth();
    return () => { isMounted = false; };
  }, [navigate]);

  // Carregar dados do backend
  useEffect(() => {
    if (!isAuthenticated) return;
    const carregarDados = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const dadosUrl = `${WORKER_URL}/admin/dados`;
        console.log(`📥 Carregando dados → ${dadosUrl}`);

        const response = await fetch(dadosUrl, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          console.warn(`⚠️ Falha ao carregar dados: HTTP ${response.status}`);
          return;
        }

        const data = await response.json();
        if (data.success && data.dados) {
          const d = data.dados;
          if (Array.isArray(d.carrossel) && d.carrossel.length) setFotosCarrossel(d.carrossel);
          if (Array.isArray(d.popups) && d.popups.length) setPopups(d.popups);
          if (d.sobreNos) setSobreNos(d.sobreNos);
          if (Array.isArray(d.recados)) setRecados(d.recados);
        }
      } catch (e) {
        console.warn('⚠️ Sem dados no servidor.', e);
      }
    };
    carregarDados();
  }, [isAuthenticated]);

  // ============================================
  // ✅ SALVAR E PUBLICAR — CORRIGIDO
  // ============================================
  const salvarEPublicar = async () => {
    setSaveStatus('saving');
    setSaveError('');

    const token = getAuthToken();

    if (!token) {
      alert('Sessão expirada. Faça login novamente.');
      navigate('/panilogin');
      return;
    }

    const dados = {
      carrossel: fotosCarrossel,
      cardapio: produtos,
      popups,
      sobreNos,
      recados,
    };

    const resultado = await salvarDadosKV(dados, token);

    if (resultado.success) {
      setLastSyncTime(new Date().toLocaleTimeString());
      setSaveStatus('published');
      setTimeout(() => setSaveStatus('idle'), 3000);
      alert('✅ Dados salvos e publicados com sucesso!');
      window.dispatchEvent(new CustomEvent('dadosAtualizados'));
    } else {
      const errorMsg = resultado.error || 'Erro desconhecido ao salvar';
      setSaveError(`❌ ${errorMsg}`);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 6000);

      // Se sessão expirada, redireciona
      if (resultado.error?.includes('expirada') || resultado.error?.includes('401')) {
        localStorage.removeItem('pani_token');
        localStorage.removeItem('pani_user');
        alert('Sessão expirada. Faça login novamente.');
        navigate('/panilogin');
      } else {
        alert(`❌ Erro ao salvar:\n${errorMsg}`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pani_token');
    localStorage.removeItem('pani_user');
    navigate('/panilogin');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadParaR2(file, 'avatar');
      setUserProfile({ ...userProfile, avatar: url });
      setPerfilAdmin({ ...perfilAdmin, avatar: url });
    } catch (error) {
      alert(`❌ Erro ao fazer upload do avatar:\n${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleSaveProfile = async () => {
    setPerfilAdmin({ ...perfilAdmin, nome: editProfileForm.nome, email: editProfileForm.email });
    const userStr = localStorage.getItem('pani_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        user.nome = editProfileForm.nome;
        user.email = editProfileForm.email;
        localStorage.setItem('pani_user', JSON.stringify(user));
      } catch {}
    }
    setShowEditProfileModal(false);
    alert('✅ Perfil atualizado!');
  };

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      alert('❌ Preencha todos os campos!');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      alert('❌ As senhas não coincidem!');
      return;
    }
    if (passwordForm.new.length < 6) {
      alert('❌ Mínimo 6 caracteres!');
      return;
    }
    setShowChangePasswordModal(false);
    setPasswordForm({ current: '', new: '', confirm: '' });
    alert('✅ Senha alterada com sucesso!');
  };

  // ============================================
  // ✅ HANDLERS DO CARROSSEL — CORRIGIDO
  // ============================================
  const handleUploadCarrossel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const sucessos: CarrosselItem[] = [];
    const erros: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const url = await uploadParaR2(file, 'carrossel');
        sucessos.push({
          id: `${Date.now()}_${i}`,
          imagem: url,
          titulo: `Nova Imagem ${fotosCarrossel.length + i + 1}`,
          ordem: fotosCarrossel.length + i,
          ativo: true,
        });
      } catch (error) {
        erros.push(`${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    if (sucessos.length > 0) {
      setFotosCarrossel(prev => [...prev, ...sucessos]);
    }

    if (erros.length > 0) {
      alert(`⚠️ Alguns uploads falharam:\n${erros.join('\n')}`);
    } else if (sucessos.length > 0) {
      alert(`✅ ${sucessos.length} imagem(ns) adicionada(s) com sucesso!`);
    }

    // Limpa o input para permitir re-upload do mesmo arquivo
    e.target.value = '';
  };

  const handleDeleteCarrossel = (id: string) => {
    if (confirm('Excluir esta imagem do carrossel?')) {
      setFotosCarrossel(prev => prev.filter(i => i.id !== id));
    }
  };
  const handleToggleAtivoCarrossel = (id: string) => setFotosCarrossel(prev => prev.map(i => i.id === id ? { ...i, ativo: !i.ativo } : i));
  const handleReorderCarrossel = (fromIndex: number, toIndex: number) => {
    const newItems = [...fotosCarrossel];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    setFotosCarrossel(newItems.map((item, idx) => ({ ...item, ordem: idx })));
  };

  // ============================================
  // ✅ HANDLERS DO CARDÁPIO — CORRIGIDO
  // ============================================
  const handleUploadProdutoImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const file = files[0];
      const url = await uploadParaR2(file, 'cardapio');
      setNovoProduto(prev => ({ ...prev, imageUrl: url }));
      alert('✅ Imagem enviada! Complete as informações do produto.');
    } catch (error) {
      alert(`❌ Erro ao fazer upload da imagem:\n${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // ✅ Upload de imagem ao editar produto
  const handleUploadEditProdutoImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const file = files[0];
      const url = await uploadParaR2(file, 'cardapio');
      setEditProdutoForm(prev => ({ ...prev, imageUrl: url }));
      alert('✅ Imagem atualizada!');
    } catch (error) {
      alert(`❌ Erro ao fazer upload da imagem:\n${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddProduto = () => {
    if (!novoProduto.name.trim()) { alert('Preencha o nome do produto!'); return; }
    if (!novoProduto.imageUrl) { alert('Faça o upload da imagem do produto!'); return; }
    if (novoProduto.price <= 0) { alert('Preço deve ser maior que zero!'); return; }
    if (!novoProduto.category) { alert('Selecione uma categoria!'); return; }

    const novo: ProdutoAdmin = {
      id: `${Date.now()}`,
      name: novoProduto.name.trim(),
      description: novoProduto.description.trim(),
      price: novoProduto.price,
      category: novoProduto.category,
      imageUrl: novoProduto.imageUrl,
      available: true,
      ordem: produtos.length,
    };

    setProdutos(prev => [...prev, novo]);
    setNovoProduto({ name: '', description: '', price: 0, category: '', imageUrl: '', available: true });

    if (!categoriasDisponiveis.includes(novo.category)) {
      setCategoriasDisponiveis(prev => [...prev, novo.category]);
    }

    alert('✅ Produto adicionado! Lembre-se de salvar.');
  };

  const handleStartEditProduto = (produto: ProdutoAdmin) => {
    setEditingProdutoId(produto.id);
    setEditProdutoForm({
      name: produto.name,
      description: produto.description || '',
      price: produto.price,
      category: produto.category,
      imageUrl: produto.imageUrl,
    });
  };

  const handleSaveEditProduto = () => {
    if (!editingProdutoId) return;
    if (!editProdutoForm.name.trim()) { alert('Nome não pode ser vazio!'); return; }
    if (editProdutoForm.price <= 0) { alert('Preço deve ser maior que zero!'); return; }

    setProdutos(prev => prev.map(p =>
      p.id === editingProdutoId
        ? { ...p, name: editProdutoForm.name.trim(), description: editProdutoForm.description.trim(), price: editProdutoForm.price, category: editProdutoForm.category, imageUrl: editProdutoForm.imageUrl }
        : p
    ));
    setEditingProdutoId(null);
    setEditProdutoForm({ name: '', description: '', price: 0, category: '', imageUrl: '' });
    alert('✅ Produto editado! Lembre-se de salvar.');
  };

  const handleCancelEditProduto = () => {
    setEditingProdutoId(null);
    setEditProdutoForm({ name: '', description: '', price: 0, category: '', imageUrl: '' });
  };

  const handleDeleteProduto = (id: string) => {
    if (confirm('Excluir este produto?')) {
      setProdutos(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleAtivoProduto = (id: string) => setProdutos(prev => prev.map(p => p.id === id ? { ...p, available: !p.available } : p));

  const produtosFiltrados = produtos.filter(p => categoriaFiltro === 'todos' || p.category === categoriaFiltro);

  // ============================================
  // ✅ HANDLERS DO POPUP — CORRIGIDO
  // ============================================
  const handleUploadPopups = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const sucessos: PopupItem[] = [];
    const erros: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const url = await uploadParaR2(file, 'popup');
        sucessos.push({
          id: `${Date.now()}_${i}`,
          imagem: url,
          tempoExibicao: 10,
          ativo: true,
          ordem: popups.length + i,
        });
      } catch (error) {
        erros.push(`${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    if (sucessos.length > 0) {
      setPopups(prev => [...prev, ...sucessos]);
    }

    if (erros.length > 0) {
      alert(`⚠️ Alguns uploads falharam:\n${erros.join('\n')}`);
    } else if (sucessos.length > 0) {
      alert(`✅ ${sucessos.length} popup(s) adicionado(s) com sucesso!`);
    }

    e.target.value = '';
  };

  const handleDeletePopup = (id: string) => {
    if (confirm('Excluir este popup?')) {
      setPopups(prev => prev.filter(p => p.id !== id));
    }
  };
  const handleToggleAtivoPopup = (id: string) => setPopups(prev => prev.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p));
  const handleTempoExibicao = (id: string, tempo: number) => setPopups(prev => prev.map(p => p.id === id ? { ...p, tempoExibicao: tempo } : p));
  const handleReorderPopup = (id: string, direction: 'up' | 'down') => {
    const index = popups.findIndex(p => p.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === popups.length - 1)) return;
    const newPopups = [...popups];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newPopups[index], newPopups[newIndex]] = [newPopups[newIndex], newPopups[index]];
    setPopups(newPopups.map((item, idx) => ({ ...item, ordem: idx })));
  };
  const handleSavePopupEdit = (id: string, field: keyof PopupItem, value: any) => setPopups(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  // ============================================
  // HANDLERS DO SOBRE NÓS
  // ============================================
  const handleStartEditSobre = () => { setEditSobreForm(sobreNos); setEditandoSobre(true); };
  const handleSaveEditSobre = () => { setSobreNos(editSobreForm); setEditandoSobre(false); alert('✅ Informações salvas! Lembre-se de clicar em "Salvar e Publicar".'); };
  const handleCancelEditSobre = () => { setEditandoSobre(false); setEditSobreForm(sobreNos); };
  const handleAddValor = () => setEditSobreForm(prev => ({ ...prev, valores: [...prev.valores, ''] }));
  const handleUpdateValor = (index: number, value: string) => {
    const novosValores = [...editSobreForm.valores];
    novosValores[index] = value;
    setEditSobreForm(prev => ({ ...prev, valores: novosValores }));
  };
  const handleRemoveValor = (index: number) => {
    setEditSobreForm(prev => ({ ...prev, valores: prev.valores.filter((_, i) => i !== index) }));
  };

  // ============================================
  // HANDLERS DOS RECADOS
  // ============================================
  const handleAddRecado = () => {
    if (!novoRecado.titulo.trim() || !novoRecado.conteudo.trim()) { alert('Preencha título e conteúdo!'); return; }
    setRecados(prev => [...prev, { ...novoRecado, id: `${Date.now()}`, dataCriacao: new Date().toLocaleDateString('pt-BR'), ativo: true, tempoExibicao: tempoExibicaoRecados }]);
    setNovoRecado({ titulo: '', conteudo: '', avisoimportante: false });
  };

  const handleStartEditRecado = (recado: RecadoItem) => { setEditingRecadoId(recado.id); setEditRecadoForm({ titulo: recado.titulo, conteudo: recado.conteudo }); };
  const handleSaveEditRecado = () => {
    if (!editingRecadoId) return;
    if (!editRecadoForm.titulo.trim() || !editRecadoForm.conteudo.trim()) { alert('Título e conteúdo não podem ser vazios!'); return; }
    setRecados(prev => prev.map(r => r.id === editingRecadoId ? { ...r, titulo: editRecadoForm.titulo, conteudo: editRecadoForm.conteudo } : r));
    setEditingRecadoId(null);
    setEditRecadoForm({ titulo: '', conteudo: '' });
    alert('✅ Recado editado!');
  };
  const handleCancelEditRecado = () => { setEditingRecadoId(null); setEditRecadoForm({ titulo: '', conteudo: '' }); };
  const handleDeleteRecado = (id: string) => { if (confirm('Excluir este recado?')) setRecados(prev => prev.filter(r => r.id !== id)); };
  const handleToggleAtivoRecado = (id: string) => setRecados(prev => prev.map(r => r.id === id ? { ...r, ativo: !r.ativo } : r));
  const handleToggleAvisoImportanteRecado = (id: string) => setRecados(prev => prev.map(r => r.id === id ? { ...r, avisoimportante: !r.avisoimportante } : r));
  const handleTempoExibicaoRecado = (id: string, tempo: number) => setRecados(prev => prev.map(r => r.id === id ? { ...r, tempoExibicao: tempo } : r));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-secondary-foreground">Verificando autenticação...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return null;

  const menuItems = [
    { id: 'carrossel-home', label: 'Carrossel Hero', icon: Image, count: fotosCarrossel.filter(f => f.ativo).length },
    { id: 'cardapio', label: 'Cardápio', icon: Menu, count: produtos.filter(p => p.available).length },
    { id: 'popup', label: 'Popup', icon: Bell, count: popups.filter(p => p.ativo).length },
    { id: 'sobre-nos', label: 'Sobre Nós', icon: Users, count: 1 },
    { id: 'recados', label: 'Recados', icon: AlertCircle, count: recados.filter(r => r.ativo).length },
  ];

  return (
    <div
      className="min-h-screen flex overflow-hidden bg-secondary"
      style={perfilAdmin.imagemFundo ? {
        backgroundImage: `url('${getImageUrl(perfilAdmin.imagemFundo)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      } : {
        backgroundColor: perfilAdmin.corFundo || '#8B5A2B',
      }}
    >
      <div className="fixed inset-0 bg-black/40 z-0"></div>

      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-16'} bg-secondary border-r border-secondary-foreground/20 shadow-xl transition-all duration-300 flex flex-col fixed h-screen top-0 left-0 z-40 overflow-y-auto overflow-x-hidden`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-8 right-4 z-50 p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} className={`text-secondary-foreground transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
        </button>

        <div className="mt-20">
          {sidebarOpen && (
            <div className="flex items-center gap-2 px-6 pb-4 flex-shrink-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Settings size={18} className="text-primary-foreground" />
              </div>
              <span className="text-secondary-foreground font-bold text-lg">Pani Di Grano</span>
            </div>
          )}

          <div className="p-5 flex flex-col items-center">
            <div className="relative group mb-4 flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg overflow-hidden border-4 border-white/20">
                {perfilAdmin.avatar
                  ? <img src={getImageUrl(perfilAdmin.avatar)} alt={perfilAdmin.nome} className="w-full h-full object-cover" />
                  : (perfilAdmin.nome?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD')}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 cursor-pointer hover:bg-primary/80 transition-colors shadow-lg opacity-0 group-hover:opacity-100">
                <Camera size={12} className="text-primary-foreground" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            {sidebarOpen && (
              <div className="text-center w-full mb-4">
                <p className="font-semibold text-secondary-foreground truncate text-lg">{perfilAdmin.nome || 'Administrador'}</p>
                <p className="text-sm text-secondary-foreground/70 mb-1">{userProfile.cargo}</p>
                <p className="text-xs text-secondary-foreground/50 truncate mb-4">{perfilAdmin.email || 'admin@panidigrano.com'}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-secondary-foreground/70">
                  <button onClick={() => { setEditProfileForm({ nome: perfilAdmin.nome, email: perfilAdmin.email }); setShowEditProfileModal(true); }} className="hover:text-secondary-foreground transition-colors">Editar Perfil</button>
                  <span className="text-secondary-foreground/30">/</span>
                  <button onClick={() => setShowChangePasswordModal(true)} className="hover:text-secondary-foreground transition-colors">Alterar Senha</button>
                </div>
                <p className="text-xs text-secondary-foreground/40 mt-2">Última sync: {lastSyncTime}</p>
              </div>
            )}
          </div>

          {sidebarOpen && <div className="border-t border-secondary-foreground/20 mx-4 mb-4"></div>}

          <nav className="px-4 pb-4 space-y-1">
            {menuItems.map((item, index) => (
              <div key={item.id}>
                <button onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-primary/20 text-secondary-foreground shadow-lg border border-primary/30'
                      : 'text-secondary-foreground/70 hover:bg-white/10 hover:text-secondary-foreground'
                  } ${!sidebarOpen && 'justify-center px-2'}`}>
                  <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-primary/30' : 'bg-white/10'}`}>
                    <item.icon size={sidebarOpen ? 18 : 20} className={activeTab === item.id ? 'text-primary' : 'text-secondary-foreground/60'} />
                  </div>
                  {sidebarOpen && (<><span className="flex-1 text-left text-sm font-medium">{item.label}</span><span className="text-xs px-2 py-1 rounded-full bg-primary/30 text-secondary-foreground">{item.count}</span></>)}
                </button>
                {sidebarOpen && index < menuItems.length - 1 && <div className="border-t border-secondary-foreground/10 my-1"></div>}
              </div>
            ))}

            <button
              onClick={() => setShowEditProfileModal(true)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-secondary-foreground/70 hover:bg-white/10 hover:text-secondary-foreground ${!sidebarOpen && 'justify-center px-2'}`}
            >
              <div className="p-2 rounded-lg bg-white/10">
                <Palette size={sidebarOpen ? 18 : 20} className="text-secondary-foreground/60" />
              </div>
              {sidebarOpen && <span className="flex-1 text-left text-sm font-medium">Personalizar</span>}
            </button>

            <div className="border-t border-secondary-foreground/20 my-2"></div>

            <button onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-300 hover:bg-red-500/20 hover:text-red-200 ${!sidebarOpen && 'justify-center px-2'}`}>
              <div className="p-2 rounded-lg bg-red-500/20">
                <LogOut size={sidebarOpen ? 18 : 20} className="text-red-300" />
              </div>
              {sidebarOpen && <span className="flex-1 text-left text-sm font-medium">Sair</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-16'} relative z-10 overflow-y-auto min-h-screen`}>
        <main className="container mx-auto px-4 pt-8 pb-32">

          {/* CARDS RESUMO */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Carrossel Hero', count: fotosCarrossel.filter(f => f.ativo).length, total: fotosCarrossel.length },
              { label: 'Cardápio', count: produtos.filter(p => p.available).length, total: produtos.length },
              { label: 'Popups Ativos', count: popups.filter(p => p.ativo).length, total: popups.length },
              { label: 'Recados', count: recados.filter(r => r.ativo).length, total: recados.length },
            ].map(card => (
              <div key={card.label} className="bg-white/95 backdrop-blur-sm rounded-lg shadow p-3 border border-white/20">
                <div className="flex flex-col">
                  <p className="text-xs text-gray-500 font-medium truncate">{card.label}</p>
                  <p className="text-xl font-bold text-gray-800">{card.count}<span className="text-xs font-normal text-gray-500 ml-1">/ {card.total}</span></p>
                </div>
              </div>
            ))}
          </div>

          {/* ============================================ */}
          {/* CARROSSEL HOME */}
          {/* ============================================ */}
          {activeTab === 'carrossel-home' && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-4 sm:p-8 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Gerenciar Carrossel da Home</h2>
                <div className={`px-3 py-1 rounded-full text-sm ${fotosCarrossel.length >= LIMITES.CARROSSEL_MAX ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{fotosCarrossel.length}/{LIMITES.CARROSSEL_MAX}</div>
              </div>

              <div className="mb-6">
                <div className="border-2 border-dashed border-primary/50 rounded-xl p-6 text-center hover:border-primary bg-primary/10">
                  <Upload className="w-5 h-5 text-primary mx-auto mb-3" />
                  <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm cursor-pointer transition-colors text-white ${fotosCarrossel.length >= LIMITES.CARROSSEL_MAX ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'bg-primary hover:bg-primary/80'}`}>
                    <Plus size={16} /> Adicionar Imagens ({fotosCarrossel.length}/{LIMITES.CARROSSEL_MAX})
                    <input type="file" multiple accept="image/*" onChange={handleUploadCarrossel} className="hidden" disabled={fotosCarrossel.length >= LIMITES.CARROSSEL_MAX} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {fotosCarrossel.map((item, index) => (
                  <div key={item.id} className="border border-white/20 rounded-lg overflow-hidden bg-white/10 group">
                    <div className="relative">
                      <img src={getImageUrl(item.imagem)} alt={item.titulo} className="w-full h-40 object-cover bg-gray-100" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button onClick={() => handleToggleAtivoCarrossel(item.id)} className={`p-1 rounded-full ${item.ativo ? 'bg-green-500' : 'bg-red-500'}`}><Eye size={12} className="text-white" /></button>
                        <button onClick={() => handleDeleteCarrossel(item.id)} className="p-1 bg-red-500 rounded-full"><Trash2 size={12} className="text-white" /></button>
                      </div>
                      <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {index > 0 && <button onClick={() => handleReorderCarrossel(index, index - 1)} className="p-1 bg-primary rounded text-white"><ChevronLeft size={10} /></button>}
                        {index < fotosCarrossel.length - 1 && <button onClick={() => handleReorderCarrossel(index, index + 1)} className="p-1 bg-primary rounded text-white"><ChevronRight size={10} /></button>}
                      </div>
                    </div>
                    <div className="p-3">
                      <input type="text" value={item.titulo || ''} onChange={(e) => setFotosCarrossel(prev => prev.map(i => i.id === item.id ? { ...i, titulo: e.target.value } : i))}
                        className="w-full text-sm border border-white/20 rounded px-2 py-1 mb-1 bg-white/10 text-white placeholder-white/50" placeholder="Título" />
                      <div className="flex justify-between text-xs text-white/60">
                        <span>Pos: {item.ordem + 1}</span>
                        <span className={item.ativo ? 'text-green-400' : 'text-red-400'}>{item.ativo ? 'Ativo' : 'Inativo'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* CARDÁPIO */}
          {/* ============================================ */}
          {activeTab === 'cardapio' && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-4 sm:p-8 mb-8">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-bold text-white">Gerenciar Cardápio</h2>
                <div className={`px-3 py-1 rounded-full text-sm ${produtos.length >= LIMITES.CARDAPIO_MAX ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{produtos.length}/{LIMITES.CARDAPIO_MAX}</div>
              </div>

              {/* Filtro por categoria */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button onClick={() => setCategoriaFiltro('todos')} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${categoriaFiltro === 'todos' ? 'bg-primary text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>Todos</button>
                {categoriasDisponiveis.map(cat => (
                  <button key={cat} onClick={() => setCategoriaFiltro(cat)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${categoriaFiltro === cat ? 'bg-primary text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>{cat}</button>
                ))}
              </div>

              {/* Formulário para adicionar novo produto */}
              <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                <h3 className="font-bold text-white/90 mb-3">➕ Adicionar Novo Produto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Imagem</label>
                    {novoProduto.imageUrl ? (
                      <div className="relative w-24 h-24 mb-2">
                        <img src={getImageUrl(novoProduto.imageUrl)} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                        <button onClick={() => setNovoProduto(prev => ({ ...prev, imageUrl: '' }))} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X size={12} className="text-white" /></button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-primary/50 rounded-lg p-3 cursor-pointer hover:border-primary bg-primary/10">
                        <Upload size={20} className="text-primary mb-1" />
                        <span className="text-xs text-white/60">{uploadingImage ? 'Enviando...' : 'Upload'}</span>
                        <input type="file" accept="image/*" onChange={handleUploadProdutoImagem} className="hidden" disabled={uploadingImage} />
                      </label>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input type="text" value={novoProduto.name} onChange={(e) => setNovoProduto(prev => ({ ...prev, name: e.target.value }))} placeholder="Nome do produto" className="w-full p-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50" />
                    <div className="flex gap-2">
                      <input type="number" step="0.01" min="0" value={novoProduto.price || ''} onChange={(e) => setNovoProduto(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} placeholder="Preço R$" className="w-1/2 p-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50" />
                      <select value={novoProduto.category} onChange={(e) => setNovoProduto(prev => ({ ...prev, category: e.target.value }))} className="w-1/2 p-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white">
                        <option value="">Selecione</option>
                        {categoriasDisponiveis.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <textarea value={novoProduto.description} onChange={(e) => setNovoProduto(prev => ({ ...prev, description: e.target.value }))} placeholder="Descrição" rows={2} className="w-full p-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50" />
                  </div>
                </div>
                <button onClick={handleAddProduto} disabled={!novoProduto.imageUrl || !novoProduto.name || uploadingImage} className="mt-3 w-full py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium text-sm disabled:opacity-50">
                  {uploadingImage ? 'Aguarde o upload...' : 'Adicionar Produto'}
                </button>
              </div>

              {/* Lista de produtos */}
              <div className="space-y-3">
                {produtosFiltrados.map((produto) => (
                  <div key={produto.id} className={`border rounded-lg p-4 ${produto.available ? 'bg-white/5 border-white/20' : 'bg-red-500/10 border-red-400/30 opacity-60'}`}>
                    <div className="flex gap-4">
                      <div className="w-20 h-20 flex-shrink-0">
                        <img src={getImageUrl(produto.imageUrl)} alt={produto.name} className="w-full h-full object-cover rounded-lg" />
                      </div>
                      <div className="flex-1">
                        {editingProdutoId === produto.id ? (
                          <div className="space-y-2">
                            <input type="text" value={editProdutoForm.name} onChange={(e) => setEditProdutoForm(prev => ({ ...prev, name: e.target.value }))} className="w-full p-2 text-sm bg-white/10 border border-primary/30 rounded-lg text-white" />
                            <div className="flex gap-2">
                              <input type="number" step="0.01" min="0" value={editProdutoForm.price} onChange={(e) => setEditProdutoForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} className="w-32 p-2 text-sm bg-white/10 border border-primary/30 rounded-lg text-white" />
                              <select value={editProdutoForm.category} onChange={(e) => setEditProdutoForm(prev => ({ ...prev, category: e.target.value }))} className="flex-1 p-2 text-sm bg-white/10 border border-primary/30 rounded-lg text-white">
                                {categoriasDisponiveis.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                            </div>
                            <textarea value={editProdutoForm.description} onChange={(e) => setEditProdutoForm(prev => ({ ...prev, description: e.target.value }))} rows={2} className="w-full p-2 text-sm bg-white/10 border border-primary/30 rounded-lg text-white" />
                            {/* ✅ Upload de imagem na edição */}
                            <div>
                              <p className="text-xs text-white/60 mb-1">Imagem atual:</p>
                              <div className="flex items-center gap-3">
                                <img src={getImageUrl(editProdutoForm.imageUrl)} alt="atual" className="w-12 h-12 object-cover rounded" />
                                <label className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-lg cursor-pointer hover:bg-primary/30 text-xs text-white">
                                  <Upload size={14} /> {uploadingImage ? 'Enviando...' : 'Trocar Imagem'}
                                  <input type="file" accept="image/*" onChange={handleUploadEditProdutoImagem} className="hidden" disabled={uploadingImage} />
                                </label>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={handleSaveEditProduto} disabled={uploadingImage} className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50">Salvar</button>
                              <button onClick={handleCancelEditProduto} className="px-3 py-1 bg-gray-500 text-white rounded text-sm">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-white">{produto.name}</h4>
                                <p className="text-primary font-bold text-lg">R$ {produto.price.toFixed(2)}</p>
                                <p className="text-white/50 text-xs">{produto.description}</p>
                                <span className="text-xs text-white/40">{produto.category}</span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleStartEditProduto(produto)} className="p-2 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30"><Edit2 size={16} /></button>
                                <button onClick={() => handleToggleAtivoProduto(produto.id)} className={`p-2 rounded ${produto.available ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}><Eye size={16} /></button>
                                <button onClick={() => handleDeleteProduto(produto.id)} className="p-2 bg-red-500/20 text-red-300 rounded"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {produtosFiltrados.length === 0 && <p className="text-white/50 text-center py-6">Nenhum produto nesta categoria</p>}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* POPUP */}
          {/* ============================================ */}
          {activeTab === 'popup' && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-4 sm:p-8 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Gerenciar Popups</h2>
                <div className={`px-3 py-1 rounded-full text-sm ${popups.length >= LIMITES.POPUP_MAX ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{popups.length}/{LIMITES.POPUP_MAX}</div>
              </div>

              <div className="mb-6">
                <div className="border-2 border-dashed border-primary/50 rounded-xl p-8 text-center bg-primary/10 max-w-md mx-auto">
                  <Upload className="w-8 h-8 text-primary mx-auto mb-3" />
                  <label className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm cursor-pointer transition-colors text-white ${popups.length >= LIMITES.POPUP_MAX ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'bg-primary hover:bg-primary/80'}`}>
                    <Plus size={18} /> Upload ({popups.length}/{LIMITES.POPUP_MAX})
                    <input type="file" multiple accept="image/*" onChange={handleUploadPopups} className="hidden" disabled={popups.length >= LIMITES.POPUP_MAX} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {popups.map((popup, index) => (
                  <div key={popup.id} className="border border-white/20 rounded-xl overflow-hidden bg-white/10">
                    <div className="relative h-48 bg-gray-100">
                      <img src={getImageUrl(popup.imagem)} alt="Popup" className="w-full h-full object-contain" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button onClick={() => setEditingPopupId(popup.id === editingPopupId ? null : popup.id)} className="p-1.5 bg-primary rounded-full text-white"><Edit2 size={14} /></button>
                        <button onClick={() => handleToggleAtivoPopup(popup.id)} className={`p-1.5 rounded-full ${popup.ativo ? 'bg-green-500' : 'bg-red-500'} text-white`}>{popup.ativo ? <Eye size={14} /> : <X size={14} />}</button>
                        <button onClick={() => handleDeletePopup(popup.id)} className="p-1.5 bg-red-500 rounded-full text-white"><Trash2 size={14} /></button>
                      </div>
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        {index > 0 && <button onClick={() => handleReorderPopup(popup.id, 'up')} className="p-1 bg-gray-800/70 rounded text-white"><ChevronLeft size={12} /></button>}
                        {index < popups.length - 1 && <button onClick={() => handleReorderPopup(popup.id, 'down')} className="p-1 bg-gray-800/70 rounded text-white"><ChevronRight size={12} /></button>}
                      </div>
                      {popup.ativo && <div className="absolute top-2 left-2"><span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">Ativo</span></div>}
                    </div>
                    <div className="p-4">
                      <div className="flex gap-1 mb-2">
                        {temposExibicao.map(t => (
                          <button key={t.segundos} onClick={() => handleTempoExibicao(popup.id, t.segundos)}
                            className={`flex-1 py-2 text-xs rounded ${popup.tempoExibicao === t.segundos ? 'bg-primary text-white' : 'bg-white/10 text-white/70'}`}>{t.label}</button>
                        ))}
                      </div>
                      {editingPopupId === popup.id && (
                        <div className="p-3 bg-primary/20 rounded-lg border border-primary/30">
                          <input type="text" value={popup.imagem} onChange={(e) => handleSavePopupEdit(popup.id, 'imagem', e.target.value)}
                            className="w-full text-sm border border-white/20 rounded px-2 py-1 mb-2 bg-white/10 text-white" placeholder="URL da imagem" />
                          <button onClick={() => setEditingPopupId(null)} className="w-full py-1.5 bg-primary text-white text-xs rounded">Fechar</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* SOBRE NÓS */}
          {/* ============================================ */}
          {activeTab === 'sobre-nos' && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-4 sm:p-8 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Gerenciar Sobre Nós</h2>
                {!editandoSobre ? (
                  <button onClick={handleStartEditSobre} className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm flex items-center gap-2"><Edit2 size={16} /> Editar Conteúdo</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleSaveEditSobre} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2"><Check size={16} /> Salvar</button>
                    <button onClick={handleCancelEditSobre} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm flex items-center gap-2"><X size={16} /> Cancelar</button>
                  </div>
                )}
              </div>

              {!editandoSobre ? (
                <div className="space-y-6 text-white">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="font-bold text-primary text-lg mb-2 flex items-center gap-2"><Heart size={20} /> Nossa História</h3>
                    <p className="text-white/80 leading-relaxed">{sobreNos.historia}</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="font-bold text-primary text-lg mb-2 flex items-center gap-2"><Target size={20} /> Nossa Missão</h3>
                    <p className="text-white/80 leading-relaxed">{sobreNos.missao}</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="font-bold text-primary text-lg mb-2 flex items-center gap-2"><Award size={20} /> Nossos Valores</h3>
                    <div className="flex flex-wrap gap-2">
                      {sobreNos.valores.map((valor, idx) => (
                        <span key={idx} className="px-3 py-1 bg-primary/20 rounded-full text-sm text-white">{valor}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="font-bold text-primary text-lg mb-3 flex items-center gap-2"><MapPin size={20} /> Informações</h3>
                    <div className="space-y-2 text-white/80">
                      <p className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {sobreNos.endereco}</p>
                      <p className="flex items-center gap-2"><Phone size={16} className="text-primary" /> {sobreNos.telefone}</p>
                      <p className="flex items-center gap-2"><Mail size={16} className="text-primary" /> {sobreNos.email}</p>
                      <p className="flex items-center gap-2"><Clock size={16} className="text-primary" /> {sobreNos.horarioFuncionamento}</p>
                      <div className="flex gap-4 mt-3">
                        <a href={sobreNos.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><Facebook size={20} /></a>
                        <a href={sobreNos.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><Instagram size={20} /></a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-1">História</label>
                    <textarea value={editSobreForm.historia} onChange={(e) => setEditSobreForm(prev => ({ ...prev, historia: e.target.value }))} rows={4} className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Missão</label>
                    <textarea value={editSobreForm.missao} onChange={(e) => setEditSobreForm(prev => ({ ...prev, missao: e.target.value }))} rows={3} className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Valores</label>
                    {editSobreForm.valores.map((valor, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <input type="text" value={valor} onChange={(e) => handleUpdateValor(idx, e.target.value)} className="flex-1 p-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                        <button onClick={() => handleRemoveValor(idx)} className="p-2 bg-red-500/20 text-red-300 rounded"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={handleAddValor} className="mt-2 px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Adicionar Valor</button>
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Endereço</label>
                    <input type="text" value={editSobreForm.endereco} onChange={(e) => setEditSobreForm(prev => ({ ...prev, endereco: e.target.value }))} className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/80 text-sm mb-1">Telefone</label>
                      <input type="text" value={editSobreForm.telefone} onChange={(e) => setEditSobreForm(prev => ({ ...prev, telefone: e.target.value }))} className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white" />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-1">Email</label>
                      <input type="email" value={editSobreForm.email} onChange={(e) => setEditSobreForm(prev => ({ ...prev, email: e.target.value }))} className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/80 text-sm mb-1">Facebook</label>
                      <input type="url" value={editSobreForm.facebook} onChange={(e) => setEditSobreForm(prev => ({ ...prev, facebook: e.target.value }))} className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white" />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-1">Instagram</label>
                      <input type="url" value={editSobreForm.instagram} onChange={(e) => setEditSobreForm(prev => ({ ...prev, instagram: e.target.value }))} className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Horário de Funcionamento</label>
                    <input type="text" value={editSobreForm.horarioFuncionamento} onChange={(e) => setEditSobreForm(prev => ({ ...prev, horarioFuncionamento: e.target.value }))} className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* RECADOS */}
          {/* ============================================ */}
          {activeTab === 'recados' && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-4 sm:p-8 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Gerenciar Recados</h2>
                <div className={`px-3 py-1 rounded-full text-sm ${recados.length >= LIMITES.RECADOS_MAX ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{recados.length}/{LIMITES.RECADOS_MAX}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
                <h3 className="font-bold text-white/90 mb-3">Tempo de exibição padrão</h3>
                <div className="flex gap-2">
                  {[5, 10].map(tempo => (
                    <button key={tempo} onClick={() => setTempoExibicaoRecados(tempo)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${tempoExibicaoRecados === tempo ? 'bg-primary text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>{tempo}s</button>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                <h3 className="font-bold text-white/90 mb-3">Novo Recado</h3>
                <div className="space-y-3">
                  <input type="text" value={novoRecado.titulo} onChange={(e) => setNovoRecado(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Título do recado" className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/50" />
                  <textarea value={novoRecado.conteudo} onChange={(e) => setNovoRecado(prev => ({ ...prev, conteudo: e.target.value }))}
                    placeholder="Conteúdo..." rows={4} className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/50" />
                  <div className="bg-primary/20 p-3 rounded-lg border border-primary/30">
                    <p className="text-sm text-primary mb-2">📢 Modelo rápido:</p>
                    <button onClick={() => setNovoRecado({ titulo: "Aviso Importante", conteudo: "Novos pães artesanais chegaram! Venha conferir.", avisoimportante: true })}
                      className="text-xs bg-primary hover:bg-primary/80 text-white px-3 py-1.5 rounded transition-colors">Usar este modelo</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="avisoimportante" checked={novoRecado.avisoimportante || false}
                      onChange={(e) => setNovoRecado(prev => ({ ...prev, avisoimportante: e.target.checked }))} className="w-4 h-4" />
                    <label htmlFor="avisoimportante" className="text-sm text-white/80">
                      <AlertCircle size={14} className="inline mr-1 text-red-400" />
                      Marcar como aviso importante
                    </label>
                  </div>
                  <button onClick={handleAddRecado} disabled={recados.length >= LIMITES.RECADOS_MAX}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${recados.length >= LIMITES.RECADOS_MAX ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'bg-primary hover:bg-primary/80 text-white'}`}>
                    <Plus size={18} /> Adicionar ({recados.length}/{LIMITES.RECADOS_MAX})
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {recados.map((recado) => (
                  <div key={recado.id} className={`border rounded-lg p-4 ${recado.avisoimportante ? 'bg-red-500/10 border-red-400/30' : 'bg-white/5 border-white/20'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white">{recado.titulo}</h4>
                          {recado.avisoimportante && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">⚠️ AVISO</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${recado.ativo ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{recado.ativo ? 'Ativo' : 'Inativo'}</span>
                          <span className="text-xs text-white/50 flex items-center gap-1"><Clock size={10} />{recado.dataCriacao}</span>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{recado.tempoExibicao || 5}s</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex gap-1 mr-2">
                          {[5, 10].map(t => (
                            <button key={t} onClick={() => handleTempoExibicaoRecado(recado.id, t)}
                              className={`px-1.5 py-0.5 text-xs rounded ${(recado.tempoExibicao || 5) === t ? 'bg-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>{t}s</button>
                          ))}
                        </div>
                        {editingRecadoId === recado.id ? (
                          <div className="flex gap-1">
                            <button onClick={handleSaveEditRecado} className="p-1.5 bg-green-500 text-white rounded"><Check size={14} /></button>
                            <button onClick={handleCancelEditRecado} className="p-1.5 bg-gray-500 text-white rounded"><X size={14} /></button>
                          </div>
                        ) : (
                          <button onClick={() => handleStartEditRecado(recado)} className="p-2 bg-primary/20 text-primary rounded hover:bg-primary/30"><Edit2 size={16} /></button>
                        )}
                        <button onClick={() => handleToggleAvisoImportanteRecado(recado.id)} className={`p-2 rounded ${recado.avisoimportante ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'}`}><AlertCircle size={16} /></button>
                        <button onClick={() => handleToggleAtivoRecado(recado.id)} className={`p-2 rounded ${recado.ativo ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}><Eye size={16} /></button>
                        <button onClick={() => handleDeleteRecado(recado.id)} className="p-2 bg-red-500/20 text-red-300 rounded"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    {editingRecadoId === recado.id ? (
                      <div className="mt-3 space-y-2">
                        <input type="text" value={editRecadoForm.titulo} onChange={(e) => setEditRecadoForm(prev => ({ ...prev, titulo: e.target.value }))}
                          className="w-full p-2 text-sm bg-white/10 border border-primary/30 rounded-lg text-white" placeholder="Título" />
                        <textarea value={editRecadoForm.conteudo} onChange={(e) => setEditRecadoForm(prev => ({ ...prev, conteudo: e.target.value }))}
                          rows={3} className="w-full p-2 text-sm bg-white/10 border border-primary/30 rounded-lg text-white" placeholder="Conteúdo" />
                      </div>
                    ) : (
                      <p className="text-white/70 text-sm whitespace-pre-line">{recado.conteudo}</p>
                    )}
                  </div>
                ))}
                {recados.length === 0 && <p className="text-white/50 text-center py-6">Nenhum recado cadastrado</p>}
              </div>
            </div>
          )}
        </main>

        {/* BOTÃO SALVAR */}
        <div className="fixed bottom-0 left-0 right-0 bg-transparent p-4 z-30" style={{ marginLeft: sidebarOpen ? '18rem' : '4rem' }}>
          <div className="container mx-auto flex items-center justify-center gap-4">
            <button onClick={salvarEPublicar} disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-3 px-8 py-3 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg font-bold transition-all shadow-lg disabled:opacity-70">
              {saveStatus === 'saving' ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Publicando...</>)
                : saveStatus === 'published' ? (<><Check size={20} />Publicado!</>)
                : (<><Globe size={20} />Salvar e Publicar no Site</>)}
            </button>
            {saveError && <span className="text-red-300 text-sm">{saveError}</span>}
          </div>
        </div>

        <div className="h-20"></div>

        {/* FOOTER */}
        <footer className="border-t border-secondary-foreground/20 bg-secondary text-secondary-foreground py-4 relative z-10">
          <div className="container mx-auto px-4 text-left text-sm">
            <p>© {new Date().getFullYear()} Pani Di Grano — Sistema Administrativo</p>
            <p className="text-xs opacity-70 mt-1">Acessado por: {perfilAdmin.nome || 'Administrador'} | Última sync: {lastSyncTime}</p>
          </div>
        </footer>
      </div>

      {/* MODAL EDITAR PERFIL */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl max-w-md w-full p-6 border border-border shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-foreground">Editar Perfil</h3>
              <button onClick={() => setShowEditProfileModal(false)}><X size={24} className="text-muted-foreground hover:text-foreground" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={editProfileForm.nome} onChange={(e) => setEditProfileForm(prev => ({ ...prev, nome: e.target.value }))} placeholder="Nome" className="w-full p-3 bg-input border border-border rounded-lg text-foreground" />
              <input type="email" value={editProfileForm.email} onChange={(e) => setEditProfileForm(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" className="w-full p-3 bg-input border border-border rounded-lg text-foreground" />

              <div className="border-t border-border pt-3">
                <p className="text-foreground/80 text-sm mb-2 flex items-center gap-2"><Palette size={16} /> Personalizar Fundo</p>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setFundoTipo('cor')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs ${fundoTipo === 'cor' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>Cor</button>
                  <button onClick={() => setFundoTipo('imagem')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs ${fundoTipo === 'imagem' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>Imagem</button>
                </div>

                {fundoTipo === 'cor' && (
                  <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-1">
                    {coresPalheta.map(cor => (
                      <button key={cor} onClick={() => setPerfilAdmin(prev => ({ ...prev, corFundo: cor, imagemFundo: undefined }))}
                        className="w-7 h-7 rounded-full border-2 border-white/30 hover:scale-110 transition-transform" style={{ backgroundColor: cor }} />
                    ))}
                  </div>
                )}

                {fundoTipo === 'imagem' && (
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {fundosPredefinidos.map(img => (
                      <button key={img} onClick={() => setPerfilAdmin(prev => ({ ...prev, imagemFundo: img, corFundo: undefined }))} className="relative group">
                        <img src={getImageUrl(img)} alt="Fundo" className="w-full h-16 object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/40 rounded-lg group-hover:bg-black/20 transition-colors" />
                      </button>
                    ))}
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg h-16 cursor-pointer hover:border-primary">
                      <Upload size={16} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Upload</span>
                      <input type="file" accept="image/*" onChange={handleUploadImagemFundo} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handleSaveProfile} className="flex-1 py-3 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg font-medium">Salvar</button>
                <button onClick={() => setShowEditProfileModal(false)} className="flex-1 py-3 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg font-medium">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTERAR SENHA */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl max-w-md w-full p-6 border border-border shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-foreground">Alterar Senha</h3>
              <button onClick={() => setShowChangePasswordModal(false)}><X size={24} className="text-muted-foreground hover:text-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input type={showCurrentPassword ? "text" : "password"} value={passwordForm.current} onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))} placeholder="Senha atual" className="w-full p-3 pr-12 bg-input border border-border rounded-lg text-foreground" />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><Eye size={20} /></button>
              </div>
              <div className="relative">
                <input type={showNewPassword ? "text" : "password"} value={passwordForm.new} onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))} placeholder="Nova senha (mínimo 6)" className="w-full p-3 pr-12 bg-input border border-border rounded-lg text-foreground" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><Eye size={20} /></button>
              </div>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={passwordForm.confirm} onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))} placeholder="Confirmar nova senha" className="w-full p-3 pr-12 bg-input border border-border rounded-lg text-foreground" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><Eye size={20} /></button>
              </div>
              <button onClick={handleChangePassword} className="w-full py-3 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg font-medium">Alterar Senha</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(139,90,43,0.5); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(139,90,43,0.7); }
        * { scrollbar-width: thin; scrollbar-color: rgba(139,90,43,0.5) rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}