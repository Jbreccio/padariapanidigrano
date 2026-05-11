import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Image, AlertCircle, LogOut,
  Trash2, Eye, Bell, Settings, Plus,
  Globe, X, Edit2, Check, ChevronLeft, ChevronRight,
  Clock, RefreshCw, EyeOff, Camera,
  ArrowLeft, Palette, User, Menu,
  Download, FileText, Heart, Award, Users, ChefHat
} from 'lucide-react';

// ============================================
// 🖼️ FUNÇÃO PARA CORRIGIR URL DAS IMAGENS
// ============================================
const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/images/')) return url;
  return url;
};

const WORKER_URL = import.meta.env.VITE_WORKER_URL || '/api';

// Interface dos produtos do cardápio
interface Produto {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  available: boolean;
}

// Interface das categorias
interface Categoria {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl?: string;
}

// Interface do carrossel (Hero)
interface CarrosselItem {
  id: string;
  imagem: string;
  titulo?: string;
  ordem: number;
  ativo: boolean;
}

// Interface do Popup
interface PopupItem {
  id: string;
  imagem: string;
  tempoExibicao: number;
  ativo: boolean;
  ordem: number;
}

// Interface da página Sobre Nós
interface SobreNosData {
  historia: string;
  valores: {
    artesanal: string;
    amor: string;
    qualidade: string;
    familia: string;
  };
  imagensCarrossel: string[];
}

// Interface de Recado
interface RecadoItem {
  id: string;
  titulo: string;
  conteudo: string;
  dataCriacao: string;
  ativo: boolean;
  avisoimportante?: boolean;
  tempoExibicao?: number;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('fiel_token');
};

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

const LIMITES = {
  CARROSSEL_MAX: 20,
  POPUP_MAX: 10,
  RECADOS_MAX: 10
};

// Dados iniciais do cardápio
const CATEGORIAS_INICIAIS: Categoria[] = [
  { id: "bolos", name: "Bolos caseiros", description: "Deliciosos bolos feitos com receitas tradicionais", icon: "cake", imageUrl: "/images/boloscaseiros.png" },
  { id: "paes", name: "Pães caseiros", description: "Pães fresquinhos assados diariamente", icon: "bread", imageUrl: "/images/paescaseiros.png" },
  { id: "baguetes", name: "Baguetes Recheadas", description: "Baguetes crocantes com recheios especiais", icon: "sandwich", imageUrl: "/images/baguetesrecheadas.png" },
  { id: "focaccias", name: "Focaccias", description: "Focaccias italianas com diversos sabores", icon: "pizza" },
  { id: "sobremesas", name: "Sobremesas", description: "Doces irresistíveis para adoçar seu dia", icon: "dessert", imageUrl: "/images/sobremesas.png" },
  { id: "paes-doces", name: "Pães Doces", description: "Pães doces artesanais", icon: "croissant", imageUrl: "/images/paesdoces.png" },
  { id: "tortas", name: "Tortas e Quiches", description: "Opções salgadas para qualquer ocasião", icon: "pie", imageUrl: "/images/tortasequiches.png" },
  { id: "aperitivos", name: "Aperitivos e Antepastos", description: "Entradas e acompanhamentos especiais", icon: "utensils", imageUrl: "/images/aperiticoseantepastos.png" },
  { id: "doces", name: "Doces", description: "Brigadeiros, carolinas e muito mais", icon: "candy", imageUrl: "/images/doces.png" },
  { id: "bolachinhas", name: "Bolachinhas e torradas", description: "Biscoitos artesanais e torradas", icon: "cookie", imageUrl: "/images/bolachinhasetorradas.png" },
  { id: "pani-festa", name: "Pani Festa", description: "Opções para festas e eventos", icon: "party", imageUrl: "/images/panifesta.png" },
  { id: "paes-delicia", name: "Pães Delícia", description: "Pães recheados especiais", icon: "bread", imageUrl: "/images/paesedelicia.png" },
  { id: "salgados", name: "Salgados Individuais", description: "Esfihas, joelhos e delícias salgadas", icon: "croissant", imageUrl: "/images/salgadosindividuais.png" },
];

const PRODUTOS_INICIAIS: Produto[] = [
  // Bolos caseiros
  { id: "b1", name: "Bolo Laranja", description: "O queridinho, coberto com calda açucarada e casquinhas de laranja cristalizadas", price: 36.00, category: "Bolos caseiros", imageUrl: "/images/boloscaseiros.png", available: true },
  { id: "b2", name: "Bolo Abacaxi", description: "Bolo feito com suco da fruta, calda açucarada e pedaços de doce de abacaxi", price: 36.00, category: "Bolos caseiros", available: true },
  { id: "b3", name: "Bolo Cenoura", description: "Bolo feito com cenoura fresca raladinha", price: 30.00, category: "Bolos caseiros", available: true },
  // Pães caseiros
  { id: "p1", name: "Pão Caseiro", description: "Pão de casa da vó, combina com manteiga ou geléia", price: 13.00, category: "Pães caseiros", imageUrl: "/images/paescaseiros.png", available: true },
  { id: "p2", name: "Pão de Batata", description: "Macio, feito com a batata cozida, leve e delicioso", price: 15.00, category: "Pães caseiros", available: true },
  // Baguetes Recheadas
  { id: "bq1", name: "Baguete de Pizza", description: "Recheio de presunto fatiado, mussarela, azeitona verde", price: 38.00, category: "Baguetes Recheadas", imageUrl: "/images/baguetesrecheadas.png", available: true },
  // Sobremesas
  { id: "s1", name: "Cheesecake Frutas Vermelhas", description: "Base de bolacha crocante, creme aerado de cream cheese", price: 188.00, category: "Sobremesas", imageUrl: "/images/sobremesas.png", available: true },
  // Pães Doces
  { id: "pd1", name: "Sonhos", description: "Opções: Baunilha, chocolate, limão", price: 5.00, category: "Pães Doces", imageUrl: "/images/paesdoces.png", available: true },
  // Tortas e Quiches
  { id: "t1", name: "Torta de Frango com Requeijão", description: "Massa amanteigada, recheio de frango temperadinho", price: 80.00, category: "Tortas e Quiches", imageUrl: "/images/tortasequiches.png", available: true },
  // Aperitivos
  { id: "a1", name: "Antepasto de Berinjela", description: "Berinjela, pimentões coloridos, cebola, azeitonas", price: 108.00, category: "Aperitivos e Antepastos", imageUrl: "/images/aperiticoseantepastos.png", available: true },
  // Doces
  { id: "d1", name: "Brigadeiro", description: "Brigadeiro tradicional", price: 2.00, category: "Doces", imageUrl: "/images/doces.png", available: true },
  // Bolachinhas
  { id: "bt1", name: "Sequilho", description: "Bolacha a base de amido de milho", price: 12.00, category: "Bolachinhas e torradas", imageUrl: "/images/bolachinhasetorradas.png", available: true },
  // Pani Festa
  { id: "pf1", name: "Mini Esfihas", description: "Opções: carne, queijo, calabresa", price: 3.00, category: "Pani Festa", imageUrl: "/images/panifesta.png", available: true },
  // Pães Delícia
  { id: "pdl1", name: "Pão delícia frango", description: "Feito na massa de batata, recheio de frango com requeijão", price: 22.00, category: "Pães Delícia", imageUrl: "/images/paesedelicia.png", available: true },
  // Salgados
  { id: "si1", name: "Esfiha", description: "Feita na massa de batata, massa super macia", price: 5.00, category: "Salgados Individuais", imageUrl: "/images/salgadosindividuais.png", available: true },
];

const SOBRE_NOS_INICIAL: SobreNosData = {
  historia: "A Pani Di Grano nasceu do sonho de levar o verdadeiro sabor artesanal até você. Com receitas passadas de geração em geração e ingredientes cuidadosamente selecionados, cada pão, cada bolo carrega uma história de dedicação e amor.\n\nNosso nome, 'Pani Di Grano' (Pão de Trigo em italiano), reflete nossa paixão pela arte da panificação e pelo respeito aos ingredientes simples que transformamos em verdadeiras delícias.\n\nTrabalhamos com fermentação natural, farinhas de qualidade e um processo artesanal que respeita o tempo de cada massa. O resultado são produtos únicos, com sabor e textura incomparáveis.",
  valores: {
    artesanal: "Cada produto é feito à mão com cuidado e atenção aos detalhes",
    amor: "Colocamos carinho em cada etapa da produção",
    qualidade: "Ingredientes selecionados para o melhor sabor",
    familia: "Receitas tradicionais passadas de geração em geração"
  },
  imagensCarrossel: ["/images/loja.png", "/images/loja2.png", "/images/loja3.png", "/images/loja4.png", "/images/loja5.png", "/images/loja6.png", "/images/loja7.png", "/images/loja8.png", "/images/loja9.png", "/images/loja10.png", "/images/loja11.png"]
};

const CARROSSEL_INICIAL: CarrosselItem[] = [
  { id: "1", imagem: "/images/foto17.png", titulo: "Pães Artesanais", ordem: 0, ativo: true },
  { id: "2", imagem: "/images/loja07.png", titulo: "Nossa Loja", ordem: 1, ativo: true },
  { id: "3", imagem: "/images/loja08.png", titulo: "Ambiente Acolhedor", ordem: 2, ativo: true },
];

export default function PainelAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'carrossel' | 'cardapio' | 'popup' | 'sobre-nos' | 'recados'>('carrossel');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'published' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  
  // Estados do Carrossel (Hero)
  const [fotosCarrossel, setFotosCarrossel] = useState<CarrosselItem[]>(CARROSSEL_INICIAL);
  
  // Estados do Cardápio
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_INICIAIS);
  const [produtos, setProdutos] = useState<Produto[]>(PRODUTOS_INICIAIS);
  const [editingProdutoId, setEditingProdutoId] = useState<string | null>(null);
  const [editProdutoForm, setEditProdutoForm] = useState({ name: '', description: '', price: 0, category: '' });
  
  // Estados do Popup
  const [popups, setPopups] = useState<PopupItem[]>([]);
  
  // Estados da página Sobre Nós
  const [sobreNos, setSobreNos] = useState<SobreNosData>(SOBRE_NOS_INICIAL);
  const [editandoHistoria, setEditandoHistoria] = useState(false);
  const [editandoValor, setEditandoValor] = useState<string | null>(null);
  
  // Estados de Recados
  const [recados, setRecados] = useState<RecadoItem[]>([]);
  const [novoRecado, setNovoRecado] = useState({ titulo: '', conteudo: '', avisoimportante: false });
  const [tempoExibicaoRecados, setTempoExibicaoRecados] = useState(5);
  const [editingRecadoId, setEditingRecadoId] = useState<string | null>(null);
  const [editRecadoForm, setEditRecadoForm] = useState({ titulo: '', conteudo: '' });
  
  // Perfil Admin
  const [perfilAdmin, setPerfilAdmin] = useState({ nome: '', email: '' });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ nome: '', email: '' });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Autenticação
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('fiel_token');
      if (!token) {
        navigate('/auth');
        return;
      }
      
      try {
        const response = await fetch(`${WORKER_URL}/auth/verificar`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (!data.success || data.user?.role !== 'admin') {
          navigate('/auth');
          return;
        }
        
        setPerfilAdmin({ nome: data.user.nome || 'Admin', email: data.user.email || '' });
        setIsAuthenticated(true);
      } catch (err) {
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    carregarDadosSalvos();
  }, [navigate]);

  const carregarDadosSalvos = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${WORKER_URL}/admin/dados`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.dados) {
        if (data.dados.carrossel?.length) setFotosCarrossel(data.dados.carrossel);
        if (data.dados.categorias?.length) setCategorias(data.dados.categorias);
        if (data.dados.produtos?.length) setProdutos(data.dados.produtos);
        if (data.dados.popups?.length) setPopups(data.dados.popups);
        if (data.dados.sobreNos) setSobreNos(data.dados.sobreNos);
        if (data.dados.recados?.length) setRecados(data.dados.recados);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.warn('Sem dados salvos no servidor', e);
    }
  };

  const salvarEPublicar = async () => {
    setSaveStatus('saving');
    setSaveError('');
    
    const token = getAuthToken();
    if (!token) {
      alert('Sessão expirada.');
      navigate('/auth');
      return;
    }
    
    const dados = {
      carrossel: fotosCarrossel,
      categorias,
      produtos,
      popups,
      sobreNos,
      recados
    };
    
    try {
      const response = await fetch(`${WORKER_URL}/admin/dados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dados)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setLastSyncTime(new Date().toLocaleTimeString());
        setSaveStatus('published');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else if (response.status === 401) {
        alert('Sessão expirada. Faça login novamente.');
        navigate('/auth');
      } else {
        setSaveError(`❌ ${result.error || 'Erro ao salvar'}`);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    } catch (error) {
      setSaveError('❌ Erro de conexão');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fiel_token');
    localStorage.removeItem('fiel_user');
    navigate('/auth');
  };

  // Handlers do Carrossel
  const handleUploadCarrossel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    try {
      const novas = await Promise.all(Array.from(files).map(async (file, i) => ({
        id: Date.now() + i + '',
        imagem: await uploadParaR2(file, 'carrossel'),
        titulo: `Nova Imagem ${fotosCarrossel.length + i + 1}`,
        ordem: fotosCarrossel.length + i,
        ativo: true
      })));
      setFotosCarrossel([...fotosCarrossel, ...novas]);
    } catch (error) {
      alert('❌ Erro ao fazer upload para o R2');
    }
  };

  const handleDeleteCarrossel = (id: string) => {
    if (confirm('Excluir esta imagem?')) {
      setFotosCarrossel(fotosCarrossel.filter(i => i.id !== id));
    }
  };

  const handleToggleAtivoCarrossel = (id: string) => {
    setFotosCarrossel(fotosCarrossel.map(i => i.id === id ? { ...i, ativo: !i.ativo } : i));
  };

  const handleUpdateCarrosselTitulo = (id: string, titulo: string) => {
    setFotosCarrossel(fotosCarrossel.map(i => i.id === id ? { ...i, titulo } : i));
  };

  // Handlers do Cardápio
  const handleAddProduto = () => {
    const novoProduto: Produto = {
      id: Date.now().toString(),
      name: 'Novo Produto',
      description: 'Descrição do produto',
      price: 0,
      category: categorias[0]?.name || 'Bolos caseiros',
      available: true
    };
    setProdutos([...produtos, novoProduto]);
  };

  const handleDeleteProduto = (id: string) => {
    if (confirm('Excluir este produto?')) {
      setProdutos(produtos.filter(p => p.id !== id));
    }
  };

  const handleUpdateProduto = (id: string, field: keyof Produto, value: any) => {
    setProdutos(produtos.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleStartEditProduto = (produto: Produto) => {
    setEditingProdutoId(produto.id);
    setEditProdutoForm({
      name: produto.name,
      description: produto.description,
      price: produto.price,
      category: produto.category
    });
  };

  const handleSaveEditProduto = () => {
    if (!editingProdutoId) return;
    setProdutos(produtos.map(p => p.id === editingProdutoId ? {
      ...p,
      name: editProdutoForm.name,
      description: editProdutoForm.description,
      price: editProdutoForm.price,
      category: editProdutoForm.category
    } : p));
    setEditingProdutoId(null);
  };

  const handleAddCategoria = () => {
    const novaCategoria: Categoria = {
      id: Date.now().toString(),
      name: 'Nova Categoria',
      description: 'Descrição da categoria',
      icon: 'cake'
    };
    setCategorias([...categorias, novaCategoria]);
  };

  const handleUpdateCategoria = (id: string, field: keyof Categoria, value: any) => {
    setCategorias(categorias.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleDeleteCategoria = (id: string) => {
    if (confirm('Excluir esta categoria? Os produtos serão movidos para a primeira categoria.')) {
      const categoriaToDelete = categorias.find(c => c.id === id);
      if (categoriaToDelete) {
        const firstCategory = categorias[0]?.name || 'Bolos caseiros';
        setProdutos(produtos.map(p => p.category === categoriaToDelete.name ? { ...p, category: firstCategory } : p));
        setCategorias(categorias.filter(c => c.id !== id));
      }
    }
  };

  const handleUploadCategoriaImagem = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadParaR2(file, 'categorias');
        handleUpdateCategoria(id, 'imageUrl', url);
      } catch (error) {
        alert('❌ Erro ao fazer upload da imagem');
      }
    }
  };

  // Handlers do Popup
  const handleUploadPopups = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    try {
      const novos = await Promise.all(Array.from(files).map(async (file, i) => ({
        id: Date.now() + i + '',
        imagem: await uploadParaR2(file, 'popup'),
        tempoExibicao: 10,
        ativo: true,
        ordem: popups.length + i
      })));
      setPopups([...popups, ...novos]);
    } catch (error) {
      alert('❌ Erro ao fazer upload para o R2');
    }
  };

  const handleDeletePopup = (id: string) => {
    if (confirm('Excluir este popup?')) {
      setPopups(popups.filter(p => p.id !== id));
    }
  };

  const handleToggleAtivoPopup = (id: string) => {
    setPopups(popups.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p));
  };

  const handleTempoExibicaoPopup = (id: string, tempo: number) => {
    setPopups(popups.map(p => p.id === id ? { ...p, tempoExibicao: tempo } : p));
  };

  // Handlers da página Sobre Nós
  const handleAddImagemSobre = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    try {
      const novas = await Promise.all(Array.from(files).map(f => uploadParaR2(f, 'sobre')));
      setSobreNos({ ...sobreNos, imagensCarrossel: [...sobreNos.imagensCarrossel, ...novas] });
    } catch (error) {
      alert('❌ Erro ao fazer upload');
    }
  };

  const handleDeleteImagemSobre = (index: number) => {
    const novasImagens = [...sobreNos.imagensCarrossel];
    novasImagens.splice(index, 1);
    setSobreNos({ ...sobreNos, imagensCarrossel: novasImagens });
  };

  // Handlers de Recados
  const handleAddRecado = () => {
    if (!novoRecado.titulo || !novoRecado.conteudo) {
      alert('Preencha título e conteúdo!');
      return;
    }
    setRecados([...recados, {
      ...novoRecado,
      id: Date.now() + '',
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      ativo: true,
      tempoExibicao: tempoExibicaoRecados
    }]);
    setNovoRecado({ titulo: '', conteudo: '', avisoimportante: false });
  };

  const handleStartEditRecado = (recado: RecadoItem) => {
    setEditingRecadoId(recado.id);
    setEditRecadoForm({ titulo: recado.titulo, conteudo: recado.conteudo });
  };

  const handleSaveEditRecado = () => {
    if (!editingRecadoId) return;
    setRecados(recados.map(r => r.id === editingRecadoId
      ? { ...r, titulo: editRecadoForm.titulo, conteudo: editRecadoForm.conteudo }
      : r));
    setEditingRecadoId(null);
  };

  const handleDeleteRecado = (id: string) => {
    if (confirm('Excluir este recado?')) {
      setRecados(recados.filter(r => r.id !== id));
    }
  };

  const handleToggleAtivoRecado = (id: string) => {
    setRecados(recados.map(r => r.id === id ? { ...r, ativo: !r.ativo } : r));
  };

  const handleToggleAvisoImportante = (id: string) => {
    setRecados(recados.map(r => r.id === id ? { ...r, avisoimportante: !r.avisoimportante } : r));
  };

  // Handlers de Perfil
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadParaR2(file, 'avatar');
        const token = getAuthToken();
        await fetch(`${WORKER_URL}/admin/perfil`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ avatar: url })
        });
      } catch (error) {
        alert('❌ Erro ao fazer upload do avatar');
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = getAuthToken();
      await fetch(`${WORKER_URL}/admin/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nome: editProfileForm.nome, email: editProfileForm.email })
      });
      setPerfilAdmin({ ...perfilAdmin, nome: editProfileForm.nome, email: editProfileForm.email });
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
      const response = await fetch(`${WORKER_URL}/admin/alterar-senha`, {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const menuItems = [
    { id: 'carrossel', label: 'Carrossel (Hero)', icon: Image, count: fotosCarrossel.filter(f => f.ativo).length },
    { id: 'cardapio', label: 'Cardápio', icon: Menu, count: produtos.length },
    { id: 'popup', label: 'Popup', icon: Bell, count: popups.filter(p => p.ativo).length },
    { id: 'sobre-nos', label: 'Sobre Nós', icon: Users, count: 1 },
    { id: 'recados', label: 'Recados', icon: AlertCircle, count: recados.filter(r => r.ativo).length }
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-amber-50 to-orange-100">
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-16'} bg-gradient-to-b from-amber-800 to-amber-900 shadow-xl transition-all duration-300 flex flex-col fixed h-screen left-0 z-40 overflow-y-auto`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} className={`text-white transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
        </button>
        
        {sidebarOpen ? (
          <div className="flex items-center gap-2 px-6 pt-6 pb-4">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Settings size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">Admin Pani</span>
          </div>
        ) : (
          <div className="flex justify-center pt-6">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Settings size={18} className="text-white" />
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
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-500/30 text-white">{item.count}</span>
                  </>
                )}
              </button>
            ))}
            <div className="border-t border-amber-700/30 my-3"></div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all">
              <LogOut size={sidebarOpen ? 18 : 20} />
              {sidebarOpen && <span className="text-sm font-medium">Sair</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-16'} relative overflow-y-auto h-screen`}>
        <main className="container mx-auto px-6 pt-24 pb-32">
          
          {/* CABEÇALHO */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-amber-900">Painel Administrativo</h1>
              <p className="text-amber-600">Gerencie o conteúdo do site Pani Di Grano</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-amber-800">{perfilAdmin.nome}</p>
                <p className="text-sm text-amber-600">{perfilAdmin.email}</p>
              </div>
              <button onClick={() => { setEditProfileForm({ nome: perfilAdmin.nome, email: perfilAdmin.email }); setShowEditProfileModal(true); }} className="p-2 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors">
                <User size={20} className="text-amber-700" />
              </button>
            </div>
          </div>

          {/* DICA */}
          <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 mb-6 text-amber-800 text-sm flex items-start gap-3">
            <Globe size={20} className="flex-shrink-0 mt-0.5" />
            <span>As alterações são salvas no servidor ao clicar em <strong>"Salvar e Publicar"</strong>.</span>
          </div>

          {/* CONTEÚDO POR ABA */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            
            {/* CARROSSEL (HERO) */}
            {activeTab === 'carrossel' && (
              <div>
                <h2 className="text-xl font-bold text-amber-800 mb-4">Gerenciar Carrossel da Home (Hero)</h2>
                <div className="mb-6">
                  <div className="border-2 border-dashed border-amber-300 rounded-xl p-6 text-center bg-amber-50">
                    <Upload className="w-6 h-6 text-amber-500 mx-auto mb-3" />
                    <label className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors">
                      <Plus size={16} /> Adicionar Imagens ({fotosCarrossel.length}/{LIMITES.CARROSSEL_MAX})
                      <input type="file" multiple accept="image/*" onChange={handleUploadCarrossel} className="hidden" disabled={fotosCarrossel.length >= LIMITES.CARROSSEL_MAX} />
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {fotosCarrossel.map((item, index) => (
                    <div key={item.id} className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50 group">
                      <div className="relative">
                        <img src={getImageUrl(item.imagem)} alt={item.titulo} className="w-full h-32 object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button onClick={() => handleToggleAtivoCarrossel(item.id)} className={`p-1 rounded-full ${item.ativo ? 'bg-green-500' : 'bg-red-500'}`}>
                            {item.ativo ? <Eye size={12} className="text-white" /> : <EyeOff size={12} className="text-white" />}
                          </button>
                          <button onClick={() => handleDeleteCarrossel(item.id)} className="p-1 bg-red-500 rounded-full">
                            <Trash2 size={12} className="text-white" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <input type="text" value={item.titulo || ''} onChange={(e) => handleUpdateCarrosselTitulo(item.id, e.target.value)} className="w-full text-sm border border-amber-300 rounded px-2 py-1 mb-1 bg-white" placeholder="Título" />
                        <div className="flex justify-between text-xs text-amber-600">
                          <span>Ordem: {item.ordem + 1}</span>
                          <span className={item.ativo ? 'text-green-600' : 'text-red-500'}>{item.ativo ? 'Ativo' : 'Inativo'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CARDÁPIO */}
            {activeTab === 'cardapio' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-amber-800">Gerenciar Cardápio</h2>
                  <button onClick={handleAddProduto} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2">
                    <Plus size={16} /> Novo Produto
                  </button>
                </div>

                {/* Categorias */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-amber-700">Categorias</h3>
                    <button onClick={handleAddCategoria} className="text-sm bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1 rounded-lg">+ Nova</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categorias.map((cat) => (
                      <div key={cat.id} className="border border-amber-200 rounded-lg p-3 bg-amber-50">
                        <div className="flex justify-between">
                          <input type="text" value={cat.name} onChange={(e) => handleUpdateCategoria(cat.id, 'name', e.target.value)} className="font-medium text-amber-800 bg-transparent border-b border-amber-300 w-full mb-1" />
                          <button onClick={() => handleDeleteCategoria(cat.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                        </div>
                        <input type="text" value={cat.description} onChange={(e) => handleUpdateCategoria(cat.id, 'description', e.target.value)} className="text-xs text-amber-600 bg-transparent w-full mb-2" placeholder="Descrição" />
                        <label className="text-xs text-amber-500 cursor-pointer flex items-center gap-1">
                          <Camera size={12} /> Imagem
                          <input type="file" accept="image/*" onChange={(e) => handleUploadCategoriaImagem(cat.id, e)} className="hidden" />
                        </label>
                        {cat.imageUrl && <img src={getImageUrl(cat.imageUrl)} alt={cat.name} className="w-full h-16 object-cover mt-2 rounded" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Produtos */}
                <h3 className="text-lg font-semibold text-amber-700 mb-3">Produtos ({produtos.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {produtos.map((produto) => (
                    <div key={produto.id} className={`border rounded-lg p-4 ${produto.available ? 'border-amber-200 bg-white' : 'border-gray-300 bg-gray-50'}`}>
                      {editingProdutoId === produto.id ? (
                        <div className="space-y-3">
                          <input type="text" value={editProdutoForm.name} onChange={(e) => setEditProdutoForm({ ...editProdutoForm, name: e.target.value })} className="w-full p-2 border rounded" placeholder="Nome" />
                          <textarea value={editProdutoForm.description} onChange={(e) => setEditProdutoForm({ ...editProdutoForm, description: e.target.value })} className="w-full p-2 border rounded" rows={2} placeholder="Descrição" />
                          <input type="number" value={editProdutoForm.price} onChange={(e) => setEditProdutoForm({ ...editProdutoForm, price: parseFloat(e.target.value) })} className="w-32 p-2 border rounded" placeholder="Preço" />
                          <select value={editProdutoForm.category} onChange={(e) => setEditProdutoForm({ ...editProdutoForm, category: e.target.value })} className="p-2 border rounded">
                            {categorias.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                          <div className="flex gap-2">
                            <button onClick={handleSaveEditProduto} className="px-4 py-2 bg-green-600 text-white rounded">Salvar</button>
                            <button onClick={() => setEditingProdutoId(null)} className="px-4 py-2 bg-gray-500 text-white rounded">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-amber-800">{produto.name}</h4>
                              <span className="text-sm text-amber-600">R$ {produto.price.toFixed(2)}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${produto.available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                {produto.available ? 'Disponível' : 'Indisponível'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{produto.description}</p>
                            <p className="text-xs text-amber-500 mt-1">Categoria: {produto.category}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleStartEditProduto(produto)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                            <button onClick={() => handleUpdateProduto(produto.id, 'available', !produto.available)} className={`p-2 rounded ${produto.available ? 'text-gray-500' : 'text-green-600'}`}>
                              {produto.available ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button onClick={() => handleDeleteProduto(produto.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* POPUP */}
            {activeTab === 'popup' && (
              <div>
                <h2 className="text-xl font-bold text-amber-800 mb-4">Gerenciar Popups</h2>
                <div className="mb-6">
                  <div className="border-2 border-dashed border-amber-300 rounded-xl p-6 text-center bg-amber-50">
                    <Upload className="w-6 h-6 text-amber-500 mx-auto mb-3" />
                    <label className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors">
                      <Plus size={16} /> Adicionar Popup ({popups.length}/{LIMITES.POPUP_MAX})
                      <input type="file" multiple accept="image/*" onChange={handleUploadPopups} className="hidden" disabled={popups.length >= LIMITES.POPUP_MAX} />
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popups.map((popup, index) => (
                    <div key={popup.id} className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50">
                      <div className="relative h-40 bg-gray-100">
                        <img src={getImageUrl(popup.imagem)} alt="Popup" className="w-full h-full object-contain" />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button onClick={() => handleToggleAtivoPopup(popup.id)} className={`p-1 rounded-full ${popup.ativo ? 'bg-green-500' : 'bg-red-500'}`}>
                            {popup.ativo ? <Eye size={12} className="text-white" /> : <EyeOff size={12} className="text-white" />}
                          </button>
                          <button onClick={() => handleDeletePopup(popup.id)} className="p-1 bg-red-500 rounded-full"><Trash2 size={12} className="text-white" /></button>
                        </div>
                        {popup.ativo && <div className="absolute top-2 left-2"><span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">Ativo</span></div>}
                      </div>
                      <div className="p-4">
                        <div className="flex gap-2">
                          {[5, 10, 20].map(t => (
                            <button key={t} onClick={() => handleTempoExibicaoPopup(popup.id, t)} className={`flex-1 py-1 text-xs rounded ${popup.tempoExibicao === t ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'}`}>{t}s</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {popups.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum popup cadastrado. Clique em "Adicionar Popup" para começar.</p>}
              </div>
            )}

            {/* SOBRE NÓS */}
            {activeTab === 'sobre-nos' && (
              <div>
                <h2 className="text-xl font-bold text-amber-800 mb-4">Editar Página "Sobre Nós"</h2>
                
                {/* Carrossel de imagens */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-amber-700 mb-3">Carrossel de Imagens da Loja</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-3">
                    {sobreNos.imagensCarrossel.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={getImageUrl(img)} alt={`Loja ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                        <button onClick={() => handleDeleteImagemSobre(idx)} className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={12} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors">
                    <Upload size={16} /> Adicionar Imagem
                    <input type="file" multiple accept="image/*" onChange={handleAddImagemSobre} className="hidden" />
                  </label>
                </div>

                {/* História */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-amber-700 mb-3">História</h3>
                  {editandoHistoria ? (
                    <div className="space-y-3">
                      <textarea value={sobreNos.historia} onChange={(e) => setSobreNos({ ...sobreNos, historia: e.target.value })} rows={8} className="w-full p-3 border border-amber-300 rounded-lg" />
                      <div className="flex gap-2">
                        <button onClick={() => setEditandoHistoria(false)} className="px-4 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
                        <button onClick={() => setEditandoHistoria(false)} className="px-4 py-2 bg-gray-500 text-white rounded-lg">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="whitespace-pre-line text-gray-700">{sobreNos.historia}</p>
                      <button onClick={() => setEditandoHistoria(true)} className="mt-3 text-amber-600 hover:text-amber-700 flex items-center gap-1"><Edit2 size={14} /> Editar</button>
                    </div>
                  )}
                </div>

                {/* Valores */}
                <div>
                  <h3 className="text-lg font-semibold text-amber-700 mb-3">Nossos Valores</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(sobreNos.valores).map(([key, value]) => (
                      <div key={key} className="bg-amber-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {key === 'artesanal' && <ChefHat size={18} className="text-amber-600" />}
                          {key === 'amor' && <Heart size={18} className="text-amber-600" />}
                          {key === 'qualidade' && <Award size={18} className="text-amber-600" />}
                          {key === 'familia' && <Users size={18} className="text-amber-600" />}
                          <span className="font-medium text-amber-800 capitalize">{key}</span>
                        </div>
                        {editandoValor === key ? (
                          <div className="space-y-2">
                            <input type="text" value={value} onChange={(e) => setSobreNos({ ...sobreNos, valores: { ...sobreNos.valores, [key]: e.target.value } })} className="w-full p-2 border border-amber-300 rounded" />
                            <div className="flex gap-2">
                              <button onClick={() => setEditandoValor(null)} className="text-green-600">Salvar</button>
                              <button onClick={() => setEditandoValor(null)} className="text-gray-500">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-600">{value}</p>
                            <button onClick={() => setEditandoValor(key)} className="text-xs text-amber-600 mt-1">Editar</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* RECADOS */}
            {activeTab === 'recados' && (
              <div>
                <h2 className="text-xl font-bold text-amber-800 mb-4">Gerenciar Recados</h2>
                <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
                  <h3 className="font-bold text-amber-800 mb-3">Tempo de exibição padrão</h3>
                  <div className="flex gap-2">
                    {[5, 10].map(tempo => (
                      <button key={tempo} onClick={() => setTempoExibicaoRecados(tempo)} className={`px-3 py-1 rounded-lg text-sm ${tempoExibicaoRecados === tempo ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-300'}`}>{tempo}s</button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
                  <h3 className="font-bold text-amber-800 mb-3">Novo Recado</h3>
                  <div className="space-y-3">
                    <input type="text" value={novoRecado.titulo} onChange={(e) => setNovoRecado({ ...novoRecado, titulo: e.target.value })} placeholder="Título" className="w-full p-3 border border-amber-300 rounded-lg bg-white" />
                    <textarea value={novoRecado.conteudo} onChange={(e) => setNovoRecado({ ...novoRecado, conteudo: e.target.value })} placeholder="Conteúdo" rows={3} className="w-full p-3 border border-amber-300 rounded-lg bg-white" />
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="avisoimportante" checked={novoRecado.avisoimportante} onChange={(e) => setNovoRecado({ ...novoRecado, avisoimportante: e.target.checked })} className="w-4 h-4" />
                      <label htmlFor="avisoimportante" className="text-sm text-amber-700">Marcar como aviso importante</label>
                    </div>
                    <button onClick={handleAddRecado} className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium">Adicionar Recado</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {recados.map((recado) => (
                    <div key={recado.id} className={`border rounded-lg p-4 ${recado.avisoimportante ? 'bg-red-50 border-red-300' : 'bg-white border-amber-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-amber-800">{recado.titulo}</h4>
                            {recado.avisoimportante && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">⚠️ AVISO</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${recado.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{recado.ativo ? 'Ativo' : 'Inativo'}</span>
                            <span className="text-xs text-gray-500">{recado.dataCriacao}</span>
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{recado.tempoExibicao || 5}s</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {editingRecadoId === recado.id ? (
                            <div className="flex gap-1">
                              <button onClick={handleSaveEditRecado} className="p-1 bg-green-600 text-white rounded"><Check size={14} /></button>
                              <button onClick={() => setEditingRecadoId(null)} className="p-1 bg-gray-500 text-white rounded"><X size={14} /></button>
                            </div>
                          ) : (
                            <button onClick={() => handleStartEditRecado(recado)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                          )}
                          <button onClick={() => handleToggleAvisoImportante(recado.id)} className={`p-2 rounded ${recado.avisoimportante ? 'text-red-500' : 'text-gray-400'}`}><AlertCircle size={16} /></button>
                          <button onClick={() => handleToggleAtivoRecado(recado.id)} className={`p-2 rounded ${recado.ativo ? 'text-green-600' : 'text-gray-400'}`}>{recado.ativo ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                          <button onClick={() => handleDeleteRecado(recado.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      {editingRecadoId === recado.id ? (
                        <div className="mt-3 space-y-2">
                          <input type="text" value={editRecadoForm.titulo} onChange={(e) => setEditRecadoForm({ ...editRecadoForm, titulo: e.target.value })} className="w-full p-2 border rounded" />
                          <textarea value={editRecadoForm.conteudo} onChange={(e) => setEditRecadoForm({ ...editRecadoForm, conteudo: e.target.value })} rows={3} className="w-full p-2 border rounded" />
                        </div>
                      ) : (
                        <p className="text-gray-700 text-sm whitespace-pre-line">{recado.conteudo}</p>
                      )}
                    </div>
                  ))}
                  {recados.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum recado cadastrado</p>}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* BOTÃO SALVAR */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-200 p-4 shadow-lg z-30" style={{ marginLeft: sidebarOpen ? '18rem' : '4rem' }}>
          <div className="container mx-auto flex items-center justify-center gap-4">
            <button onClick={salvarEPublicar} disabled={saveStatus === 'saving'} className="inline-flex items-center gap-3 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-all shadow-lg disabled:opacity-70">
              {saveStatus === 'saving' ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Publicando...</>) : saveStatus === 'published' ? (<><Check size={20} />Publicado!</>) : (<><Globe size={20} />Salvar e Publicar</>)}
            </button>
            {saveError && <span className="text-red-600 text-sm">{saveError}</span>}
          </div>
        </div>
        <div className="h-20"></div>
      </div>

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