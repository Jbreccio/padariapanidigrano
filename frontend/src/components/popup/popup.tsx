// frontend/src/components/popup/popup.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { getPopups, PopupItem } from '../../data/products';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ isOpen, onClose }) => {
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar popups do backend
  useEffect(() => {
    const loadPopups = async () => {
      setLoading(true);
      const data = await getPopups();
      setPopups(data);
      setLoading(false);
    };
    
    loadPopups();

    // Escutar atualizações do PainelAdmin
    const handleDataUpdate = () => {
      loadPopups();
    };
    
    window.addEventListener('dadosAtualizados', handleDataUpdate);
    return () => window.removeEventListener('dadosAtualizados', handleDataUpdate);
  }, []);

  const currentPopup = popups[currentIndex];
  const totalPopups = popups.length;

  // Resetar progresso quando o popup muda
  useEffect(() => {
    if (currentPopup && isOpen && !isHovered) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            goToNext();
            return 0;
          }
          return prev + (100 / (currentPopup.tempoExibicao / 0.05));
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [currentPopup, isOpen, isHovered, currentPopup?.tempoExibicao]);

  const goToNext = useCallback(() => {
    if (currentIndex + 1 < totalPopups) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, totalPopups, onClose]);

  const goToPrevious = useCallback(() => {
    if (currentIndex - 1 >= 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  if (!isOpen || loading || totalPopups === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative max-w-4xl w-full mx-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Barra de progresso */}
        <div className="absolute -top-8 left-0 right-0 h-1 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-50 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Container do popup */}
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Imagem do popup */}
          <img 
            src={currentPopup.imagem} 
            alt="Popup" 
            className="w-full h-auto max-h-[80vh] object-contain"
          />

          {/* Navegação - apenas se tiver mais de um popup */}
          {totalPopups > 1 && (
            <>
              {currentIndex > 0 && (
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  ‹
                </button>
              )}
              {currentIndex < totalPopups - 1 && (
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  ›
                </button>
              )}
            </>
          )}

          {/* Indicadores */}
          {totalPopups > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {popups.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-primary w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Popup;