// src/pages/fiel/Painelfiel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Heart, Award, TrendingUp, Clock, ShoppingBag,
  LogOut, Settings, Camera, Edit2, X, Check, Star,
  Trash2, ArrowLeft, Upload, Image, AlertCircle,
  Menu, ChevronLeft, TrendingDown, Package, Calendar,
  MapPin, CreditCard, Bell, Eye, EyeOff, Lock, Mail, Phone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const WORKER_URL = import.meta.env.VITE_WORKER_URL || '/api';

interface Produto {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

interface Pedido {
  id: string;
  data: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  total: number;
  items: Array<{ id: string; name: string; quantity: number; price: number; imageUrl?: string }>;
  deliveryType: 'delivery' | 'pickup';
  endereco?: string;
}

interface Favorito {
  id: string;
  produtoId: string;
  produtoNome: string;
  produtoImagem?: string;
  produtoPreco: number;
  dataAdicionado: string;
}

interface EstatisticaProduto {
  id: string;
  name: string;
  quantity: number;
  totalSpent: number;
  imageUrl?: string;
}

// getAuthToken com pani_token
const getAuthToken = (): string | null => localStorage.getItem('pani_token');

const uploadParaR2 = async (file: File, tipo: string): Promise<string> => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('imagem', file);
  formData.append('tipo', tipo);
  
  const response = await fetch(`${WORKER_URL}/r2/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Falha no upload');
  return data.url;
};

// Ícone Palette para o seletor de cores
function Palette(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="10" cy="8" r="1" fill="currentColor" />
      <circle cx="16" cy="10" r="1" fill="currentColor" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export default function Painelfiel() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'perfil' | 'pedidos' | 'favoritos' | 'estatisticas'>('perfil');
  
  // Perfil
  const [perfil, setPerfil] = useState({
    nome: '',
    email: '',
    telefone: '',
    avatar: '',
    corFundo: '#fef3c7',
    planoFundo: ''
  });
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ nome: '', email: '', telefone: '' });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Pedidos
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  
  // Favoritos
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loadingFavoritos, setLoadingFavoritos] = useState(true);
  
  // Estatísticas
  const [maisPedidos, setMaisPedidos] = useState<EstatisticaProduto[]>([]);
  const [menosPedidos, setMenosPedidos] = useState<EstatisticaProduto[]>([]);
  const [totalGasto, setTotalGasto] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [totalItens, setTotalItens] = useState(0);
  
  // Cardápio para favoritos
  const [cardapio, setCardapio] = useState<Produto[]>([]);
  const [showProdutosModal, setShowProdutosModal] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todos');

  useEffect(() => {
    if (!user) {
      navigate('/minhaconta');
      return;
    }
    
    setPerfil({
      nome: user.nome || '',
      email: user.email || '',
      telefone: user.telefone || '',
      avatar: user.avatar || '',
      corFundo: user.corFundo || '#fef3c7',
      planoFundo: user.planoFundo || ''
    });
    
    carregarDados();
  }, [user]);

  const carregarDados = async () => {
    await Promise.all([
      carregarPedidos(),
      carregarFavoritos(),
      carregarEstatisticas(),
      carregarCardapio()
    ]);
  };

  const carregarPedidos = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${WORKER_URL}/fiel/pedidos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPedidos(data.pedidos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoadingPedidos(false);
    }
  };

  const carregarFavoritos = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${WORKER_URL}/fiel/favoritos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFavoritos(data.favoritos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setLoadingFavoritos(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${WORKER_URL}/fiel/estatisticas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMaisPedidos(data.maisPedidos || []);
        setMenosPedidos(data.menosPedidos || []);
        setTotalGasto(data.totalGasto || 0);
        setTotalPedidos(data.totalPedidos || 0);
        setTotalItens(data.totalItens || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const carregarCardapio = async () => {
    try {
      const response = await fetch(`${WORKER_URL}/cardapio`);
      const data = await response.json();
      if (data.success) {
        setCardapio(data.produtos || []);
        const cats = [...new Set((data.produtos || []).map((p: Produto) => p.category))];
        setCategorias(cats);
      }
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadParaR2(file, 'avatar');
        const token = getAuthToken();
        await fetch(`${WORKER_URL}/fiel/perfil`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ avatar: url })
        });
        setPerfil({ ...perfil, avatar: url });
      } catch (error) {
        alert('❌ Erro ao fazer upload do avatar');
      }
    }
  };

  const handleFundoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadParaR2(file, 'plano-fundo');
        const token = getAuthToken();
        await fetch(`${WORKER_URL}/fiel/perfil`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ planoFundo: url })
        });
        setPerfil({ ...perfil, planoFundo: url });
      } catch (error) {
        alert('❌ Erro ao fazer upload do plano de fundo');
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = getAuthToken();
      await fetch(`${WORKER_URL}/fiel/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          nome: editProfileForm.nome,
          email: editProfileForm.email,
          telefone: editProfileForm.telefone
        })
      });
      setPerfil({
        ...perfil,
        nome: editProfileForm.nome,
        email: editProfileForm.email,
        telefone: editProfileForm.telefone
      });
      setShowEditProfileModal(false);
      alert('✅ Perfil atualizado!');
    } catch (error) {
      alert('❌ Erro ao salvar perfil');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      alert('Preencha todos os campos!');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      alert('As senhas não coincidem!');
      return;
    }
    if (passwordForm.new.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres!');
      return;
    }
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${WORKER_URL}/fiel/alterar-senha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ senha_atual: passwordForm.current, nova_senha: passwordForm.new })
      });
      const result = await response.json();
      if (result.success) {
        setShowChangePasswordModal(false);
        setPasswordForm({ current: '', new: '', confirm: '' });
        alert('✅ Senha alterada com sucesso!');
      } else {
        alert(`❌ ${result.error || 'Erro ao alterar senha'}`);
      }
    } catch (error) {
      alert('❌ Erro de conexão');
    }
  };

  const handleAddFavorito = async (produto: Produto) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${WORKER_URL}/fiel/favoritos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          produtoId: produto.id,
          produtoNome: produto.name,
          produtoImagem: produto.imageUrl,
          produtoPreco: produto.price
        })
      });
      const data = await response.json();
      if (data.success) {
        setFavoritos([...favoritos, {
          id: data.favoritoId,
          produtoId: produto.id,
          produtoNome: produto.name,
          produtoImagem: produto.imageUrl,
          produtoPreco: produto.price,
          dataAdicionado: new Date().toISOString()
        }]);
        alert('✅ Adicionado aos favoritos!');
      }
    } catch (error) {
      alert('❌ Erro ao adicionar favorito');
    }
  };

  const handleRemoveFavorito = async (favoritoId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${WORKER_URL}/fiel/favoritos/${favoritoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFavoritos(favoritos.filter(f => f.id !== favoritoId));
        alert('✅ Removido dos favoritos');
      }
    } catch (error) {
      alert('❌ Erro ao remover favorito');
    }
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusText = (status: Pedido['status']) => {
    const map = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      delivering: 'Saiu para entrega',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return map[status];
  };

  const getStatusColor = (status: Pedido['status']) => {
    const map = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-purple-500',
      delivering: 'bg-orange-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return map[status];
  };

  const menuItems = [
    { id: 'perfil', label: 'Meu Perfil', icon: User },
    { id: 'pedidos', label: 'Meus Pedidos', icon: ShoppingBag, count: pedidos.length },
    { id: 'favoritos', label: 'Favoritos', icon: Heart, count: favoritos.length },
    { id: 'estatisticas', label: 'Estatísticas', icon: TrendingUp }
  ];

  const produtosFiltrados = cardapio.filter(p => 
    categoriaSelecionada === 'todos' || p.category === categoriaSelecionada
  );

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-amber-50 to-orange-100">
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-16'} bg-gradient-to-b from-amber-800 to-amber-900 shadow-xl transition-all duration-300 flex flex-col fixed h-screen left-0 z-40 overflow-y-auto`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft size={20} className={`text-white transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
        </button>
        
        {sidebarOpen ? (
          <div className="flex items-center gap-2 px-6 pt-6 pb-4">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">Minha Conta</span>
          </div>
        ) : (
          <div className="flex justify-center pt-6">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
          </div>
        )}
        
        <div className="flex-1 px-4 pb-4 mt-4">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-amber-600/50 text-white shadow-lg' : 'text-amber-200 hover:bg-amber-700/50 hover:text-white'}`}
              >
                <item.icon size={sidebarOpen ? 18 : 20} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/30 text-white">{item.count}</span>
                    )}
                  </>
                )}
              </button>
            ))}
            <div className="border-t border-amber-700/30 my-3"></div>
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all">
              <LogOut size={sidebarOpen ? 18 : 20} />
              {sidebarOpen && <span className="text-sm font-medium">Sair</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div 
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-16'} relative overflow-y-auto h-screen`}
        style={{ 
          backgroundColor: perfil.corFundo,
          backgroundImage: perfil.planoFundo ? `url(${perfil.planoFundo})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <main className="container mx-auto px-6 pt-24 pb-32">
          
          {/* CABEÇALHO DO PERFIL */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-amber-200 border-4 border-amber-500">
                  {perfil.avatar ? (
                    <img src={perfil.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-amber-700">
                      {perfil.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1 bg-amber-600 rounded-full cursor-pointer hover:bg-amber-700">
                  <Camera size={14} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-amber-900">{perfil.nome}</h1>
                <p className="text-amber-600">{perfil.email}</p>
                {perfil.telefone && <p className="text-sm text-amber-500">📱 {perfil.telefone}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditProfileForm({ nome: perfil.nome, email: perfil.email, telefone: perfil.telefone }); setShowEditProfileModal(true); }} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2">
                  <Edit2 size={16} /> Editar
                </button>
                <label className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg flex items-center gap-2 cursor-pointer">
                  <Image size={16} /> Fundo
                  <input type="file" accept="image/*" onChange={handleFundoUpload} className="hidden" />
                </label>
                <label className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg flex items-center gap-2 cursor-pointer">
                  <Palette size={16} /> Cor
                  <input type="color" value={perfil.corFundo} onChange={async (e) => {
                    const novaCor = e.target.value;
                    setPerfil({ ...perfil, corFundo: novaCor });
                    const token = getAuthToken();
                    await fetch(`${WORKER_URL}/fiel/perfil`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ corFundo: novaCor })
                    });
                  }} className="w-8 h-8 rounded cursor-pointer" />
                </label>
              </div>
            </div>
          </div>

          {/* CONTEÚDO POR ABA */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6">
            
            {/* PERFIL */}
            {activeTab === 'perfil' && (
              <div>
                <h2 className="text-xl font-bold text-amber-800 mb-4">Configurações da Conta</h2>
                <div className="space-y-4">
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-800 mb-2">Informações Pessoais</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-amber-600">Nome</p>
                        <p className="font-medium">{perfil.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-amber-600">E-mail</p>
                        <p className="font-medium">{perfil.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-amber-600">Telefone</p>
                        <p className="font-medium">{perfil.telefone || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowChangePasswordModal(true)} className="px-4 py-2 border border-amber-300 rounded-lg text-amber-700 hover:bg-amber-50">
                    Alterar Senha
                  </button>
                </div>
              </div>
            )}

            {/* PEDIDOS */}
            {activeTab === 'pedidos' && (
              <div>
                <h2 className="text-xl font-bold text-amber-800 mb-4">Meus Pedidos</h2>
                {loadingPedidos ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
                  </div>
                ) : pedidos.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-16 w-16 mx-auto text-amber-300 mb-4" />
                    <p className="text-gray-500">Você ainda não fez nenhum pedido</p>
                    <button onClick={() => navigate('/cardapio')} className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg">Ver Cardápio</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pedidos.map((pedido) => (
                      <div key={pedido.id} className="border border-amber-200 rounded-lg overflow-hidden">
                        <div className="bg-amber-50 p-4 border-b border-amber-200">
                          <div className="flex flex-wrap justify-between items-center gap-3">
                            <div>
                              <span className="font-bold">Pedido #{pedido.id.slice(-6)}</span>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar size={12} /> {formatDate(pedido.data)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(pedido.status)}`}>
                                {getStatusText(pedido.status)}
                              </span>
                              <span className="font-bold text-amber-700">{formatPrice(pedido.total)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            {pedido.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="text-gray-500">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          {pedido.deliveryType === 'delivery' && pedido.endereco && (
                            <div className="mt-3 pt-3 border-t border-amber-100 text-sm text-gray-500 flex items-center gap-2">
                              <MapPin size={14} /> {pedido.endereco}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FAVORITOS */}
            {activeTab === 'favoritos' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-amber-800">Meus Favoritos</h2>
                  <button onClick={() => setShowProdutosModal(true)} className="px-4 py-2 bg-amber-600 text-white rounded-lg flex items-center gap-2">
                    <Heart size={16} /> Adicionar Favorito
                  </button>
                </div>
                
                {loadingFavoritos ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
                  </div>
                ) : favoritos.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 mx-auto text-amber-300 mb-4" />
                    <p className="text-gray-500">Você ainda não tem produtos favoritos</p>
                    <button onClick={() => setShowProdutosModal(true)} className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg">Explorar Cardápio</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {favoritos.map((favorito) => (
                      <div key={favorito.id} className="border border-amber-200 rounded-lg overflow-hidden bg-white group relative">
                        <div className="h-32 bg-amber-100 flex items-center justify-center">
                          {favorito.produtoImagem ? (
                            <img src={favorito.produtoImagem} alt={favorito.produtoNome} className="w-full h-full object-cover" />
                          ) : (
                            <Heart size={32} className="text-amber-300" />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-amber-800 text-sm">{favorito.produtoNome}</h3>
                          <p className="text-amber-600 font-bold text-sm">{formatPrice(favorito.produtoPreco)}</p>
                        </div>
                        <button onClick={() => handleRemoveFavorito(favorito.id)} className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={12} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ESTATÍSTICAS */}
            {activeTab === 'estatisticas' && (
              <div>
                <h2 className="text-xl font-bold text-amber-800 mb-4">Suas Estatísticas</h2>
                
                {/* Cards */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-4 border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 text-sm">Total gasto</span>
                      <Award className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="text-2xl font-bold text-green-500">{formatPrice(totalGasto)}</span>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 text-sm">Total de pedidos</span>
                      <ShoppingBag className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="text-2xl font-bold text-blue-500">{totalPedidos}</span>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl p-4 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 text-sm">Itens comprados</span>
                      <Package className="h-5 w-5 text-purple-500" />
                    </div>
                    <span className="text-2xl font-bold text-purple-500">{totalItens}</span>
                  </div>
                </div>

                {/* Ranking */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <h3 className="font-bold text-amber-800">Produtos Mais Pedidos</h3>
                    </div>
                    {maisPedidos.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">Faça mais pedidos para ver suas preferências!</p>
                    ) : (
                      <div className="space-y-3">
                        {maisPedidos.map((prod, idx) => (
                          <div key={prod.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                              <div>
                                <p className="font-medium text-sm">{prod.name}</p>
                                <p className="text-xs text-gray-500">{prod.quantity} unidades</p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-green-500">{formatPrice(prod.totalSpent)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      <h3 className="font-bold text-amber-800">Produtos Menos Pedidos</h3>
                    </div>
                    {menosPedidos.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">Explore novos produtos!</p>
                    ) : (
                      <div className="space-y-3">
                        {menosPedidos.map((prod, idx) => (
                          <div key={prod.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                              <div>
                                <p className="font-medium text-sm">{prod.name}</p>
                                <p className="text-xs text-gray-500">{prod.quantity} unidades</p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-red-500">{formatPrice(prod.totalSpent)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dica */}
                {maisPedidos.length > 0 && (
                  <div className="mt-6 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4">
                    <p className="text-sm text-center text-amber-800">
                      💡 Baseado nos seus pedidos, você parece gostar de <strong>{maisPedidos[0]?.name}</strong>!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL ADICIONAR FAVORITO */}
      {showProdutosModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold text-amber-800">Adicionar aos Favoritos</h3>
              <button onClick={() => setShowProdutosModal(false)}><X size={24} /></button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button onClick={() => setCategoriaSelecionada('todos')} className={`px-3 py-1 rounded-full text-sm ${categoriaSelecionada === 'todos' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                  Todos
                </button>
                {categorias.map(cat => (
                  <button key={cat} onClick={() => setCategoriaSelecionada(cat)} className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${categoriaSelecionada === cat ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto">
                {produtosFiltrados.map(produto => {
                  const isFavorito = favoritos.some(f => f.produtoId === produto.id);
                  return (
                    <div key={produto.id} className="border border-amber-200 rounded-lg p-3 hover:shadow-lg transition-shadow">
                      <div className="h-24 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
                        {produto.imageUrl ? (
                          <img src={produto.imageUrl} alt={produto.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package size={24} className="text-amber-300" />
                        )}
                      </div>
                      <h4 className="font-semibold text-amber-800 text-sm">{produto.name}</h4>
                      <p className="text-amber-600 font-bold text-sm mt-1">{formatPrice(produto.price)}</p>
                      <button
                        onClick={() => isFavorito ? null : handleAddFavorito(produto)}
                        disabled={isFavorito}
                        className={`mt-2 w-full py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isFavorito ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-700'
                        }`}
                      >
                        {isFavorito ? '★ Favorito' : '☆ Adicionar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PERFIL */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-amber-800">Editar Perfil</h3>
              <button onClick={() => setShowEditProfileModal(false)}><X size={24} className="text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={editProfileForm.nome} onChange={(e) => setEditProfileForm({ ...editProfileForm, nome: e.target.value })} placeholder="Nome" className="w-full p-3 border border-gray-300 rounded-lg" />
              <input type="email" value={editProfileForm.email} onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })} placeholder="Email" className="w-full p-3 border border-gray-300 rounded-lg" />
              <input type="tel" value={editProfileForm.telefone} onChange={(e) => setEditProfileForm({ ...editProfileForm, telefone: e.target.value })} placeholder="Telefone" className="w-full p-3 border border-gray-300 rounded-lg" />
              <button onClick={handleSaveProfile} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTERAR SENHA */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-amber-800">Alterar Senha</h3>
              <button onClick={() => setShowChangePasswordModal(false)}><X size={24} className="text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input type={showCurrentPassword ? "text" : "password"} value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} placeholder="Senha atual" className="w-full p-3 pr-12 border border-gray-300 rounded-lg" />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2"><Eye size={20} className="text-gray-500" /></button>
              </div>
              <div className="relative">
                <input type={showNewPassword ? "text" : "password"} value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} placeholder="Nova senha" className="w-full p-3 pr-12 border border-gray-300 rounded-lg" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2"><Eye size={20} className="text-gray-500" /></button>
              </div>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} placeholder="Confirmar senha" className="w-full p-3 pr-12 border border-gray-300 rounded-lg" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2"><Eye size={20} className="text-gray-500" /></button>
              </div>
              <button onClick={handleChangePassword} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium">Alterar Senha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}