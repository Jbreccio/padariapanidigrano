// frontend/src/components/MiniCarrosselRecados.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { getRecados, RecadoItem } from '../data/products';

interface MiniCarrosselRecadosProps {
  autoPlayInterval?: number;
}

const MiniCarrosselRecados: React.FC<MiniCarrosselRecadosProps> = ({ autoPlayInterval = 5000 }) => {
  const [recados, setRecados] = useState<RecadoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar recados do backend
  useEffect(() => {
    const loadRecados = async () => {
      setLoading(true);
      const data = await getRecados();
      setRecados(data);
      setLoading(false);
    };
    
    loadRecados();

    const handleDataUpdate = () => {
      loadRecados();
    };
    
    window.addEventListener('dadosAtualizados', handleDataUpdate);
    return () => window.removeEventListener('dadosAtualizados', handleDataUpdate);
  }, []);

  const currentRecado = recados[currentIndex];
  const totalRecados = recados.length;

  // Auto-play
  useEffect(() => {
    if (!isHovered && recados.length > 1) {
      const interval = setInterval(() => {
        goToNext();
      }, currentRecado?.tempoExibicao || autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [isHovered, currentIndex, recados.length, currentRecado?.tempoExibicao, autoPlayInterval]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalRecados);
  }, [totalRecados]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalRecados) % totalRecados);
  }, [totalRecados]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 text-center">
        <p className="text-gray-500">Carregando recados...</p>
      </div>
    );
  }

  if (totalRecados === 0) {
    return null;
  }

  return (
    <div 
      className="relative bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 shadow-lg overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ícone de aviso */}
      {currentRecado?.avisoimportante && (
        <div className="absolute top-4 right-4">
          <AlertCircle size={24} className="text-red-500 animate-pulse" />
        </div>
      )}

      {/* Conteúdo do recado */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{currentRecado?.titulo}</h3>
        <p className="text-gray-600 leading-relaxed">{currentRecado?.conteudo}</p>
        <p className="text-xs text-gray-400 mt-4">
          Publicado em: {currentRecado?.dataCriacao}
        </p>
      </div>

      {/* Botões de navegação */}
      {totalRecados > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>

          {/* Indicadores */}
          <div className="flex justify-center gap-2 mt-4">
            {recados.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-amber-500 w-6' : 'bg-amber-300 w-2'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MiniCarrosselRecados;