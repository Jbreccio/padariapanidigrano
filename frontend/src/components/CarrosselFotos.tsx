// CarrosselFotos.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useConteudo } from '../../context/ConteudoContext';
import { getImageUrl } from '../../config/r2';

interface Slide {
  id: string;
  imagem: string;
  titulo?: string;
  ordem?: number;
  ativo?: boolean;
}

// 🔥 Dados fixos de fallback
const CARROSSEL_PADRAO: Slide[] = [
  { id: 'altarcristo', imagem: 'carrosselFotos/altarcristo.png', titulo: 'Altar de Cristo', ordem: 0, ativo: true },
  { id: 'altarlateral', imagem: 'carrosselFotos/altarlateral.png', titulo: 'Altar Lateral', ordem: 1, ativo: true },
  { id: 'altarlaterall', imagem: 'carrosselFotos/altarlaterall.png', titulo: 'Altar Lateral Esquerdo', ordem: 2, ativo: true },
  { id: 'cruzNovo', imagem: 'carrosselFotos/cruzNovo.png', titulo: 'Cruz Nova', ordem: 3, ativo: true },
  { id: 'cruzNovo2', imagem: 'carrosselFotos/cruzNovo2.png', titulo: 'Cruz Nova 2', ordem: 4, ativo: true },
  { id: 'rosto', imagem: 'carrosselFotos/Rosto.png', titulo: 'Rosto', ordem: 5, ativo: true },
  { id: 'entradaNovo2', imagem: 'carrosselFotos/entradaNovo2.png', titulo: 'Entrada Nova 2', ordem: 6, ativo: true },
  { id: 'entradaNovo', imagem: 'carrosselFotos/entradaNovo.png', titulo: 'Entrada Nova', ordem: 7, ativo: true },
  { id: 'fachada1', imagem: 'carrosselFotos/fachada1.png', titulo: 'Fachada 1', ordem: 8, ativo: true },
  { id: 'terco', imagem: 'carrosselFotos/Terco.png', titulo: 'Terço', ordem: 9, ativo: true },
  { id: 'comunhao', imagem: 'carrosselFotos/comunhao.png', titulo: 'Comunhão', ordem: 10, ativo: true },
  { id: 'mesanino', imagem: 'carrosselFotos/mesanino.png', titulo: 'Mezanino', ordem: 11, ativo: true },
  { id: 'bible', imagem: 'carrosselFotos/bible.png', titulo: 'Bíblia', ordem: 12, ativo: true },
  { id: 'altar', imagem: 'carrosselFotos/altar.png', titulo: 'Altar', ordem: 13, ativo: true },
  { id: 'snsf', imagem: 'carrosselFotos/snsf.png', titulo: 'Santuário Nossa Senhora de Fátima', ordem: 14, ativo: true },
];

export default function CarrosselFotos() {
  const { carrossel: carrosselWorker, loading } = useConteudo();
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // ✅ Combina dados do Worker com fallback
  const slides: Slide[] = React.useMemo(() => {
    let sourceSlides = CARROSSEL_PADRAO;

    if (!loading && carrosselWorker && carrosselWorker.length > 0) {
      sourceSlides = carrosselWorker;
    }

    return sourceSlides
      .filter((item: any) => item.ativo !== false)
      .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
      .map((slide: Slide) => ({
        ...slide,
        imagem: getImageUrl(slide.imagem),
      }));
  }, [loading, carrosselWorker]);

  // 🔁 Rolagem automática
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (slides.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 10000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    // Resetar timer ao clicar manualmente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 10000);
    }
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    // Resetar timer ao clicar manualmente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 10000);
    }
  };

  const handleImageError = (slideId: string, imagemUrl: string) => {
    console.error(`❌ Erro ao carregar: ${imagemUrl}`);
    setImageErrors(prev => new Set(prev).add(slideId));
  };

  if (loading) {
    return (
      <section className="relative w-full max-w-6xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <div className="rounded-2xl shadow-xl bg-gray-100 min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-400">Carregando fotos...</p>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative w-full max-w-6xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <div className="rounded-2xl shadow-xl bg-gray-100 min-h-[400px] flex items-center justify-center">
          <p className="text-gray-500">Nenhuma foto disponível.</p>
        </div>
      </section>
    );
  }

  // Filtra slides que não deram erro
  const validSlides = slides.filter(slide => !imageErrors.has(slide.id));
  
  if (validSlides.length === 0) {
    return (
      <section className="relative w-full max-w-6xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <div className="rounded-2xl shadow-xl bg-gray-100 min-h-[400px] flex items-center justify-center">
          <p className="text-gray-500">Não foi possível carregar as imagens.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full max-w-6xl mx-auto px-4 py-8 md:px-8 md:py-12">
      <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gray-900">
        {/* Container com altura fixa e responsiva */}
        <div 
          className="relative"
          style={{ 
            minHeight: 'clamp(300px, 50vh, 600px)',
            height: 'clamp(300px, 50vh, 600px)'
          }}
        >
          <div
            className="flex transition-transform duration-700 ease-in-out h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {validSlides.map((slide, index) => (
              <div
                key={slide.id || index}
                className="relative flex-shrink-0 w-full h-full flex items-center justify-center"
              >
                {/* Fundo com blur (efeito visual) */}
                <div
                  className="absolute inset-0 bg-center bg-no-repeat bg-cover blur-2xl scale-110 opacity-50"
                  style={{ backgroundImage: `url(${slide.imagem})` }}
                />

                {/* Container da imagem com proporção consistente */}
                <div className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-8">
                  <img
                    src={slide.imagem}
                    alt={slide.titulo || `Imagem ${index + 1}`}
                    className="max-w-full max-h-full w-auto h-auto object-contain select-none shadow-2xl rounded-lg"
                    style={{
                      maxHeight: 'clamp(280px, 45vh, 520px)',
                      width: 'auto',
                      objectFit: 'contain'
                    }}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    onError={() => handleImageError(slide.id, slide.imagem)}
                  />
                </div>

                {/* Legenda opcional (se houver título) */}
                {slide.titulo && (
                  <div className="absolute bottom-4 left-0 right-0 text-center z-10">
                    <div className="inline-block bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm md:text-base">
                      {slide.titulo}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botões de navegação */}
        {validSlides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 z-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Imagem anterior"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 z-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Próxima imagem"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Indicadores de slide (dots) */}
        {validSlides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {validSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 ${
                  idx === currentSlide 
                    ? 'w-6 md:w-8 h-2 bg-white shadow-lg' 
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Ir para imagem ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Contador de imagens (opcional) */}
        {validSlides.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs md:text-sm z-20">
            {currentSlide + 1} / {validSlides.length}
          </div>
        )}
      </div>
    </section>
  );
}