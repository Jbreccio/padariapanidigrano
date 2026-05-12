import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  const backgroundImages = [
    "/images/foto17.png",
    "/images/loja07.png",
    "/images/loja08.png",
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image Carrossel - CORRIGIDO */}
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
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Logo - Ajustado para não conflitar com header */}
      <div className="absolute top-24 left-4 md:top-36 lg:top-40 lg:left-8 z-30">
        <img 
          src="/images/logo.png" 
          alt="Pani Di Grano" 
          className="h-16 w-auto md:h-24 lg:h-40 bg-white/90 rounded-xl p-1 md:p-2 shadow-lg"
        />
      </div>

      {/* Content - Com padding-top para compensar o header */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-center">
        <div className="container px-4 py-20 md:py-24 lg:py-32 mt-8 md:mt-0">
          {/* Espaço extra para o logo em telas pequenas */}
          <div className="max-w-2xl mx-auto text-center mt-8 md:mt-0">
            <span className="inline-block text-yellow-400 font-medium mb-3 md:mb-4 animate-fade-in text-sm md:text-lg">
              ✨ Tradição e Sabor Artesanal ✨
            </span>
            
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 md:mb-4 lg:mb-6 animate-slide-up leading-tight">
              Pani Di Grano
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-yellow-200 mb-3 md:mb-4 font-display italic animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Bolos e Pães Artesanais
            </p>
            
            <p className="text-sm sm:text-base md:text-lg text-white/90 mb-6 md:mb-8 max-w-lg mx-auto animate-slide-up px-4 sm:px-6" style={{ animationDelay: "0.2s" }}>
              Feitos com carinho e ingredientes selecionados, nossos pães e bolos 
              trazem o sabor caseiro que você procura. Encomende agora e receba 
              fresquinho em sua casa!
            </p>

            {/* Stats Centralizados - Responsivo */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 mt-8 md:mt-12 lg:mt-16 pt-6 md:pt-8 border-t border-white/30 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="text-center">
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-400 font-display">100+</p>
                <p className="text-white/80 text-xs sm:text-sm md:text-base">Produtos</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-400 font-display flex items-center justify-center gap-1">
                  5<span className="text-yellow-400">★</span>
                </p>
                <p className="text-white/80 text-xs sm:text-sm md:text-base">Avaliação</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-400 font-display">1000+</p>
                <p className="text-white/80 text-xs sm:text-sm md:text-base">Clientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores do Carrossel */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {backgroundImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentImageIndex
                ? "bg-yellow-400 w-6 md:w-8 h-2"
                : "bg-white/50 hover:bg-white/70 w-2 h-2"
            }`}
            aria-label={`Ir para imagem ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;