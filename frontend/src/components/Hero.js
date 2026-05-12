import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
const Hero = () => {
    // Array de imagens para o carrossel de fundo (TODAS as imagens)
    const backgroundImages = [
        "/images/foto17.png",
        "/images/loja07.png",
        "/images/loja08.png",
    ];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    // Timer automático a cada 4 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);
    return (_jsxs("section", { className: "relative min-h-screen flex items-center justify-center overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 transition-opacity duration-1000", children: [backgroundImages.map((img, index) => (_jsx("div", { className: `absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? "opacity-100" : "opacity-0"}`, children: _jsx("img", { src: img, alt: "Pani Di Grano", className: "w-full h-full object-cover" }) }, index))), _jsx("div", { className: "absolute inset-0 bg-black/50" })] }), _jsx("div", { className: "absolute top-[120px] left-8 z-30", children: _jsx("img", { src: "/images/logo.png", alt: "Pani Di Grano", className: "h-40 w-auto bg-white/90 rounded-xl p-2 shadow-lg" }) }), _jsx("div", { className: "container relative z-10 px-4 pt-20", children: _jsxs("div", { className: "max-w-2xl mx-auto text-center", children: [_jsx("span", { className: "inline-block text-yellow-400 font-medium mb-4 animate-fade-in text-lg", children: "\u2728 Tradi\u00E7\u00E3o e Sabor Artesanal \u2728" }), _jsx("h1", { className: "font-display text-5xl md:text-7xl font-bold text-white mb-6 animate-slide-up", children: "Pani Di Grano" }), _jsx("p", { className: "text-xl md:text-2xl text-yellow-200 mb-4 font-display italic animate-slide-up", style: { animationDelay: "0.1s" }, children: "Bolos e P\u00E3es Artesanais" }), _jsx("p", { className: "text-lg text-white/90 mb-8 max-w-lg mx-auto animate-slide-up", style: { animationDelay: "0.2s" }, children: "Feitos com carinho e ingredientes selecionados, nossos p\u00E3es e bolos trazem o sabor caseiro que voc\u00EA procura. Encomende agora e receba fresquinho em sua casa!" }), _jsxs("div", { className: "grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/30 max-w-2xl mx-auto animate-fade-in", style: { animationDelay: "0.5s" }, children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-4xl font-bold text-yellow-400 font-display", children: "100+" }), _jsx("p", { className: "text-white/80 text-sm", children: "Produtos" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-4xl font-bold text-yellow-400 font-display flex items-center justify-center gap-1", children: ["5", _jsx("span", { className: "text-yellow-400", children: "\u2605" })] }), _jsx("p", { className: "text-white/80 text-sm", children: "Avalia\u00E7\u00E3o" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-4xl font-bold text-yellow-400 font-display", children: "1000+" }), _jsx("p", { className: "text-white/80 text-sm", children: "Clientes" })] })] })] }) }), _jsx("div", { className: "absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20", children: backgroundImages.map((_, index) => (_jsx("button", { onClick: () => setCurrentImageIndex(index), className: `w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex
                        ? "bg-yellow-400 w-6"
                        : "bg-white/50 hover:bg-white/70"}` }, index))) })] }));
};
export default Hero;
