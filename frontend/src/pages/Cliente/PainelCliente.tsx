// src/pages/Cliente/PainelCliente.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { 
  ShoppingBag, History, Heart, Bell, Star, 
  TrendingUp, TrendingDown, Package, LogOut,
  Calendar, MapPin, CreditCard, Award
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_WORKER_URL || 'http://localhost:8787/api').replace('/api', '');
const API = `${API_BASE}/api`;

interface Pedido {
  id: string;
  data: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryType: 'delivery' | 'pickup';
  endereco?: string;
}

interface EstatisticaProduto {
  id: string;
  name: string;
  quantity: number;
  totalSpent: number;
}

export default function PainelCliente() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [maisPedidos, setMaisPedidos] = useState<EstatisticaProduto[]>([]);
  const [menosPedidos, setMenosPedidos] = useState<EstatisticaProduto[]>([]);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'estatisticas' | 'notificacoes'>('pedidos');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    carregarDados();
  }, [user]);

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const [pedidosRes, statsRes, notificacoesRes] = await Promise.all([
        fetch(`${API}/cliente/pedidos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/cliente/estatisticas`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/cliente/notificacoes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (pedidosRes.ok) {
        const data = await pedidosRes.json();
        setPedidos(data.pedidos || []);
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setMaisPedidos(data.maisPedidos || []);
        setMenosPedidos(data.menosPedidos || []);
      }
      
      if (notificacoesRes.ok) {
        const data = await notificacoesRes.json();
        setNotificacoes(data.notificacoes || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemCount={0}
        onCartClick={() => {}}
        onLoginClick={() => {}}
      />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* User Header */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-secondary">
                    Olá, {user?.nome?.split(' ')[0]}!
                  </h1>
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                  {user?.telefone && (
                    <p className="text-muted-foreground text-xs">📱 {user.telefone}</p>
                  )}
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" className="gap-2">
                <LogOut size={16} /> Sair
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                activeTab === 'pedidos' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <History size={18} /> Meus Pedidos
            </button>
            <button
              onClick={() => setActiveTab('estatisticas')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                activeTab === 'estatisticas' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp size={18} /> Estatísticas
            </button>
            <button
              onClick={() => setActiveTab('notificacoes')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                activeTab === 'notificacoes' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bell size={18} /> Notificações
              {notificacoes.filter(n => !n.lida).length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {notificacoes.filter(n => !n.lida).length}
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Pedidos Tab */}
              {activeTab === 'pedidos' && (
                <div className="space-y-4">
                  {pedidos.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-2xl border border-border">
                      <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                      <h3 className="text-xl font-medium mb-2">Nenhum pedido ainda</h3>
                      <p className="text-muted-foreground mb-4">Faça seu primeiro pedido!</p>
                      <Button onClick={() => navigate('/cardapio')} className="btn-primary">
                        Ver Cardápio
                      </Button>
                    </div>
                  ) : (
                    pedidos.map((pedido) => (
                      <div key={pedido.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                          <div className="flex flex-wrap justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                              <Package className="h-5 w-5 text-secondary" />
                              <div>
                                <span className="font-bold">Pedido #{pedido.id.slice(-6)}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar size={12} />
                                  <span>{formatDate(pedido.data)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(pedido.status)}`}>
                                {getStatusText(pedido.status)}
                              </span>
                              <span className="font-bold text-secondary">
                                {formatPrice(pedido.total)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="space-y-2">
                            {pedido.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="text-muted-foreground">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {pedido.deliveryType === 'delivery' ? (
                                <>
                                  <MapPin size={14} />
                                  <span>Entrega: {pedido.endereco}</span>
                                </>
                              ) : (
                                <>
                                  <Package size={14} />
                                  <span>Retirada no local</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {pedido.status === 'delivered' && (
                            <Button variant="outline" size="sm" className="mt-4 w-full gap-2">
                              <Star size={14} /> Avaliar Pedido
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Estatísticas Tab */}
              {activeTab === 'estatisticas' && (
                <div className="space-y-6">
                  {/* Cards de Resumo */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-4 border border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground text-sm">Total gasto</span>
                        <Award className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="text-2xl font-bold text-green-500">
                        {formatPrice(pedidos.reduce((sum, p) => sum + p.total, 0))}
                      </span>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground text-sm">Total de pedidos</span>
                        <ShoppingBag className="h-5 w-5 text-blue-500" />
                      </div>
                      <span className="text-2xl font-bold text-blue-500">{pedidos.length}</span>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl p-4 border border-purple-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground text-sm">Itens comprados</span>
                        <Package className="h-5 w-5 text-purple-500" />
                      </div>
                      <span className="text-2xl font-bold text-purple-500">
                        {pedidos.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.quantity, 0), 0)}
                      </span>
                    </div>
                  </div>

                  {/* Ranking de Produtos */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Mais Pedidos */}
                    <div className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <h3 className="font-bold text-foreground">Produtos Mais Pedidos</h3>
                      </div>
                      
                      {maisPedidos.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-8">
                          Faça mais pedidos para ver suas preferências!
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {maisPedidos.map((prod, idx) => (
                            <div key={prod.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="font-medium text-sm">{prod.name}</p>
                                  <p className="text-xs text-muted-foreground">{prod.quantity} unidades</p>
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-green-500">
                                {formatPrice(prod.totalSpent)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Menos Pedidos */}
                    <div className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        <h3 className="font-bold text-foreground">Produtos Menos Pedidos</h3>
                      </div>
                      
                      {menosPedidos.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-8">
                          Explore nosso cardápio e experimente novos produtos!
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {menosPedidos.map((prod, idx) => (
                            <div key={prod.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 text-xs font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="font-medium text-sm">{prod.name}</p>
                                  <p className="text-xs text-muted-foreground">{prod.quantity} unidades</p>
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-red-500">
                                {formatPrice(prod.totalSpent)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sugestão */}
                  {maisPedidos.length > 0 && (
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4">
                      <p className="text-sm text-center">
                        💡 Baseado nos seus pedidos, você parece gostar de <strong>{maisPedidos[0]?.name}</strong>!
                        {maisPedidos[1] && ` Que tal experimentar também o ${maisPedidos[1]?.name}?`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Notificações Tab */}
              {activeTab === 'notificacoes' && (
                <div className="space-y-3">
                  {notificacoes.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-2xl border border-border">
                      <Bell className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                      <h3 className="text-xl font-medium mb-2">Nenhuma notificação</h3>
                      <p className="text-muted-foreground">Fique ligado para promoções e novidades!</p>
                    </div>
                  ) : (
                    notificacoes.map((notif) => (
                      <div key={notif.id} className={`bg-card rounded-xl border p-4 ${!notif.lida ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Bell className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-foreground">{notif.titulo}</h4>
                              <span className="text-xs text-muted-foreground">{formatDate(notif.data)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notif.mensagem}</p>
                            {notif.promocao && (
                              <div className="mt-2 p-2 bg-green-500/10 rounded-lg">
                                <p className="text-xs text-green-600">🎉 Promoção: {notif.promocao.desconto}% OFF</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}