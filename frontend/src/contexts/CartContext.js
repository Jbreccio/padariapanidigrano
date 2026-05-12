import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
import { useToast } from "@/hooks/use-toast";
const CartContext = createContext(undefined);
export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const addToCart = (product, quantity) => {
        setItems(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item);
            }
            return [...prev, { product, quantity }];
        });
        toast({
            title: "Adicionado ao carrinho!",
            description: `${quantity}x ${product.name}`,
        });
    };
    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        setItems(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
    };
    const removeItem = (productId) => {
        setItems(prev => prev.filter(item => item.product.id !== productId));
    };
    const clearCart = () => {
        setItems([]);
    };
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    return (_jsx(CartContext.Provider, { value: {
            items, isOpen, setIsOpen,
            addToCart, updateQuantity, removeItem, clearCart,
            itemCount, total,
        }, children: children }));
};
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context)
        throw new Error("useCart must be used within CartProvider");
    return context;
};
