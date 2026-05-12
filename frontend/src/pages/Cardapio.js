import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Cart from "../components/Cart";
import MenuSidebar from "../components/MenuSidebar";
import ProductCard from "../components/ProductCard";
import { useCart } from "../contexts/CartContext";
import { products, categories } from "../data/products";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
const Cardapio = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { items, isOpen, setIsOpen, addToCart, updateQuantity, removeItem, clearCart, itemCount, total } = useCart();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const selectedCategory = searchParams.get("categoria") || "all";
    const filteredProducts = useMemo(() => {
        let filtered = products;
        if (selectedCategory !== "all") {
            const category = categories.find(c => c.id === selectedCategory);
            if (category) {
                filtered = filtered.filter(p => p.category === category.name);
            }
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query));
        }
        return filtered;
    }, [selectedCategory, searchQuery]);
    // Group products by category for sectioned display
    const groupedProducts = useMemo(() => {
        const groups = [];
        const categoryOrder = categories.map(c => c.name);
        const grouped = filteredProducts.reduce((acc, product) => {
            if (!acc[product.category])
                acc[product.category] = [];
            acc[product.category].push(product);
            return acc;
        }, {});
        categoryOrder.forEach(catName => {
            if (grouped[catName]) {
                groups.push({ name: catName, products: grouped[catName] });
            }
        });
        return groups;
    }, [filteredProducts]);
    const handleCategoryChange = (categoryId) => {
        if (categoryId === "all") {
            searchParams.delete("categoria");
        }
        else {
            searchParams.set("categoria", categoryId);
        }
        setSearchParams(searchParams);
    };
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };
    const selectedCategoryName = selectedCategory === "all"
        ? "Todos os Produtos"
        : categories.find(c => c.id === selectedCategory)?.name || "Todos";
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, { cartItemCount: itemCount, onCartClick: () => setIsOpen(true), onLoginClick: () => navigate("/auth") }), _jsx(MenuSidebar, { isOpen: isSidebarOpen, onClose: () => setIsSidebarOpen(false), selectedCategory: selectedCategory, onSelectCategory: handleCategoryChange }), _jsx("main", { className: "pt-24 pb-16", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "font-display text-4xl md:text-5xl font-bold text-secondary mb-4", children: "Nosso Card\u00E1pio" }), _jsx("p", { className: "text-muted-foreground max-w-2xl mx-auto", children: "Explore nossa sele\u00E7\u00E3o de p\u00E3es, bolos e del\u00EDcias artesanais." })] }), _jsxs("div", { className: "flex gap-3 mb-6", children: [_jsxs(Button, { variant: "outline", onClick: () => setIsSidebarOpen(true), className: "flex items-center gap-2 border-secondary/30 hover:bg-secondary/10 shrink-0", children: [_jsx(SlidersHorizontal, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: "Categorias" })] }), _jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" }), _jsx(Input, { placeholder: "Buscar produtos...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10 input-styled" })] })] }), _jsx("div", { className: "flex items-center justify-between mb-6", children: _jsxs("div", { className: "flex items-center gap-2", children: [selectedCategory !== "all" && (_jsxs("span", { className: "inline-flex items-center gap-1.5 bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-sm font-medium", children: [selectedCategoryName, _jsx("button", { onClick: () => handleCategoryChange("all"), className: "ml-1 hover:text-destructive transition-colors", children: "\u00D7" })] })), _jsxs("p", { className: "text-muted-foreground text-sm", children: [filteredProducts.length, " produto", filteredProducts.length !== 1 ? "s" : ""] })] }) }), groupedProducts.length > 0 ? (_jsx("div", { className: "space-y-12", children: groupedProducts.map((group) => (_jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("h2", { className: "font-display text-2xl font-bold text-secondary", children: group.name }), _jsx("div", { className: "flex-1 h-px bg-border" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [group.products.length, " ", group.products.length === 1 ? "item" : "itens"] })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: group.products.map((product) => (_jsx(ProductCard, { product: product, onAddToCart: addToCart }, product.id))) })] }, group.name))) })) : (_jsxs("div", { className: "text-center py-16", children: [_jsx("p", { className: "text-muted-foreground text-lg mb-4", children: "Nenhum produto encontrado" }), _jsx(Button, { onClick: () => { setSearchQuery(""); handleCategoryChange("all"); }, children: "Limpar filtros" })] }))] }) }), itemCount > 0 && (_jsx("div", { className: "fixed bottom-0 left-0 right-0 z-30 bg-secondary text-secondary-foreground shadow-lg border-t border-secondary/20", children: _jsx("div", { className: "container mx-auto px-4", children: _jsxs("button", { onClick: () => setIsOpen(true), className: "w-full flex items-center justify-between py-4 hover:opacity-90 transition-opacity", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "bg-secondary-foreground text-secondary rounded-full h-7 w-7 flex items-center justify-center text-sm font-bold", children: itemCount }), _jsx("span", { className: "font-medium", children: "Ver carrinho" })] }), _jsx("span", { className: "font-bold text-lg", children: formatPrice(total) })] }) }) })), _jsx(Footer, {}), _jsx(Cart, { isOpen: isOpen, onClose: () => setIsOpen(false), items: items, onUpdateQuantity: updateQuantity, onRemoveItem: removeItem, onClearCart: clearCart })] }));
};
export default Cardapio;
