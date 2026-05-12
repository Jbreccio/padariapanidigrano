import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { X, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { categories } from "../data/products";
import { cn } from "../lib/utils";
const MenuSidebar = ({ isOpen, onClose, selectedCategory, onSelectCategory }) => {
    const handleSelect = (catId) => {
        onSelectCategory(catId);
        onClose();
    };
    return (_jsxs(_Fragment, { children: [isOpen && (_jsx("div", { className: "fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 transition-opacity", onClick: onClose })), _jsxs("div", { className: cn("fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl", isOpen ? "translate-x-0" : "-translate-x-full"), children: [_jsxs("div", { className: "flex items-center justify-between p-5 border-b border-border bg-sidebar-background", children: [_jsx("h2", { className: "font-display text-xl font-bold text-secondary", children: "Categorias" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: onClose, className: "h-8 w-8", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsx(ScrollArea, { className: "flex-1", children: _jsxs("div", { className: "py-2", children: [_jsxs("button", { onClick: () => handleSelect("all"), className: cn("w-full flex items-center justify-between px-5 py-4 text-left transition-all duration-200 hover:bg-sidebar-accent", selectedCategory === "all"
                                        ? "bg-sidebar-accent border-l-4 border-secondary text-secondary font-semibold"
                                        : "border-l-4 border-transparent text-foreground"), children: [_jsx("span", { className: "text-sm", children: "Todos os Produtos" }), _jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })] }), _jsx("div", { className: "mx-5 my-1 border-t border-border" }), categories.map((cat) => (_jsxs("button", { onClick: () => handleSelect(cat.id), className: cn("w-full flex items-center justify-between px-5 py-4 text-left transition-all duration-200 hover:bg-sidebar-accent group", selectedCategory === cat.id
                                        ? "bg-sidebar-accent border-l-4 border-secondary text-secondary font-semibold"
                                        : "border-l-4 border-transparent text-foreground"), children: [_jsxs("div", { className: "flex flex-col gap-0.5", children: [_jsx("span", { className: "text-sm font-medium", children: cat.name }), _jsx("span", { className: "text-xs text-muted-foreground line-clamp-1", children: cat.description })] }), _jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors" })] }, cat.id)))] }) }), _jsx("div", { className: "p-4 border-t border-border bg-sidebar-background", children: _jsxs("p", { className: "text-xs text-muted-foreground text-center", children: [categories.length, " categorias dispon\u00EDveis"] }) })] })] }));
};
export default MenuSidebar;
