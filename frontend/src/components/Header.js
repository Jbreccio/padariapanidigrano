import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
const Header = ({ cartItemCount = 0, onCartClick, onLoginClick, isLoggedIn }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navLinks = [
        { name: "Início", href: "/" },
        { name: "Cardápio", href: "/cardapio" },
        { name: "Contato", href: "/contato" },
        { name: "Localização", href: "/localizacao" },
        { name: "Sobre Nós", href: "/sobrenos" },
        { name: "Minha Conta", href: "/auth" },
    ];
    return (_jsx("header", { className: "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "flex items-center justify-between h-20", children: [_jsx("nav", { className: "hidden md:flex items-center justify-center flex-1 gap-8", children: navLinks.map((link) => (_jsxs(Link, { to: link.href, className: "relative group text-rose-900/60 hover:text-rose-900/90 font-medium transition-colors duration-200 px-3 py-2", children: [_jsx("span", { className: "absolute inset-0 rounded-lg bg-pink-400/0 group-hover:bg-pink-400/20 transition-all duration-300 scale-0 group-hover:scale-100" }), _jsx("span", { className: "relative z-10", children: link.name })] }, link.name))) }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs(Button, { size: "icon", className: "btn-primary relative", onClick: onCartClick, children: [_jsx(ShoppingCart, { className: "h-5 w-5" }), cartItemCount > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 bg-white text-rose-900 text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold", children: cartItemCount }))] }), _jsx(Button, { size: "icon", onClick: onLoginClick, className: "hidden md:flex btn-primary", children: _jsx(User, { className: "h-5 w-5" }) }), _jsx(Link, { to: "/cardapio", className: "hidden md:block", children: _jsx(Button, { className: "btn-primary", children: "Fazer Pedido" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "md:hidden text-rose-900/60", onClick: () => setIsMenuOpen(!isMenuOpen), children: isMenuOpen ? _jsx(X, { className: "h-6 w-6" }) : _jsx(Menu, { className: "h-6 w-6" }) })] })] }), isMenuOpen && (_jsx("div", { className: "md:hidden py-4 border-t border-border animate-fade-in", children: _jsxs("nav", { className: "flex flex-col gap-4", children: [navLinks.map((link) => (_jsxs(Link, { to: link.href, className: "relative group text-rose-900/60 hover:text-rose-900/90 font-medium py-2 transition-colors px-3 rounded-lg", onClick: () => setIsMenuOpen(false), children: [_jsx("span", { className: "absolute inset-0 rounded-lg bg-pink-400/0 group-hover:bg-pink-400/20 transition-all duration-300 scale-0 group-hover:scale-100" }), _jsx("span", { className: "relative z-10", children: link.name })] }, link.name))), _jsxs(Button, { className: "btn-primary mt-2", onClick: onLoginClick, children: [_jsx(User, { className: "h-4 w-4 mr-2" }), isLoggedIn ? "Minha Conta" : "Entrar"] })] }) }))] }) }));
};
export default Header;
