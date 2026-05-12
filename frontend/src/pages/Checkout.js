import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Cart from "../components/Cart";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { useToast } from "../hooks/use-toast";
import { ShoppingBag, CreditCard, Truck, Store, User, Trash2, Minus, Plus } from "lucide-react";
const Checkout = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, itemCount, total } = useCart();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [deliveryType, setDeliveryType] = useState("delivery");
    const [address, setAddress] = useState("");
    const [complement, setComplement] = useState("");
    const [neighborhood, setNeighborhood] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("pix");
    const [notes, setNotes] = useState("");
    const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    // Preencher dados do usuário se estiver logado
    useEffect(() => {
        if (user) {
            setName(user.nome || "");
            // Telefone não está disponível no user, manter vazio ou preencher depois
        }
    }, [user]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Faça login", description: "Você precisa estar logado para finalizar o pedido.", variant: "destructive" });
            navigate("/auth");
            return;
        }
        if (items.length === 0) {
            toast({ title: "Carrinho vazio", description: "Adicione produtos antes de finalizar.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            // Aqui você pode enviar o pedido para a API
            toast({ title: "Pedido enviado!", description: `Total: ${formatPrice(total)}. Em breve entraremos em contato.` });
            clearCart();
            navigate("/");
        }
        catch (error) {
            toast({ title: "Erro", description: "Não foi possível enviar o pedido.", variant: "destructive" });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, { cartItemCount: itemCount, onCartClick: () => setIsOpen(true), onLoginClick: () => navigate("/auth") }), _jsx("main", { className: "pt-24 pb-16", children: _jsx("div", { className: "container mx-auto px-4", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "font-display text-3xl font-bold text-secondary mb-2", children: "Finalizar Pedido" }), _jsx("p", { className: "text-muted-foreground", children: "Preencha os dados para concluir sua encomenda" })] }), !user && (_jsxs("div", { className: "bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8 text-center", children: [_jsx(User, { className: "h-12 w-12 mx-auto text-secondary mb-4" }), _jsx("h3", { className: "font-display text-xl font-semibold mb-2", children: "Fa\u00E7a login para continuar" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "Voc\u00EA precisa estar logado para finalizar seu pedido" }), _jsx(Button, { onClick: () => navigate("/auth"), className: "btn-primary", children: "Entrar ou Cadastrar" })] })), _jsxs("div", { className: "bg-card rounded-2xl border border-border p-6 mb-8", children: [_jsxs("h2", { className: "font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2", children: [_jsx(ShoppingBag, { className: "h-5 w-5 text-secondary" }), "Itens do Pedido (", itemCount, ")"] }), items.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(ShoppingBag, { className: "h-12 w-12 mx-auto text-muted-foreground/30 mb-3" }), _jsx("p", { className: "text-muted-foreground", children: "Seu carrinho est\u00E1 vazio" }), _jsx(Button, { onClick: () => navigate("/cardapio"), variant: "outline", className: "mt-4", children: "Ver Card\u00E1pio" })] })) : (_jsxs("div", { className: "space-y-3", children: [items.map((item) => (_jsxs("div", { className: "flex items-center gap-3 p-3 bg-muted/50 rounded-xl", children: [_jsx("div", { className: "w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0", children: item.product.imageUrl ? (_jsx("img", { src: item.product.imageUrl, alt: item.product.name, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20", children: _jsx(ShoppingBag, { className: "h-5 w-5 text-muted-foreground/30" }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-medium text-foreground text-sm line-clamp-1", children: item.product.name }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [formatPrice(item.product.price), " cada"] })] }), _jsxs("div", { className: "flex items-center gap-1 bg-background rounded-lg", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => updateQuantity(item.product.id, item.quantity - 1), children: _jsx(Minus, { className: "h-3 w-3" }) }), _jsx("span", { className: "w-6 text-center text-sm font-medium", children: item.quantity }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => updateQuantity(item.product.id, item.quantity + 1), children: _jsx(Plus, { className: "h-3 w-3" }) })] }), _jsx("span", { className: "font-semibold text-secondary text-sm whitespace-nowrap", children: formatPrice(item.product.price * item.quantity) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-destructive hover:text-destructive", onClick: () => removeItem(item.product.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }, item.product.id))), _jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-border", children: [_jsx("span", { className: "font-medium text-lg", children: "Total" }), _jsx("span", { className: "font-bold text-secondary text-2xl", children: formatPrice(total) })] })] }))] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", children: [_jsxs("div", { className: "bg-card rounded-2xl border border-border p-6", children: [_jsxs("h2", { className: "font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2", children: [_jsx(User, { className: "h-5 w-5 text-secondary" }), "Dados Pessoais"] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", children: "Nome completo" }), _jsx(Input, { id: "name", value: name, onChange: (e) => setName(e.target.value), placeholder: "Seu nome", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "phone", children: "Telefone / WhatsApp" }), _jsx(Input, { id: "phone", type: "tel", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "(11) 99999-9999", required: true })] })] })] }), _jsxs("div", { className: "bg-card rounded-2xl border border-border p-6", children: [_jsxs("h2", { className: "font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2", children: [_jsx(Truck, { className: "h-5 w-5 text-secondary" }), "Tipo de Entrega"] }), _jsx(RadioGroup, { value: deliveryType, onValueChange: setDeliveryType, children: _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("label", { className: `flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === "delivery" ? "border-secondary bg-secondary/5" : "border-border"}`, children: [_jsx(RadioGroupItem, { value: "delivery", id: "delivery" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Truck, { className: "h-6 w-6 text-secondary" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Entrega" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Receba em casa" })] })] })] }), _jsxs("label", { className: `flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === "pickup" ? "border-secondary bg-secondary/5" : "border-border"}`, children: [_jsx(RadioGroupItem, { value: "pickup", id: "pickup" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Store, { className: "h-6 w-6 text-secondary" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Retirada" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Retire no local" })] })] })] })] }) }), deliveryType === "delivery" && (_jsxs("div", { className: "mt-6 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "address", children: "Endere\u00E7o" }), _jsx(Input, { id: "address", value: address, onChange: (e) => setAddress(e.target.value), placeholder: "Rua, n\u00FAmero", required: deliveryType === "delivery" })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "complement", children: "Complemento" }), _jsx(Input, { id: "complement", value: complement, onChange: (e) => setComplement(e.target.value), placeholder: "Apto, bloco, etc." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "neighborhood", children: "Bairro" }), _jsx(Input, { id: "neighborhood", value: neighborhood, onChange: (e) => setNeighborhood(e.target.value), placeholder: "Bairro", required: deliveryType === "delivery" })] })] })] }))] }), _jsxs("div", { className: "bg-card rounded-2xl border border-border p-6", children: [_jsxs("h2", { className: "font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2", children: [_jsx(CreditCard, { className: "h-5 w-5 text-secondary" }), "Forma de Pagamento"] }), _jsx(RadioGroup, { value: paymentMethod, onValueChange: setPaymentMethod, children: _jsx("div", { className: "space-y-3", children: [
                                                        { value: "pix", label: "PIX", desc: "Pagamento instantâneo" },
                                                        { value: "card", label: "Cartão (na entrega)", desc: "Débito ou crédito" },
                                                        { value: "cash", label: "Dinheiro", desc: "Pague na entrega" },
                                                    ].map(opt => (_jsxs("label", { className: `flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === opt.value ? "border-secondary bg-secondary/5" : "border-border"}`, children: [_jsx(RadioGroupItem, { value: opt.value, id: opt.value }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: opt.label }), _jsx("p", { className: "text-sm text-muted-foreground", children: opt.desc })] })] }, opt.value))) }) })] }), _jsxs("div", { className: "bg-card rounded-2xl border border-border p-6", children: [_jsxs("h2", { className: "font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2", children: [_jsx(ShoppingBag, { className: "h-5 w-5 text-secondary" }), "Observa\u00E7\u00F5es"] }), _jsx(Textarea, { value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Alguma observa\u00E7\u00E3o especial?", rows: 3 })] }), _jsx(Button, { type: "submit", className: "w-full btn-primary py-6 text-lg", disabled: isLoading || !user || items.length === 0, children: isLoading ? "Enviando..." : `Confirmar Pedido — ${formatPrice(total)}` })] })] }) }) }), _jsx(Footer, {}), _jsx(Cart, { isOpen: isOpen, onClose: () => setIsOpen(false), items: items, onUpdateQuantity: updateQuantity, onRemoveItem: removeItem, onClearCart: clearCart })] }));
};
export default Checkout;
