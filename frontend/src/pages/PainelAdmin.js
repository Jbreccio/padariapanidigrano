import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image, AlertCircle, LogOut, Trash2, Eye, Bell, Settings, Plus, Globe, X, Edit2, Check, EyeOff, Camera, ArrowLeft, User, Menu, Heart, Award, Users, ChefHat } from 'lucide-react';
// ============================================
// 🖼️ FUNÇÃO PARA CORRIGIR URL DAS IMAGENS
// ============================================
const getImageUrl = (url) => {
    if (!url)
        return '';
    if (url.startsWith('http://') || url.startsWith('https://'))
        return url;
    if (url.startsWith('/images/'))
        return url;
    return url;
};
const WORKER_URL = import.meta.env.VITE_WORKER_URL || '/api';
const getAuthToken = () => {
    return localStorage.getItem('fiel_token');
};
const uploadParaR2 = async (file, tipo) => {
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
    if (!data.success)
        throw new Error(data.error || 'Falha no upload');
    return data.url;
};
const LIMITES = {
    CARROSSEL_MAX: 20,
    POPUP_MAX: 10,
    RECADOS_MAX: 10
};
// Dados iniciais do cardápio
const CATEGORIAS_INICIAIS = [
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
const PRODUTOS_INICIAIS = [
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
const SOBRE_NOS_INICIAL = {
    historia: "A Pani Di Grano nasceu do sonho de levar o verdadeiro sabor artesanal até você. Com receitas passadas de geração em geração e ingredientes cuidadosamente selecionados, cada pão, cada bolo carrega uma história de dedicação e amor.\n\nNosso nome, 'Pani Di Grano' (Pão de Trigo em italiano), reflete nossa paixão pela arte da panificação e pelo respeito aos ingredientes simples que transformamos em verdadeiras delícias.\n\nTrabalhamos com fermentação natural, farinhas de qualidade e um processo artesanal que respeita o tempo de cada massa. O resultado são produtos únicos, com sabor e textura incomparáveis.",
    valores: {
        artesanal: "Cada produto é feito à mão com cuidado e atenção aos detalhes",
        amor: "Colocamos carinho em cada etapa da produção",
        qualidade: "Ingredientes selecionados para o melhor sabor",
        familia: "Receitas tradicionais passadas de geração em geração"
    },
    imagensCarrossel: ["/images/loja.png", "/images/loja2.png", "/images/loja3.png", "/images/loja4.png", "/images/loja5.png", "/images/loja6.png", "/images/loja7.png", "/images/loja8.png", "/images/loja9.png", "/images/loja10.png", "/images/loja11.png"]
};
const CARROSSEL_INICIAL = [
    { id: "1", imagem: "/images/foto17.png", titulo: "Pães Artesanais", ordem: 0, ativo: true },
    { id: "2", imagem: "/images/loja07.png", titulo: "Nossa Loja", ordem: 1, ativo: true },
    { id: "3", imagem: "/images/loja08.png", titulo: "Ambiente Acolhedor", ordem: 2, ativo: true },
];
export default function PainelAdmin() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('carrossel');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [saveError, setSaveError] = useState('');
    // Estados do Carrossel (Hero)
    const [fotosCarrossel, setFotosCarrossel] = useState(CARROSSEL_INICIAL);
    // Estados do Cardápio
    const [categorias, setCategorias] = useState(CATEGORIAS_INICIAIS);
    const [produtos, setProdutos] = useState(PRODUTOS_INICIAIS);
    const [editingProdutoId, setEditingProdutoId] = useState(null);
    const [editProdutoForm, setEditProdutoForm] = useState({ name: '', description: '', price: 0, category: '' });
    // Estados do Popup
    const [popups, setPopups] = useState([]);
    // Estados da página Sobre Nós
    const [sobreNos, setSobreNos] = useState(SOBRE_NOS_INICIAL);
    const [editandoHistoria, setEditandoHistoria] = useState(false);
    const [editandoValor, setEditandoValor] = useState(null);
    // Estados de Recados
    const [recados, setRecados] = useState([]);
    const [novoRecado, setNovoRecado] = useState({ titulo: '', conteudo: '', avisoimportante: false });
    const [tempoExibicaoRecados, setTempoExibicaoRecados] = useState(5);
    const [editingRecadoId, setEditingRecadoId] = useState(null);
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
    const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
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
            }
            catch (err) {
                navigate('/auth');
            }
            finally {
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
                if (data.dados.carrossel?.length)
                    setFotosCarrossel(data.dados.carrossel);
                if (data.dados.categorias?.length)
                    setCategorias(data.dados.categorias);
                if (data.dados.produtos?.length)
                    setProdutos(data.dados.produtos);
                if (data.dados.popups?.length)
                    setPopups(data.dados.popups);
                if (data.dados.sobreNos)
                    setSobreNos(data.dados.sobreNos);
                if (data.dados.recados?.length)
                    setRecados(data.dados.recados);
                setLastSyncTime(new Date().toLocaleTimeString());
            }
        }
        catch (e) {
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
            }
            else if (response.status === 401) {
                alert('Sessão expirada. Faça login novamente.');
                navigate('/auth');
            }
            else {
                setSaveError(`❌ ${result.error || 'Erro ao salvar'}`);
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 4000);
            }
        }
        catch (error) {
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
    const handleUploadCarrossel = async (e) => {
        const files = e.target.files;
        if (!files)
            return;
        try {
            const novas = await Promise.all(Array.from(files).map(async (file, i) => ({
                id: Date.now() + i + '',
                imagem: await uploadParaR2(file, 'carrossel'),
                titulo: `Nova Imagem ${fotosCarrossel.length + i + 1}`,
                ordem: fotosCarrossel.length + i,
                ativo: true
            })));
            setFotosCarrossel([...fotosCarrossel, ...novas]);
        }
        catch (error) {
            alert('❌ Erro ao fazer upload para o R2');
        }
    };
    const handleDeleteCarrossel = (id) => {
        if (confirm('Excluir esta imagem?')) {
            setFotosCarrossel(fotosCarrossel.filter(i => i.id !== id));
        }
    };
    const handleToggleAtivoCarrossel = (id) => {
        setFotosCarrossel(fotosCarrossel.map(i => i.id === id ? { ...i, ativo: !i.ativo } : i));
    };
    const handleUpdateCarrosselTitulo = (id, titulo) => {
        setFotosCarrossel(fotosCarrossel.map(i => i.id === id ? { ...i, titulo } : i));
    };
    // Handlers do Cardápio
    const handleAddProduto = () => {
        const novoProduto = {
            id: Date.now().toString(),
            name: 'Novo Produto',
            description: 'Descrição do produto',
            price: 0,
            category: categorias[0]?.name || 'Bolos caseiros',
            available: true
        };
        setProdutos([...produtos, novoProduto]);
    };
    const handleDeleteProduto = (id) => {
        if (confirm('Excluir este produto?')) {
            setProdutos(produtos.filter(p => p.id !== id));
        }
    };
    const handleUpdateProduto = (id, field, value) => {
        setProdutos(produtos.map(p => p.id === id ? { ...p, [field]: value } : p));
    };
    const handleStartEditProduto = (produto) => {
        setEditingProdutoId(produto.id);
        setEditProdutoForm({
            name: produto.name,
            description: produto.description,
            price: produto.price,
            category: produto.category
        });
    };
    const handleSaveEditProduto = () => {
        if (!editingProdutoId)
            return;
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
        const novaCategoria = {
            id: Date.now().toString(),
            name: 'Nova Categoria',
            description: 'Descrição da categoria',
            icon: 'cake'
        };
        setCategorias([...categorias, novaCategoria]);
    };
    const handleUpdateCategoria = (id, field, value) => {
        setCategorias(categorias.map(c => c.id === id ? { ...c, [field]: value } : c));
    };
    const handleDeleteCategoria = (id) => {
        if (confirm('Excluir esta categoria? Os produtos serão movidos para a primeira categoria.')) {
            const categoriaToDelete = categorias.find(c => c.id === id);
            if (categoriaToDelete) {
                const firstCategory = categorias[0]?.name || 'Bolos caseiros';
                setProdutos(produtos.map(p => p.category === categoriaToDelete.name ? { ...p, category: firstCategory } : p));
                setCategorias(categorias.filter(c => c.id !== id));
            }
        }
    };
    const handleUploadCategoriaImagem = async (id, e) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const url = await uploadParaR2(file, 'categorias');
                handleUpdateCategoria(id, 'imageUrl', url);
            }
            catch (error) {
                alert('❌ Erro ao fazer upload da imagem');
            }
        }
    };
    // Handlers do Popup
    const handleUploadPopups = async (e) => {
        const files = e.target.files;
        if (!files)
            return;
        try {
            const novos = await Promise.all(Array.from(files).map(async (file, i) => ({
                id: Date.now() + i + '',
                imagem: await uploadParaR2(file, 'popup'),
                tempoExibicao: 10,
                ativo: true,
                ordem: popups.length + i
            })));
            setPopups([...popups, ...novos]);
        }
        catch (error) {
            alert('❌ Erro ao fazer upload para o R2');
        }
    };
    const handleDeletePopup = (id) => {
        if (confirm('Excluir este popup?')) {
            setPopups(popups.filter(p => p.id !== id));
        }
    };
    const handleToggleAtivoPopup = (id) => {
        setPopups(popups.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p));
    };
    const handleTempoExibicaoPopup = (id, tempo) => {
        setPopups(popups.map(p => p.id === id ? { ...p, tempoExibicao: tempo } : p));
    };
    // Handlers da página Sobre Nós
    const handleAddImagemSobre = async (e) => {
        const files = e.target.files;
        if (!files)
            return;
        try {
            const novas = await Promise.all(Array.from(files).map(f => uploadParaR2(f, 'sobre')));
            setSobreNos({ ...sobreNos, imagensCarrossel: [...sobreNos.imagensCarrossel, ...novas] });
        }
        catch (error) {
            alert('❌ Erro ao fazer upload');
        }
    };
    const handleDeleteImagemSobre = (index) => {
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
    const handleStartEditRecado = (recado) => {
        setEditingRecadoId(recado.id);
        setEditRecadoForm({ titulo: recado.titulo, conteudo: recado.conteudo });
    };
    const handleSaveEditRecado = () => {
        if (!editingRecadoId)
            return;
        setRecados(recados.map(r => r.id === editingRecadoId
            ? { ...r, titulo: editRecadoForm.titulo, conteudo: editRecadoForm.conteudo }
            : r));
        setEditingRecadoId(null);
    };
    const handleDeleteRecado = (id) => {
        if (confirm('Excluir este recado?')) {
            setRecados(recados.filter(r => r.id !== id));
        }
    };
    const handleToggleAtivoRecado = (id) => {
        setRecados(recados.map(r => r.id === id ? { ...r, ativo: !r.ativo } : r));
    };
    const handleToggleAvisoImportante = (id) => {
        setRecados(recados.map(r => r.id === id ? { ...r, avisoimportante: !r.avisoimportante } : r));
    };
    // Handlers de Perfil
    const handleAvatarUpload = async (e) => {
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
            }
            catch (error) {
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
        }
        catch (error) {
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
            }
            else {
                alert(`❌ ${result.error || 'Erro ao alterar senha'}`);
            }
        }
        catch (error) {
            alert('❌ Erro de conexão');
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-900", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" }), _jsx("p", { className: "text-white", children: "Verificando autentica\u00E7\u00E3o..." })] }) }));
    }
    if (!isAuthenticated)
        return null;
    const menuItems = [
        { id: 'carrossel', label: 'Carrossel (Hero)', icon: Image, count: fotosCarrossel.filter(f => f.ativo).length },
        { id: 'cardapio', label: 'Cardápio', icon: Menu, count: produtos.length },
        { id: 'popup', label: 'Popup', icon: Bell, count: popups.filter(p => p.ativo).length },
        { id: 'sobre-nos', label: 'Sobre Nós', icon: Users, count: 1 },
        { id: 'recados', label: 'Recados', icon: AlertCircle, count: recados.filter(r => r.ativo).length }
    ];
    return (_jsxs("div", { className: "min-h-screen flex bg-gradient-to-br from-amber-50 to-orange-100", children: [_jsxs("div", { className: `${sidebarOpen ? 'w-72' : 'w-16'} bg-gradient-to-b from-amber-800 to-amber-900 shadow-xl transition-all duration-300 flex flex-col fixed h-screen left-0 z-40 overflow-y-auto`, children: [_jsx("button", { onClick: () => setSidebarOpen(!sidebarOpen), className: "absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors", children: _jsx(ArrowLeft, { size: 20, className: `text-white transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}` }) }), sidebarOpen ? (_jsxs("div", { className: "flex items-center gap-2 px-6 pt-6 pb-4", children: [_jsx("div", { className: "w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center", children: _jsx(Settings, { size: 18, className: "text-white" }) }), _jsx("span", { className: "text-white font-bold text-lg", children: "Admin Pani" })] })) : (_jsx("div", { className: "flex justify-center pt-6", children: _jsx("div", { className: "w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center", children: _jsx(Settings, { size: 18, className: "text-white" }) }) })), _jsx("div", { className: "flex-1 px-4 pb-4 mt-4", children: _jsxs("nav", { className: "space-y-1", children: [menuItems.map((item) => (_jsxs("button", { onClick: () => setActiveTab(item.id), className: `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-amber-600/50 text-white shadow-lg' : 'text-amber-200 hover:bg-amber-700/50 hover:text-white'}`, children: [_jsx(item.icon, { size: sidebarOpen ? 18 : 20 }), sidebarOpen && (_jsxs(_Fragment, { children: [_jsx("span", { className: "flex-1 text-left text-sm font-medium", children: item.label }), _jsx("span", { className: "text-xs px-2 py-1 rounded-full bg-amber-500/30 text-white", children: item.count })] }))] }, item.id))), _jsx("div", { className: "border-t border-amber-700/30 my-3" }), _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all", children: [_jsx(LogOut, { size: sidebarOpen ? 18 : 20 }), sidebarOpen && _jsx("span", { className: "text-sm font-medium", children: "Sair" })] })] }) })] }), _jsxs("div", { className: `flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-16'} relative overflow-y-auto h-screen`, children: [_jsxs("main", { className: "container mx-auto px-6 pt-24 pb-32", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-amber-900", children: "Painel Administrativo" }), _jsx("p", { className: "text-amber-600", children: "Gerencie o conte\u00FAdo do site Pani Di Grano" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-medium text-amber-800", children: perfilAdmin.nome }), _jsx("p", { className: "text-sm text-amber-600", children: perfilAdmin.email })] }), _jsx("button", { onClick: () => { setEditProfileForm({ nome: perfilAdmin.nome, email: perfilAdmin.email }); setShowEditProfileModal(true); }, className: "p-2 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors", children: _jsx(User, { size: 20, className: "text-amber-700" }) })] })] }), _jsxs("div", { className: "bg-amber-100 border border-amber-300 rounded-xl p-4 mb-6 text-amber-800 text-sm flex items-start gap-3", children: [_jsx(Globe, { size: 20, className: "flex-shrink-0 mt-0.5" }), _jsxs("span", { children: ["As altera\u00E7\u00F5es s\u00E3o salvas no servidor ao clicar em ", _jsx("strong", { children: "\"Salvar e Publicar\"" }), "."] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [activeTab === 'carrossel' && (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-amber-800 mb-4", children: "Gerenciar Carrossel da Home (Hero)" }), _jsx("div", { className: "mb-6", children: _jsxs("div", { className: "border-2 border-dashed border-amber-300 rounded-xl p-6 text-center bg-amber-50", children: [_jsx(Upload, { className: "w-6 h-6 text-amber-500 mx-auto mb-3" }), _jsxs("label", { className: "inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors", children: [_jsx(Plus, { size: 16 }), " Adicionar Imagens (", fotosCarrossel.length, "/", LIMITES.CARROSSEL_MAX, ")", _jsx("input", { type: "file", multiple: true, accept: "image/*", onChange: handleUploadCarrossel, className: "hidden", disabled: fotosCarrossel.length >= LIMITES.CARROSSEL_MAX })] })] }) }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4", children: fotosCarrossel.map((item, index) => (_jsxs("div", { className: "border border-amber-200 rounded-lg overflow-hidden bg-amber-50 group", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: getImageUrl(item.imagem), alt: item.titulo, className: "w-full h-32 object-cover" }), _jsxs("div", { className: "absolute top-2 right-2 flex gap-1", children: [_jsx("button", { onClick: () => handleToggleAtivoCarrossel(item.id), className: `p-1 rounded-full ${item.ativo ? 'bg-green-500' : 'bg-red-500'}`, children: item.ativo ? _jsx(Eye, { size: 12, className: "text-white" }) : _jsx(EyeOff, { size: 12, className: "text-white" }) }), _jsx("button", { onClick: () => handleDeleteCarrossel(item.id), className: "p-1 bg-red-500 rounded-full", children: _jsx(Trash2, { size: 12, className: "text-white" }) })] })] }), _jsxs("div", { className: "p-3", children: [_jsx("input", { type: "text", value: item.titulo || '', onChange: (e) => handleUpdateCarrosselTitulo(item.id, e.target.value), className: "w-full text-sm border border-amber-300 rounded px-2 py-1 mb-1 bg-white", placeholder: "T\u00EDtulo" }), _jsxs("div", { className: "flex justify-between text-xs text-amber-600", children: [_jsxs("span", { children: ["Ordem: ", item.ordem + 1] }), _jsx("span", { className: item.ativo ? 'text-green-600' : 'text-red-500', children: item.ativo ? 'Ativo' : 'Inativo' })] })] })] }, item.id))) })] })), activeTab === 'cardapio' && (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-amber-800", children: "Gerenciar Card\u00E1pio" }), _jsxs("button", { onClick: handleAddProduto, className: "px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2", children: [_jsx(Plus, { size: 16 }), " Novo Produto"] })] }), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h3", { className: "text-lg font-semibold text-amber-700", children: "Categorias" }), _jsx("button", { onClick: handleAddCategoria, className: "text-sm bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1 rounded-lg", children: "+ Nova" })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3", children: categorias.map((cat) => (_jsxs("div", { className: "border border-amber-200 rounded-lg p-3 bg-amber-50", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("input", { type: "text", value: cat.name, onChange: (e) => handleUpdateCategoria(cat.id, 'name', e.target.value), className: "font-medium text-amber-800 bg-transparent border-b border-amber-300 w-full mb-1" }), _jsx("button", { onClick: () => handleDeleteCategoria(cat.id), className: "text-red-500 hover:text-red-700", children: _jsx(Trash2, { size: 14 }) })] }), _jsx("input", { type: "text", value: cat.description, onChange: (e) => handleUpdateCategoria(cat.id, 'description', e.target.value), className: "text-xs text-amber-600 bg-transparent w-full mb-2", placeholder: "Descri\u00E7\u00E3o" }), _jsxs("label", { className: "text-xs text-amber-500 cursor-pointer flex items-center gap-1", children: [_jsx(Camera, { size: 12 }), " Imagem", _jsx("input", { type: "file", accept: "image/*", onChange: (e) => handleUploadCategoriaImagem(cat.id, e), className: "hidden" })] }), cat.imageUrl && _jsx("img", { src: getImageUrl(cat.imageUrl), alt: cat.name, className: "w-full h-16 object-cover mt-2 rounded" })] }, cat.id))) })] }), _jsxs("h3", { className: "text-lg font-semibold text-amber-700 mb-3", children: ["Produtos (", produtos.length, ")"] }), _jsx("div", { className: "space-y-3 max-h-96 overflow-y-auto", children: produtos.map((produto) => (_jsx("div", { className: `border rounded-lg p-4 ${produto.available ? 'border-amber-200 bg-white' : 'border-gray-300 bg-gray-50'}`, children: editingProdutoId === produto.id ? (_jsxs("div", { className: "space-y-3", children: [_jsx("input", { type: "text", value: editProdutoForm.name, onChange: (e) => setEditProdutoForm({ ...editProdutoForm, name: e.target.value }), className: "w-full p-2 border rounded", placeholder: "Nome" }), _jsx("textarea", { value: editProdutoForm.description, onChange: (e) => setEditProdutoForm({ ...editProdutoForm, description: e.target.value }), className: "w-full p-2 border rounded", rows: 2, placeholder: "Descri\u00E7\u00E3o" }), _jsx("input", { type: "number", value: editProdutoForm.price, onChange: (e) => setEditProdutoForm({ ...editProdutoForm, price: parseFloat(e.target.value) }), className: "w-32 p-2 border rounded", placeholder: "Pre\u00E7o" }), _jsx("select", { value: editProdutoForm.category, onChange: (e) => setEditProdutoForm({ ...editProdutoForm, category: e.target.value }), className: "p-2 border rounded", children: categorias.map(c => _jsx("option", { value: c.name, children: c.name }, c.id)) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleSaveEditProduto, className: "px-4 py-2 bg-green-600 text-white rounded", children: "Salvar" }), _jsx("button", { onClick: () => setEditingProdutoId(null), className: "px-4 py-2 bg-gray-500 text-white rounded", children: "Cancelar" })] })] })) : (_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h4", { className: "font-semibold text-amber-800", children: produto.name }), _jsxs("span", { className: "text-sm text-amber-600", children: ["R$ ", produto.price.toFixed(2)] }), _jsx("span", { className: `text-xs px-2 py-0.5 rounded-full ${produto.available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`, children: produto.available ? 'Disponível' : 'Indisponível' })] }), _jsx("p", { className: "text-sm text-gray-600", children: produto.description }), _jsxs("p", { className: "text-xs text-amber-500 mt-1", children: ["Categoria: ", produto.category] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => handleStartEditProduto(produto), className: "p-2 text-blue-600 hover:bg-blue-50 rounded", children: _jsx(Edit2, { size: 16 }) }), _jsx("button", { onClick: () => handleUpdateProduto(produto.id, 'available', !produto.available), className: `p-2 rounded ${produto.available ? 'text-gray-500' : 'text-green-600'}`, children: produto.available ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) }), _jsx("button", { onClick: () => handleDeleteProduto(produto.id), className: "p-2 text-red-500 hover:bg-red-50 rounded", children: _jsx(Trash2, { size: 16 }) })] })] })) }, produto.id))) })] })), activeTab === 'popup' && (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-amber-800 mb-4", children: "Gerenciar Popups" }), _jsx("div", { className: "mb-6", children: _jsxs("div", { className: "border-2 border-dashed border-amber-300 rounded-xl p-6 text-center bg-amber-50", children: [_jsx(Upload, { className: "w-6 h-6 text-amber-500 mx-auto mb-3" }), _jsxs("label", { className: "inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors", children: [_jsx(Plus, { size: 16 }), " Adicionar Popup (", popups.length, "/", LIMITES.POPUP_MAX, ")", _jsx("input", { type: "file", multiple: true, accept: "image/*", onChange: handleUploadPopups, className: "hidden", disabled: popups.length >= LIMITES.POPUP_MAX })] })] }) }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: popups.map((popup, index) => (_jsxs("div", { className: "border border-amber-200 rounded-lg overflow-hidden bg-amber-50", children: [_jsxs("div", { className: "relative h-40 bg-gray-100", children: [_jsx("img", { src: getImageUrl(popup.imagem), alt: "Popup", className: "w-full h-full object-contain" }), _jsxs("div", { className: "absolute top-2 right-2 flex gap-1", children: [_jsx("button", { onClick: () => handleToggleAtivoPopup(popup.id), className: `p-1 rounded-full ${popup.ativo ? 'bg-green-500' : 'bg-red-500'}`, children: popup.ativo ? _jsx(Eye, { size: 12, className: "text-white" }) : _jsx(EyeOff, { size: 12, className: "text-white" }) }), _jsx("button", { onClick: () => handleDeletePopup(popup.id), className: "p-1 bg-red-500 rounded-full", children: _jsx(Trash2, { size: 12, className: "text-white" }) })] }), popup.ativo && _jsx("div", { className: "absolute top-2 left-2", children: _jsx("span", { className: "px-2 py-0.5 bg-green-500 text-white text-xs rounded-full", children: "Ativo" }) })] }), _jsx("div", { className: "p-4", children: _jsx("div", { className: "flex gap-2", children: [5, 10, 20].map(t => (_jsxs("button", { onClick: () => handleTempoExibicaoPopup(popup.id, t), className: `flex-1 py-1 text-xs rounded ${popup.tempoExibicao === t ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'}`, children: [t, "s"] }, t))) }) })] }, popup.id))) }), popups.length === 0 && _jsx("p", { className: "text-center text-gray-500 py-8", children: "Nenhum popup cadastrado. Clique em \"Adicionar Popup\" para come\u00E7ar." })] })), activeTab === 'sobre-nos' && (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-amber-800 mb-4", children: "Editar P\u00E1gina \"Sobre N\u00F3s\"" }), _jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-amber-700 mb-3", children: "Carrossel de Imagens da Loja" }), _jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-3", children: sobreNos.imagensCarrossel.map((img, idx) => (_jsxs("div", { className: "relative group", children: [_jsx("img", { src: getImageUrl(img), alt: `Loja ${idx + 1}`, className: "w-full h-20 object-cover rounded-lg" }), _jsx("button", { onClick: () => handleDeleteImagemSobre(idx), className: "absolute top-1 right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(Trash2, { size: 12, className: "text-white" }) })] }, idx))) }), _jsxs("label", { className: "inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors", children: [_jsx(Upload, { size: 16 }), " Adicionar Imagem", _jsx("input", { type: "file", multiple: true, accept: "image/*", onChange: handleAddImagemSobre, className: "hidden" })] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-amber-700 mb-3", children: "Hist\u00F3ria" }), editandoHistoria ? (_jsxs("div", { className: "space-y-3", children: [_jsx("textarea", { value: sobreNos.historia, onChange: (e) => setSobreNos({ ...sobreNos, historia: e.target.value }), rows: 8, className: "w-full p-3 border border-amber-300 rounded-lg" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setEditandoHistoria(false), className: "px-4 py-2 bg-green-600 text-white rounded-lg", children: "Salvar" }), _jsx("button", { onClick: () => setEditandoHistoria(false), className: "px-4 py-2 bg-gray-500 text-white rounded-lg", children: "Cancelar" })] })] })) : (_jsxs("div", { className: "bg-amber-50 p-4 rounded-lg", children: [_jsx("p", { className: "whitespace-pre-line text-gray-700", children: sobreNos.historia }), _jsxs("button", { onClick: () => setEditandoHistoria(true), className: "mt-3 text-amber-600 hover:text-amber-700 flex items-center gap-1", children: [_jsx(Edit2, { size: 14 }), " Editar"] })] }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-amber-700 mb-3", children: "Nossos Valores" }), _jsx("div", { className: "grid md:grid-cols-2 gap-4", children: Object.entries(sobreNos.valores).map(([key, value]) => (_jsxs("div", { className: "bg-amber-50 p-3 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [key === 'artesanal' && _jsx(ChefHat, { size: 18, className: "text-amber-600" }), key === 'amor' && _jsx(Heart, { size: 18, className: "text-amber-600" }), key === 'qualidade' && _jsx(Award, { size: 18, className: "text-amber-600" }), key === 'familia' && _jsx(Users, { size: 18, className: "text-amber-600" }), _jsx("span", { className: "font-medium text-amber-800 capitalize", children: key })] }), editandoValor === key ? (_jsxs("div", { className: "space-y-2", children: [_jsx("input", { type: "text", value: value, onChange: (e) => setSobreNos({ ...sobreNos, valores: { ...sobreNos.valores, [key]: e.target.value } }), className: "w-full p-2 border border-amber-300 rounded" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setEditandoValor(null), className: "text-green-600", children: "Salvar" }), _jsx("button", { onClick: () => setEditandoValor(null), className: "text-gray-500", children: "Cancelar" })] })] })) : (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: value }), _jsx("button", { onClick: () => setEditandoValor(key), className: "text-xs text-amber-600 mt-1", children: "Editar" })] }))] }, key))) })] })] })), activeTab === 'recados' && (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-amber-800 mb-4", children: "Gerenciar Recados" }), _jsxs("div", { className: "bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200", children: [_jsx("h3", { className: "font-bold text-amber-800 mb-3", children: "Tempo de exibi\u00E7\u00E3o padr\u00E3o" }), _jsx("div", { className: "flex gap-2", children: [5, 10].map(tempo => (_jsxs("button", { onClick: () => setTempoExibicaoRecados(tempo), className: `px-3 py-1 rounded-lg text-sm ${tempoExibicaoRecados === tempo ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-300'}`, children: [tempo, "s"] }, tempo))) })] }), _jsxs("div", { className: "bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200", children: [_jsx("h3", { className: "font-bold text-amber-800 mb-3", children: "Novo Recado" }), _jsxs("div", { className: "space-y-3", children: [_jsx("input", { type: "text", value: novoRecado.titulo, onChange: (e) => setNovoRecado({ ...novoRecado, titulo: e.target.value }), placeholder: "T\u00EDtulo", className: "w-full p-3 border border-amber-300 rounded-lg bg-white" }), _jsx("textarea", { value: novoRecado.conteudo, onChange: (e) => setNovoRecado({ ...novoRecado, conteudo: e.target.value }), placeholder: "Conte\u00FAdo", rows: 3, className: "w-full p-3 border border-amber-300 rounded-lg bg-white" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "avisoimportante", checked: novoRecado.avisoimportante, onChange: (e) => setNovoRecado({ ...novoRecado, avisoimportante: e.target.checked }), className: "w-4 h-4" }), _jsx("label", { htmlFor: "avisoimportante", className: "text-sm text-amber-700", children: "Marcar como aviso importante" })] }), _jsx("button", { onClick: handleAddRecado, className: "w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium", children: "Adicionar Recado" })] })] }), _jsxs("div", { className: "space-y-4", children: [recados.map((recado) => (_jsxs("div", { className: `border rounded-lg p-4 ${recado.avisoimportante ? 'bg-red-50 border-red-300' : 'bg-white border-amber-200'}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h4", { className: "font-bold text-amber-800", children: recado.titulo }), recado.avisoimportante && _jsx("span", { className: "px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse", children: "\u26A0\uFE0F AVISO" })] }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx("span", { className: `text-xs px-2 py-0.5 rounded-full ${recado.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`, children: recado.ativo ? 'Ativo' : 'Inativo' }), _jsx("span", { className: "text-xs text-gray-500", children: recado.dataCriacao }), _jsxs("span", { className: "text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full", children: [recado.tempoExibicao || 5, "s"] })] })] }), _jsxs("div", { className: "flex gap-2", children: [editingRecadoId === recado.id ? (_jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: handleSaveEditRecado, className: "p-1 bg-green-600 text-white rounded", children: _jsx(Check, { size: 14 }) }), _jsx("button", { onClick: () => setEditingRecadoId(null), className: "p-1 bg-gray-500 text-white rounded", children: _jsx(X, { size: 14 }) })] })) : (_jsx("button", { onClick: () => handleStartEditRecado(recado), className: "p-2 text-blue-600 hover:bg-blue-50 rounded", children: _jsx(Edit2, { size: 16 }) })), _jsx("button", { onClick: () => handleToggleAvisoImportante(recado.id), className: `p-2 rounded ${recado.avisoimportante ? 'text-red-500' : 'text-gray-400'}`, children: _jsx(AlertCircle, { size: 16 }) }), _jsx("button", { onClick: () => handleToggleAtivoRecado(recado.id), className: `p-2 rounded ${recado.ativo ? 'text-green-600' : 'text-gray-400'}`, children: recado.ativo ? _jsx(Eye, { size: 16 }) : _jsx(EyeOff, { size: 16 }) }), _jsx("button", { onClick: () => handleDeleteRecado(recado.id), className: "p-2 text-red-500 hover:bg-red-50 rounded", children: _jsx(Trash2, { size: 16 }) })] })] }), editingRecadoId === recado.id ? (_jsxs("div", { className: "mt-3 space-y-2", children: [_jsx("input", { type: "text", value: editRecadoForm.titulo, onChange: (e) => setEditRecadoForm({ ...editRecadoForm, titulo: e.target.value }), className: "w-full p-2 border rounded" }), _jsx("textarea", { value: editRecadoForm.conteudo, onChange: (e) => setEditRecadoForm({ ...editRecadoForm, conteudo: e.target.value }), rows: 3, className: "w-full p-2 border rounded" })] })) : (_jsx("p", { className: "text-gray-700 text-sm whitespace-pre-line", children: recado.conteudo }))] }, recado.id))), recados.length === 0 && _jsx("p", { className: "text-center text-gray-500 py-8", children: "Nenhum recado cadastrado" })] })] }))] })] }), _jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-white border-t border-amber-200 p-4 shadow-lg z-30", style: { marginLeft: sidebarOpen ? '18rem' : '4rem' }, children: _jsxs("div", { className: "container mx-auto flex items-center justify-center gap-4", children: [_jsx("button", { onClick: salvarEPublicar, disabled: saveStatus === 'saving', className: "inline-flex items-center gap-3 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-all shadow-lg disabled:opacity-70", children: saveStatus === 'saving' ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-white" }), "Publicando..."] })) : saveStatus === 'published' ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 20 }), "Publicado!"] })) : (_jsxs(_Fragment, { children: [_jsx(Globe, { size: 20 }), "Salvar e Publicar"] })) }), saveError && _jsx("span", { className: "text-red-600 text-sm", children: saveError })] }) }), _jsx("div", { className: "h-20" })] }), showEditProfileModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-2xl max-w-md w-full p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-amber-800", children: "Editar Perfil" }), _jsx("button", { onClick: () => setShowEditProfileModal(false), children: _jsx(X, { size: 24, className: "text-gray-500" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "text", value: editProfileForm.nome, onChange: (e) => setEditProfileForm({ ...editProfileForm, nome: e.target.value }), placeholder: "Nome", className: "w-full p-3 border border-gray-300 rounded-lg" }), _jsx("input", { type: "email", value: editProfileForm.email, onChange: (e) => setEditProfileForm({ ...editProfileForm, email: e.target.value }), placeholder: "Email", className: "w-full p-3 border border-gray-300 rounded-lg" }), _jsx("button", { onClick: handleSaveProfile, className: "w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium", children: "Salvar" })] })] }) })), showChangePasswordModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-2xl max-w-md w-full p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-amber-800", children: "Alterar Senha" }), _jsx("button", { onClick: () => setShowChangePasswordModal(false), children: _jsx(X, { size: 24, className: "text-gray-500" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "relative", children: [_jsx("input", { type: showCurrentPassword ? "text" : "password", value: passwordForm.current, onChange: (e) => setPasswordForm({ ...passwordForm, current: e.target.value }), placeholder: "Senha atual", className: "w-full p-3 pr-12 border border-gray-300 rounded-lg" }), _jsx("button", { type: "button", onClick: () => setShowCurrentPassword(!showCurrentPassword), className: "absolute right-3 top-1/2 -translate-y-1/2", children: _jsx(Eye, { size: 20, className: "text-gray-500" }) })] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showNewPassword ? "text" : "password", value: passwordForm.new, onChange: (e) => setPasswordForm({ ...passwordForm, new: e.target.value }), placeholder: "Nova senha", className: "w-full p-3 pr-12 border border-gray-300 rounded-lg" }), _jsx("button", { type: "button", onClick: () => setShowNewPassword(!showNewPassword), className: "absolute right-3 top-1/2 -translate-y-1/2", children: _jsx(Eye, { size: 20, className: "text-gray-500" }) })] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showConfirmPassword ? "text" : "password", value: passwordForm.confirm, onChange: (e) => setPasswordForm({ ...passwordForm, confirm: e.target.value }), placeholder: "Confirmar senha", className: "w-full p-3 pr-12 border border-gray-300 rounded-lg" }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-3 top-1/2 -translate-y-1/2", children: _jsx(Eye, { size: 20, className: "text-gray-500" }) })] }), _jsx("button", { onClick: handleChangePassword, className: "w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium", children: "Alterar Senha" })] })] }) }))] }));
}
