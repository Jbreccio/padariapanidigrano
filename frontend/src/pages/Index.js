import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import Cart from "../components/Cart";
import CategoryCard from "../components/CategoryCard";
import { useCart } from "../contexts/CartContext";
import { categories } from "../data/products";
import { Cake, Cookie, Sandwich, Pizza, IceCream, ChefHat, Croissant, UtensilsCrossed, PartyPopper, Utensils } from "lucide-react";
const iconMap = {
    cake: Cake,
    bread: Cookie,
    sandwich: Sandwich,
    pizza: Pizza,
    dessert: IceCream,
    pie: ChefHat,
    candy: Cookie,
    croissant: Croissant,
    cookie: Cookie,
    utensils: Utensils,
    party: PartyPopper,
};
const Index = () => {
    const navigate = useNavigate();
    const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, itemCount } = useCart();
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, { cartItemCount: itemCount, onCartClick: () => setIsOpen(true), onLoginClick: () => navigate("/auth") }), _jsxs("main", { children: [_jsx(Hero, {}), _jsx("section", { className: "py-20 bg-section-gradient", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsx("h2", { className: "section-title", children: "Nosso Card\u00E1pio" }), _jsx("p", { className: "section-subtitle", children: "Explore nossa variedade de p\u00E3es, bolos e del\u00EDcias artesanais, todos feitos com carinho e ingredientes selecionados." }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", children: categories.map((category) => {
                                        const Icon = iconMap[category.icon] || UtensilsCrossed;
                                        return (_jsx(CategoryCard, { title: category.name, description: category.description, icon: Icon, imageUrl: category.imageUrl, onClick: () => navigate(`/cardapio?categoria=${category.id}`) }, category.id));
                                    }) })] }) }), _jsx("section", { className: "py-20", children: _jsx("div", { className: "container mx-auto px-4", children: _jsxs("div", { className: "max-w-3xl mx-auto text-center", children: [_jsx("h2", { className: "section-title", children: "Sobre a Pani Di Grano" }), _jsx("p", { className: "text-muted-foreground text-lg leading-relaxed mb-8", children: "Nascemos do amor pela panifica\u00E7\u00E3o artesanal. Cada p\u00E3o, cada bolo \u00E9 preparado com dedica\u00E7\u00E3o, usando receitas tradicionais e ingredientes de primeira qualidade." }), _jsxs("div", { className: "grid grid-cols-3 gap-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center", children: _jsx(ChefHat, { className: "h-8 w-8 text-secondary" }) }), _jsx("h3", { className: "font-display font-semibold mb-2", children: "Artesanal" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Feito \u00E0 m\u00E3o com carinho" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center", children: _jsx(Cookie, { className: "h-8 w-8 text-secondary" }) }), _jsx("h3", { className: "font-display font-semibold mb-2", children: "Ingredientes" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Selecionados com cuidado" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center", children: _jsx(Cake, { className: "h-8 w-8 text-secondary" }) }), _jsx("h3", { className: "font-display font-semibold mb-2", children: "Tradi\u00E7\u00E3o" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Receitas de fam\u00EDlia" })] })] })] }) }) }), _jsx("section", { className: "py-20 bg-hero-gradient", children: _jsxs("div", { className: "container mx-auto px-4 text-center", children: [_jsx("h2", { className: "font-display text-3xl md:text-4xl font-bold text-secondary mb-4", children: "Pronto para fazer seu pedido?" }), _jsx("p", { className: "text-muted-foreground mb-8 max-w-xl mx-auto", children: "Cadastre-se e fa\u00E7a seu pedido online. Receba fresquinho em sua casa!" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx("button", { onClick: () => navigate("/cardapio"), className: "btn-primary", children: "Ver Card\u00E1pio Completo" }), _jsx("button", { onClick: () => navigate("/auth"), className: "btn-outline", children: "Criar Minha Conta" })] })] }) })] }), _jsx(Footer, {}), _jsx(Cart, { isOpen: isOpen, onClose: () => setIsOpen(false), items: items, onUpdateQuantity: updateQuantity, onRemoveItem: removeItem, onClearCart: clearCart })] }));
};
export default Index;
