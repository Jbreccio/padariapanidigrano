import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

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

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Carrossel - Imagem ampla (object-cover) */}
      <div className="absolute inset-0 transition-opacity duration-1000">
        {backgroundImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={img}
              alt="Pani Di Grano"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {/* Overlay escuro para destacar o texto sobre qualquer imagem */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Logo fixa no canto superior esquerdo */}
      <div className="absolute top-[120px] left-8 z-30">
  <img 
    src="/images/logo.png" 
    alt="Pani Di Grano" 
    className="h-40 w-auto bg-white/90 rounded-xl p-2 shadow-lg"
  />
</div>

      {/* Content - TEXTO FIXO SOBRE TODAS AS IMAGENS */}
      <div className="container relative z-10 px-4 pt-20">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block text-yellow-400 font-medium mb-4 animate-fade-in text-lg">
            ✨ Tradição e Sabor Artesanal ✨
          </span>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 animate-slide-up">
            Pani Di Grano
          </h1>
          
          <p className="text-xl md:text-2xl text-yellow-200 mb-4 font-display italic animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Bolos e Pães Artesanais
          </p>
          
          <p className="text-lg text-white/90 mb-8 max-w-lg mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Feitos com carinho e ingredientes selecionados, nossos pães e bolos 
            trazem o sabor caseiro que você procura. Encomende agora e receba 
            fresquinho em sua casa!
          </p>
         

          {/* Stats Centralizados - FIXOS SOBRE TODAS AS IMAGENS */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/30 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="text-center">
              <p className="text-4xl font-bold text-yellow-400 font-display">100+</p>
              <p className="text-white/80 text-sm">Produtos</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-yellow-400 font-display flex items-center justify-center gap-1">
                5<span className="text-yellow-400">★</span>
              </p>
              <p className="text-white/80 text-sm">Avaliação</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-yellow-400 font-display">1000+</p>
              <p className="text-white/80 text-sm">Clientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores do Carrossel (dots) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {backgroundImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentImageIndex
                ? "bg-yellow-400 w-6"
                : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;