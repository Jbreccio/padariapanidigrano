// frontend/src/components/HeroCarrossel.tsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCarrosselHero, CarrosselItem } from '../data/products';

interface HeroCarrosselProps {
  autoPlayInterval?: number;
}

const HeroCarrossel: React.FC<HeroCarrosselProps> = ({ autoPlayInterval = 5000 }) => {
  const [slides, setSlides] = useState<CarrosselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadSlides = async () => {
      setLoading(true);
      const data = await getCarrosselHero();
      setSlides(data);
      setLoading(false);
    };
    
    loadSlides();

    const handleDataUpdate = () => {
      loadSlides();
    };
    
    window.addEventListener('dadosAtualizados', handleDataUpdate);
    return () => window.removeEventListener('dadosAtualizados', handleDataUpdate);
  }, []);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [slides.length, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="w-full h-[500px] bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Nenhuma imagem no carrossel</p>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* Imagem de fundo */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out"
        style={{ 
          backgroundImage: !imageErrors[currentSlide?.id] 
            ? `url(${currentSlide?.imagem})` 
            : 'none',
          transform: `scale(1.05)`,
        }}
      >
        {imageErrors[currentSlide?.id] && (
          <div className="w-full h-full bg-gradient-to-r from-amber-600 to-orange-600 flex items-center justify-center">
            <p className="text-white text-xl">Imagem não disponível</p>
          </div>
        )}
      </div>

      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Conteúdo */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fadeInUp">
          {currentSlide?.titulo || 'Pani Di Grano'}
        </h1>
        <p className="text-lg md:text-xl max-w-2xl animate-fadeInUp animation-delay-200">
          Bolos e Pães Artesanais feitos com amor e ingredientes de qualidade
        </p>
        <button className="mt-8 px-8 py-3 bg-primary hover:bg-primary/80 text-white rounded-full font-medium transition-all transform hover:scale-105 animate-fadeInUp animation-delay-400">
          Conheça nosso cardápio
        </button>
      </div>

      {/* Botões de navegação */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Indicadores */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-primary w-8' : 'bg-white/50 w-2'
              }`}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes fade