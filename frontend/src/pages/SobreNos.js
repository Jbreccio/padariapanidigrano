import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { ChefHat, Heart, Award, Users, ChevronLeft, ChevronRight } from "lucide-react";
const SobreNos = () => {
    const navigate = useNavigate();
    // Array de imagens para o carrossel
    const images = [
        "/images/loja.png",
        "/images/loja02.png",
        "/images/loja03.png",
        "/images/loja04.png",
        "/images/loja05.png",
        "/images/loja06.png",
        "/images/loja07.png",
        "/images/loja08.png",
        "/images/loja09.png",
        "/images/loja10.png",
        "/images/loja11.png",
    ];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };
    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };
    // Timer automático a cada 4 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            nextImage();
        }, 4000);
        return () => clearInterval(interval);
    }, []);
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, { onLoginClick: () => navigate("/auth") }), _jsx("main", { className: "pt-24 pb-16", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("div", { className: "flex justify-center mb-6", children: _jsx("img", { src: "/images/logo.png", alt: "Pani Di Grano", className: "h-32 w-auto bg-gray-100 rounded-2xl p-3 shadow-md" }) }), _jsx("h1", { className: "font-display text-4xl md:text-5xl font-bold text-secondary mb-4", children: "Nossa Hist\u00F3ria" }), _jsx("p", { className: "text-muted-foreground max-w-2xl mx-auto text-lg", children: "Conhe\u00E7a a Pani Di Grano, uma padaria artesanal nascida do amor pela arte da panifica\u00E7\u00E3o e pela tradi\u00E7\u00E3o das receitas de fam\u00EDlia." })] }), _jsx("div", { className: "max-w-4xl mx-auto mb-16", children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "overflow-hidden rounded-2xl shadow-xl", children: _jsx("img", { src: images[currentImageIndex], alt: `Loja Pani Di Grano - Imagem ${currentImageIndex + 1}`, className: "w-full h-[400px] object-cover transition-transform duration-300" }) }), _jsx("button", { onClick: prevImage, className: "absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300", children: _jsx(ChevronLeft, { className: "h-6 w-6" }) }), _jsx("button", { onClick: nextImage, className: "absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300", children: _jsx(ChevronRight, { className: "h-6 w-6" }) }), _jsx("div", { className: "absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2", children: images.map((_, index) => (_jsx("button", { onClick: () => setCurrentImageIndex(index), className: `w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex
                                                ? "bg-white w-4"
                                                : "bg-white/50 hover:bg-white/70"}` }, index))) })] }) }), _jsx("div", { className: "max-w-3xl mx-auto mb-16", children: _jsxs("div", { className: "bg-card rounded-2xl border border-border p-8", children: [_jsx("h2", { className: "font-display text-2xl font-bold text-foreground mb-4", children: "Do forno para sua mesa" }), _jsx("p", { className: "text-muted-foreground leading-relaxed mb-4", children: "A Pani Di Grano nasceu do sonho de levar o verdadeiro sabor artesanal at\u00E9 voc\u00EA. Com receitas passadas de gera\u00E7\u00E3o em gera\u00E7\u00E3o e ingredientes cuidadosamente selecionados, cada p\u00E3o, cada bolo carrega uma hist\u00F3ria de dedica\u00E7\u00E3o e amor." }), _jsx("p", { className: "text-muted-foreground leading-relaxed mb-4", children: "Nosso nome, \"Pani Di Grano\" (P\u00E3o de Trigo em italiano), reflete nossa paix\u00E3o pela arte da panifica\u00E7\u00E3o e pelo respeito aos ingredientes simples que transformamos em verdadeiras del\u00EDcias." }), _jsx("p", { className: "text-muted-foreground leading-relaxed", children: "Trabalhamos com fermenta\u00E7\u00E3o natural, farinhas de qualidade e um processo artesanal que respeita o tempo de cada massa. O resultado s\u00E3o produtos \u00FAnicos, com sabor e textura incompar\u00E1veis." })] }) }), _jsxs("div", { className: "mb-16", children: [_jsx("h2", { className: "section-title", children: "Nossos Valores" }), _jsx("p", { className: "section-subtitle", children: "O que nos guia em cada produto que fazemos" }), _jsxs("div", { className: "grid md:grid-cols-4 gap-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center", children: _jsx(ChefHat, { className: "h-10 w-10 text-secondary" }) }), _jsx("h3", { className: "font-display text-xl font-semibold mb-2", children: "Artesanal" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Cada produto \u00E9 feito \u00E0 m\u00E3o com cuidado e aten\u00E7\u00E3o aos detalhes" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center", children: _jsx(Heart, { className: "h-10 w-10 text-secondary" }) }), _jsx("h3", { className: "font-display text-xl font-semibold mb-2", children: "Com Amor" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Colocamos carinho em cada etapa da produ\u00E7\u00E3o" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center", children: _jsx(Award, { className: "h-10 w-10 text-secondary" }) }), _jsx("h3", { className: "font-display text-xl font-semibold mb-2", children: "Qualidade" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Ingredientes selecionados para o melhor sabor" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center", children: _jsx(Users, { className: "h-10 w-10 text-secondary" }) }), _jsx("h3", { className: "font-display text-xl font-semibold mb-2", children: "Fam\u00EDlia" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Receitas tradicionais passadas de gera\u00E7\u00E3o em gera\u00E7\u00E3o" })] })] })] }), _jsxs("div", { className: "bg-hero-gradient rounded-2xl p-8 md:p-12 text-center", children: [_jsx("h2", { className: "font-display text-3xl font-bold text-secondary mb-4", children: "Mais de 100 produtos artesanais" }), _jsx("p", { className: "text-muted-foreground max-w-2xl mx-auto mb-8", children: "Bolos caseiros, p\u00E3es de diversos tipos, focaccias, baguetes recheadas, sobremesas, salgados e muito mais. Tudo feito com receitas exclusivas." }), _jsx("button", { onClick: () => navigate("/cardapio"), className: "btn-primary", children: "Conhecer o Card\u00E1pio" })] })] }) }), _jsx(Footer, {})] }));
};
export default SobreNos;
