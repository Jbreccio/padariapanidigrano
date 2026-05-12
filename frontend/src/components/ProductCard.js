import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { cn } from "../lib/utils";
const ProductCard = ({ product, onAddToCart, className }) => {
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const handleAddToCart = () => {
        setIsAdding(true);
        onAddToCart?.(product, quantity);
        setTimeout(() => {
            setIsAdding(false);
            setQuantity(1);
        }, 500);
    };
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };
    return (_jsxs("div", { className: cn("group bg-card rounded-xl border border-border overflow-hidden card-hover", !product.available && "opacity-60", className), children: [_jsxs("div", { className: "aspect-square relative overflow-hidden bg-muted", children: [product.imageUrl ? (_jsx("img", { src: product.imageUrl, alt: product.name, className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20", children: _jsx(ShoppingBag, { className: "h-12 w-12 text-muted-foreground/30" }) })), !product.available && (_jsx("div", { className: "absolute inset-0 bg-background/60 flex items-center justify-center", children: _jsx("span", { className: "bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium", children: "Indispon\u00EDvel" }) }))] }), _jsxs("div", { className: "p-4", children: [_jsx("span", { className: "text-xs text-muted-foreground uppercase tracking-wider", children: product.category }), _jsx("h3", { className: "font-display text-lg font-semibold text-foreground mt-1 line-clamp-1", children: product.name }), _jsx("p", { className: "text-muted-foreground text-sm mt-1 line-clamp-2 min-h-[2.5rem]", children: product.description }), _jsxs("div", { className: "flex items-center justify-between mt-4", children: [_jsx("span", { className: "text-xl font-bold text-secondary", children: formatPrice(product.price) }), product.available !== false && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-1 bg-muted rounded-lg", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setQuantity(Math.max(1, quantity - 1)), disabled: quantity <= 1, children: _jsx(Minus, { className: "h-3 w-3" }) }), _jsx("span", { className: "w-6 text-center text-sm font-medium", children: quantity }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setQuantity(quantity + 1), children: _jsx(Plus, { className: "h-3 w-3" }) })] }), _jsx(Button, { size: "icon", className: cn("h-8 w-8 btn-primary", isAdding && "animate-pulse"), onClick: handleAddToCart, children: _jsx(Plus, { className: "h-4 w-4" }) })] }))] })] })] }));
};
export default ProductCard;
